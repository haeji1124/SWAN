// 관리자 화면 /admin (Phase 2: 기수 · 신청자 · 졸업생. 나머지 메뉴는 자리만)
// 왼쪽 메뉴 240px 고정, 오른쪽은 폭에 맞춰 늘어난다. 표는 가로 스크롤 없이 마지막 글 칸을 줄임표로 자른다 (구현 전달 3장).
// 관리자만 들어온다: 화면은 App의 AdminOnly, 서버는 auth.require_admin 이 막는다.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Button } from '../components/Button'
import { useFeedback } from '../components/Feedback'
import {
  addCohort,
  applicantsXlsxUrl,
  closeCohort,
  editCohort,
  graduateCohort,
  importAlumni,
  listAlumni,
  listApplicants,
  listCohorts,
  openCohort,
  previewAlumni,
  type AdminCohort,
  type AlumniPreview,
  type AlumniRow,
  type Applicant,
  type CohortForm,
} from '../lib/adminApi'
import { ApiError } from '../lib/api'
import { useMe } from '../lib/me'
import { QuizAdmin } from './AdminQuiz'
import { track } from '../lib/track'

const MENU: { to: string; label: string; phase?: number }[] = [
  { to: 'cohorts', label: '기수' },
  { to: 'applicants', label: '신청자' },
  { to: 'alumni', label: '졸업생' },
  { to: 'projects', label: '완성작 검수', phase: 4 },
  { to: 'toys', label: '토이프로젝트', phase: 5 },
  { to: 'ideas', label: '아이디어', phase: 5 },
  { to: 'quiz', label: '수준 테스트' },
  { to: 'curriculum', label: '커리큘럼', phase: 6 },
  { to: 'admins', label: '관리자', phase: 6 },
]

export const errText = (e: unknown) => (e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요')
const dt = (iso: string) => iso.replace('T', ' ').slice(5) // "10-16 14:05"
// 표 안에서 쓰는 짧은 날짜: "10.12(월)" (긴 "10월 12일(월)"은 칸을 넘친다)
const WEEK = '일월화수목금토'
const md = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getMonth() + 1}.${d.getDate()}(${WEEK[d.getDay()]})`
}

export function Admin() {
  return (
    <div className="flex min-h-[calc(100vh-88px)]">
      <aside className="w-[240px] shrink-0 border-r border-line px-6 py-10">
        <p className="mb-4 px-3 font-mono text-[13px] text-mark">// 관리자</p>
        <nav className="flex flex-col gap-1">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={`/admin/${m.to}`}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-btn px-3 py-2.5 text-[16px] font-semibold ${
                  isActive ? 'bg-sky' : 'hover:bg-sky/40'
                } ${m.phase ? 'text-muted' : ''}`
              }
            >
              {m.label}
              {m.phase && <span className="font-mono text-[12px] text-disabled-ink">P{m.phase}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1 px-14 py-10">
        <Routes>
          <Route index element={<Navigate to="cohorts" replace />} />
          <Route path="cohorts" element={<Cohorts />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="alumni" element={<AlumniPage />} />
          <Route path="quiz/*" element={<QuizAdmin />} />
          {MENU.filter((m) => m.phase).map((m) => (
            <Route
              key={m.to}
              path={m.to}
              element={<Title text={m.label} sub={`// Phase ${m.phase}에서 채워요`} />}
            />
          ))}
          <Route path="*" element={<Navigate to="cohorts" replace />} />
        </Routes>
      </section>
    </div>
  )
}

export function Title({ text, sub, right }: { text: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[40px] leading-[1.3] font-extrabold tracking-[-0.02em]">{text}</h1>
        {sub && <p className="text-[15px] text-muted">{sub}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-4">{right}</div>}
    </div>
  )
}

/** 화면 데이터 불러오기: 불러오는 중 / 실패(다시 시도) / 받음 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    setError(null)
    fn()
      .then(setData)
      .catch((e) => setError(errText(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(load, [load])
  return { data, error, load }
}

export function LoadState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (error)
    return (
      <p role="alert" className="flex items-baseline gap-3 text-[16px]">
        <span className="font-semibold text-error">{error}</span>
        <button type="button" onClick={onRetry} className="font-semibold underline-offset-4 hover:underline">
          다시 시도 →
        </button>
      </p>
    )
  return <p className="font-mono text-[15px] text-muted motion-safe:animate-pulse">// 불러오는 중…</p>
}

export function Badge({ tone, children }: { tone: 'success' | 'sky' | 'gray' | 'warning'; children: ReactNode }) {
  const cls = {
    success: 'bg-success-bg text-success',
    sky: 'bg-sky text-ink',
    gray: 'bg-disabled text-muted',
    warning: 'bg-warning-bg text-warning',
  }[tone]
  return <span className={`inline-flex rounded-badge px-2.5 py-1 text-[13px] font-bold whitespace-nowrap ${cls}`}>{children}</span>
}

const STATUS_TONE = { open: 'success', before: 'sky', closed: 'gray', done: 'gray' } as const

/* ================= 기수 ================= */
function Cohorts() {
  const { data, error, load } = useLoad(listCohorts, [])
  const { confirm, toast } = useFeedback()
  const { reload } = useMe()
  const [editing, setEditing] = useState<AdminCohort | 'new' | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const act = async (id: number, fn: () => Promise<unknown>, done: string) => {
    setBusy(id)
    try {
      await fn()
      toast(done)
      load()
      await reload() // 상단 버튼(신청하기 / 다음 기수 알림 받기)이 바로 바뀌게
    } catch (e) {
      toast(errText(e))
    } finally {
      setBusy(null)
    }
  }

  const nextNumber = data ? Math.max(0, ...data.map((c) => c.number)) + 1 : 1

  return (
    <div>
      <Title
        text="기수"
        sub="모집 중인 기수는 하나만 열 수 있어요. 모집을 닫으면 모든 사람의 버튼이 '다음 기수 알림 받기'로 바뀌어요."
        right={
          <Button onClick={() => setEditing('new')} disabled={editing !== null}>
            기수 추가
          </Button>
        }
      />
      {editing && (
        <CohortEditor
          initial={editing === 'new' ? undefined : editing}
          nextNumber={nextNumber}
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
              <th className="w-[70px] py-3 font-semibold">기수</th>
              <th className="w-[96px] font-semibold">상태</th>
              <th className="font-semibold">모집 기간</th>
              <th className="font-semibold">개강 ~ 종료</th>
              <th className="w-[110px] font-semibold">강의</th>
              <th className="w-[80px] text-right font-semibold">신청</th>
              <th className="w-[80px] text-right font-semibold">졸업생</th>
              <th className="w-[280px] pl-6 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="py-4 font-display text-[20px] font-extrabold">{c.number}기</td>
                <td>
                  <Badge tone={STATUS_TONE[c.status]}>{c.status_label}</Badge>
                </td>
                <td className="truncate font-mono text-[14px]">
                  {md(c.recruit_start)} ~ {md(c.recruit_end)}
                </td>
                <td className="truncate font-mono text-[14px]">
                  {md(c.start_date)} ~ {md(c.end_date)}
                </td>
                <td>
                  {c.class_day} {c.class_time}
                </td>
                <td className="text-right font-mono" title={c.canceled > 0 ? `취소 ${c.canceled}명` : undefined}>
                  {c.applicants}
                  {c.canceled > 0 && <span className="block text-[12px] text-muted">취소 {c.canceled}</span>}
                </td>
                <td className="text-right font-mono">{c.alumni}</td>
                <td className="pl-6">
                  <div className="flex items-center gap-4">
                    <Button variant="text" onClick={() => setEditing(c)} disabled={editing !== null}>
                      수정
                    </Button>
                    {(c.status === 'before' || c.status === 'closed') && (
                      <Button
                        variant="secondary"
                        className="px-4! py-2!"
                        disabled={busy === c.id}
                        onClick={() => {
                          track('click', `admin:cohort:open:${c.number}`)
                          act(c.id, () => openCohort(c.id), `${c.number}기 모집을 열었어요`)
                        }}
                      >
                        모집 열기
                      </Button>
                    )}
                    {c.status === 'open' && (
                      <Button
                        variant="secondary"
                        className="px-4! py-2!"
                        disabled={busy === c.id}
                        onClick={async () => {
                          const ok = await confirm({
                            title: `${c.number}기 모집을 닫을까요?`,
                            body: "닫으면 더 이상 신청을 받지 않고, 모든 사람의 버튼이 '다음 기수 알림 받기'로 바뀌어요. 다시 열 수 있어요.",
                            confirmLabel: '모집 닫기',
                          })
                          if (ok) act(c.id, () => closeCohort(c.id), `${c.number}기 모집을 닫았어요`)
                        }}
                      >
                        모집 닫기
                      </Button>
                    )}
                    {c.status === 'closed' && (
                      <Button
                        variant="text"
                        disabled={busy === c.id}
                        onClick={async () => {
                          const ok = await confirm({
                            title: `${c.number}기를 수료 처리할까요?`,
                            body: `신청자 ${c.applicants}명을 졸업생 명단으로 옮기고 기수를 종료해요. 종료한 기수는 다시 모집할 수 없어요.`,
                            confirmLabel: '수료 처리',
                            danger: true,
                          })
                          if (!ok) return
                          setBusy(c.id)
                          try {
                            const r = await graduateCohort(c.id)
                            toast(`${r.moved}명을 졸업생 명단에 올렸어요${r.skipped ? ` (이미 있던 ${r.skipped}명은 건너뜀)` : ''}`)
                            load()
                          } catch (e) {
                            toast(errText(e))
                          } finally {
                            setBusy(null)
                          }
                        }}
                      >
                        수료 처리
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const DAYS = ['월', '화', '수', '목', '금']

function CohortEditor({
  initial,
  nextNumber,
  onClose,
  onSaved,
}: {
  initial?: AdminCohort
  nextNumber: number
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useFeedback()
  const [f, setF] = useState<CohortForm>(
    initial
      ? {
          number: initial.number,
          recruit_start: initial.recruit_start,
          recruit_end: initial.recruit_end,
          start_date: initial.start_date,
          end_date: initial.end_date,
          class_day: initial.class_day,
          class_time: initial.class_time,
        }
      : { number: nextNumber, recruit_start: '', recruit_end: '', start_date: '', end_date: '', class_day: '목', class_time: '16:00' },
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof CohortForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === 'number' ? Number(e.target.value) : e.target.value })
  const filled = f.number > 0 && f.recruit_start && f.recruit_end && f.start_date && f.end_date && f.class_time

  const field = (label: string, input: ReactNode) => (
    <label className="flex flex-col gap-2 text-[14px] font-semibold text-muted">
      {label}
      {input}
    </label>
  )
  const inputCls =
    'rounded-btn border border-line bg-surface px-3 py-2.5 text-[16px] font-normal text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]'

  return (
    <form
      className="mb-10 flex flex-col gap-6 rounded-dialog border border-line bg-surface p-8"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
          if (initial) await editCohort(initial.id, f)
          else await addCohort(f)
          toast(initial ? `${f.number}기를 고쳤어요` : `${f.number}기를 추가했어요`)
          onSaved()
        } catch (err) {
          setError(errText(err))
        } finally {
          setSaving(false)
        }
      }}
    >
      <p className="text-[20px] font-bold">{initial ? `${initial.number}기 수정` : '기수 추가'}</p>
      <div className="grid grid-cols-[110px_repeat(4,minmax(0,1fr))_110px_130px] gap-4">
        {field('기수', <input type="number" min={1} value={f.number} onChange={set('number')} className={inputCls} />)}
        {field('모집 시작', <input type="date" value={f.recruit_start} onChange={set('recruit_start')} className={inputCls} />)}
        {field('모집 마감', <input type="date" value={f.recruit_end} onChange={set('recruit_end')} className={inputCls} />)}
        {field('개강', <input type="date" value={f.start_date} onChange={set('start_date')} className={inputCls} />)}
        {field('종료', <input type="date" value={f.end_date} onChange={set('end_date')} className={inputCls} />)}
        {field(
          '강의 요일',
          <select value={f.class_day} onChange={set('class_day')} className={inputCls}>
            {DAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>,
        )}
        {field('강의 시간', <input type="time" value={f.class_time} onChange={set('class_time')} className={inputCls} />)}
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

/* ================= 신청자 ================= */
function Applicants() {
  const cohorts = useLoad(listCohorts, [])
  const [picked, setPicked] = useState<number | null>(null)
  // 기본은 모집 중인 기수, 없으면 가장 최근 기수
  const cohortId =
    picked ?? cohorts.data?.find((c) => c.status === 'open')?.id ?? cohorts.data?.[0]?.id ?? null
  const list = useLoad(() => (cohortId ? listApplicants(cohortId) : Promise.resolve(null)), [cohortId])

  if (!cohorts.data) return <LoadState error={cohorts.error} onRetry={cohorts.load} />
  const d = list.data
  return (
    <div>
      <Title
        text="신청자"
        sub={d ? `${d.cohort.number}기 · 신청 ${d.active.length}명 · 취소 ${d.canceled.length}명` : undefined}
        right={
          <>
            <select
              aria-label="기수 고르기"
              value={cohortId ?? ''}
              onChange={(e) => setPicked(Number(e.target.value))}
              className="rounded-btn border border-line bg-surface px-3 py-2.5 text-[16px] outline-none focus:border-ink"
            >
              {cohorts.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number}기 ({c.status_label})
                </option>
              ))}
            </select>
            {cohortId && (
              <a
                href={applicantsXlsxUrl(cohortId)}
                onClick={() => track('click', 'admin:applicants:xlsx')}
                className="inline-flex rounded-btn bg-sky px-[22px] py-[11px] text-[16px] font-bold hover:bg-sky-hover"
              >
                엑셀로 내려받기
              </a>
            )}
          </>
        }
      />
      {!d ? (
        <LoadState error={list.error} onRetry={list.load} />
      ) : (
        <div className="flex flex-col gap-14">
          <ApplicantTable rows={d.active} empty="아직 신청한 사람이 없어요" quizTotal={d.quiz_total} />
          {d.canceled.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-[18px] font-bold">
                취소한 사람 <span className="font-mono text-[15px] text-muted">{d.canceled.length}</span>
              </p>
              <ApplicantTable rows={d.canceled} canceled empty="" quizTotal={d.quiz_total} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApplicantTable({ rows, canceled, empty, quizTotal }: { rows: Applicant[]; canceled?: boolean; empty: string; quizTotal: number }) {
  if (rows.length === 0) return <p className="border-y border-line py-10 text-center text-[16px] text-muted">{empty}</p>
  return (
    <table className={`w-full table-fixed border-collapse text-left text-[15px] ${canceled ? 'text-muted' : ''}`}>
      <thead>
        <tr className="border-y border-ink text-[13px] text-muted">
          <th className="w-[96px] py-3 font-semibold">이름</th>
          <th className="w-[140px] font-semibold">부서</th>
          <th className="w-[120px] font-semibold">{canceled ? '취소 일시' : '신청 일시'}</th>
          <th className="w-[170px] font-semibold">파이썬 경험</th>
          <th className="w-[120px] font-semibold">수준 테스트</th>
          <th className="font-semibold">만들고 싶은 것</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-line">
            <td className="py-3.5 font-semibold">{r.name}</td>
            <td className="truncate">{r.dept}</td>
            <td className="font-mono text-[14px]">{dt(canceled && r.canceled_at ? r.canceled_at : r.applied_at)}</td>
            <td>{r.python_exp_label}</td>
            <td className="font-mono text-[14px]" title={r.quiz_first_score === null ? '아직 수준 테스트를 풀지 않았어요' : '첫 응시 점수 (기준 기록)'}>
              {r.quiz_first_score === null ? <span className="text-disabled-ink">—</span> : `${r.quiz_first_score} / ${quizTotal}`}
            </td>
            <td className="truncate" title={r.want_to_make ?? ''}>
              {r.want_to_make || <span className="text-disabled-ink">—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ================= 졸업생 ================= */
function AlumniPage() {
  const [cohort, setCohort] = useState<number | undefined>(undefined)
  const { data, error, load } = useLoad(() => listAlumni(cohort), [cohort])
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AlumniPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useFeedback()

  const pick = async (f: File) => {
    setBusy(true)
    try {
      setPreview(await previewAlumni(f))
      setFile(f)
    } catch (e) {
      toast(errText(e))
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div>
      <Title
        text="졸업생"
        sub={
          <>
            엑셀 첫 줄에 <b className="text-ink">이름 · 부서 · 기수 · 사번</b> 열이 있어야 해요. 수료 처리는 '기수' 메뉴에서 해요.
          </>
        }
        right={
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx"
              className="sr-only"
              aria-label="졸업생 엑셀 파일 고르기"
              onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
            />
            <Button disabled={busy || preview !== null} onClick={() => fileInput.current?.click()}>
              {busy && !preview ? '읽는 중…' : '엑셀로 올리기'}
            </Button>
          </>
        }
      />

      {preview && file && (
        <UploadPreview
          file={file}
          preview={preview}
          onClose={() => {
            setPreview(null)
            setFile(null)
          }}
          onDone={(added) => {
            setPreview(null)
            setFile(null)
            toast(`${added}명을 올렸어요. 홈의 숫자와 이름 띠에 바로 반영돼요`)
            load()
          }}
        />
      )}

      {!data ? (
        <LoadState error={error} onRetry={load} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 text-[15px] font-semibold" role="group" aria-label="기수로 거르기">
            <Chip active={cohort === undefined} onClick={() => setCohort(undefined)}>
              전체 <span className="font-mono">{data.total}</span>
            </Chip>
            {data.counts.map((c) => (
              <Chip key={c.cohort_number} active={cohort === c.cohort_number} onClick={() => setCohort(c.cohort_number)}>
                {c.cohort_number}기 <span className="font-mono">{c.count}</span>
              </Chip>
            ))}
          </div>
          <AlumniTable rows={data.rows} />
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-btn px-4 py-2.5 ${active ? 'bg-ink text-white' : 'bg-surface ring-1 ring-line hover:ring-mark'}`}
    >
      {children}
    </button>
  )
}

function AlumniTable({ rows, note }: { rows: AlumniRow[]; note?: (r: AlumniRow) => ReactNode }) {
  if (rows.length === 0) return <p className="border-y border-line py-10 text-center text-[16px] text-muted">명단이 비어 있어요</p>
  return (
    <table className="w-full table-fixed border-collapse text-left text-[15px]">
      <thead>
        <tr className="border-y border-ink text-[13px] text-muted">
          {note && <th className="w-[70px] py-3 font-semibold">줄</th>}
          <th className="w-[80px] py-3 font-semibold">기수</th>
          <th className="w-[120px] font-semibold">이름</th>
          <th className="font-semibold">부서</th>
          <th className="w-[140px] font-semibold">사번</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? `${r.emp_no}-${i}`} className="border-b border-line">
            {note && <td className="py-3 font-mono text-[14px] text-muted">{note(r)}</td>}
            <td className="py-3 font-mono">{r.cohort_number}기</td>
            <td className="font-semibold">{r.name}</td>
            <td className="truncate">{r.dept}</td>
            <td className="font-mono text-[14px]">{r.emp_no}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function UploadPreview({
  file,
  preview,
  onClose,
  onDone,
}: {
  file: File
  preview: AlumniPreview
  onClose: () => void
  onDone: (added: number) => void
}) {
  const { toast } = useFeedback()
  const [busy, setBusy] = useState(false)
  const n = preview.rows.length
  return (
    <div className="mb-12 flex flex-col gap-6 rounded-dialog border border-line bg-surface p-8">
      <div className="flex items-baseline justify-between gap-6">
        <p className="text-[20px] font-bold">
          올리기 전에 확인해 주세요 <span className="font-mono text-[14px] font-normal text-muted">{file.name}</span>
        </p>
      </div>
      <p className="flex flex-wrap gap-x-6 gap-y-2 text-[16px]">
        <span>
          올릴 사람 <b className="font-mono">{n}</b>명
        </span>
        <span className="text-muted">
          이미 있어서 건너뜀 <b className="font-mono">{preview.duplicates.length}</b>명
        </span>
        <span className={preview.errors.length ? 'text-error' : 'text-muted'}>
          문제 있는 줄 <b className="font-mono">{preview.errors.length}</b>개
        </span>
      </p>
      {preview.errors.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-btn bg-error-bg px-5 py-4 text-[15px] text-error">
          {preview.errors.slice(0, 8).map((e) => (
            <li key={e.line}>
              <span className="font-mono">{e.line}번째 줄</span> · {e.message}
            </li>
          ))}
          {preview.errors.length > 8 && <li>그 밖에 {preview.errors.length - 8}개 줄</li>}
        </ul>
      )}
      {n > 0 && (
        <div className="max-h-[320px] overflow-y-auto">
          <AlumniTable rows={preview.rows.slice(0, 50)} />
          {n > 50 && <p className="pt-3 text-[14px] text-muted">처음 50명만 보여 줬어요</p>}
        </div>
      )}
      <div className="flex items-center gap-6">
        <Button
          disabled={n === 0 || busy}
          onClick={async () => {
            setBusy(true)
            try {
              const r = await importAlumni(file)
              onDone(r.added)
            } catch (e) {
              toast(errText(e))
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? '올리는 중…' : `${n}명 올리기`}
        </Button>
        <Button variant="text" onClick={onClose}>
          그만두기
        </Button>
      </div>
    </div>
  )
}
