// 코드 상자: JetBrains Mono, 줄 번호, 문법 색. 색은 사이트에 포함한 prism-react-renderer로 입힌다 (외부 서비스 없음)
// 줄마다 바탕색·왼쪽 막대·// 설명을 달 수 있고, onPick을 주면 줄을 눌러 고를 수 있다 (수준 테스트 6번)
import { Highlight, type PrismTheme } from 'prism-react-renderer'
import type { ReactNode } from 'react'

// 방향 A 팔레트 안에서 고른 문법 색. 노랑은 쓰지 않는다
const theme: PrismTheme = {
  plain: { color: '#1f2a44', backgroundColor: 'transparent' },
  styles: [
    { types: ['keyword', 'boolean', 'builtin'], style: { color: '#3d5a99', fontWeight: '600' } },
    { types: ['string', 'char', 'triple-quoted-string'], style: { color: '#2f6e55' } },
    { types: ['number'], style: { color: '#9a4f2a' } },
    { types: ['comment'], style: { color: '#7d93b0', fontStyle: 'italic' } },
    { types: ['function', 'class-name'], style: { color: '#1f2a44', fontWeight: '600' } },
    { types: ['operator', 'punctuation'], style: { color: '#5b6273' } },
  ],
}

export type LineTone = 'success' | 'warning' | 'error' | 'sky' | 'hover'

const TONE: Record<LineTone, string> = {
  success: 'bg-success-bg',
  warning: 'bg-warning-bg',
  error: 'bg-error-bg',
  sky: 'bg-sky',
  hover: 'bg-sky/50',
}
const NOTE_TONE: Record<LineTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  sky: 'text-mark',
  hover: 'text-mark',
}

type Props = {
  code: string
  /** 줄 번호(1부터) → 바탕색 */
  tone?: (line: number) => LineTone | undefined
  /** 왼쪽 ink 굵은 막대 (고른 줄) */
  bar?: (line: number) => boolean
  /** 줄 옆 여백의 // 설명 */
  note?: (line: number) => ReactNode
  /** 주면 줄을 눌러 고를 수 있다. 빈 줄은 고를 수 없다 */
  onPick?: (line: number) => void
  picked?: number | null
  label?: string
  className?: string
  size?: 'md' | 'sm'
}

export function Code({ code, tone, bar, note, onPick, picked, label, className = '', size = 'md' }: Props) {
  const text = size === 'md' ? 'text-[16px] leading-[30px]' : 'text-[14px] leading-[26px]'
  return (
    <Highlight code={code.replace(/\n+$/, '')} language="python" theme={theme}>
      {({ tokens, getTokenProps }) => (
        <div
          className={`overflow-x-auto rounded-card border border-line bg-surface py-3 font-mono ${text} ${className}`}
          role={onPick ? 'radiogroup' : undefined}
          aria-label={label}
        >
          {tokens.map((line, i) => {
            const n = i + 1
            const empty = line.every((t) => t.empty || t.content.trim() === '')
            const lineTone = tone?.(n)
            const body = (
              <>
                <span className="w-12 shrink-0 pr-4 text-right text-mark select-none">{n}</span>
                <span className="min-w-0 flex-1 whitespace-pre">
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                  {empty && ' '}
                </span>
                {note?.(n) && (
                  <span className={`shrink-0 pr-5 pl-6 font-mono text-[13px] ${NOTE_TONE[lineTone ?? 'sky']}`}>// {note(n)}</span>
                )}
              </>
            )
            const cls = `relative flex w-full min-w-max items-baseline text-left ${lineTone ? TONE[lineTone] : ''} ${
              bar?.(n) ? 'shadow-[inset_4px_0_0_var(--color-ink)]' : ''
            }`
            if (onPick && !empty)
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={picked === n}
                  aria-label={`${n}번 줄`}
                  onClick={() => onPick(n)}
                  className={`${cls} cursor-pointer outline-none ${picked === n ? '' : 'hover:bg-sky/50 focus-visible:bg-sky/50'}`}
                >
                  {body}
                </button>
              )
            return (
              <div key={n} className={cls}>
                {body}
              </div>
            )
          })}
        </div>
      )}
    </Highlight>
  )
}

/** 터미널처럼 보이는 작은 상자 (원래 에러, 로그 파일) */
export function Terminal({ label, children, tone }: { label: string; children: string; tone?: 'error' }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="font-mono text-[13px] text-mark">// {label}</figcaption>
      <pre
        className={`rounded-card border bg-surface px-4 py-3 font-mono text-[14px] leading-[24px] whitespace-pre-wrap ${
          tone === 'error' ? 'border-[#e8c6a8] text-[#a5541c]' : 'border-line text-ink'
        }`}
      >
        {children}
      </pre>
    </figure>
  )
}
