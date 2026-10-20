// 그림 프레임을 캔버스에 그린다. 프레임은 미리 모두 불러 두고, 바깥에서 draw(번호)를 부른다.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export type FrameCanvasHandle = { draw: (index: number) => void; count: number }

export function frameUrls(folder: string, count: number) {
  return Array.from({ length: count }, (_, i) => `/frames/${folder}/${String(i).padStart(3, '0')}.webp`)
}

// size는 가로(px). height를 주지 않으면 정사각형이다
type Props = { urls: string[]; size: number; height?: number; className?: string; style?: React.CSSProperties; onReady?: () => void }

export const FrameCanvas = forwardRef<FrameCanvasHandle, Props>(
  function FrameCanvas({ urls, size, height, className, style, onReady }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const images = useRef<HTMLImageElement[]>([])
    const current = useRef(-1)
    const pending = useRef(0)

    const draw = (index: number) => {
      const i = Math.max(0, Math.min(urls.length - 1, Math.round(index)))
      const img = images.current[i]
      pending.current = i
      if (!img || !img.complete || !canvas.current) return
      if (current.current === i) return
      const ctx = canvas.current.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)
      ctx.drawImage(img, 0, 0, canvas.current.width, canvas.current.height)
      current.current = i
    }

    useImperativeHandle(ref, () => ({ draw, count: urls.length }), [urls])

    // 그림은 캔버스가 화면 가까이(위아래로 화면 1.5배 안) 올 때 받기 시작한다.
    // 처음엔 모든 섹션의 프레임을 한꺼번에 받아 홈 첫 방문이 약 11MB였다 (Phase 8 성능 점검)
    useEffect(() => {
      let loaded = 0
      images.current = []
      const load = () => {
        images.current = urls.map((u, i) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => {
            loaded += 1
            if (i === pending.current) {
              current.current = -1
              draw(i)
            }
            if (loaded === urls.length) onReady?.()
          }
          img.src = u
          return img
        })
      }
      if (!canvas.current || typeof IntersectionObserver === 'undefined') {
        load()
        return
      }
      let started = false
      const start = () => {
        if (started) return
        started = true
        io.disconnect()
        load()
      }
      const io = new IntersectionObserver(([e]) => e.isIntersecting && start(), { rootMargin: '150% 0px' })
      io.observe(canvas.current)
      // 화면에서 먼 프레임도 첫 화면이 뜬 뒤 한가할 때 미리 받아 둔다. 스크롤하는 도중에 받으면 장면이 끊겼다
      const idle = window.setTimeout(start, 5000)
      return () => {
        io.disconnect()
        window.clearTimeout(idle)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urls])

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const h = height ?? size
    return (
      <canvas
        ref={canvas}
        width={Math.round(size * dpr)}
        height={Math.round(h * dpr)}
        style={{ ...style, width: size, height: h }}
        className={className}
        aria-hidden
      />
    )
  },
)
