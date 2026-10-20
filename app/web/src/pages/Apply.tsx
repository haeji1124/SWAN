// 신청 화면 /apply (Phase 2). 확신이 든 사람이 10초 만에 끝낼 수 있게: 신청서는 두 칸뿐.
// 이름·부서·사번은 화면에 묻지 않고 로그인 정보로 서버가 저장한다. 선발이 없어서 신청하면 바로 수강 확정이다.
// 정보를 읽는 화면이라 장식 없이 둔다 (구현 전달 3장: 상단 메뉴 대신 로고 + [나가기]).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Confetti, type ConfettiHandle } from '../components/Confetti'
import { FrameCanvas, frameUrls, type FrameCanvasHandle } from '../components/FrameCanvas'
import { useFeedback } from '../components/Feedback'
import {
  ApiError,
  cancelApply,
  getApplyInfo,
  postApply,
  postInterest,
  type ApplyInfo,
  type CohortInfo,
  type MyApplication,
  type PythonExp,
} from '../lib/api'
import { useMe } from '../lib/me'
import { prefersReducedMotion } from '../lib/motion'
import { track } from '../lib/track'
import { dLabel } from './home/types'

const EXP: { value: PythonExp; label: string; desc: string }[] = [
  { value: 'none', label: '거의 없음', desc: '책이나 강의로 조금 봤어요' },
  { value: 'script', label: '간단한 스크립트', desc: '짧은 스크립트를 짜 본 적 있어요' },
  { value: 'regular', label: '업무에 꾸준히 사용 중', desc: '업무에 정기적으로 써요' },
]
const WANT_MAX = 300

const errText = (e: unknown) => (e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요')

export function Apply() {
  const { me, reload } = useMe()
  const [info, setInfo] = useState<ApplyInfo | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [done, setDone] = useState<MyApplication | null>(null)

  const load = useCallback(() => {
    setLoadError(false)
    getApplyInfo()
      .then(setInfo)
      .catch(() => setLoadError(true))
  }, [])
  useEffect(load, [load])

  let body: ReactNode
  if (loadError) body = <LoadFailed onRetry={load} />
  else if (!info || me === null) body = <p className="font-mono text-[15px] text-muted motion-safe:animate-pulse">// 신청 정보를 불러오는 중…</p>
  else if (done) body = <Done result={done} />
  else if (!me.logged_in) body = <NeedLogin />
  else if (!info.cohort) body = <NotRecruiting info={info} onChange={load} />
  else if (info.mine) body = <AlreadyApplied cohort={info.cohort} mine={info.mine} onCanceled={load} />
  else
    body = (
      <ApplyForm
        cohort={info.cohort}
        onDone={async (r) => {
          setDone(r)
          await reload() // 상단 버튼을 [신청 완료]로
        }}
      />
    )

  return (
    <div className="min-h-screen bg-paper">
      {/* 선은 화면 끝까지, 내용은 페이지 폭 안 (상단 메뉴와 같게) */}
      <header className="border-b border-line">
        <div className="page flex h-[88px] items-center justify-between">
          <Link to="/" className="flex items-baseline gap-2" onClick={() => track('click', 'apply:logo')}>
            <span className="font-mono text-[15px] text-mark">&gt;_</span>
            <span className="font-display text-[26px] font-extrabold tracking-[0.02em]">SWAN</span>
          </Link>
          <Link to="/" className="text-[16px] font-semibold underline-offset-4 hover:underline" onClick={() => track('click', 'apply:exit')}>
            나가기
          </Link>
        </div>
      </header>
      <main className="page pt-20 pb-32">{body}</main>
    </div>
  )
}

/* ---------- 기수 정보: 신청서 왼쪽 ---------- */
function CohortFacts({ c }: { c: CohortInfo }) {
  const rows: [string, ReactNode][] = [
    ['모집 기간', <>{c.recruit_start_label} ~ {c.recruit_end_label} <span className="font-mono text-[15px] text-muted">· 마감 {dLabel(c.days_left)}</span></>],
    ['개강', <>{c.start_label} <span className="font-mono text-[15px] text-muted">· D-{Math.max(c.days_to_start, 0)}</span></>],
    ['강의', `매주 ${c.class_day} ${c.class_time} · 온라인 1시간 30분`],
    ['기간', `${c.start_label} ~ ${c.end_label} (3개월)`],
  ]
  return (
    <div className="flex flex-col gap-6">
      <dl className="flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-t border-line py-4 text-[17px] last:border-b">
            <dt className="font-mono text-[14px] text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-card bg-sky px-5 py-4 text-[16px] leading-relaxed">
        <b>주 3~4시간이 필요해요.</b> 강의 1시간 30분에 복습과 실습을 더한 시간이에요.
      </p>
      <p className="text-[15px] leading-relaxed text-muted">선발 없이, 신청하면 바로 수강이 확정돼요.</p>
    </div>
  )
}

/* ---------- 신청서: 두 칸 ---------- */
function ApplyForm({ cohort, onDone }: { cohort: CohortInfo; onDone: (r: MyApplication) => void }) {
  const [exp, setExp] = useState<PythonExp | null>(null)
  const [want, setWant] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!exp || sending) return
    track('click', 'apply:submit')
    setSending(true)
    setError(null)
    try {
      onDone(await postApply(exp, want))
    } catch (e) {
      setError(errText(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-24">
      <div className="flex flex-col gap-8">
        <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">{cohort.number}기 신청</h1>
        <CohortFacts c={cohort} />
      </div>
      <form
        className="flex max-w-[640px] flex-col gap-12"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-[20px] font-bold">
            파이썬을 써 본 경험 <span className="text-[15px] font-semibold text-error">필수</span>
          </legend>
          {EXP.map((o) => {
            const checked = exp === o.value
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-4 rounded-btn border px-5 py-4 transition-colors ${
                  checked ? 'border-ink bg-surface' : 'border-line bg-surface hover:border-mark'
                }`}
              >
                <input
                  type="radio"
                  name="python_exp"
                  value={o.value}
                  checked={checked}
                  onChange={() => setExp(o.value)}
                  className="peer sr-only"
                />
                {/* 고르기: 테두리 1.5px → 고르면 ink 6px 테두리 (구현 전달 2장) */}
                <span
                  className={`h-5 w-5 shrink-0 rounded-full border-ink transition-[border-width] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
                    checked ? 'border-[6px]' : 'border-[1.5px] border-disabled-ink'
                  }`}
                  aria-hidden
                />
                <span className="flex flex-col">
                  <span className="text-[17px] font-semibold">{o.label}</span>
                  <span className="text-[15px] text-muted">{o.desc}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <div className="flex flex-col gap-3">
          <label htmlFor="want" className="text-[20px] font-bold">
            만들고 싶은 것, 자동화하고 싶은 업무 <span className="text-[15px] font-semibold text-muted">선택</span>
          </label>
          <textarea
            id="want"
            rows={2}
            maxLength={WANT_MAX}
            value={want}
            onChange={(e) => setWant(e.target.value)}
            placeholder="예: 매일 아침 설비 로그를 모아 보는 일"
            className="resize-none rounded-btn border border-line bg-surface px-4 py-3 text-[17px] leading-relaxed outline-none placeholder:text-disabled-ink focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]"
          />
          <span className="self-end font-mono text-[13px] text-muted">
            {want.length} / {WANT_MAX}
          </span>
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-8">
          <p className="text-[15px] text-muted">이름 · 부서 · 사번은 사내 계정 정보로 함께 저장돼요.</p>
          <div className="flex items-center gap-6">
            <Button type="submit" disabled={!exp || sending}>
              {sending ? '보내는 중…' : `${cohort.number}기 신청하기`}
            </Button>
            {!exp && <span className="text-[15px] text-muted">파이썬 경험을 골라 주세요</span>}
          </div>
          {error && (
            <p role="alert" className="text-[15px] font-semibold text-error">
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

/* ---------- 접수 완료 ---------- */
// 축하: 오리가 컨페티 속에서 두 번 폴짝 (히어로와 같은 duck-hop 18장, 초당 12장). 움직임 줄이기면 서 있는 장면만
const HOP = frameUrls('duck-hop', 18)
const HOP_SIZE = 585 // 프레임 720 안에서 오리 키 369px → 화면에서 약 300px
const HOP_TIMES = 2

function Done({ result }: { result: MyApplication }) {
  const confetti = useRef<ConfettiHandle>(null)
  const hop = useRef<FrameCanvasHandle>(null)
  useEffect(() => {
    hop.current?.draw(0)
    if (prefersReducedMotion()) return
    const id = window.setTimeout(() => confetti.current?.burst(180, 260), 200)
    let f = 0
    let timer = 0
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        f += 1
        hop.current?.draw(f % HOP.length)
        if (f >= HOP.length * HOP_TIMES - 1) window.clearInterval(timer)
      }, 1000 / 12)
    }, 200)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(start)
      window.clearInterval(timer)
    }
  }, [])
  return (
    <div className="relative grid grid-cols-[360px_minmax(0,1fr)] items-center gap-24">
      <div className="relative flex h-[420px] items-end justify-center">
        {/* 프레임 안에서 발은 아래 11% 지점이라 그만큼 내려 발이 바닥에 닿게 한다 */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -HOP_SIZE * 0.11, width: HOP_SIZE, height: HOP_SIZE }} role="img" aria-label="안경 쓴 오리가 폴짝 뛰며 축하한다">
          <FrameCanvas ref={hop} urls={HOP} size={HOP_SIZE} />
        </div>
        <Confetti ref={confetti} width={360} height={420} className="absolute inset-0" />
      </div>
      <div className="flex flex-col gap-8">
        <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">
          {result.cohort_number}기 신청이
          <br />
          접수됐어요
        </h1>
        <dl className="flex max-w-[560px] flex-col">
          {(
            [
              ['신청한 분', `${result.name} · ${result.dept}`],
              ['신청 일시', result.applied_label],
              ['개강', `${result.start_label} · ${result.days_to_start > 0 ? `${result.days_to_start}일 남았어요` : '곧 시작해요'}`],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-t border-line py-4 text-[17px] last:border-b">
              <dt className="font-mono text-[14px] text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-6">
          <Link
            to="/projects"
            onClick={() => track('click', 'apply:done:projects')}
            className="inline-flex rounded-btn bg-ink px-[26px] py-[13px] text-[16px] font-bold text-white hover:bg-ink-hover"
          >
            완성작 구경하기
          </Link>
          <Link to="/" onClick={() => track('click', 'apply:done:home')} className="text-[16px] font-semibold underline-offset-4 hover:underline">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ---------- 이미 신청함 ---------- */
function AlreadyApplied({ cohort, mine, onCanceled }: { cohort: CohortInfo; mine: MyApplication; onCanceled: () => void }) {
  const { confirm, toast } = useFeedback()
  const { reload } = useMe()
  const [busy, setBusy] = useState(false)
  return (
    <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-24">
      <div className="flex flex-col gap-8">
        <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">
          이미 {cohort.number}기에
          <br />
          신청하셨어요
        </h1>
        <CohortFacts c={cohort} />
      </div>
      <div className="flex max-w-[640px] flex-col gap-8">
        <dl className="flex flex-col">
          {(
            [
              ['신청 일시', mine.applied_label],
              ['파이썬 경험', mine.python_exp_label],
              ['만들고 싶은 것', mine.want_to_make || '—'],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-t border-line py-4 text-[17px] last:border-b">
              <dt className="font-mono text-[14px] text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-6">
          <Link to="/" className="inline-flex rounded-btn bg-ink px-[26px] py-[13px] text-[16px] font-bold text-white hover:bg-ink-hover">
            홈으로
          </Link>
          <Button
            variant="text"
            disabled={busy}
            className="text-error!"
            onClick={async () => {
              const ok = await confirm({
                title: '신청을 취소할까요?',
                body: '취소해도 모집 기간 안에는 다시 신청할 수 있어요.',
                confirmLabel: '신청 취소',
                cancelLabel: '그대로 두기',
                danger: true,
              })
              if (!ok) return
              track('click', 'apply:cancel')
              setBusy(true)
              try {
                await cancelApply()
                await reload()
                toast('신청을 취소했어요')
                onCanceled()
              } catch (e) {
                toast(errText(e))
              } finally {
                setBusy(false)
              }
            }}
          >
            신청 취소
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- 모집 기간이 아님 ---------- */
function NotRecruiting({ info, onChange }: { info: ApplyInfo; onChange: () => void }) {
  const { reload } = useMe()
  const { toast } = useFeedback()
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex max-w-[760px] flex-col gap-8">
      <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">지금은 모집 기간이 아니에요</h1>
      <p className="text-[18px] leading-relaxed text-ink/80">
        {info.next_number}기 모집이 열리면 알려 드릴게요. 그동안 완성작과 커리큘럼을 둘러보거나 수준 테스트를 풀어 볼 수 있어요.
      </p>
      <div className="flex items-center gap-6">
        {info.interested ? (
          <Button variant="secondary" disabled>
            <span className="font-mono">✓</span> 알림 신청됨
          </Button>
        ) : (
          <Button
            disabled={busy}
            onClick={async () => {
              track('click', 'apply:interest')
              setBusy(true)
              try {
                await postInterest()
                await reload()
                toast('알림을 신청했어요. 다음 기수 모집이 열리면 알려 드릴게요')
                onChange()
              } catch (e) {
                toast(errText(e))
              } finally {
                setBusy(false)
              }
            }}
          >
            다음 기수 알림 받기
          </Button>
        )}
        <Link to="/quiz" className="text-[16px] font-semibold underline-offset-4 hover:underline">
          수준 테스트 풀어 보기 →
        </Link>
      </div>
    </div>
  )
}

function NeedLogin() {
  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">로그인이 필요해요</h1>
      <p className="text-[18px] leading-relaxed text-ink/80">사내 계정으로 자동 로그인되지 않았어요. 사내망에서 다시 열어 주세요. 화면은 그대로 둘러볼 수 있어요.</p>
      <Link to="/" className="text-[16px] font-semibold underline-offset-4 hover:underline">
        홈으로 →
      </Link>
    </div>
  )
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const navigate = useNavigate()
  return (
    <div role="alert" className="flex flex-col gap-4">
      <p className="text-[18px] font-semibold text-error">신청 정보를 불러오지 못했어요.</p>
      <div className="flex gap-6">
        <Button variant="secondary" onClick={onRetry} data-retry>
          다시 시도
        </Button>
        <Button variant="text" onClick={() => navigate('/')}>
          홈으로
        </Button>
      </div>
    </div>
  )
}
