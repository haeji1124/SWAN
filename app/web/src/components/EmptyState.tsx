// 빈 상태: 글 + 성장 3단계 그림(알에서 나온 오리 · 아기 오리 · 어린 백조)을 바닥선에 맞춰 나란히 (구현 전달 5장 "상태 빈 화면")
// 그림은 수준 테스트와 같은 정지 그림을 다시 쓴다. 숨쉬기는 움직임 줄이기 설정이면 멈춘다
import type { ReactNode } from 'react'

const LINEUP = [
  { src: '/images/stage-1.webp', h: 'h-[76px]', idle: 'motion-safe:animate-[wobble_1.6s_ease-in-out_infinite]' },
  { src: '/images/stage-2.webp', h: 'h-[100px]', idle: 'motion-safe:animate-[breathe_2.4s_ease-in-out_infinite]' },
  { src: '/images/stage-3.webp', h: 'h-[132px]', idle: 'motion-safe:animate-[breathe_3.1s_ease-in-out_.4s_infinite]' },
]

export function StageLineup({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end gap-4 border-b border-line px-2 ${className}`} aria-hidden>
      {LINEUP.map((s) => (
        <img key={s.src} src={s.src} alt="" className={`${s.h} origin-bottom ${s.idle}`} />
      ))}
    </div>
  )
}

export function EmptyState({ title, body, action, className = '' }: { title: string; body: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-12 border-y border-line py-14 ${className}`}>
      <div className="flex flex-col items-start gap-3">
        <p className="font-display text-[30px] font-extrabold">{title}</p>
        <p className="max-w-[560px] text-[17px] text-muted">{body}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
      <StageLineup className="shrink-0" />
    </div>
  )
}
