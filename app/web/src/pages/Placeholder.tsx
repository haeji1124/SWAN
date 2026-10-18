// 아직 채우지 않은 화면의 자리. 각 Phase에서 실제 화면으로 바꾼다.
export function Placeholder({ title, path, phase }: { title: string; path: string; phase: number }) {
  return (
    <section className="page pt-24 pb-36">
      <p className="font-mono text-[14px] text-mark">{path}</p>
      <h1 className="mt-3 font-display text-[54px] leading-tight font-extrabold tracking-[-0.02em]">{title}</h1>
      <p className="mt-6 font-mono text-[15px] text-muted">// Phase {phase}에서 채워요</p>
    </section>
  )
}
