// 수준 테스트 서버 함수 (Phase 3). 정답은 제출한 뒤에만 받는다
import { api } from './api'

export type QuizType = 'choice' | 'short' | 'line'

export type QuizQuestion = {
  id: number
  order: number
  type: QuizType
  title: string
  scenario: string | null
  code: string
  question: string
  choices: string[]
}

export type QuizInfo = {
  questions: QuizQuestion[]
  total: number
  mine: { first_score: number; first_at: string; attempts: number } | null // 기준 기록(첫 응시)
  will_record: boolean // 로그인 실패면 false
}

export type Answer = number | string | null
export type Grade = 'correct' | 'partial' | 'wrong'
export type StageKey = 'hatchling' | 'duckling' | 'cygnet'

export type QuizResultItem = QuizQuestion & {
  my_answer: Answer
  result: Grade
  answer: string
  partial_answer: number[]
  explanation: string
  better_code: string | null
  line_notes: Record<string, string>
}

export type QuizResult = {
  score: number
  total: number
  stage: { key: StageKey; label: string }
  saved: boolean
  is_first: boolean
  first_score: number | null
  recruiting: boolean
  applied: boolean
  results: QuizResultItem[]
}

export const getQuiz = () => api<QuizInfo>('/api/quiz')
export const submitQuiz = (answers: Record<number, Answer>) =>
  api<QuizResult>('/api/quiz/submit', { method: 'POST', body: JSON.stringify({ answers }) })

// ---------- 관리자 ----------

export type QuizQuestionFull = Omit<QuizResultItem, 'my_answer' | 'result'>
export type QuizQuestionForm = Omit<QuizQuestionFull, 'id'>

export type QuizAttemptRow = {
  user_id: number
  name: string
  dept: string
  first_score: number
  first_at: string
  attempts: number
  stage: string
  results: Record<string, Grade>
}

export const listQuizQuestions = () => api<QuizQuestionFull[]>('/api/admin/quiz/questions')
export const addQuizQuestion = (f: QuizQuestionForm) =>
  api<QuizQuestionFull>('/api/admin/quiz/questions', { method: 'POST', body: JSON.stringify(f) })
export const editQuizQuestion = (id: number, f: QuizQuestionForm) =>
  api<QuizQuestionFull>(`/api/admin/quiz/questions/${id}`, { method: 'PUT', body: JSON.stringify(f) })
export const listQuizAttempts = () =>
  api<{ questions: { id: number; order: number; title: string }[]; total: number; rows: QuizAttemptRow[] }>(
    '/api/admin/quiz/attempts',
  )
