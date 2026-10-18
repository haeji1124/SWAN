import { useEffect, useRef, type ReactNode } from 'react'
import { useReveal } from '../lib/motion'
import { observeSection } from '../lib/track'

/** 홈 섹션 틀: 처음 화면에 보일 때 도달을 한 번 기록하고, [data-reveal] 요소를 등장시킨다 */
export function Section({
  name,
  id,
  className = '',
  children,
}: {
  name: string
  id?: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  useEffect(() => (ref.current ? observeSection(ref.current, name) : undefined), [name])
  return (
    <section ref={ref} id={id} data-section={name} className={className}>
      {children}
    </section>
  )
}

/** 홈 섹션 제목: 디자인 기준 H1 (NanumSquareRound 800 · 54px / 1.25 · 자간 -3%). 모든 섹션이 같은 크기를 쓴다.
 *  섹션 안의 큰 소제목(커리큘럼의 실습 프로젝트 모음)도 섹션 제목보다 커지지 않게 같은 크기의 h3로 쓴다.
 *  예외: 마지막 신청 안내(⑪)만 마무리 강조로 64px (BottomSections FinalCta) */
export function SectionTitle({ children, as: Tag = 'h2', className = '' }: { children: ReactNode; as?: 'h2' | 'h3'; className?: string }) {
  return (
    <Tag data-reveal className={`font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em] ${className}`}>
      {children}
    </Tag>
  )
}

/** 줄 번호처럼 쓰는 작은 고정폭 표시 (`01`, `# 지금까지` 같은 것) */
export function Mark({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[13px] text-mark ${className}`}>{children}</span>
}

/** 사진·영상이 아직 없는 자리. 줄무늬 바탕에 무엇이 들어갈지 적는다 */
export function Placeholder({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div
      className={`flex items-end rounded-card p-4 font-mono text-[12px] text-mark ${className}`}
      style={{ background: 'repeating-linear-gradient(135deg,#eef1f5 0 10px,#f6f7f9 10px 20px)' }}
    >
      {label}
    </div>
  )
}
