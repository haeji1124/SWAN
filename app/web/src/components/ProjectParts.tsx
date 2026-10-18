// 완성작 부품: 카드 · 하트(좋아요) · 상태 배지 (구현 전달 2장 · 4장)
// 카드: 그림 + 제목·만든 사람·하트. 마우스를 올리면 그림 위로 ink 면에 짧은 설명이 아래에서 올라온다(0.2s, 움직임 줄이기면 투명도만)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { useMe } from '../lib/me'
import { likeProject, type ProjectCard as Card, type ProjectStatus } from '../lib/projectsApi'
import { track } from '../lib/track'
import { useFeedback } from './Feedback'

export const authorLine = (a: Card['author']) => `${a.name} · ${a.dept}${a.cohort ? ` · ${a.cohort}기` : ''}`

export function StatusBadge({ status, label }: { status: ProjectStatus; label: string }) {
  const cls = { pending: 'bg-warning-bg text-warning', published: 'bg-success-bg text-success', rejected: 'bg-error-bg text-error' }[status]
  return <span className={`inline-flex rounded-badge px-2.5 py-1 text-[13px] font-bold whitespace-nowrap ${cls}`}>{label}</span>
}

/** 좋아요. 누르는 순간 숫자가 바뀌고(먼저 바꾸고 실패하면 되돌림) 하트가 톡 튄다. 로그인 실패면 안내 */
export function Heart({
  id,
  likes,
  liked,
  size = 'sm',
  onChange,
}: {
  id: number
  likes: number
  liked: boolean
  size?: 'sm' | 'lg'
  onChange?: (v: { liked: boolean; likes: number }) => void
}) {
  const { me } = useMe()
  const { toast } = useFeedback()
  const [state, setState] = useState({ liked, likes })
  const [pop, setPop] = useState(false)
  const [busy, setBusy] = useState(false)

  const click = async (e: React.MouseEvent) => {
    e.preventDefault() // 카드 안에서 눌러도 상세로 넘어가지 않게
    e.stopPropagation()
    if (!me?.logged_in) return toast('로그인이 필요해요')
    if (busy) return
    const next = { liked: !state.liked, likes: state.likes + (state.liked ? -1 : 1) }
    setState(next)
    if (next.liked) setPop(true)
    setBusy(true)
    track('click', `project:like:${id}`)
    try {
      const r = await likeProject(id)
      setState(r)
      onChange?.(r)
      if (r.liked) toast('좋아요를 눌렀어요')
    } catch (err) {
      setState(state)
      toast(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요')
    } finally {
      setBusy(false)
    }
  }

  const big = size === 'lg'
  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={state.liked}
      aria-label={`좋아요 ${state.likes}개${state.liked ? ', 눌렀음' : ''}`}
      className={`inline-flex items-center gap-1.5 font-mono whitespace-nowrap ${
        big ? 'rounded-btn border border-line bg-surface px-4 py-2.5 text-[16px] hover:bg-sky/40' : 'text-[14px] hover:text-error'
      } ${state.liked ? 'text-error' : ''}`}
    >
      <span
        className={`inline-block ${big ? 'text-[20px]' : 'text-[16px]'} ${pop ? 'motion-safe:animate-[heart-pop_.35s_ease-out]' : ''}`}
        onAnimationEnd={() => setPop(false)}
      >
        {state.liked ? '♥' : '♡'}
      </span>
      {state.likes}
    </button>
  )
}

export function ProjectCard({ p, big, place }: { p: Card; big?: boolean; place: string }) {
  return (
    <Link
      to={`/projects/${p.id}`}
      onClick={() => track('click', `${place}:project:${p.id}`)}
      className="group flex flex-col gap-3.5 outline-offset-4"
    >
      <div className={`relative overflow-hidden rounded-card bg-sky ${big ? 'h-[520px]' : 'h-[240px]'}`}>
        {p.cover && <img src={p.cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
        {/* 마우스를 올리면 아래에서 올라오는 짧은 설명 */}
        <div className="absolute inset-0 flex translate-y-full flex-col justify-end gap-3 bg-ink/92 p-6 text-white opacity-0 transition-[translate,opacity] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-opacity">
          <span className={`leading-snug font-semibold ${big ? 'text-[24px]' : 'text-[18px]'}`}>{p.summary}</span>
          {p.effect && <span className="font-mono text-[13px] text-sky">// {p.effect}</span>}
          <span className="text-[14px] text-white/75">자세히 보기 →</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className={`truncate font-bold ${big ? 'text-[26px]' : 'text-[19px]'}`}>{p.title}</span>
          <span className="truncate text-[14px] text-muted">{authorLine(p.author)}</span>
        </div>
        <Heart id={p.id} likes={p.likes} liked={p.liked} />
      </div>
    </Link>
  )
}
