// 토이프로젝트 (Phase 5): 목록 /toys · 상세 /toys/:id · 쓰기 /toys/new · 고치기 /toys/:id/edit
// 혼자 막혔을 때 물어볼 사람을 만나는 곳. 누구나 볼 수 있지만 글쓰기와 참여는 수강생과 졸업생만 (직원에게는 버튼이 없다)
// [참여하고 싶어요]를 누르면 글쓴이에게 내 이름과 부서가 전달된다. 희망자 목록은 글쓴이만 본다
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ToyBadge } from '../components/BoardParts'
import { useFeedback } from '../components/Feedback'
import { EmptyState } from '../components/EmptyState'
import { Mark } from '../components/Section'
import { ApiError } from '../lib/api'
import {
  TOY_LIMITS,
  createToy,
  deleteToy,
  getToy,
  joinToy,
  listToys,
  personLine,
  setToyStatus,
  updateToy,
  type Toy,
  type ToyForm,
  type ToyFull,
} from '../lib/boardApi'
import { useMe } from '../lib/me'
import { track } from '../lib/track'
import { dayLabel } from './Ideas'

const errText = (e: unknown) => (e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요')
const MEMBERS_ONLY = '글쓰기와 참여는 SWAN 수강생과 졸업생만 할 수 있어요'

/** what은 조사까지: "모집 글을" */
function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="text-[20px] font-bold">{what} 불러오지 못했어요</p>
      <Button variant="secondary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  )
}

// 주 버튼은 메뉴의 [신청하기] 하나로 두고, 게시판의 행동은 보조 버튼 모양으로
const actionLink = 'inline-flex rounded-btn bg-sky px-[26px] py-[13px] text-[16px] font-bold hover:bg-sky-hover active:bg-sky-press'

/* ================= 목록 ================= */
export function Toys() {
  const [data, setData] = useState<{ items: Toy[]; can_write: boolean } | null>(null)
  const [error, setError] = useState(false)
  const load = useCallback(() => {
    setError(false)
    listToys()
      .then(setData)
      .catch(() => setError(true))
  }, [])
  useEffect(load, [load])

  return (
    <section className="page pt-16 pb-32">
      <div className="flex items-end justify-between gap-8 border-b border-ink pb-8">
        <div className="flex flex-col gap-3">
          <Mark>// 혼자 막혔을 때 물어볼 사람을 만나는 곳</Mark>
          <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">
            토이프로젝트 <span className="font-mono text-[28px] font-normal text-mark">{data ? data.items.length : ''}</span>
          </h1>
        </div>
        {data &&
          (data.can_write ? (
            <Link to="/toys/new" onClick={() => track('click', 'toys:new')} className={actionLink}>
              모집 글 쓰기
            </Link>
          ) : (
            <span className="pb-2 font-mono text-[13px] text-muted">// {MEMBERS_ONLY}</span>
          ))}
      </div>

      {error ? (
        <LoadFailed what="모집 글을" onRetry={load} />
      ) : !data ? (
        <p className="py-10 font-mono text-[15px] text-muted motion-safe:animate-pulse">// 모집 글을 불러오는 중…</p>
      ) : data.items.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="아직 모집 글이 없어요"
          body={data.can_write ? '같이 만들어 볼 사람을 찾고 있다면 첫 모집 글을 올려 주세요.' : '수강생과 졸업생이 함께 만들 사람을 찾으면 이곳에 올라와요.'}
        />
      ) : (
        <ol className="flex flex-col">
          {data.items.map((t) => (
            <li key={t.id}>
              <Link
                to={`/toys/${t.id}`}
                onClick={() => track('click', `toys:open:${t.id}`)}
                className={`group grid grid-cols-[minmax(0,1fr)_300px] gap-12 border-b border-line py-8 ${t.status === 'closed' ? 'text-ink/60' : ''}`}
              >
                <div className="flex min-w-0 flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <ToyBadge status={t.status} label={t.status_label} />
                    <h2 className="truncate text-[22px] font-bold group-hover:underline group-hover:underline-offset-4">{t.title}</h2>
                    {t.mine && <span className="rounded-badge bg-sky px-2 py-0.5 text-[12px] font-semibold">내 글</span>}
                  </div>
                  <p className="line-clamp-2 text-[16px] leading-relaxed text-ink/80">{t.what}</p>
                  <p className="font-mono text-[13px] text-muted">
                    // {personLine(t.author)} · {dayLabel(t.created_at)}
                  </p>
                </div>
                <dl className="grid grid-cols-[88px_minmax(0,1fr)] content-start gap-x-4 gap-y-2 border-l border-dashed border-dash pl-8 text-[15px]">
                  <dt className="text-muted">필요한 사람</dt>
                  <dd className="font-semibold">{t.roles}</dd>
                  <dt className="text-muted">예상 기간</dt>
                  <dd className="font-semibold">{t.period}</dd>
                  <dt className="text-muted">참여 희망</dt>
                  <dd className="font-semibold">
                    {t.joins}명{t.joined && <span className="ml-2 text-[13px] font-bold text-success">✓ 나도 신청함</span>}
                  </dd>
                </dl>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/* ================= 상세 ================= */
export function ToyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { me } = useMe()
  const { toast, confirm } = useFeedback()
  const [t, setT] = useState<ToyFull | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setError(null)
    getToy(Number(id))
      .then(setT)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'notfound' : errText(e)))
  }, [id])
  useEffect(load, [load])

  if (!t)
    return (
      <section className="page pt-16 pb-32">
        <Link to="/toys" className="text-[15px] font-semibold underline-offset-4 hover:underline">
          ← 토이프로젝트
        </Link>
        {error === 'notfound' ? (
          // 없는 번호·지운 글·숨긴 글은 다시 시도해도 같아서 안내만 (완성작 상세와 같은 모양)
          <div className="flex flex-col items-start gap-3 py-16">
            <p className="font-display text-[34px] font-extrabold">찾는 모집 글이 없어요</p>
            <p className="text-[17px] text-muted">지워졌거나 관리자가 숨긴 모집 글이에요.</p>
          </div>
        ) : error ? (
          <LoadFailed what="모집 글을" onRetry={load} />
        ) : (
          <p className="py-10 font-mono text-[15px] text-muted motion-safe:animate-pulse">// 불러오는 중…</p>
        )}
      </section>
    )

  const join = async () => {
    if (busy) return
    setBusy(true)
    track('click', `toy:join:${t.id}`)
    try {
      const r = await joinToy(t.id)
      setT({ ...t, ...r })
      toast(r.joined ? '참여 희망을 남겼어요. 글쓴이에게 이름과 부서가 전달돼요' : '참여 희망을 취소했어요')
    } catch (e) {
      toast(errText(e))
    } finally {
      setBusy(false)
    }
  }

  const toggleStatus = async () => {
    const closing = t.status === 'open'
    track('click', `toy:${closing ? 'close' : 'reopen'}:${t.id}`)
    try {
      setT(await setToyStatus(t.id, closing ? 'closed' : 'open'))
      toast(closing ? '모집을 마감했어요' : '모집을 다시 열었어요')
    } catch (e) {
      toast(errText(e))
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: '모집 글을 지울까요?',
      body: `참여 희망 ${t.joins}명의 기록도 함께 사라지고 되돌릴 수 없어요.`,
      confirmLabel: '지우기',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteToy(t.id)
      toast('모집 글을 지웠어요')
      navigate('/toys')
    } catch (e) {
      toast(errText(e))
    }
  }

  const closed = t.status === 'closed'
  return (
    <section className="page grid grid-cols-[minmax(0,1fr)_380px] gap-16 pt-16 pb-32">
      <article className="flex min-w-0 flex-col gap-10">
        <div className="flex flex-col gap-4 border-b border-ink pb-8">
          <Link to="/toys" className="text-[15px] font-semibold underline-offset-4 hover:underline">
            ← 토이프로젝트
          </Link>
          <div className="flex items-center gap-3">
            <ToyBadge status={t.status} label={t.status_label} />
            <span className="font-mono text-[13px] text-muted">// {dayLabel(t.created_at)}에 올림</span>
          </div>
          <h1 className="font-display text-[44px] leading-[1.3] font-extrabold tracking-[-0.02em] break-keep">{t.title}</h1>
          <p className="text-[16px] text-muted">{personLine(t.author)}</p>
        </div>
        <Block label="만들고 싶은 것">
          <p className="text-[18px] leading-[1.75] whitespace-pre-line">{t.what}</p>
        </Block>
        <div className="grid grid-cols-2 gap-8">
          <Block label="필요한 역할과 인원">
            <p className="text-[20px] font-bold">{t.roles}</p>
          </Block>
          <Block label="예상 기간">
            <p className="text-[20px] font-bold">{t.period}</p>
          </Block>
        </div>
      </article>

      <aside className="sticky top-28 flex h-fit flex-col gap-5 rounded-card border border-line bg-surface p-7">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-bold">참여 희망</span>
          <span className="font-display text-[34px] leading-none font-extrabold">
            {t.joins}
            <span className="ml-1 font-sans text-[16px] font-semibold">명</span>
          </span>
        </div>

        {t.mine ? (
          <>
            {/* 희망자 목록: 글쓴이만 */}
            <div className="flex flex-col border-t border-dashed border-dash pt-4">
              <span className="mb-2 font-mono text-[13px] text-mark">// 나에게만 보여요</span>
              {t.applicants && t.applicants.length > 0 ? (
                <ul className="flex flex-col">
                  {t.applicants.map((p) => (
                    <li key={p.id} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
                      <span className="text-[16px] font-semibold">{p.name}</span>
                      <span className="truncate text-[14px] text-muted">
                        {p.dept} · {p.cohort ? `${p.cohort}기 졸업생` : p.type_label}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[15px] text-muted">아직 참여 희망자가 없어요. 신청이 오면 이름과 부서가 여기에 보여요.</p>
              )}
            </div>
            <Button variant="secondary" onClick={toggleStatus}>
              {closed ? '모집 다시 열기' : '모집 마감'}
            </Button>
            <div className="flex justify-between text-[15px] font-semibold">
              <Link to={`/toys/${t.id}/edit`} className="underline-offset-4 hover:underline">
                고치기 →
              </Link>
              <button type="button" onClick={remove} className="text-error underline-offset-4 hover:underline">
                지우기
              </button>
            </div>
          </>
        ) : t.can_join ? (
          <>
            {t.joined ? (
              <Button variant="secondary" onClick={join} disabled={busy} aria-pressed className="border border-ink bg-surface! hover:bg-sky/40!">
                ✓ 참여 희망함 · 누르면 취소
              </Button>
            ) : closed ? (
              <Button variant="secondary" disabled>
                모집이 마감됐어요
              </Button>
            ) : (
              <Button variant="secondary" onClick={join} disabled={busy} aria-pressed={false}>
                참여하고 싶어요
              </Button>
            )}
            <p className="text-[14px] leading-relaxed text-muted">
              {t.joined ? '글쓴이가 내 이름과 부서를 보고 연락할 거예요.' : '누르면 글쓴이에게 내 이름과 부서가 전달돼요. 다시 누르면 취소돼요.'}
            </p>
          </>
        ) : (
          <p className="border-t border-dashed border-dash pt-4 text-[15px] text-muted">
            {me?.logged_in ? MEMBERS_ONLY : '로그인이 필요해요. ' + MEMBERS_ONLY}
          </p>
        )}
      </aside>
    </section>
  )
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Mark>// {label}</Mark>
      {children}
    </div>
  )
}

/* ================= 쓰기 · 고치기 ================= */
const PERIODS = ['2주', '1개월', '2개월', '3개월 이상']

const inputCls =
  'w-full rounded-btn border bg-surface px-4 py-3 text-[16px] outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]'

function Field({ label, help, error, children }: { label: string; help?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-8 border-t border-line py-7">
      <div className="flex flex-col gap-1 pt-2.5">
        <span className="text-[17px] font-bold">{label}</span>
        {help && <span className="text-[14px] text-muted">{help}</span>}
      </div>
      <div className="flex flex-col gap-2">
        {children}
        {error && <span className="text-[13px] text-error">{error}</span>}
      </div>
    </div>
  )
}

export function ToyFormPage() {
  const { id } = useParams()
  const editing = id !== undefined
  const navigate = useNavigate()
  const { me } = useMe()
  const { toast } = useFeedback()
  const [f, setF] = useState<ToyForm>({ title: '', what: '', roles: '', period: '' })
  const [loaded, setLoaded] = useState(!editing)
  const [errors, setErrors] = useState<Partial<Record<keyof ToyForm, string>>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!editing) return
    getToy(Number(id))
      .then((t) => {
        if (!t.mine) {
          toast('내가 쓴 모집 글만 고칠 수 있어요')
          return navigate(`/toys/${t.id}`, { replace: true })
        }
        setF({ title: t.title, what: t.what, roles: t.roles, period: t.period })
        setLoaded(true)
      })
      .catch((e) => {
        toast(errText(e))
        navigate('/toys', { replace: true })
      })
  }, [editing, id, navigate, toast])

  if (!me) return null
  const member = me.logged_in && me.type !== 'employee'
  if (!member)
    return (
      <section className="page flex flex-col items-start gap-4 pt-24 pb-32">
        <p className="font-display text-[34px] font-extrabold">{MEMBERS_ONLY}</p>
        <Link to="/toys" className="text-[16px] font-semibold underline-offset-4 hover:underline">
          ← 모집 글 보러 가기
        </Link>
      </section>
    )
  if (!loaded) return <p className="page py-16 font-mono text-[15px] text-muted motion-safe:animate-pulse">// 불러오는 중…</p>

  const set = (k: keyof ToyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value })
    setErrors({ ...errors, [k]: undefined }) // 고쳐 쓰면 그 칸의 안내를 지운다
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!f.title.trim()) errs.title = '제목을 적어 주세요'
    if (!f.what.trim()) errs.what = '무엇을 만들고 싶은지 적어 주세요'
    if (!f.roles.trim()) errs.roles = '어떤 사람이 몇 명 필요한지 적어 주세요'
    if (!f.period.trim()) errs.period = '예상 기간을 골라 주세요'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const t = editing ? await updateToy(Number(id), f) : await createToy(f)
      toast(editing ? '모집 글을 고쳤어요' : '모집 글을 올렸어요')
      navigate(`/toys/${t.id}`)
    } catch (err) {
      toast(errText(err))
      setBusy(false)
    }
  }

  const periods = PERIODS.includes(f.period) || !f.period ? PERIODS : [...PERIODS, f.period] // 예전에 적은 기간도 고를 수 있게

  return (
    <form onSubmit={submit} className="page max-w-[1040px] pt-16 pb-32">
      <div className="flex flex-col gap-3 pb-8">
        <Link to={editing ? `/toys/${id}` : '/toys'} className="text-[15px] font-semibold underline-offset-4 hover:underline">
          ← {editing ? '모집 글' : '토이프로젝트'}
        </Link>
        <h1 className="font-display text-[44px] leading-[1.3] font-extrabold tracking-[-0.02em]">{editing ? '모집 글 고치기' : '모집 글 쓰기'}</h1>
        <p className="text-[16px] text-muted">올리면 바로 모두에게 보여요. 참여 희망자는 나만 볼 수 있어요.</p>
      </div>
      <Field label="제목" error={errors.title} help={`${f.title.length} / ${TOY_LIMITS.title}`}>
        <input
          value={f.title}
          onChange={set('title')}
          maxLength={TOY_LIMITS.title}
          placeholder="예: 설비 로그 대시보드 같이 만들 분"
          className={`${inputCls} ${errors.title ? 'border-error' : 'border-line'}`}
        />
      </Field>
      <Field label="만들고 싶은 것" error={errors.what} help="무엇을, 왜 만들고 싶은지">
        <textarea
          value={f.what}
          onChange={set('what')}
          maxLength={TOY_LIMITS.what}
          rows={6}
          placeholder="어떤 불편을 풀고 싶은지, 지금 어디까지 해 봤는지 적어 주세요"
          className={`${inputCls} ${errors.what ? 'border-error' : 'border-line'}`}
        />
      </Field>
      <Field label="필요한 역할과 인원" error={errors.roles} help="예: 화면 1명 · 데이터 정리 1명">
        <input
          value={f.roles}
          onChange={set('roles')}
          maxLength={TOY_LIMITS.roles}
          placeholder="어떤 일을 할 사람이 몇 명 필요한가요?"
          className={`${inputCls} ${errors.roles ? 'border-error' : 'border-line'}`}
        />
      </Field>
      <Field label="예상 기간" error={errors.period}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="예상 기간">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={f.period === p}
              onClick={() => {
                setF({ ...f, period: p })
                setErrors({ ...errors, period: undefined })
              }}
              className={`rounded-btn px-4 py-2.5 text-[15px] font-semibold ${f.period === p ? 'bg-ink text-white' : 'bg-sky hover:bg-sky-hover'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex justify-end gap-2 border-t border-line pt-8">
        <Button type="button" variant="secondary" onClick={() => navigate(editing ? `/toys/${id}` : '/toys')}>
          그만두기
        </Button>
        <Button type="submit" disabled={busy}>
          {editing ? '고친 내용 저장' : '모집 글 올리기'}
        </Button>
      </div>
    </form>
  )
}
