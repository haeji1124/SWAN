// 화면 전체에 잠깐 꽃잎이 흩날린다 (모험길 끝에 도착했을 때의 축하). 바깥에서 start()를 부른다.
// 화면 위에 고정된 캔버스라 스크롤과 상관없이 보이고, 누르는 것을 막지 않는다.
// 노랑은 쓰지 않는다. 움직임 줄이기 설정이면 아무것도 그리지 않는다.
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { createPortal } from 'react-dom'
import { prefersReducedMotion } from '../lib/motion'

export type PetalRainHandle = { start: () => void }

const COLORS = ['#f3a6bd', '#f7c6d4', '#ffffff', '#bcdcf6', '#9ccbf2', '#f28c38', '#7cc9a5']
const DURATION = 3200 // 새 꽃잎이 생기는 시간 (ms). 그 뒤 남은 꽃잎이 다 떨어지면 끝난다

type Petal = { x: number; y: number; vy: number; sway: number; phase: number; rot: number; vr: number; size: number; color: string }

export const PetalRain = forwardRef<PetalRainHandle>(function PetalRain(_, ref) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)

  useImperativeHandle(ref, () => ({
    start() {
      if (prefersReducedMotion() || raf.current || !canvas.current) return
      const c = canvas.current
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const resize = () => {
        c.width = innerWidth * dpr
        c.height = innerHeight * dpr
      }
      resize()
      c.style.display = 'block'
      const petals: Petal[] = []
      const t0 = performance.now()
      let last = t0
      const step = (t: number) => {
        const k = Math.min(3, (t - last) / (1000 / 60))
        last = t
        if (t - t0 < DURATION) {
          for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.55)
              petals.push({
                x: Math.random() * innerWidth,
                y: -20,
                vy: 1.6 + Math.random() * 2.2,
                sway: 0.6 + Math.random() * 1.4,
                phase: Math.random() * Math.PI * 2,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.08,
                size: 9 + Math.random() * 9,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
              })
          }
        }
        const ctx = c.getContext('2d')!
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, innerWidth, innerHeight)
        for (let i = petals.length - 1; i >= 0; i--) {
          const p = petals[i]
          p.phase += 0.03 * k
          p.y += p.vy * k
          p.x += Math.sin(p.phase) * p.sway * k
          p.rot += p.vr * k
          if (p.y > innerHeight + 30) {
            petals.splice(i, 1)
            continue
          }
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          // 꽃잎이 뒤집히며 떨어지는 느낌: 가로 폭을 흔든다
          ctx.scale(Math.abs(Math.cos(p.phase * 1.3)) * 0.7 + 0.3, 1)
          ctx.fillStyle = p.color
          ctx.strokeStyle = 'rgba(31,42,68,.12)'
          ctx.lineWidth = 0.6
          // 꽃잎 모양: 끝이 뾰족한 둥근 잎
          const s = p.size
          ctx.beginPath()
          ctx.moveTo(0, -s / 2)
          ctx.bezierCurveTo(s / 2, -s / 4, s / 3, s / 2, 0, s / 2)
          ctx.bezierCurveTo(-s / 3, s / 2, -s / 2, -s / 4, 0, -s / 2)
          ctx.fill()
          ctx.stroke()
          ctx.restore()
        }
        if (petals.length || t - t0 < DURATION) raf.current = requestAnimationFrame(step)
        else {
          raf.current = 0
          c.style.display = 'none'
        }
      }
      raf.current = requestAnimationFrame(step)
    },
  }))

  return createPortal(
    <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[60]" style={{ width: '100vw', height: '100vh', display: 'none' }} aria-hidden />,
    document.body,
  )
})
