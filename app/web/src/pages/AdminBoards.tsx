// 관리자 · 아이디어 / 토이프로젝트 (Phase 5)
// 아이디어: 목록(공감 수) · [상태 변경] · [답변 쓰기](한 줄) · [숨기기]. 이름 표시 방식과 상관없이 이름과 부서가 보인다
// 토이프로젝트: 목록 · [숨기기]. 숨기면 목록에서 사라지고, 다시 보이게 할 수 있다
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { IdeaBadge, ToyBadge } from '../components/BoardParts'
import { useFeedback } from '../components/Feedback'
import {
  IDEA_REPLY_MAX,
  adminIdeas,
  adminToys,
  hideIdea,
  hideToy,
  setIdeaReply,
  setIdeaStatus,
  type AdminIdea,
  type IdeaStatus,
} from '../lib/boardApi'
import { track } from '../lib/track'
import { Badge, LoadState, Title, errText, useLoad } from './Admin'

const day = (iso: string) => iso.replace('T', ' ').slice(5, 10).replace('-', '.')

/* ================= 아이디어 ================= */
export function IdeasAdmin() {
  const { data, error, load } = useLoad(adminIdeas, [])
  const { toast } = useFeedback()
  const [replying, setReplying] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  const changeStatus = async (i: AdminIdea, status: IdeaStatus) => {
    track('click', `admin:ideas:status:${i.id}`)
    try {
      const r = await setIdeaStatus(i.id, status)
      toast(`"${i.title}"을(를) ${r.status_label}(으)로 바꿨어요`)
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  const saveReply = async (i: AdminIdea) => {
    try {
      const r = await setIdeaReply(i.id, draft)
      toast(r.reply ? '답변을 달았어요. 카드에 바로 보여요' : '답변을 지웠어요')
      setReplying(null)
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  const toggleHide = async (i: AdminIdea) => {
    track('click', `admin:ideas:${i.hidden ? 'show' : 'hide'}:${i.id}`)
    try {
      await hideIdea(i.id, !i.hidden)
      toast(i.hidden ? '다시 보이게 했어요' : '숨겼어요. 아이디어 보드와 홈에서 사라져요')
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  return (
    <div>
      <Title
        text="아이디어"
        sub="상태와 답변은 아이디어 카드에 바로 보여요. 올린 사람이 '부서만'을 골랐어도 여기서는 이름이 보여요."
        right={
          <Link to="/ideas" className="text-[15px] font-semibold underline-offset-4 hover:underline">
            아이디어 보드 보기 →
          </Link>
        }
      />
      {!data ? (
        <LoadState error={error} onRetry={load} />
      ) : data.items.length === 0 ? (
        <p className="border-y border-line py-10 text-center text-[16px] text-muted">아직 남겨진 아이디어가 없어요</p>
      ) : (
        <table className="w-full table-fixed border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-y border-ink text-[13px] text-muted">
              <th className="w-[64px] py-3 text-right font-semibold">공감</th>
              <th className="pl-6 font-semibold">아이디어 · 답변</th>
              <th className="w-[200px] font-semibold">올린 사람</th>
              <th className="w-[72px] font-semibold">올린 날</th>
              <th className="w-[140px] font-semibold">상태</th>
              <th className="w-[96px] text-right font-semibold">보드</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i.id} className={`border-b border-line align-top ${i.hidden ? 'bg-disabled/50 text-ink/55' : ''}`}>
                <td className="py-4 text-right font-display text-[22px] font-extrabold">{i.votes}</td>
                <td className="py-4 pr-6 pl-6">
                  <span className="flex items-center gap-2">
                    {i.hidden && <Badge tone="gray">숨김</Badge>}
                    <span className="truncate font-semibold">{i.title}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[14px] text-muted">{i.description}</span>
                  {replying === i.id ? (
                    <form
                      className="mt-3 flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveReply(i)
                      }}
                    >
                      <input
                        autoFocus
                        value={draft}
                        maxLength={IDEA_REPLY_MAX}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && setReplying(null)}
                        placeholder="한 줄 답변 (비우고 저장하면 지워져요)"
                        aria-label="답변"
                        className="min-w-0 flex-1 rounded-btn border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]"
                      />
                      <span className="font-mono text-[12px] text-muted">
                        {draft.length}/{IDEA_REPLY_MAX}
                      </span>
                      <Button type="submit" className="px-4! py-2! text-[14px]!">
                        저장
                      </Button>
                      <Button type="button" variant="text" className="text-[14px]!" onClick={() => setReplying(null)}>
                        그만두기
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-2 flex items-baseline gap-3 text-[14px]">
                      {i.reply && <span className="truncate">↳ {i.reply}</span>}
                      <button
                        type="button"
                        onClick={() => {
                          setReplying(i.id)
                          setDraft(i.reply ?? '')
                        }}
                        className="shrink-0 font-semibold underline-offset-4 hover:underline"
                      >
                        {i.reply ? '답변 고치기' : '답변 쓰기'}
                      </button>
                    </div>
                  )}
                </td>
                <td className="py-4 pr-4">
                  <span className="block truncate font-semibold">{i.author_name}</span>
                  <span className="block truncate text-[14px] text-muted">
                    {i.author_dept}
                    {i.name_display === 'dept' && ' · 부서만 표시'}
                  </span>
                </td>
                <td className="py-4 font-mono text-[14px]">{day(i.created_at)}</td>
                <td className="py-3.5">
                  <div className="flex flex-col items-start gap-2">
                    <IdeaBadge status={i.status} label={i.status_label} />
                    <select
                      aria-label={`${i.title} 상태 바꾸기`}
                      value={i.status}
                      onChange={(e) => changeStatus(i, e.target.value as IdeaStatus)}
                      className="w-full rounded-btn border border-line bg-surface px-2 py-1.5 text-[14px] outline-none focus:border-ink"
                    >
                      {data.statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    onClick={() => toggleHide(i)}
                    className={`text-[14px] font-semibold underline-offset-4 hover:underline ${i.hidden ? '' : 'text-error'}`}
                  >
                    {i.hidden ? '다시 보이기' : '숨기기'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/* ================= 토이프로젝트 ================= */
export function ToysAdmin() {
  const { data, error, load } = useLoad(adminToys, [])
  const { toast } = useFeedback()

  const toggleHide = async (id: number, hidden: boolean) => {
    track('click', `admin:toys:${hidden ? 'show' : 'hide'}:${id}`)
    try {
      await hideToy(id, !hidden)
      toast(hidden ? '다시 보이게 했어요' : '숨겼어요. 토이프로젝트 목록에서 사라져요')
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  return (
    <div>
      <Title
        text="토이프로젝트"
        sub="모집 글은 올리면 바로 공개돼요. 문제가 있는 글은 숨길 수 있어요."
        right={
          <Link to="/toys" className="text-[15px] font-semibold underline-offset-4 hover:underline">
            토이프로젝트 보기 →
          </Link>
        }
      />
      {!data ? (
        <LoadState error={error} onRetry={load} />
      ) : data.items.length === 0 ? (
        <p className="border-y border-line py-10 text-center text-[16px] text-muted">아직 모집 글이 없어요</p>
      ) : (
        <table className="w-full table-fixed border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-y border-ink text-[13px] text-muted">
              <th className="py-3 font-semibold">제목 · 필요한 사람</th>
              <th className="w-[220px] font-semibold">글쓴이</th>
              <th className="w-[100px] font-semibold">모집</th>
              <th className="w-[88px] text-right font-semibold">참여 희망</th>
              <th className="w-[96px] pl-6 font-semibold">올린 날</th>
              <th className="w-[96px] text-right font-semibold">목록</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((t) => (
              <tr key={t.id} className={`border-b border-line ${t.hidden ? 'bg-disabled/50 text-ink/55' : ''}`}>
                <td className="py-4 pr-6">
                  <span className="flex items-center gap-2">
                    {t.hidden && <Badge tone="gray">숨김</Badge>}
                    <Link to={`/toys/${t.id}`} className="truncate font-semibold underline-offset-4 hover:underline">
                      {t.title}
                    </Link>
                  </span>
                  <span className="block truncate text-[14px] text-muted">
                    {t.roles} · {t.period}
                  </span>
                </td>
                <td className="truncate pr-4">
                  {t.author_name} · {t.author_dept}
                </td>
                <td>
                  <ToyBadge status={t.status} label={t.status_label} />
                </td>
                <td className="text-right font-mono">{t.joins}명</td>
                <td className="pl-6 font-mono text-[14px]">{day(t.created_at)}</td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleHide(t.id, t.hidden)}
                    className={`text-[14px] font-semibold underline-offset-4 hover:underline ${t.hidden ? '' : 'text-error'}`}
                  >
                    {t.hidden ? '다시 보이기' : '숨기기'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
