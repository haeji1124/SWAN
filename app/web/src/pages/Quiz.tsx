// 수준 테스트 /quiz (Phase 3). "내 수준이 이 강의에 맞나?"에 3분 만에 답한다. 걸러 내기가 아니라 확신 주기.
// 시작 → 1~4 보기 고르기 → 5 주관식 → 6 AI가 고친 코드에서 틀린 줄 고르기 → 결과(성장 단계 카드, 뒤집으면 문제별 해설) → 6번 해설(펼친 채로)
// 정답은 서버만 안다: 제출하면 서버가 채점해 해설과 함께 돌려준다. 로그인 실패면 채점만 하고 기록하지 않는다.
// 상단 메뉴는 그대로 두고(2026-10-19 사용자 요청, 처음엔 로고 + [나가기]만이었다) 그 아래 줄에 진행 표시 + [나가기]. 어떤 결과든 신청을 막지 않는다.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Code } from '../components/Code'
import { useFeedback } from '../components/Feedback'
import { Inline, RichText } from '../components/RichText'
import { Mark } from '../components/Section'
import { setLeaveGuard, useHideNavPrimary } from '../components/TopNav'
import { ApiError, postInterest } from '../lib/api'
import { useMe } from '../lib/me'
import {
  getQuiz,
  submitQuiz,
  type Answer,
  type QuizInfo,
  type QuizQuestion,
  type QuizResult,
  type QuizResultItem,
  type StageKey,
} from '../lib/quizApi'
import { track } from '../lib/track'

const errText = (e: unknown) => (e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요')
const CIRCLED = '①②③④⑤⑥⑦⑧'

// 성장 단계 그림 (3D 정지 렌더, 바닥선에 맞춰 정렬). 홈 수준 테스트 섹션과 같은 그림
const STAGES: { key: StageKey; name: string; range: string; src: string; h: string; idle: string }[] = [
  { key: 'hatchling', name: '알에서 나온 오리', range: '0~2개', src: '/images/stage-1.webp', h: 'h-[150px]', idle: 'motion-safe:animate-[wobble_1.6s_ease-in-out_infinite]' },
  { key: 'duckling', name: '아기 오리', range: '3~4개', src: '/images/stage-2.webp', h: 'h-[196px]', idle: 'motion-safe:animate-[breathe_2.4s_ease-in-out_infinite]' },
  { key: 'cygnet', name: '어린 백조', range: '5~6개', src: '/images/stage-3.webp', h: 'h-[258px]', idle: 'motion-safe:animate-[breathe_3.1s_ease-in-out_.4s_infinite]' },
]
const stageOf = (k: StageKey) => STAGES.find((s) => s.key === k)!

const MESSAGE: Record<StageKey, string> = {
  cygnet: '지금 딱 SWAN이 필요한 단계예요. 고급까지 함께 가요.',
  duckling: '기초는 있어요. 복습 시간을 조금 더 잡으면 충분히 따라올 수 있어요.',
  hatchling: '지금은 기초를 먼저 다지는 걸 추천해요.',
}

// 0~2개일 때 보여 줄 추천 기초 자료 (가상. 실제 자료가 정해지면 바꾼다)
const BASICS = [
  { title: '파이썬 기초 문법 한 바퀴', desc: '변수 · 조건문 · 반복문 · 함수를 하루에 훑어요' },
  { title: '리스트와 딕셔너리 연습 문제 20개', desc: '1·2번 문제에서 본 내용을 손으로 익혀요' },
  { title: '함수와 재귀, 그림으로 따라가기', desc: '5번 문제처럼 실행 순서를 머릿속에 그려 봐요' },
]

type Step = 'start' | number | 'result'

export function Quiz() {
  const [info, setInfo] = useState<QuizInfo | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [step, setStep] = useState<Step>('start')
  const [answers, setAnswers] = useState<Record<number, Answer>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { confirm, toast } = useFeedback()
  const { reload } = useMe()
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoadError(false)
    getQuiz()
      .then(setInfo)
      .catch(() => setLoadError(true))
  }, [])
  useEffect(load, [load])

  const questions = info?.questions ?? []
  const total = questions.length
  const go = (s: Step) => {
    setStep(s)
    window.scrollTo(0, 0)
    if (typeof s === 'number') track('section', `quiz:q${questions[s].order}`)
  }

  const start = () => {
    track('click', 'quiz:start')
    setAnswers({})
    setResult(null)
    go(0)
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const r = await submitQuiz(answers)
      setResult(r)
      track('section', `quiz:done:${r.stage.key}:${r.score}`)
      go('result')
      if (r.saved) reload()
    } catch (e) {
      toast(errText(e))
    } finally {
      setSubmitting(false)
    }
  }

  const solving = typeof step === 'number' && Object.keys(answers).length > 0
  const askLeave = useCallback(
    () =>
      confirm({
        title: '풀던 문제를 그만둘까요?',
        body: '지금까지 고른 답은 저장되지 않아요. 언제든 처음부터 다시 풀 수 있어요.',
        confirmLabel: '그만두기',
        cancelLabel: '계속 풀기',
      }),
    [confirm],
  )
  // 풀던 중에는 상단 메뉴·로고를 눌러도 먼저 묻는다 (메뉴를 다시 보이게 한 뒤 답이 말없이 사라졌다)
  useEffect(() => {
    setLeaveGuard(solving ? askLeave : null)
    return () => setLeaveGuard(null)
  }, [solving, askLeave])

  const exit = async () => {
    track('click', `quiz:exit:${step}`)
    if (solving && !(await askLeave())) return
    navigate('/')
  }

  let body: ReactNode
  if (loadError)
    body = (
      <div className="flex flex-col items-start gap-5 pt-10">
        <p className="text-[22px] font-bold">문제를 불러오지 못했어요</p>
        <p className="text-[17px] text-muted">잠시 뒤에 다시 시도해 주세요. 계속 안 되면 운영자에게 알려 주세요.</p>
        <Button variant="secondary" onClick={load}>
          다시 시도
        </Button>
      </div>
    )
  else if (!info) body = <p className="font-mono text-[15px] text-muted motion-safe:animate-pulse">// 문제를 불러오는 중…</p>
  else if (step === 'start') body = <Start info={info} onStart={start} />
  else if (step === 'result' && result) body = <Result result={result} onRetry={() => { track('click', 'quiz:result:retry'); load(); go('start') }} />
  else if (typeof step === 'number') {
    const q = questions[step]
    const a = answers[q.id]
    const set = (v: Answer) => setAnswers((x) => ({ ...x, [q.id]: v }))
    const ready = a !== undefined && a !== null && String(a).trim() !== ''
    const last = step === total - 1
    const next = () => (last ? submit() : go(step + 1))
    body = (
        <QuestionView
          q={q}
          answer={a ?? null}
          onAnswer={set}
          onEnter={() => ready && next()}
          nav={
            // [이전] [다음]은 보기 바로 아래에 둔다 (사용자 요청 2026-10-18: 화면 맨 아래 고정 줄은 고른 곳에서 너무 멀었다)
            <div className="flex items-center justify-between gap-6 border-t border-line pt-6">
              <Button variant="text" disabled={step === 0} onClick={() => go(step - 1)}>
                ← 이전
              </Button>
              <div className="flex items-center gap-6">
                {q.type === 'line' && (
                  <span className="font-mono text-[15px] text-muted">{a ? `고른 줄: ${a}` : '줄을 눌러 한 줄을 골라 주세요'}</span>
                )}
                <Button disabled={!ready || submitting} onClick={next}>
                  {last ? (submitting ? '채점하는 중…' : '결과 보기') : '다음'}
                </Button>
              </div>
            </div>
          }
        />
    )
  }

  return (
    <div className="min-h-[calc(100vh-88px)] bg-paper">
      {/* 상단 메뉴 바로 아래 얇은 줄: 어디인지 · 진행 · [나가기](풀던 중이면 한 번 더 묻는다) */}
      {/* 선은 화면 끝까지 (구현 전달 3장: 띠는 화면 끝까지), 내용은 페이지 폭 안 */}
      <div className="border-b border-line">
        <div className="page flex h-[64px] items-center justify-between gap-8">
          <span className="font-mono text-[14px] text-mark">// 수준 테스트</span>
          {typeof step === 'number' && <Progress at={step} total={total} />}
          <button type="button" onClick={exit} className="text-[15px] font-semibold underline-offset-4 hover:underline">
            나가기
          </button>
        </div>
      </div>
      <div className="page pt-14 pb-32">{body}</div>
    </div>
  )
}

function Progress({ at, total }: { at: number; total: number }) {
  return (
    <div className="flex items-center gap-4" aria-label={`${total}문제 중 ${at + 1}번째`}>
      <span className="font-mono text-[15px]">
        <b className="font-semibold">{at + 1}</b>
        <span className="text-mark"> / {total}</span>
      </span>
      <span className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 w-8 rounded-full ${i <= at ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </span>
    </div>
  )
}

/* ================= 시작 ================= */
function Start({ info, onStart }: { info: QuizInfo; onStart: () => void }) {
  const kinds = [
    ['1~4', '코드를 읽고 출력 고르기', '보기 4개'],
    ['5', '코드를 읽고 출력 직접 적기', '입력 칸 하나'],
    ['6', 'AI가 고친 코드에서 결과를 틀리게 만드는 줄 찾기', '줄을 눌러 고르기'],
  ]
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <section className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-20">
      <div className="flex flex-col gap-8 pb-4">
        <div className="flex flex-col gap-4">
          <Mark>// 수준 테스트 · 문제 {info.total}개</Mark>
          <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.02em]">
            3분이면 내 수준을
            <br />알 수 있어요
          </h1>
        </div>
        <ol className="flex flex-col border-t border-ink">
          {kinds.map(([n, what, how]) => (
            <li key={n} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line py-4">
              {/* 문제 번호 범위는 읽어야 하는 정보라 muted (mark는 대비 3:1, Phase 8) */}
              <span className="font-mono text-[15px] text-muted">{n}</span>
              <span className="text-[18px] font-semibold">{what}</span>
              <span className="font-mono text-[13px] text-muted">// {how}</span>
            </li>
          ))}
        </ol>
        <p className="max-w-[560px] text-[16px] leading-relaxed text-ink/80">
          결과는 교육 운영에 참고하기 위해 기록됩니다. 신청한 분은 모두 수강할 수 있으니 편하게 풀어 보세요.
        </p>
        <div className="flex items-center gap-6">
          <Button onClick={onStart}>{info.mine ? '다시 풀기' : '시작하기'}</Button>
          {info.mine && (
            <span className="font-mono text-[14px] text-muted">
              // 기준 기록 {info.mine.first_score} / {info.total} · 다시 풀어도 첫 기록은 바뀌지 않아요
            </span>
          )}
          {!info.will_record && <span className="font-mono text-[14px] text-muted">// 로그인이 안 돼 있어 이번 결과는 기록되지 않아요</span>}
        </div>
      </div>
      <div className="flex items-end justify-around border-b border-line">
        {STAGES.map((s, i) => (
          <figure
            key={s.key}
            className={`flex flex-col items-center gap-3 pb-5 transition-[opacity,translate] duration-500 ease-out hover:-translate-y-1 ${
              entered ? 'opacity-100' : 'translate-y-3 opacity-0'
            }`}
            style={{ transitionDelay: entered ? `${i * 150}ms` : '0ms' }}
          >
            <img src={s.src} alt="" className={`${s.h} origin-bottom ${s.idle}`} />
            <figcaption className="flex flex-col items-center gap-1">
              <span className="text-[16px] font-semibold">{s.name}</span>
              <span className="font-mono text-[13px] text-muted">{s.range}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/* ================= 문제 ================= */
function QuestionView({
  q,
  answer,
  onAnswer,
  onEnter,
  nav,
}: {
  q: QuizQuestion
  answer: Answer
  onAnswer: (a: Answer) => void
  onEnter: () => void
  nav: ReactNode
}) {
  const head = (
    <div className="flex flex-col gap-3">
      <Mark>// 문제 {q.order}</Mark>
      <h1 className="text-[28px] leading-[1.45] font-bold">{q.question}</h1>
    </div>
  )

  if (q.type === 'line')
    return (
      <section className="flex flex-col gap-10">
        {head}
        <div className="grid grid-cols-[400px_minmax(0,1fr)] items-start gap-14">
          <RichText text={q.scenario ?? ''} className="text-[16px]" />
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[13px] text-mark">// AI가 고친 코드 · 줄을 눌러 고르세요</span>
            <Code
              code={q.code}
              label="AI가 고친 코드의 줄"
              onPick={(n) => onAnswer(n)}
              picked={typeof answer === 'number' ? answer : null}
              tone={(n) => (n === answer ? 'sky' : undefined)}
              bar={(n) => n === answer}
            />
            <div className="mt-4">{nav}</div>
          </div>
        </div>
      </section>
    )

  return (
    <section className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-16">
      <div className="flex flex-col gap-2 pt-1">
        <span className="font-mono text-[13px] text-mark">// 코드</span>
        <Code code={q.code} />
      </div>
      <div className="flex flex-col gap-8">
        {head}
        {q.type === 'choice' ? (
          <div role="radiogroup" aria-label="보기" className="flex flex-col gap-3">
            {q.choices.map((c, i) => {
              const on = answer === i + 1
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onAnswer(i + 1)}
                  className={`flex items-center gap-4 rounded-btn border px-5 py-4 text-left transition-colors ${
                    on ? 'border-ink bg-sky' : 'border-line bg-surface hover:bg-sky/40'
                  }`}
                >
                  <span
                    className={`size-5 shrink-0 rounded-full bg-surface ${on ? 'border-[6px] border-ink' : 'border-[1.5px] border-disabled-ink'}`}
                  />
                  <span className="text-[17px] text-mark">{CIRCLED[i]}</span>
                  <span className="font-mono text-[17px]">{c}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="short-answer"
              className="flex items-center gap-3 rounded-btn border border-line bg-surface px-4 focus-within:border-ink focus-within:shadow-[0_0_0_3px_var(--color-sky)]"
            >
              <span className="font-mono text-[15px] text-mark select-none">출력:</span>
              <input
                id="short-answer"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                maxLength={200}
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => onAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onEnter()}
                className="h-[54px] min-w-0 flex-1 bg-transparent font-mono text-[18px] outline-none focus-visible:outline-none!"
              />
            </label>
            <p className="text-[14px] text-muted">따옴표나 공백은 신경 쓰지 않아도 돼요</p>
          </div>
        )}
        {nav}
      </div>
    </section>
  )
}

/* ================= 결과 ================= */
function Result({ result, onRetry }: { result: QuizResult; onRetry: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const six = result.results.find((r) => r.type === 'line')
  const sixRef = useRef<HTMLElement>(null)
  const flip = (to: boolean) => {
    track('click', `quiz:result:${to ? 'explain' : 'front'}`)
    setFlipped(to)
  }
  const toSix = () => {
    track('click', 'quiz:result:to-six')
    sixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="grid grid-cols-[560px_minmax(0,1fr)] items-start gap-20">
        <div className={`flip ${flipped ? 'is-flipped' : ''}`}>
          <div className="flip-inner">
            <CardFront result={result} onFlip={() => flip(true)} />
            <CardBack result={result} onFlip={() => flip(false)} onSix={toSix} />
          </div>
        </div>
        <ResultSide result={result} onRetry={onRetry} onSix={six ? toSix : undefined} />
      </section>
      {six && (
        <section ref={sixRef} id="q6" className="mt-28 scroll-mt-8 border-t border-ink pt-16">
          <Explain6 q={six} result={result} />
        </section>
      )}
    </>
  )
}

function CardFront({ result, onFlip }: { result: QuizResult; onFlip: () => void }) {
  const s = stageOf(result.stage.key)
  return (
    <div className="flip-face flip-front flex flex-col rounded-result border border-line bg-surface p-6 shadow-dialog">
      <div className="relative flex h-[270px] items-end justify-center overflow-hidden rounded-card bg-sky">
        {/* 발밑의 흐린 접지 그림자 (구현 전달: 그림자 예외) */}
        <span className="absolute bottom-[22px] h-4 w-[150px] rounded-full bg-ink/15 blur-md" />
        <img src={s.src} alt={s.name} className={`relative mb-6 ${s.h} max-h-[230px] origin-bottom ${s.idle}`} />
      </div>
      <div className="flex flex-col gap-2 px-2 pt-6">
        <Mark>// 지금 나는</Mark>
        <p className="font-display text-[40px] leading-[1.25] font-extrabold">{result.stage.label}</p>
        <p className="flex items-baseline gap-2 text-[18px]">
          {result.total}문제 중
          <b className="font-display text-[44px] leading-none font-extrabold">{result.score}</b>개 맞혔어요
        </p>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-dashed border-dash px-2 pt-5">
        <span className="font-mono text-[13px] text-muted">// 카드를 뒤집으면 문제별 해설</span>
        <Button variant="secondary" onClick={onFlip}>
          해설 보기
        </Button>
      </div>
    </div>
  )
}

const GRADE = {
  correct: { label: '정답', cls: 'bg-success-bg text-success' },
  partial: { label: '절반', cls: 'bg-warning-bg text-warning' },
  wrong: { label: '오답', cls: 'bg-error-bg text-error' },
} as const

function showAnswer(q: QuizResultItem, a: Answer | string): string {
  if (a === null || a === undefined || a === '') return '(비움)'
  if (q.type === 'choice') return `${CIRCLED[Number(a) - 1] ?? a} ${q.choices[Number(a) - 1] ?? ''}`
  if (q.type === 'line') return `${a}번 줄`
  return String(a)
}

function CardBack({ result, onFlip, onSix }: { result: QuizResult; onFlip: () => void; onSix: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="flip-face flip-back flex flex-col rounded-result border border-line bg-surface p-6 shadow-dialog">
      <div className="flex items-center justify-between px-2 pb-4">
        <p className="text-[20px] font-bold">문제별 해설</p>
        <Button variant="text" onClick={onFlip}>
          ← 앞면
        </Button>
      </div>
      <ol className="flex flex-col border-t border-ink">
        {result.results.map((q) => {
          const g = GRADE[q.result]
          const isSix = q.type === 'line'
          const isOpen = open === q.id
          return (
            <li key={q.id} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isSix ? undefined : isOpen}
                onClick={() => {
                  if (isSix) return onSix()
                  track('click', `quiz:explain:${q.order}`)
                  setOpen(isOpen ? null : q.id)
                }}
                className="grid w-full grid-cols-[28px_minmax(0,1fr)_auto_20px] items-center gap-3 px-2 py-3.5 text-left hover:bg-sky/30"
              >
                <span className="font-mono text-[14px] text-mark">{q.order}</span>
                <span className="min-w-0 truncate text-[16px] font-semibold">{q.title}</span>
                <span className={`rounded-badge px-2 py-0.5 text-[13px] font-bold ${g.cls}`}>{g.label}</span>
                <span className="text-center font-mono text-[14px] text-muted">{isSix ? '↓' : isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-3 px-2 pb-5 pl-[42px]">
                  <p className="font-mono text-[14px]">
                    <span className="text-muted">내 답 </span>
                    {showAnswer(q, q.my_answer)}
                    {q.result !== 'correct' && (
                      <>
                        <span className="text-muted"> · 정답 </span>
                        {showAnswer(q, q.answer)}
                      </>
                    )}
                  </p>
                  <RichText
                    text={q.explanation}
                    className="gap-3! text-[15px]"
                    slots={q.better_code ? { better_code: <Code code={q.better_code} size="sm" /> } : undefined}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <p className="px-2 pt-4 font-mono text-[13px] text-muted">// 6번 해설은 아래에 펼쳐 두었어요</p>
    </div>
  )
}

/** 결과 옆: 메시지, 다음 행동, 기록 안내, 다시 풀기 */
function ResultSide({ result, onRetry, onSix }: { result: QuizResult; onRetry: () => void; onSix?: () => void }) {
  const { key } = result.stage
  return (
    <div className="flex flex-col gap-8 pt-6">
      <div className="flex flex-col gap-4">
        <Mark>// 결과</Mark>
        <p className="font-display text-[36px] leading-[1.35] font-extrabold tracking-[-0.01em]">{MESSAGE[key]}</p>
      </div>
      {key === 'hatchling' && (
        <div className="flex flex-col gap-3">
          <p className="text-[16px] font-semibold">먼저 보면 좋은 기초 자료</p>
          <ul className="flex flex-col border-t border-line">
            {BASICS.map((b, i) => (
              <li key={b.title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 border-b border-line py-3">
                <span className="font-mono text-[14px] text-mark">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[16px] font-semibold">{b.title}</span>
                <span className="col-start-2 text-[14px] text-muted">{b.desc}</span>
              </li>
            ))}
          </ul>
          <p className="font-mono text-[12px] text-disabled-ink">// 가상 자료 · 실제 자료가 정해지면 바뀌어요</p>
        </div>
      )}
      <NextAction result={result} where="result" />
      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <RecordNote result={result} />
        <div className="flex items-center gap-8">
          {onSix && (
            <Button variant="text" onClick={onSix}>
              6번 해설 보기 ↓
            </Button>
          )}
          <Button variant="text" onClick={onRetry}>
            다시 풀기 →
          </Button>
        </div>
      </div>
    </div>
  )
}

function RecordNote({ result }: { result: QuizResult }) {
  let text: string
  if (!result.saved) text = '로그인이 안 돼 있어 이번 결과는 기록하지 않았어요'
  else if (result.is_first) text = '첫 응시라 이 결과를 기준 기록으로 남겼어요'
  else text = `기준 기록은 첫 응시 ${result.first_score} / ${result.total} 그대로예요. 이번 결과도 함께 남겼어요`
  return <p className="font-mono text-[14px] text-muted">// {text}</p>
}

/** 신청하기 / 이미 신청하셨어요 / 다음 기수 알림 받기. 결과가 낮아도 신청은 막지 않는다 */
function NextAction({ result, where }: { result: QuizResult; where: 'result' | 'six' }) {
  const { me, reload } = useMe()
  const { toast } = useFeedback()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const interested = !!(me && me.logged_in && me.interested)
  // 여기 주 버튼이 보이는 동안 상단 메뉴의 [신청하기]를 숨긴다 (주 버튼은 한 화면에 하나)
  const box = useHideNavPrimary<HTMLDivElement>(`quiz:${where}`, !result.applied)

  const apply = (label: string) => (
    <Button
      variant={label === '그래도 신청하기' ? 'secondary' : 'primary'}
      onClick={() => {
        track('click', `quiz:${where}:apply`)
        navigate('/apply')
      }}
    >
      {label}
    </Button>
  )
  const alert = (
    <Button
      disabled={busy || interested}
      onClick={async () => {
        track('click', `quiz:${where}:interest`)
        if (!me?.logged_in) return toast('로그인이 필요해요')
        setBusy(true)
        try {
          await postInterest()
          await reload()
          toast('다음 기수 모집이 열리면 알려 드릴게요')
        } catch (e) {
          toast(errText(e))
        } finally {
          setBusy(false)
        }
      }}
    >
      {interested ? '✓ 알림 신청됨' : '다음 기수 알림 받기'}
    </Button>
  )

  if (result.applied)
    return (
      <p className="flex items-baseline gap-4 text-[17px]">
        <span className="rounded-badge bg-success-bg px-2.5 py-1 text-[14px] font-bold text-success">✓ 이미 신청하셨어요</span>
        <Link to="/apply" className="font-semibold underline-offset-4 hover:underline" onClick={() => track('click', `quiz:${where}:mine`)}>
          신청 내용 보기 →
        </Link>
      </p>
    )
  if (!result.recruiting)
    return (
      <div ref={box} className="flex flex-col items-start gap-3">
        <p className="text-[16px] text-muted">지금은 모집 기간이 아니에요.</p>
        {alert}
      </div>
    )
  if (result.stage.key === 'hatchling')
    return (
      <div ref={box} className="flex items-center gap-4">
        {alert}
        {apply('그래도 신청하기')}
      </div>
    )
  return <div ref={box}>{apply('신청하기')}</div>
}

/* ================= 6번 해설 (펼친 채로) ================= */
function Explain6({ q, result }: { q: QuizResultItem; result: QuizResult }) {
  const lines = q.code.split('\n')
  const lineText = (n: number) => (lines[n - 1] ?? '').trim()
  const mine = typeof q.my_answer === 'number' ? q.my_answer : Number(q.my_answer) || null
  const right = Number(q.answer)

  const box = {
    correct: { cls: 'border-success bg-success-bg', text: <>정답이에요.</> },
    partial: { cls: 'border-warning bg-warning-bg', text: <>절반 맞았어요. 더 직접적인 원인이 있어요.</> },
    wrong: { cls: 'border-error bg-error-bg', text: <>정답은 {right}번 줄이에요.</> },
  }[q.result]

  const instructor = (quote: string[]) => (
    <div className="mt-6 grid grid-cols-[120px_minmax(0,1fr)] items-end gap-8 rounded-result bg-sky px-10 pt-8">
      <img src="/images/instructor-stand.webp" alt="강사 백조" className="h-[150px] justify-self-center object-contain object-bottom" />
      <div className="flex flex-col gap-3 pb-8">
        <Mark>// 강사 한마디</Mark>
        <p className="text-[22px] leading-[1.6] font-bold">
          <Inline text={quote[0]} />
        </p>
        {quote.slice(1).map((l, i) => (
          <p key={i} className="text-[14px] text-muted">
            <Inline text={l} />
          </p>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-end justify-between gap-8">
        <div className="flex flex-col gap-3">
          <Mark>// {q.order}번 해설</Mark>
          <h2 className="font-display text-[40px] leading-[1.4] font-extrabold tracking-[-0.01em]">{q.title}</h2>
        </div>
        <Button variant="text" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ← 결과로
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-14">
        <div className="flex flex-col gap-4">
          <p className={`rounded-btn border-l-4 px-5 py-4 text-[17px] ${box.cls}`}>
            {mine ? (
              <>
                {/* 코드 뒤에 바로 조사를 붙이면 "pass을"처럼 틀린다. 조사는 '줄'에 붙인다 */}
                <b>{mine}번 줄</b>(<code className="font-mono text-[15px]">{lineText(mine)}</code>)을 골랐어요. {box.text}
              </>
            ) : (
              <>줄을 고르지 않았어요. 정답은 {right}번 줄이에요.</>
            )}
          </p>
          <Code
            code={q.code}
            tone={(n) => (n === right ? 'success' : q.partial_answer.includes(n) ? 'warning' : undefined)}
            bar={(n) => n === mine}
            note={(n) => q.line_notes[String(n)] ?? (n === mine && n !== right && !q.partial_answer.includes(n) ? '내가 고른 줄' : null)}
          />
          <p className="flex gap-6 font-mono text-[13px] text-muted">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-[3px] bg-success-bg ring-1 ring-success/40" /> 정답 줄
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-[3px] bg-warning-bg ring-1 ring-warning/40" /> 절반 맞는 줄
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-1 bg-ink" /> 내가 고른 줄
            </span>
          </p>
        </div>
        <RichText text={q.scenario ?? ''} className="text-[15px]" />
      </div>

      <div className="max-w-[980px]">
        <RichText
          text={q.explanation}
          quote={instructor}
          slots={{ better_code: q.better_code ? <Compare before={q.code} after={q.better_code} /> : null }}
        />
      </div>

      <div className="flex items-center gap-6 border-t border-line pt-10">
        <Button variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          결과로 돌아가기
        </Button>
        <NextAction result={result} where="six" />
      </div>
    </div>
  )
}

/** 원래 코드와 더 나은 코드를 나란히. 새로 생기거나 바뀐 줄만 sky 바탕 */
function Compare({ before, after }: { before: string; after: string }) {
  const old = new Set(before.split('\n').map((l) => l.trim()))
  const afterLines = after.split('\n')
  return (
    <div className="grid w-[1248px] max-w-[calc(100vw-192px)] grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[13px] text-mark">// AI가 고친 코드</span>
        <Code code={before} size="sm" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[13px] text-mark">// 더 나은 코드 · 바뀐 줄</span>
        <Code code={after} size="sm" tone={(n) => (old.has((afterLines[n - 1] ?? '').trim()) ? undefined : 'sky')} />
      </div>
    </div>
  )
}
