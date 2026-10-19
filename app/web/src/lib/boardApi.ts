// 아이디어 보드 · 토이프로젝트 서버 함수 (Phase 5)
import { ApiError, api } from './api'

// ---------- 아이디어 보드 ----------

export type IdeaStatus = 'open' | 'reviewing' | 'building' | 'done' | 'held'
export type NameDisplay = 'full' | 'dept'
export type IdeaSort = 'votes' | 'latest'

export type Idea = {
  id: number
  title: string
  description: string
  author: string // 고른 방식대로: "이름 · 부서" 또는 "부서"
  votes: number
  voted: boolean
  status: IdeaStatus
  status_label: string
  reply: string | null
  images: string[] // 첨부 그림 주소
  mine: boolean
  name_display: NameDisplay | null // 내 아이디어일 때만
  created_at: string
}

export type IdeaForm = { title: string; description: string; name_display: NameDisplay }

export const IDEA_TITLE_MAX = 60
export const IDEA_DESC_MAX = 300
export const IDEA_REPLY_MAX = 100
export const IDEA_MAX_IMAGES = 3

export const listIdeas = (sort: IdeaSort) => api<{ items: Idea[]; can_post: boolean }>(`/api/ideas?sort=${sort}`)

/** 그림이 붙을 수 있어 FormData로 보낸다. Content-Type은 브라우저가 정해야 해서(경계 문자열) api() 대신 fetch */
async function sendIdea(path: string, method: 'POST' | 'PUT', f: IdeaForm, images: File[], keep?: string[]): Promise<Idea> {
  const body = new FormData()
  body.append('title', f.title)
  body.append('description', f.description)
  body.append('name_display', f.name_display)
  if (keep) body.append('keep_images', JSON.stringify(keep))
  images.forEach((img) => body.append('images', img))
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
export const createIdea = (f: IdeaForm, images: File[]) => sendIdea('/api/ideas', 'POST', f, images)
/** keep: 남겨 둘 기존 그림 주소. 빠진 그림은 서버에서 지운다 */
export const updateIdea = (id: number, f: IdeaForm, images: File[], keep: string[]) => sendIdea(`/api/ideas/${id}`, 'PUT', f, images, keep)
export const deleteIdea = (id: number) => api<{ ok: boolean }>(`/api/ideas/${id}`, { method: 'DELETE' })
export const voteIdea = (id: number) => api<{ voted: boolean; votes: number }>(`/api/ideas/${id}/vote`, { method: 'POST' })

export type AdminIdea = {
  id: number
  title: string
  description: string
  author_name: string
  author_dept: string
  name_display: NameDisplay
  votes: number
  status: IdeaStatus
  status_label: string
  reply: string | null
  images: string[]
  hidden: boolean
  created_at: string
}

export const adminIdeas = () => api<{ items: AdminIdea[]; statuses: { value: IdeaStatus; label: string }[] }>('/api/admin/ideas')
export const setIdeaStatus = (id: number, status: IdeaStatus) =>
  api<{ status: IdeaStatus; status_label: string }>(`/api/admin/ideas/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) })
export const setIdeaReply = (id: number, reply: string) =>
  api<{ reply: string | null }>(`/api/admin/ideas/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) })
export const hideIdea = (id: number, hidden: boolean) =>
  api<{ hidden: boolean }>(`/api/admin/ideas/${id}/hide`, { method: 'POST', body: JSON.stringify({ hidden }) })

// ---------- 토이프로젝트 ----------

export type ToyStatus = 'open' | 'closed'

export type ToyPerson = {
  id: number
  name: string
  dept: string
  cohort: number | null // 졸업생이면 처음 수료한 기수
  type: 'alumni' | 'student' | 'employee'
  type_label: string
}

export type Toy = {
  id: number
  title: string
  what: string
  roles: string
  period: string
  status: ToyStatus
  status_label: string
  author: ToyPerson
  joins: number
  joined: boolean
  mine: boolean
  created_at: string
}

export type ToyFull = Toy & { can_join: boolean; applicants: ToyPerson[] | null }

export type ToyForm = { title: string; what: string; roles: string; period: string }

export const TOY_LIMITS = { title: 60, what: 1000, roles: 200, period: 50 }

export const personLine = (p: ToyPerson) => `${p.name} · ${p.dept} · ${p.cohort ? `${p.cohort}기 졸업생` : p.type_label}`

export const listToys = () => api<{ items: Toy[]; can_write: boolean }>('/api/toys')
export const getToy = (id: number) => api<ToyFull>(`/api/toys/${id}`)
export const createToy = (f: ToyForm) => api<ToyFull>('/api/toys', { method: 'POST', body: JSON.stringify(f) })
export const updateToy = (id: number, f: ToyForm) => api<ToyFull>(`/api/toys/${id}`, { method: 'PUT', body: JSON.stringify(f) })
export const deleteToy = (id: number) => api<{ ok: boolean }>(`/api/toys/${id}`, { method: 'DELETE' })
export const joinToy = (id: number) => api<{ joined: boolean; joins: number }>(`/api/toys/${id}/join`, { method: 'POST' })
export const setToyStatus = (id: number, status: ToyStatus) =>
  api<ToyFull>(`/api/toys/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) })

export type AdminToy = {
  id: number
  title: string
  roles: string
  period: string
  author_name: string
  author_dept: string
  joins: number
  status: ToyStatus
  status_label: string
  hidden: boolean
  created_at: string
}

export const adminToys = () => api<{ items: AdminToy[] }>('/api/admin/toys')
export const hideToy = (id: number, hidden: boolean) =>
  api<{ hidden: boolean }>(`/api/admin/toys/${id}/hide`, { method: 'POST', body: JSON.stringify({ hidden }) })
