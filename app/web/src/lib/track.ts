// 방문, 섹션 도달, 클릭을 기록한다. 기록이 실패해도 화면은 그대로 동작한다.

export type EventKind = 'visit' | 'section' | 'click'

export function track(kind: EventKind, target: string) {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, target: target.slice(0, 200) }),
    keepalive: true,
  }).catch(() => {})
}

// 같은 섹션은 한 번만 기록한다 (페이지를 새로 열기 전까지)
const seenSections = new Set<string>()

export function observeSection(el: Element, name: string): () => void {
  if (seenSections.has(name)) return () => {}
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !seenSections.has(name)) {
        seenSections.add(name)
        track('section', name)
        io.disconnect()
      }
    },
    // 비율(threshold)로 재면 화면보다 긴 섹션은 영영 기록되지 않는다.
    // 그래서 섹션이 화면 아래 30%를 지나 들어오면 도달로 본다
    { threshold: 0, rootMargin: '0px 0px -30% 0px' },
  )
  io.observe(el)
  return () => io.disconnect()
}
