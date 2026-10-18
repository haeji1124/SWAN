// 관리자 화면에서 쓰는 서버 함수 (Phase 2: 기수 · 신청자 · 졸업생)
import { api, type CohortInfo } from './api'

export type AdminCohort = CohortInfo & { status_label: string; applicants: number; canceled: number; alumni: number }

export type CohortForm = {
  number: number
  recruit_start: string
  recruit_end: string
  start_date: string
  end_date: string
  class_day: string
  class_time: string
}

export type Applicant = {
  id: number
  name: string
  dept: string
  emp_no: string
  applied_at: string
  python_exp_label: string
  want_to_make: string | null
  canceled_at: string | null
  quiz_first_score: number | null
}

export type AlumniRow = { id?: number; line?: number; name: string; dept: string; cohort_number: number; emp_no: string }
export type AlumniPreview = { rows: AlumniRow[]; errors: { line: number; message: string }[]; duplicates: AlumniRow[] }

export const listCohorts = () => api<AdminCohort[]>('/api/admin/cohorts')
export const addCohort = (f: CohortForm) => api<CohortInfo>('/api/admin/cohorts', { method: 'POST', body: JSON.stringify(f) })
export const editCohort = (id: number, f: CohortForm) =>
  api<CohortInfo>(`/api/admin/cohorts/${id}`, { method: 'PUT', body: JSON.stringify(f) })
export const openCohort = (id: number) => api<CohortInfo>(`/api/admin/cohorts/${id}/open`, { method: 'POST' })
export const closeCohort = (id: number) => api<CohortInfo>(`/api/admin/cohorts/${id}/close`, { method: 'POST' })
export const graduateCohort = (id: number) =>
  api<{ moved: number; skipped: number }>(`/api/admin/cohorts/${id}/graduate`, { method: 'POST' })

export const listApplicants = (cohortId: number) =>
  api<{ cohort: CohortInfo; active: Applicant[]; canceled: Applicant[]; quiz_total: number }>(`/api/admin/applicants?cohort_id=${cohortId}`)
export const applicantsXlsxUrl = (cohortId: number) => `/api/admin/applicants.xlsx?cohort_id=${cohortId}`

export const listAlumni = (cohortNumber?: number) =>
  api<{ counts: { cohort_number: number; count: number }[]; total: number; rows: AlumniRow[] }>(
    `/api/admin/alumni${cohortNumber ? `?cohort_number=${cohortNumber}` : ''}`,
  )
// 엑셀 파일은 본문 그대로 보낸다 (서버가 multipart 없이 읽는다)
const raw = (file: File) => ({ method: 'POST', body: file, headers: { 'Content-Type': 'application/octet-stream' } })
export const previewAlumni = (file: File) => api<AlumniPreview>('/api/admin/alumni/preview', raw(file))
export const importAlumni = (file: File) =>
  api<{ added: number; skipped: number; errors: number }>('/api/admin/alumni/import', raw(file))
