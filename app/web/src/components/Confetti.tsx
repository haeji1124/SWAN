// 알록달록한 종이 조각이 한 점에서 터져 위로 솟았다가 떨어진다. 바깥에서 burst(x, y)를 부른다.
// 화면 요소 색 규칙에 따라 노랑은 쓰지 않는다. 움직임 줄이기 설정이면 아무것도 그리지 않는다.
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

export type ConfettiHandle = { burst: (x: number, y: number) => void }

const COLORS = ['#9ccbf2', '#1f2a44', '#f28c38', '#7cc9a5', '#f3a6bd', '#7d93b0', '#bcdcf6']

type Piece = {
  x: number; y: number; vx: number; vy: number
  rot: number; vr: number; w: number; h: number
  color: string; round: boolean; life: number; age: number
}

export const Confetti = forwardRef<ConfettiHandle, { width: number; height: number; className?: string }>(
  function Confetti({ width, height, className }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const pieces = useRef<Piece[]>([])
    const raf = useRef(0)
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    const loop = (t0: number) => {
      let last = t0
      const step = (t: number) => {
        const k = Math.min(3, (t - last) / (1000 / 60)) // 60fps 기준 한 칸
        last = t
        const ctx = canvas.current?.getContext('2d')
        if (!ctx) return
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, width, height)
        pieces.current = pieces.current.filter((p) => p.age < p.life)
        for (const p of pieces.current) {
          p.vy += 0.28 * k
          p.vx *= Math.pow(0.985, k)
          p.vy *= Math.pow(0.985, k)
          p.x += p.vx * k
          p.y += p.vy * k
          p.rot += p.vr * k
          p.age += k
          const fade = Math.min(1, (p.life - p.age) / 25)
          ctx.save()
          ctx.globalAlpha = Math.max(0, fade)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          // 종이가 뒤집히는 느낌: 세로 크기를 회전에 따라 줄였다 늘린다
          ctx.scale(1, Math.abs(Math.cos(p.rot * 1.7)) * 0.8 + 0.2)
          ctx.fillStyle = p.color
          if (p.round) {
            ctx.beginPath()
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
            ctx.fill()
          } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          ctx.restore()
        }
        raf.current = pieces.current.length ? requestAnimationFrame(step) : 0
      }
      raf.current = requestAnimationFrame(step)
    }

    useImperativeHandle(ref, () => ({
      burst(x, y) {
        if (prefersReducedMotion()) return
        for (let i = 0; i < 110; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3 // 위쪽 부채꼴
          const v = 8 + Math.random() * 11
          const round = Math.random() < 0.2
          const w = round ? 10 + Math.random() * 5 : 12 + Math.random() * 10
          pieces.current.push({
            x: x + (Math.random() - 0.5) * 90,
            y: y + (Math.random() - 0.5) * 90,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.35,
            w,
            h: round ? w : 6 + Math.random() * 4,
            color: COLORS[i % COLORS.length],
            round,
            life: 80 + Math.random() * 50,
            age: 0,
          })
        }
        if (!raf.current) loop(performance.now())
      },
    }))

    return (
      <canvas
        ref={canvas}
        width={width * dpr}
        height={height * dpr}
        style={{ width, height }}
        className={`pointer-events-none ${className ?? ''}`}
        aria-hidden
      />
    )
  },
)
