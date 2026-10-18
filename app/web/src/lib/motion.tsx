// 움직임 공통: 섹션 등장, 숫자 세기. 움직임 줄이기 설정이면 움직이지 않고 바로 보여준다.
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, useState, type RefObject } from 'react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 섹션 안의 [data-reveal] 요소가 화면에 들어올 때 아래에서 16px 올라오며 나타난다 (0.4s, 0.08s 간격) */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (prefersReducedMotion() || !scope.current) return
      const items = scope.current.querySelectorAll('[data-reveal]')
      if (!items.length) return
      gsap.from(items, {
        y: 16,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: { trigger: scope.current, start: 'top 78%', once: true },
      })
    },
    { scope },
  )
}

/** 화면에 들어올 때 0부터 세어 올라가는 숫자 (1.2s, 끝에서 느려짐) */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) {
        setShown(value)
        return
      }
      const state = { n: 0 }
      gsap.to(state, {
        n: value,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => setShown(Math.round(state.n)),
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      })
    },
    { dependencies: [value] },
  )
  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  )
}
