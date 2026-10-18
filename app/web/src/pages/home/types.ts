// /api/home 응답
export type Unit = { id: number; stage: number; title: string; content: string }

export type PracticeProject = {
  id: number
  title: string
  one_liner: string
  detail: string
  topic: string
  skill: string
  preview_image: string | null
  preview_video: string | null
}

export type HomeData = {
  recruit: {
    number: number
    recruit_end: string
    recruit_end_label: string
    days_left: number
    start_label: string // 개강일 "11월 5일(목)"
    days_to_start: number
    class_day: string
    class_time: string
  } | null
  next_number: number
  stats: { cohorts: number; first_cohort: number | null; last_cohort: number | null; alumni: number; depts: number }
  alumni_names: string[]
  dept_names: string[]
  units: Unit[]
  projects: PracticeProject[]
}

/** 홈 데이터(/api/home) 상태: 불러오는 중 / 받음 / 실패. retry로 다시 부른다 */
export type HomeLoad = { status: 'loading' | 'ready' | 'error'; retry: () => void }

export const dLabel = (days: number) => (days <= 0 ? '오늘 마감' : `D-${days}`)
