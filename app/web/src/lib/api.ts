// 서버와 주고받는 함수들

export type UserType = 'employee' | 'student' | 'alumni'

export type Me =
  | { logged_in: false }
  | {
      logged_in: true
      id: number
      name: string
      dept: string
      type: UserType
      is_admin: boolean
      applied_current: boolean
      recruiting: boolean
      interested: boolean // 다음 기수 알림을 신청했는지
    }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    let message = '잠시 후 다시 시도해 주세요'
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      /* 본문이 없으면 기본 문구 */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const getMe = () => api<Me>('/api/me')

// ---------- 신청 (Phase 2) ----------

export type CohortInfo = {
  id: number
  number: number
  status: 'before' | 'open' | 'closed' | 'done'
  recruit_start: string
  recruit_end: string
  start_date: string
  end_date: string
  recruit_start_label: string
  recruit_end_label: string
  start_label: string
  end_label: string
  class_day: string
  class_time: string
  days_left: number
  days_to_start: number
}

export type MyApplication = {
  cohort_number: number
  name: string
  dept: string
  python_exp: PythonExp
  python_exp_label: string
  want_to_make: string | null
  applied_at: string
  applied_label: string
  start_label: string
  days_to_start: number
}

export type PythonExp = 'none' | 'script' | 'regular'

export type ApplyInfo = { cohort: CohortInfo | null; next_number: number; mine: MyApplication | null; interested: boolean }

export const getApplyInfo = () => api<ApplyInfo>('/api/apply')
export const postApply = (python_exp: PythonExp, want_to_make: string) =>
  api<MyApplication>('/api/apply', { method: 'POST', body: JSON.stringify({ python_exp, want_to_make }) })
export const cancelApply = () => api<{ ok: true }>('/api/apply/cancel', { method: 'POST' })
export const postInterest = () => api<{ ok: true; already: boolean }>('/api/interest', { method: 'POST' })
