// 제작 과정 내용 파일(src/content/making.md)을 화면이 쓰기 좋은 모양으로 나눈다.
// "## 구획" → "### 제목 | 보조" 항목 → "- 이름: 값" 칸 · 일반 줄(본문) · ``` 프롬프트 원문 (원문 안의 #은 무시한다)
import raw from '../content/making.md?raw'

export type MakingItem = { title: string; sub: string; fields: Record<string, string>; body: string[]; code: string | null }
export type MakingSection = { name: string; fields: Record<string, string>; items: MakingItem[] }

export function parseMaking(text: string): Record<string, MakingSection> {
  const sections: Record<string, MakingSection> = {}
  let section: MakingSection | null = null
  let item: MakingItem | null = null
  let fence: string[] | null = null
  for (const line of text.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)) {
    if (line.startsWith('```')) {
      if (fence) {
        if (item) item.code = fence.join('\n').trim()
        fence = null
      } else fence = []
      continue
    }
    if (fence) {
      fence.push(line)
      continue
    }
    if (line.startsWith('## ')) {
      section = { name: line.slice(3).trim(), fields: {}, items: [] }
      sections[section.name] = section
      item = null
    } else if (line.startsWith('### ') && section) {
      const [title, ...rest] = line.slice(4).split('|')
      item = { title: title.trim(), sub: rest.join('|').trim(), fields: {}, body: [], code: null }
      section.items.push(item)
    } else if (/^- [^:]+:/.test(line) && section) {
      const at = line.indexOf(':')
      const target = item ?? section
      target.fields[line.slice(2, at).trim()] = line.slice(at + 1).trim()
    } else if (line.trim() && item) item.body.push(line.trim())
  }
  return sections
}

export const making = parseMaking(raw)
export const section = (name: string): MakingSection => making[name] ?? { name, fields: {}, items: [] }
