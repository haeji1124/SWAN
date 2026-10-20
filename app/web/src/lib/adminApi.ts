// 관리자 화면에서 쓰는 서버 함수 (Phase 2: 기수 · 신청자 · 졸업생 · Phase 6: 커리큘럼 · 관리자)
import { ApiError, api, type CohortInfo } from './api'

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

// ---------- 커리큘럼 (Phase 6) ----------
export type AdminUnit = { id: number; order: number; stage: number; stage_label: string; title: string; content: string }
export type AdminPractice = {
  id: number
  order: number
  title: string
  one_liner: string
  detail: string
  topic: string
  skill: string
  preview_image: string | null
  preview_video: string | null
}
export type CurriculumData = { units: AdminUnit[]; projects: AdminPractice[]; stages: { value: number; label: string }[]; topics: string[] }
export type PracticeForm = { title: string; one_liner: string; detail: string; topic: string; skill: string }

export const getCurriculum = () => api<CurriculumData>('/api/admin/curriculum')
export const editUnit = (id: number, body: { stage: number; title: string; content: string }) =>
  api<AdminUnit>(`/api/admin/curriculum/units/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const movePractice = (id: number, direction: 'up' | 'down') =>
  api<{ order: number[] }>(`/api/admin/curriculum/projects/${id}/move`, { method: 'POST', body: JSON.stringify({ direction }) })
export const deletePractice = (id: number) => api<{ ok: boolean }>(`/api/admin/curriculum/projects/${id}`, { method: 'DELETE' })

/** 미리보기 그림·영상이 붙을 수 있어 FormData로 보낸다 (Content-Type은 브라우저가 정한다) */
export async function savePractice(
  id: number | null,
  f: PracticeForm,
  files: { image?: File | null; video?: File | null; removeImage?: boolean; removeVideo?: boolean },
): Promise<AdminPractice> {
  const body = new FormData()
  Object.entries(f).forEach(([k, v]) => body.append(k, v))
  if (files.image) body.append('image', files.image)
  if (files.video) body.append('video', files.video)
  if (files.removeImage) body.append('remove_image', 'true')
  if (files.removeVideo) body.append('remove_video', 'true')
  const res = await fetch(id ? `/api/admin/curriculum/projects/${id}` : '/api/admin/curriculum/projects', { method: id ? 'PUT' : 'POST', body })
  if (!res.ok) {
    let message = '잠시 후 다시 시도해 주세요'
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') message = data.detail
    } catch {
      /* 본문이 없으면 기본 문구 */
    }
    throw new ApiError(res.status, message)
  }
  return res.json()
}

// ---------- 관리자 (Phase 6) ----------
export type AdminUser = { id: number; emp_no: string; name: string; dept: string; type: 'employee' | 'student' | 'alumni'; me?: boolean }
export const listAdmins = () => api<{ items: AdminUser[] }>('/api/admin/admins')
export const searchUsers = (q: string) => api<{ items: AdminUser[] }>(`/api/admin/users/search?q=${encodeURIComponent(q)}`)
export const addAdmin = (id: number) => api<AdminUser>(`/api/admin/admins/${id}`, { method: 'POST' })
export const removeAdmin = (id: number) => api<{ ok: boolean }>(`/api/admin/admins/${id}`, { method: 'DELETE' })
