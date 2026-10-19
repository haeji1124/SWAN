import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { DevUserPicker } from './components/DevUserPicker'
import { FeedbackProvider } from './components/Feedback'
import { TopNav } from './components/TopNav'
import { MeProvider, useMe } from './lib/me'
import { track } from './lib/track'
import { Admin } from './pages/Admin'
import { Apply } from './pages/Apply'
import { Home } from './pages/Home'
import { Ideas } from './pages/Ideas'
import { Placeholder } from './pages/Placeholder'
import { ProjectForm } from './pages/ProjectForm'
import { ProjectDetail, Projects } from './pages/Projects'
import { Quiz } from './pages/Quiz'
import { ToyDetail, ToyFormPage, Toys } from './pages/Toys'

// 사이트에 처음 들어올 때 방문을 한 번 기록한다 (개발 모드의 StrictMode 이중 실행에도 한 번만)
let visited = false

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

/** 신청 화면은 상단 메뉴 대신 자기 머리(로고 + 나가기)를 쓴다 (구현 전달 3장).
 *  수준 테스트는 처음엔 같았지만 다른 메뉴로 갈 수 없어 답답하다는 의견으로 상단 메뉴를 그대로 둔다 (2026-10-19) */
function Chrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  if (pathname.startsWith('/apply')) return <>{children}</>
  return (
    <>
      <TopNav />
      <main className="pt-[88px]">{children}</main>
    </>
  )
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { me } = useMe()
  if (me === null) return null
  if (!me.logged_in || !me.is_admin) {
    return (
      <section className="page pt-24 pb-36">
        <h1 className="font-display text-[40px] font-extrabold">관리자만 볼 수 있어요</h1>
        <p className="mt-4 text-muted">관리자 권한이 필요하면 운영자에게 요청해 주세요.</p>
      </section>
    )
  }
  return <>{children}</>
}

export default function App() {
  useEffect(() => {
    if (visited) return
    visited = true
    track('visit', window.location.pathname)
  }, [])

  return (
    <BrowserRouter>
      <MeProvider>
        <FeedbackProvider>
          <ScrollToTop />
          <Chrome>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/new" element={<ProjectForm />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:id/edit" element={<ProjectForm />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/apply" element={<Apply />} />
              <Route path="/toys" element={<Toys />} />
              <Route path="/toys/new" element={<ToyFormPage />} />
              <Route path="/toys/:id" element={<ToyDetail />} />
              <Route path="/toys/:id/edit" element={<ToyFormPage />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/making" element={<Placeholder title="이렇게 만들었어요" path="/making" phase={6} />} />
              <Route
                path="/admin/*"
                element={
                  <AdminOnly>
                    <Admin />
                  </AdminOnly>
                }
              />
              <Route path="*" element={<Placeholder title="없는 주소예요" path="404" phase={0} />} />
            </Routes>
          </Chrome>
          <DevUserPicker />
        </FeedbackProvider>
      </MeProvider>
    </BrowserRouter>
  )
}
