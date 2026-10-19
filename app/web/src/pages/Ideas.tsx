// 아이디어 보드 /ideas (Phase 5): 사내 직원 누구나 작은 불편을 가볍게 남기고 공감한다
// 공감순·최신순 → 카드(제목·설명·올린 사람·공감 수·상태·파트 답변) → [나도 필요해요]
// [아이디어 남기기]는 창 하나: 제목 · 설명(두세 줄) · 이름 표시 방식. 승인 없이 바로 목록에 보인다
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { IdeaBadge, VoteButton } from '../components/BoardParts'
import { useFeedback } from '../components/Feedback'
import { Mark } from '../components/Section'
import { ApiError } from '../lib/api'
import {
  IDEA_DESC_MAX,
  IDEA_TITLE_MAX,
  createIdea,
  deleteIdea,
  listIdeas,
  updateIdea,
  type Idea,
  type IdeaForm,
  type IdeaSort,
  type NameDisplay,
} from '../lib/boardApi'
import { useMe } from '../lib/me'
import { track } from '../lib/track'

const errText = (e: unknown) => (e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요')
export const dayLabel = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`

// 상태가 어떻게 흘러가는지 (왼쪽 안내)
const FLOW: { status: Idea['status']; label: string; note: string }[] = [
  { status: 'open', label: '접수됨', note: '남기면 바로 모두에게 보여요' },
  { status: 'reviewing', label: '검토 중', note: 'IPS 파트가 살펴보고 있어요' },
  { status: 'building', label: '만드는 중', note: '만들고 있어요' },
  { status: 'done', label: '완료', note: '이제 쓸 수 있어요' },
]

type Dialog = { mode: 'new' } | { mode: 'edit'; idea: Idea }

export function Ideas() {
  const { me } = useMe()
  const { toast, confirm } = useFeedback()
  const [sort, setSort] = useState<IdeaSort>('votes')
  const [items, setItems] = useState<Idea[] | null>(null)
  const [error, setError] = useState(false)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [fresh, setFresh] = useState<number | null>(null) // 방금 남긴 아이디어를 잠깐 강조

  const load = useCallback(() => {
    setError(false)
    listIdeas(sort)
      .then((d) => setItems(d.items))
      .catch(() => setError(true))
  }, [sort])
  useEffect(load, [load])

  const openNew = () => {
    track('click', 'ideas:new')
    if (!me?.logged_in) return toast('로그인이 필요해요')
    setDialog({ mode: 'new' })
  }

  const saved = (idea: Idea, isNew: boolean) => {
    setDialog(null)
    toast(isNew ? '아이디어를 남겼어요' : '아이디어를 고쳤어요')
    setFresh(idea.id)
    window.setTimeout(() => setFresh(null), 2400)
    if (isNew && sort !== 'latest') setSort('latest') // 새 아이디어는 공감 0이라 공감순에서는 맨 아래로 간다 → 최신순으로 보여 준다
    else load()
  }

  const remove = async (idea: Idea) => {
    const ok = await confirm({
      title: '아이디어를 지울까요?',
      body: `"${idea.title}" — 받은 공감 ${idea.votes}개도 함께 사라지고 되돌릴 수 없어요.`,
      confirmLabel: '지우기',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteIdea(idea.id)
      toast('아이디어를 지웠어요')
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  return (
    <section className="page pt-16 pb-32">
      <div className="flex items-end justify-between gap-8 border-b border-ink pb-8">
        <div className="flex flex-col gap-3">
          <Mark>// 부서장님께 말하긴 애매한 작은 불편</Mark>
          <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">
            아이디어 보드 <span className="font-mono text-[28px] font-normal text-mark">{items ? items.length : ''}</span>
          </h1>
        </div>
        {/* 주 버튼은 메뉴의 [신청하기] 하나로 두고, 보드의 행동은 보조 버튼 (홈 ⑨의 [아이디어 남기기]와 같은 모양) */}
        <Button variant="secondary" onClick={openNew}>
          아이디어 남기기
        </Button>
      </div>

      <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-16 pt-10">
        <aside className="sticky top-28 flex h-fit flex-col gap-5">
          <p className="text-[17px] font-bold">이렇게 진행돼요</p>
          <ol className="flex flex-col">
            {FLOW.map((f, i) => (
              <li key={f.status} className="relative flex flex-col items-start gap-1.5 pb-6 pl-6">
                {/* 단계 사이를 잇는 세로 줄 */}
                {i < FLOW.length - 1 && <span className="absolute top-3 bottom-0 left-[5px] w-px bg-line" aria-hidden />}
                <span className="absolute top-2 left-0 h-[11px] w-[11px] rounded-full border-2 border-ink bg-paper" aria-hidden />
                <IdeaBadge status={f.status} label={f.label} />
                <span className="font-mono text-[13px] text-muted">// {f.note}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col items-start gap-1.5 border-t border-dashed border-dash pt-5">
            <IdeaBadge status="held" label="보류" />
            <span className="font-mono text-[13px] text-muted">// 지금은 어렵지만 다시 볼게요</span>
          </div>
        </aside>

        <div className="flex flex-col">
          {items && items.length > 0 && (
            <div className="flex items-center gap-1 pb-4 font-semibold" role="group" aria-label="정렬">
              {(['votes', 'latest'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sort === s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-2 text-[15px] first:pl-0 ${sort === s ? 'text-ink underline decoration-2 underline-offset-8' : 'text-muted hover:text-ink'}`}
                >
                  {s === 'votes' ? '공감순' : '최신순'}
                </button>
              ))}
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-start gap-4 py-10">
              <p className="text-[20px] font-bold">아이디어를 불러오지 못했어요</p>
              <Button variant="secondary" onClick={load}>
                다시 시도
              </Button>
            </div>
          ) : !items ? (
            <p className="py-10 font-mono text-[15px] text-muted motion-safe:animate-pulse">// 아이디어를 불러오는 중…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 border-y border-line py-20">
              <p className="font-display text-[30px] font-extrabold">아직 남겨진 아이디어가 없어요</p>
              <p className="text-[17px] text-muted">매주 손으로 반복하는 일, 있으면 좋겠다 싶은 작은 도구를 첫 번째로 남겨 주세요.</p>
            </div>
          ) : (
            <ol className="flex flex-col border-t border-line">
              {items.map((idea) => (
                <IdeaRow
                  key={`${idea.id}-${idea.votes}-${idea.voted}`}
                  idea={idea}
                  fresh={fresh === idea.id}
                  onEdit={() => setDialog({ mode: 'edit', idea })}
                  onDelete={() => remove(idea)}
                />
              ))}
            </ol>
          )}
        </div>
      </div>

      {dialog && (
        <IdeaDialog
          initial={dialog.mode === 'edit' ? dialog.idea : null}
          onClose={() => setDialog(null)}
          onSaved={(idea) => saved(idea, dialog.mode === 'new')}
        />
      )}
    </section>
  )
}

function IdeaRow({ idea, fresh, onEdit, onDelete }: { idea: Idea; fresh: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <li
      className={`grid grid-cols-[112px_minmax(0,1fr)] gap-7 border-b border-line py-7 transition-colors duration-700 ${fresh ? 'bg-sky/40' : ''}`}
    >
      <VoteButton id={idea.id} votes={idea.votes} voted={idea.voted} />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <IdeaBadge status={idea.status} label={idea.status_label} />
            <h2 className="text-[20px] leading-snug font-bold break-keep">{idea.title}</h2>
          </div>
          {idea.mine && (
            <div className="flex shrink-0 items-center gap-4 pt-1 text-[14px] font-semibold">
              <span className="rounded-badge bg-sky px-2 py-0.5 text-[12px]">내 아이디어</span>
              <button type="button" onClick={onEdit} className="underline-offset-4 hover:underline">
                고치기
              </button>
              <button type="button" onClick={onDelete} className="text-error underline-offset-4 hover:underline">
                지우기
              </button>
            </div>
          )}
        </div>
        <p className="text-[16px] leading-relaxed whitespace-pre-line text-ink/85">{idea.description}</p>
        <p className="font-mono text-[13px] text-muted">
          // {idea.author} · {dayLabel(idea.created_at)}
        </p>
        {idea.reply && (
          <div className="mt-2 flex items-baseline gap-3 rounded-btn bg-surface px-4 py-3 ring-1 ring-line">
            <span className="shrink-0 text-[13px] font-bold">IPS 파트 답변</span>
            <span className="text-[15px]">{idea.reply}</span>
          </div>
        )}
      </div>
    </li>
  )
}

/* ---------- 남기기 · 고치기 창 ---------- */

const inputCls =
  'w-full rounded-btn border bg-surface px-4 py-3 text-[16px] outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]'

function IdeaDialog({ initial, onClose, onSaved }: { initial: Idea | null; onClose: () => void; onSaved: (idea: Idea) => void }) {
  const { me } = useMe()
  const { toast } = useFeedback()
  const [f, setF] = useState<IdeaForm>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    name_display: initial?.name_display ?? 'full',
  })
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})
  const [busy, setBusy] = useState(false)
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!f.title.trim()) errs.title = '제목을 적어 주세요'
    if (!f.description.trim()) errs.description = '어떤 일이 불편한지 적어 주세요'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      onSaved(initial ? await updateIdea(initial.id, f) : await createIdea(f))
    } catch (err) {
      toast(errText(err))
      setBusy(false)
    }
  }

  const name = me?.logged_in ? me : null
  const options: { value: NameDisplay; label: string; preview: string }[] = [
    { value: 'full', label: '이름과 부서', preview: name ? `${name.name} · ${name.dept}` : '이름 · 부서' },
    { value: 'dept', label: '부서만', preview: name ? name.dept : '부서' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-dialog-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[560px] flex-col gap-6 rounded-dialog bg-surface p-8 shadow-dialog"
      >
        <div className="flex flex-col gap-1.5">
          <h2 id="idea-dialog-title" className="text-[24px] font-bold">
            {initial ? '아이디어 고치기' : '아이디어 남기기'}
          </h2>
          <p className="text-[15px] text-muted">남기면 바로 보드에 올라가고, 다른 직원들이 [나도 필요해요]로 공감할 수 있어요.</p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between text-[15px] font-bold">
            제목 <span className="font-mono text-[12px] font-normal text-muted">{f.title.length} / {IDEA_TITLE_MAX}</span>
          </span>
          <input
            ref={first}
            value={f.title}
            maxLength={IDEA_TITLE_MAX}
            onChange={(e) => {
              setF({ ...f, title: e.target.value })
              setErrors({ ...errors, title: undefined }) // 고쳐 쓰면 그 칸의 안내를 지운다
            }}
            placeholder="예: 회의실 예약 현황을 한 화면에"
            className={`${inputCls} ${errors.title ? 'border-error' : 'border-line'}`}
          />
          {errors.title && <span className="text-[13px] text-error">{errors.title}</span>}
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between text-[15px] font-bold">
            설명 <span className="font-mono text-[12px] font-normal text-muted">{f.description.length} / {IDEA_DESC_MAX}</span>
          </span>
          <textarea
            value={f.description}
            maxLength={IDEA_DESC_MAX}
            rows={3}
            onChange={(e) => {
              setF({ ...f, description: e.target.value })
              setErrors({ ...errors, description: undefined })
            }}
            placeholder="어떤 일이 불편한지 두세 줄로 적어 주세요"
            className={`${inputCls} resize-none ${errors.description ? 'border-error' : 'border-line'}`}
          />
          {errors.description && <span className="text-[13px] text-error">{errors.description}</span>}
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[15px] font-bold">올린 사람 표시</legend>
          <div className="grid grid-cols-2 gap-3">
            {options.map((o) => {
              const on = f.name_display === o.value
              return (
                <label
                  key={o.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-btn border px-4 py-3.5 ${on ? 'border-ink' : 'border-line hover:bg-sky/30'}`}
                >
                  <input
                    type="radio"
                    name="name_display"
                    value={o.value}
                    checked={on}
                    onChange={() => setF({ ...f, name_display: o.value })}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full bg-surface ${on ? 'border-[6px] border-ink' : 'border-[1.5px] border-disabled-ink'}`}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{o.label}</span>
                    <span className="truncate font-mono text-[12px] text-muted">// {o.preview}</span>
                  </span>
                </label>
              )
            })}
          </div>
          <span className="text-[13px] text-muted">어느 쪽을 골라도 관리자 화면에는 이름이 보여요.</span>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            그만두기
          </Button>
          <Button type="submit" disabled={busy}>
            {initial ? '고친 내용 저장' : '남기기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
