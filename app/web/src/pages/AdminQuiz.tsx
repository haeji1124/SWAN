// 관리자 · 수준 테스트 (Phase 3): 문제 목록 · 추가 · 수정, 응시 결과 표
// 고친 문제는 바로 /quiz에 반영된다. 응시 기록에는 그때의 채점 결과가 남아 있어서, 문제를 고쳐도 지난 판정은 바뀌지 않는다.
import { useState, type ReactNode } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Button } from '../components/Button'
import { Code } from '../components/Code'
import { useFeedback } from '../components/Feedback'
import {
  addQuizQuestion,
  editQuizQuestion,
  listQuizAttempts,
  listQuizQuestions,
  type Grade,
  type QuizQuestionForm,
  type QuizQuestionFull,
  type QuizType,
} from '../lib/quizApi'
import { track } from '../lib/track'
import { Badge, LoadState, Title, errText, useLoad } from './Admin'

const TYPE_LABEL: Record<QuizType, string> = { choice: '보기 고르기', short: '주관식', line: '줄 고르기' }
const CIRCLED = '①②③④⑤⑥⑦⑧'

export function QuizAdmin() {
  const tab = (to: string, label: string) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-btn px-4 py-2 text-[15px] font-semibold ${isActive ? 'bg-ink text-white' : 'bg-sky hover:bg-sky-hover'}`
      }
    >
      {label}
    </NavLink>
  )
  return (
    <div>
      <Title
        text="수준 테스트"
        sub="문제를 고치면 바로 /quiz에 반영돼요. 응시 결과는 첫 응시를 기준 기록으로 보여 줘요."
        right={
          <>
            {tab('/admin/quiz', '문제')}
            {tab('/admin/quiz/attempts', '응시 결과')}
          </>
        }
      />
      <Routes>
        <Route index element={<Questions />} />
        <Route path="attempts" element={<Attempts />} />
      </Routes>
    </div>
  )
}

function answerLabel(q: QuizQuestionFull | QuizQuestionForm) {
  if (q.type === 'choice') return `${CIRCLED[Number(q.answer) - 1] ?? q.answer} ${q.choices[Number(q.answer) - 1] ?? ''}`
  if (q.type === 'line') return `${q.answer}번 줄${q.partial_answer.length ? ` (절반: ${q.partial_answer.join(', ')})` : ''}`
  return q.answer
}

/* ================= 문제 ================= */
function Questions() {
  const { data, error, load } = useLoad(listQuizQuestions, [])
  const [editing, setEditing] = useState<QuizQuestionFull | 'new' | null>(null)
  const nextOrder = data ? Math.max(0, ...data.map((q) => q.order)) + 1 : 1

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <p className="text-[15px] text-muted">
          문제 {data?.length ?? '-'}개 · 맞힌 개수 5~6 어린 백조 / 3~4 아기 오리 / 0~2 알에서 나온 오리
        </p>
        <Button onClick={() => setEditing('new')} disabled={editing !== null}>
          문제 추가
        </Button>
      </div>
      {editing && (
        <QuestionEditor
          initial={editing === 'new' ? undefined : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
      {!data ? (
        <LoadState error={error} onRetry={load} />
      ) : (
        <table className="w-full table-fixed border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-y border-ink text-[13px] text-muted">
              <th className="w-[60px] py-3 font-semibold">순서</th>
              <th className="w-[120px] font-semibold">유형</th>
              <th className="w-[300px] font-semibold">제목</th>
              <th className="font-semibold">질문</th>
              <th className="w-[200px] font-semibold">정답</th>
              <th className="w-[80px] font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {data.map((q) => (
              <tr key={q.id} className="border-b border-line">
                <td className="py-4 font-mono">{q.order}</td>
                <td>
                  <Badge tone={q.type === 'line' ? 'warning' : q.type === 'short' ? 'success' : 'sky'}>{TYPE_LABEL[q.type]}</Badge>
                </td>
                <td className="truncate pr-4 font-semibold" title={q.title}>
                  {q.title}
                </td>
                <td className="truncate pr-4 text-muted" title={q.question}>
                  {q.question}
                </td>
                <td className="truncate pr-4 font-mono text-[14px]" title={answerLabel(q)}>
                  {answerLabel(q)}
                </td>
                <td>
                  <Button
                    variant="text"
                    disabled={editing !== null}
                    onClick={() => {
                      track('click', `admin:quiz:edit:${q.order}`)
                      setEditing(q)
                    }}
                  >
                    수정
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const empty = (order: number): QuizQuestionForm => ({
  order,
  type: 'choice',
  title: '',
  scenario: '',
  code: '',
  question: '다음 코드를 실행하면 무엇이 출력될까요?',
  choices: ['', '', '', ''],
  answer: '',
  partial_answer: [],
  explanation: '',
  better_code: '',
  line_notes: {},
})

const inputCls =
  'rounded-btn border border-line bg-surface px-3 py-2.5 text-[16px] font-normal text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]'
const monoCls = `${inputCls} font-mono text-[14px] leading-[24px]`

function Field({ label, help, children, className = '' }: { label: string; help?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-2 text-[14px] font-semibold text-muted ${className}`}>
      {label}
      {children}
      {help && <span className="text-[13px] font-normal">{help}</span>}
    </label>
  )
}

function QuestionEditor({
  initial,
  nextOrder,
  onClose,
  onSaved,
}: {
  initial?: QuizQuestionFull
  nextOrder: number
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useFeedback()
  const [f, setF] = useState<QuizQuestionForm>(() => {
    if (!initial) return empty(nextOrder)
    const { id: _id, ...rest } = initial // eslint-disable-line @typescript-eslint/no-unused-vars
    return { ...rest, scenario: rest.scenario ?? '', better_code: rest.better_code ?? '', choices: rest.type === 'choice' ? rest.choices : ['', '', '', ''] }
  })
  const [lineMode, setLineMode] = useState<'answer' | 'partial'>('answer')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof QuizQuestionForm>(k: K, v: QuizQuestionForm[K]) => setF((x) => ({ ...x, [k]: v }))
  const text = (k: 'title' | 'scenario' | 'code' | 'question' | 'answer' | 'explanation' | 'better_code') => ({
    value: (f[k] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
  })

  const pickLine = (n: number) => {
    if (lineMode === 'answer') {
      set('answer', String(n))
      set('partial_answer', f.partial_answer.filter((p) => p !== n))
    } else if (String(n) !== f.answer) {
      set('partial_answer', f.partial_answer.includes(n) ? f.partial_answer.filter((p) => p !== n) : [...f.partial_answer, n].sort((a, b) => a - b))
    }
  }
  const markedLines = [Number(f.answer), ...f.partial_answer].filter((n) => n > 0)
  const filled = f.title.trim() && f.code.trim() && f.question.trim() && f.answer.trim() && f.explanation.trim()

  return (
    <form
      className="flex flex-col gap-6 rounded-dialog border border-line bg-surface p-8"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
          const body = {
            ...f,
            line_notes: Object.fromEntries(Object.entries(f.line_notes).filter(([k]) => markedLines.includes(Number(k)))),
          }
          if (initial) await editQuizQuestion(initial.id, body)
          else await addQuizQuestion(body)
          toast(initial ? `${f.order}번 문제를 고쳤어요` : `${f.order}번 문제를 추가했어요`)
          onSaved()
        } catch (err) {
          setError(errText(err))
        } finally {
          setSaving(false)
        }
      }}
    >
      <p className="text-[20px] font-bold">{initial ? `${initial.order}번 문제 수정` : '문제 추가'}</p>

      <div className="grid grid-cols-[100px_200px_minmax(0,1fr)] gap-4">
        <Field label="순서">
          <input type="number" min={1} value={f.order} onChange={(e) => set('order', Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="유형">
          <select
            value={f.type}
            onChange={(e) => {
              const type = e.target.value as QuizType
              setF((x) => ({ ...x, type, answer: '', partial_answer: [] }))
            }}
            className={inputCls}
          >
            {(Object.keys(TYPE_LABEL) as QuizType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="제목 (해설 목록·이 표에 보여요)">
          <input maxLength={100} {...text('title')} className={inputCls} />
        </Field>
      </div>

      <Field
        label="상황 설명 (선택)"
        help={
          <>
            문단은 빈 줄로 나눠요. <code className="font-mono">```error 원래 에러</code> … <code className="font-mono">```</code> 처럼 쓰면
            이름 붙은 상자가 돼요. <code className="font-mono">**굵게**</code>
          </>
        }
      >
        <textarea rows={f.type === 'line' ? 8 : 3} maxLength={4000} {...text('scenario')} className={monoCls} />
      </Field>

      <div className="grid grid-cols-2 gap-6">
        <Field label="코드">
          <textarea rows={Math.max(6, f.code.split('\n').length + 1)} maxLength={4000} spellCheck={false} {...text('code')} className={monoCls} />
        </Field>
        <div className="flex flex-col gap-2 text-[14px] font-semibold text-muted">
          미리보기 (문제 화면과 같은 색)
          {f.code.trim() ? <Code code={f.code} size="sm" /> : <p className="py-6 text-[14px] font-normal">// 코드를 적으면 여기에 보여요</p>}
        </div>
      </div>

      <Field label="질문">
        <input maxLength={500} {...text('question')} className={inputCls} />
      </Field>

      {f.type === 'choice' && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[14px] font-semibold text-muted">보기 · 정답은 동그라미를 눌러 골라요</legend>
          {f.choices.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                type="button"
                role="radio"
                aria-checked={f.answer === String(i + 1)}
                aria-label={`${i + 1}번 보기를 정답으로`}
                onClick={() => set('answer', String(i + 1))}
                className={`size-5 shrink-0 rounded-full bg-surface ${f.answer === String(i + 1) ? 'border-[6px] border-ink' : 'border-[1.5px] border-disabled-ink'}`}
              />
              <span className="w-6 text-[16px] text-mark">{CIRCLED[i]}</span>
              <input
                value={c}
                onChange={(e) => set('choices', f.choices.map((x, k) => (k === i ? e.target.value : x)))}
                className={`${inputCls} flex-1 font-mono`}
              />
              {f.answer === String(i + 1) && <Badge tone="success">정답</Badge>}
            </div>
          ))}
        </fieldset>
      )}

      {f.type === 'short' && (
        <Field label="정답" help="채점할 때 앞뒤 공백과 따옴표는 무시해요">
          <input maxLength={100} {...text('answer')} className={`${inputCls} max-w-[400px] font-mono`} />
        </Field>
      )}

      {f.type === 'line' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 text-[14px] font-semibold text-muted">
            줄을 눌러 고르기:
            {(['answer', 'partial'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLineMode(m)}
                className={`rounded-btn px-3 py-1.5 text-[14px] ${lineMode === m ? 'bg-ink text-white' : 'bg-sky text-ink'}`}
              >
                {m === 'answer' ? '정답 줄 (하나)' : '부분 정답 줄 (여러 개, 0점 · "절반 맞았어요")'}
              </button>
            ))}
          </div>
          {f.code.trim() ? (
            <Code
              code={f.code}
              size="sm"
              onPick={pickLine}
              picked={null}
              tone={(n) => (String(n) === f.answer ? 'success' : f.partial_answer.includes(n) ? 'warning' : undefined)}
            />
          ) : (
            <p className="text-[14px] text-muted">// 코드를 먼저 적어 주세요</p>
          )}
          {markedLines.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-semibold text-muted">해설에서 줄 옆에 달 설명 (선택)</p>
              {markedLines.map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-20 font-mono text-[14px]">{n}번 줄</span>
                  <input
                    value={f.line_notes[String(n)] ?? ''}
                    onChange={(e) => set('line_notes', { ...f.line_notes, [String(n)]: e.target.value })}
                    placeholder={String(n) === f.answer ? '결과를 틀리게 만드는 줄' : '에러를 통째로 숨기는 줄'}
                    className={`${inputCls} flex-1`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Field
          label="해설"
          help={
            <>
              <code className="font-mono">### 소제목</code> · <code className="font-mono">1. 목록</code> · <code className="font-mono">| 표 |</code> ·{' '}
              <code className="font-mono">==형광펜==</code> · <code className="font-mono">&gt; 강사 한마디</code> ·{' '}
              <code className="font-mono">{'{{better_code}}'}</code>(더 나은 코드 자리)
            </>
          }
        >
          <textarea rows={12} maxLength={8000} {...text('explanation')} className={monoCls} />
        </Field>
        <Field label="더 나은 코드 (선택)">
          <textarea rows={12} maxLength={4000} spellCheck={false} {...text('better_code')} className={monoCls} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-[15px] font-semibold text-error">
          {error}
        </p>
      )}
      <div className="flex items-center gap-6">
        <Button type="submit" disabled={!filled || saving}>
          {saving ? '저장하는 중…' : '저장'}
        </Button>
        <Button type="button" variant="text" onClick={onClose}>
          그만두기
        </Button>
      </div>
    </form>
  )
}

/* ================= 응시 결과 ================= */
const MARK: Record<Grade, { sym: string; cls: string; label: string }> = {
  correct: { sym: '○', cls: 'text-success', label: '정답' },
  partial: { sym: '△', cls: 'text-warning', label: '절반' },
  wrong: { sym: '×', cls: 'text-error', label: '오답' },
}

function Attempts() {
  const { data, error, load } = useLoad(listQuizAttempts, [])
  if (!data) return <LoadState error={error} onRetry={load} />
  if (data.rows.length === 0) return <p className="border-y border-line py-10 text-center text-[16px] text-muted">아직 응시한 사람이 없어요</p>
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-6 text-[14px] text-muted">
        <span>{data.rows.length}명 응시 · 문제별 칸은 첫 응시의 판정</span>
        {(Object.keys(MARK) as Grade[]).map((g) => (
          <span key={g} className="flex items-center gap-1.5">
            <span className={`text-[17px] font-bold ${MARK[g].cls}`}>{MARK[g].sym}</span>
            {MARK[g].label}
          </span>
        ))}
      </p>
      <table className="w-full table-fixed border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-y border-ink text-[13px] text-muted">
            <th className="w-[96px] py-3 font-semibold">이름</th>
            <th className="w-[140px] font-semibold">부서</th>
            <th className="w-[150px] font-semibold">첫 응시 점수</th>
            <th className="w-[80px] text-right font-semibold">응시</th>
            <th className="w-[130px] pl-6 font-semibold">첫 응시 일시</th>
            {data.questions.map((q) => (
              <th key={q.id} className="text-center font-semibold" title={q.title}>
                {q.order}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.user_id} className="border-b border-line">
              <td className="py-3.5 font-semibold">{r.name}</td>
              <td className="truncate">{r.dept}</td>
              <td>
                <span className="font-mono">
                  {r.first_score} / {data.total}
                </span>
                <span className="ml-2 text-[13px] text-muted">{r.stage}</span>
              </td>
              <td className="text-right font-mono">{r.attempts}회</td>
              <td className="pl-6 font-mono text-[14px]">{r.first_at.replace('T', ' ').slice(5)}</td>
              {data.questions.map((q) => {
                const g = r.results[String(q.id)]
                return (
                  <td key={q.id} className="text-center" title={g ? MARK[g].label : '이 문제가 생기기 전 응시'}>
                    {g ? <span className={`text-[19px] font-bold ${MARK[g].cls}`}>{MARK[g].sym}</span> : <span className="text-disabled-ink">—</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
