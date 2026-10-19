// 아이디어 보드 · 토이프로젝트 부품: 상태 배지 · [나도 필요해요] (구현 전달 2장 배지 6종)
// 배지: 접수됨·마감(회색) · 검토 중(sky) · 만드는 중·모집 중(success) · 완료(ink) · 보류(warning)
import { useState } from 'react'
import { ApiError } from '../lib/api'
import { voteIdea, type IdeaStatus, type ToyStatus } from '../lib/boardApi'
import { useMe } from '../lib/me'
import { track } from '../lib/track'
import { useFeedback } from './Feedback'

const badge = 'inline-flex rounded-badge px-2.5 py-1 text-[13px] font-bold whitespace-nowrap'

const IDEA_TONE: Record<IdeaStatus, string> = {
  open: 'bg-disabled text-muted',
  reviewing: 'bg-sky text-ink',
  building: 'bg-success-bg text-success',
  done: 'bg-ink text-white',
  held: 'bg-warning-bg text-warning',
}

export function IdeaBadge({ status, label }: { status: IdeaStatus; label: string }) {
  return <span className={`${badge} ${IDEA_TONE[status]}`}>{label}</span>
}

export function ToyBadge({ status, label }: { status: ToyStatus; label: string }) {
  return <span className={`${badge} ${status === 'open' ? 'bg-success-bg text-success' : 'bg-disabled text-muted'}`}>{label}</span>
}

/** [나도 필요해요]: 공감 수와 함께. 한 사람이 한 번, 다시 누르면 취소. 누르는 순간 숫자를 먼저 바꾸고 실패하면 되돌린다 */
export function VoteButton({
  id,
  votes,
  voted,
  onChange,
}: {
  id: number
  votes: number
  voted: boolean
  onChange?: (v: { voted: boolean; votes: number }) => void
}) {
  const { me } = useMe()
  const { toast } = useFeedback()
  const [state, setState] = useState({ voted, votes })
  const [pop, setPop] = useState(false)
  const [busy, setBusy] = useState(false)

  const click = async () => {
    if (!me?.logged_in) return toast('로그인이 필요해요')
    if (busy) return
    const before = state
    const next = { voted: !state.voted, votes: state.votes + (state.voted ? -1 : 1) }
    setState(next)
    if (next.voted) setPop(true)
    setBusy(true)
    track('click', `idea:vote:${id}`)
    try {
      const r = await voteIdea(id)
      setState(r)
      onChange?.(r)
      toast(r.voted ? '공감을 남겼어요' : '공감을 취소했어요')
    } catch (err) {
      setState(before)
      toast(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={state.voted}
      aria-label={`나도 필요해요, 공감 ${state.votes}${state.voted ? ', 눌렀음' : ''}`}
      className={`flex w-[112px] shrink-0 flex-col self-start items-center gap-1.5 rounded-btn border px-2 pt-3 pb-2.5 transition-colors ${
        state.voted ? 'border-sky bg-sky' : 'border-line bg-surface hover:bg-sky/40'
      }`}
    >
      <span
        className={`font-display text-[32px] leading-none font-extrabold ${pop ? 'motion-safe:animate-[heart-pop_.35s_ease-out]' : ''}`}
        onAnimationEnd={() => setPop(false)}
      >
        {state.votes}
      </span>
      <span className="text-[13px] font-bold whitespace-nowrap">{state.voted ? '✓ 나도 필요해요' : '나도 필요해요'}</span>
    </button>
  )
}
