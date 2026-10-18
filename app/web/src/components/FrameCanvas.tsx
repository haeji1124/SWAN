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

    useEffect(() => {
      let loaded = 0
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
