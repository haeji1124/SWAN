// 서버 데이터를 기다리거나 받지 못했을 때 섹션 자리에 두는 한 줄 안내.
// 불러오는 중: 회색 고정폭 주석 / 실패: 오류색 문장 + [다시 시도 →]. 같은 모양을 홈의 모든 섹션에서 쓴다.
import type { HomeLoad } from '../pages/home/types'

export function DataNote({
  load,
  what,
  tone = 'paper',
  className = '',
}: {
  load: HomeLoad
  /** 무엇을: "모집 정보를", "숫자를" 처럼 조사까지 */
  what: string
  /** ink: 남색 바탕 위 (마지막 신청 섹션) */
  tone?: 'paper' | 'ink'
  className?: string
}) {
  if (load.status === 'ready') return null
  if (load.status === 'loading')
    return (
      <p role="status" className={`font-mono text-[15px] motion-safe:animate-pulse ${tone === 'ink' ? 'text-white/70' : 'text-muted'} ${className}`}>
        {`// ${what} 불러오는 중…`}
      </p>
    )
  return (
    <p role="alert" className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[16px] ${className}`}>
      <span className={`font-semibold ${tone === 'ink' ? 'text-error-bg' : 'text-error'}`}>{what} 불러오지 못했어요.</span>
      <button
        type="button"
        data-retry
        onClick={load.retry}
        className={`font-semibold underline-offset-4 hover:underline ${tone === 'ink' ? 'text-white' : 'text-ink'}`}
      >
        다시 시도 →
      </button>
    </p>
  )
}
