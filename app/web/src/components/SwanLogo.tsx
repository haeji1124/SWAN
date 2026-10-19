/** 알록달록 별이 반짝이는 `>_ SWAN` 알약 로고. 히어로 변신(밝은 바탕)과 마지막 신청 섹션의 날아오른 백조(ink 바탕)가 함께 쓴다 */
export function SwanLogoMark({ onInk = false }: { onInk?: boolean }) {
  const star = (x: number, y: number, s: number, delay: number, color: string) => (
    <svg
      key={`${x}-${y}`}
      viewBox="0 0 20 20"
      className="absolute motion-safe:animate-[twinkle_1.6s_ease-in-out_infinite]"
      style={{ left: x, top: y, width: s, height: s, animationDelay: `${delay}s` }}
      aria-hidden
    >
      <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill={color} />
    </svg>
  )
  return (
    <div className="relative motion-safe:animate-[float_3s_ease-in-out_infinite]">
      <div
        className={`flex items-baseline gap-1.5 rounded-full px-5 py-2 shadow-dialog ${onInk ? 'bg-paper text-ink' : 'bg-ink text-white'}`}
      >
        <span className={`font-mono text-[14px] ${onInk ? 'text-mark' : 'text-sky'}`}>&gt;_</span>
        <span className="font-display text-[26px] font-extrabold tracking-[0.06em]">SWAN</span>
      </div>
      {star(-26, -12, 18, 0, '#f28c38')}
      {star(130, -18, 14, 0.5, '#f3a6bd')}
      {star(62, -30, 11, 0.3, '#7cc9a5')}
      {star(146, 28, 12, 1, '#9ccbf2')}
      {star(-16, 38, 11, 0.8, '#7cc9a5')}
      {star(170, 4, 9, 1.3, '#f28c38')}
      {star(-40, 16, 8, 1.1, '#f3a6bd')}
    </div>
  )
}
