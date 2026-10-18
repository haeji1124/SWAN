// 완성작 갤러리 서버 함수 (Phase 4). 올리기·고치기는 파일이 있어 multipart(FormData)로 보낸다
import { ApiError, api } from './api'

export type ProjectStatus = 'pending' | 'published' | 'rejected'

export type ProjectAuthor = { id: number; name: string; dept: string; cohort: number | null }

export type ProjectCard = {
  id: number
  title: string
  summary: string
  cover: string | null
  effect: string | null
  likes: number
  liked: boolean
  author: ProjectAuthor
  status: ProjectStatus
  status_label: string
  created_at: string
  reject_reason?: string | null
}

export type ProjectFull = ProjectCard & {
  problem: string | null
  screenshots: string[]
  slides: string | null
  slides_name: string | null
  repo_url: string | null
  detail: string | null
  reject_reason: string | null
  mine: boolean
  related: ProjectCard[]
}

export type ProjectList = { items: ProjectCard[]; total: number; cohorts: number[]; depts: string[]; can_upload: boolean }

export type ProjectSort = 'latest' | 'likes'

export function listProjects(f: { cohort?: number | null; dept?: string | null; sort: ProjectSort }) {
  const q = new URLSearchParams({ sort: f.sort })
  if (f.cohort) q.set('cohort', String(f.cohort))
  if (f.dept) q.set('dept', f.dept)
  return api<ProjectList>(`/api/projects?${q}`)
}
export const myProjects = () => api<ProjectCard[]>('/api/projects/mine')
export const getProject = (id: number) => api<ProjectFull>(`/api/projects/${id}`)
export const likeProject = (id: number) => api<{ liked: boolean; likes: number }>(`/api/projects/${id}/like`, { method: 'POST' })
export const deleteProject = (id: number) => api<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' })

/** FormData는 Content-Type을 브라우저가 정해야 해서(경계 문자열) api() 대신 fetch로 보낸다 */
async function sendForm(path: string, method: 'POST' | 'PUT', body: FormData): Promise<ProjectFull> {
  const res = await fetch(path, { method, body })
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
export const createProject = (body: FormData) => sendForm('/api/projects', 'POST', body)
export const updateProject = (id: number, body: FormData) => sendForm(`/api/projects/${id}`, 'PUT', body)

// ---------- 관리자: 완성작 검수 ----------
export const adminProjects = (status: ProjectStatus) =>
  api<{ items: ProjectCard[]; counts: Record<ProjectStatus, number> }>(`/api/admin/projects?status=${status}`)
export const approveProject = (id: number) => api<{ ok: boolean }>(`/api/admin/projects/${id}/approve`, { method: 'POST' })
export const rejectProject = (id: number, reason: string) =>
  api<{ ok: boolean }>(`/api/admin/projects/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
