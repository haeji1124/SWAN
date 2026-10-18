// 관리자가 적는 짧은 글(수준 테스트 상황 설명·해설)을 화면으로 바꾼다. 마크다운의 아주 작은 부분만 읽는다:
// 문단 · ### 소제목 · 1. / - 목록 · | 표 | · ```error 이름 / ```log 이름 상자 · > 강사 한마디 · {{better_code}} 자리
// 글 안: **굵게** · `코드` · ==형광펜==
import type { ReactNode } from 'react'
import { Terminal } from './Code'

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'ol' | 'ul'; items: string[] }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'fence'; lang: string; label: string; text: string }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'slot'; name: string }

function parse(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n')
  const out: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) {
      i++
    } else if (t.startsWith('```')) {
      const [lang = '', ...label] = t.slice(3).trim().split(/\s+/)
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) body.push(lines[i++])
      i++
      out.push({ kind: 'fence', lang, label: label.join(' '), text: body.join('\n') })
    } else if (/^\{\{\w+\}\}$/.test(t)) {
      out.push({ kind: 'slot', name: t.slice(2, -2) })
      i++
    } else if (t.startsWith('### ')) {
      out.push({ kind: 'h', text: t.slice(4) })
      i++
    } else if (t.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells)
        i++
      }
      out.push({ kind: 'table', rows })
    } else if (/^(\d+\.|-)\s/.test(t)) {
      const kind = /^\d+\./.test(t) ? 'ol' : 'ul'
      const items: string[] = []
      while (i < lines.length && /^(\d+\.|-)\s/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^(\d+\.|-)\s+/, ''))
      out.push({ kind, items })
    } else if (t.startsWith('>')) {
      const q: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) q.push(lines[i++].trim().replace(/^>\s?/, ''))
      out.push({ kind: 'quote', lines: q })
    } else {
      const p: string[] = []
      while (i < lines.length && lines[i].trim() && !/^(```|###\s|\||>|\{\{|(\d+\.|-)\s)/.test(lines[i].trim())) p.push(lines[i++].trim())
      out.push({ kind: 'p', text: p.join(' ') })
    }
  }
  return out
}

/** 글 안의 **굵게**, `코드`, ==형광펜== */
export function Inline({ text, strong = 'font-bold' }: { text: string; strong?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|==[^=]+==)/g)
  return (
    <>
      {parts.map((s, i) => {
        if (s.startsWith('**') && s.endsWith('**')) return <b key={i} className={strong}>{s.slice(2, -2)}</b>
        if (s.startsWith('`') && s.endsWith('`'))
          return (
            <code key={i} className="rounded-[4px] bg-[#eef1f6] px-1.5 py-0.5 font-mono text-[0.88em]">
              {s.slice(1, -1)}
            </code>
          )
        if (s.startsWith('==') && s.endsWith('=='))
          return (
            <mark key={i} className="bg-sky box-decoration-clone px-1 text-ink">
              <Inline text={s.slice(2, -2)} />
            </mark>
          )
        return s
      })}
    </>
  )
}

type Props = {
  text: string
  className?: string
  /** {{이름}} 자리에 넣을 것 */
  slots?: Record<string, ReactNode>
  /** > 줄들 (강사 한마디). 없으면 인용 상자로 */
  quote?: (lines: string[]) => ReactNode
}

export function RichText({ text, className = '', slots, quote }: Props) {
  return (
    <div className={`flex flex-col gap-5 text-[17px] leading-[1.75] ${className}`}>
      {parse(text).map((b, i) => {
        switch (b.kind) {
          case 'p': {
            // 문단 전체가 ==…==이면 한 줄 요약(형광펜)으로 크게
            const whole = /^==.+==$/.test(b.text) && !b.text.slice(2, -2).includes('==')
            return whole ? (
              <p key={i} className="text-[22px] leading-[1.7] font-bold">
                <mark className="bg-sky box-decoration-clone px-1.5 text-ink">
                  <Inline text={b.text.slice(2, -2)} strong="font-extrabold underline decoration-2 underline-offset-4" />
                </mark>
              </p>
            ) : (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            )
          }
          case 'h':
            return (
              <h3 key={i} className="mt-4 text-[22px] font-bold">
                {b.text}
              </h3>
            )
          case 'ol':
          case 'ul': {
            const List = b.kind
            return (
              <List key={i} className="flex flex-col gap-3">
                {b.items.map((it, k) => (
                  <li key={k} className="flex gap-3">
                    <span className="shrink-0 font-mono text-[15px] text-mark">
                      {b.kind === 'ol' ? `${k + 1}.` : '–'}
                    </span>
                    <span>
                      <Inline text={it} />
                    </span>
                  </li>
                ))}
              </List>
            )
          }
          case 'table': {
            const [head, ...rows] = b.rows
            return (
              <table key={i} className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-y border-ink text-[14px] text-muted">
                    {head.map((h, k) => (
                      <th key={k} className={`py-3 font-semibold ${k === 0 ? 'w-[44%]' : ''}`}>
                        <Inline text={h} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, k) => (
                    <tr key={k} className="border-b border-line align-baseline">
                      {r.map((c, j) => (
                        <td key={j} className="py-4 pr-6">
                          {/* 표 안의 **굵게**는 "이 코드의 값" 같은 큰 숫자로 */}
                          <Inline text={c} strong="mr-1 font-display text-[40px] leading-none font-extrabold" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          case 'fence':
            return (
              <Terminal key={i} label={b.label || b.lang} tone={b.lang === 'error' ? 'error' : undefined}>
                {b.text}
              </Terminal>
            )
          case 'quote':
            return quote ? (
              <div key={i}>{quote(b.lines)}</div>
            ) : (
              <blockquote key={i} className="border-l-4 border-sky pl-5">
                {b.lines.map((l, k) => (
                  <p key={k}>
                    <Inline text={l} />
                  </p>
                ))}
              </blockquote>
            )
          case 'slot':
            return <div key={i}>{slots?.[b.name] ?? null}</div>
        }
      })}
    </div>
  )
}
