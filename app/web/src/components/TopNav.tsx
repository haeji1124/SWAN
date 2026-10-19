import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ApiError, cancelApply, postInterest } from '../lib/api'
import { useMe } from '../lib/me'
import { track } from '../lib/track'
import { Button } from './Button'
import { useFeedback } from './Feedback'

const MENU = [
  { to: '/projects', label: '완성작' },
  { to: '/#curriculum', label: '커리큘럼' },
  { to: '/quiz', label: '수준 테스트' },
  { to: '/toys', label: '토이프로젝트' },
  { to: '/ideas', label: '아이디어 보드' },
]

/* 떠나기 전에 묻기: 수준 테스트를 풀던 중처럼 떠나면 잃는 것이 있는 화면이 등록한다.
 * 등록돼 있으면 상단 메뉴의 링크(로고·메뉴)를 누를 때 먼저 묻고, '떠난다'고 하면 그때 옮긴다 */
let leaveGuard: (() => Promise<boolean>) | null = null
export const setLeaveGuard = (fn: (() => Promise<boolean>) | null) => {
  leaveGuard = fn
}

export function TopNav() {
  const { me } = useMe()
  const navigate = useNavigate()
  const guardLinks = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a')
    if (!leaveGuard || !a || e.metaKey || e.ctrlKey) return
    e.preventDefault()
    e.stopPropagation()
    const to = a.getAttribute('href') ?? '/'
    leaveGuard().then((ok) => {
      if (!ok) return
      leaveGuard = null
      navigate(to)
    })
  }
  const [scrolled, setScrolled] = useState(false)

  // 스크롤을 시작하면 위에 붙고 paper 바탕이 채워진다
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      onClickCapture={guardLinks}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-200 ${
        scrolled ? 'border-b border-line bg-paper' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="page flex h-[88px] items-center justify-between">
        <div className="flex items-center gap-14">
          <Link
            to="/"
            className="flex items-baseline gap-2"
            onClick={() => {
              track('click', 'nav:logo')
              // 이미 홈에 있으면 주소가 같아 아무 일도 안 일어나므로 맨 위로 올려 준다
              if (window.location.pathname === '/' && !window.location.hash) window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <span className="font-mono text-[15px] text-mark">&gt;_</span>
            <span className="font-display text-[26px] font-extrabold tracking-[0.02em]">SWAN</span>
          </Link>
          <nav className="flex gap-8 text-[16px] font-semibold whitespace-nowrap">
            {MENU.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                onClick={() => track('click', `nav:${m.label}`)}
                className={({ isActive }) =>
                  `underline-offset-[6px] hover:underline ${isActive && !m.to.includes('#') ? 'underline decoration-2' : ''}`
                }
              >
                {m.label}
              </NavLink>
            ))}
            {me?.logged_in && me.is_admin && (
              <NavLink to="/admin" className="text-muted underline-offset-[6px] hover:underline">
                관리자
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          {me?.logged_in && (
            // 이름과 부서가 길면 메뉴 쪽으로 밀고 들어와서 폭을 정하고 부서 쪽을 줄임표로 자른다 (UI 체크리스트 06-1). 전체는 마우스를 올리면
            <span
              title={`${me.name} · ${me.dept}`}
              className="max-w-[300px] truncate font-mono text-[13px] whitespace-nowrap text-muted max-[1180px]:hidden"
            >
              {me.name} · {me.dept}
            </span>
          )}
          <PrimaryAction />
        </div>
      </div>
    </header>
  )
}

/* 주 행동 버튼은 한 화면에 하나 (구현 전달 2장, UI 체크리스트 01-5).
 * 섹션 안의 [신청하기](② 한 줄 소개, ⑪ 마지막 신청)가 화면에 보이는 동안에는 상단 메뉴의 버튼을 자리만 남기고 숨긴다. */
const inlineShown = new Set<string>()
const listeners = new Set<() => void>()
const setInlineShown = (place: string, shown: boolean) => {
  if (shown === inlineShown.has(place)) return
  if (shown) inlineShown.add(place)
  else inlineShown.delete(place)
  listeners.forEach((l) => l())
}
const useInlineShown = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => inlineShown.size > 0,
  )

/** 화면 안의 주 버튼을 감싼 요소에 ref를 달면, 그 요소가 보이는 동안 상단 메뉴의 주 버튼을 숨긴다.
 *  섹션 [신청하기](PrimaryAction)와 수준 테스트 결과의 [신청하기]·[다음 기수 알림 받기]가 쓴다 */
export function useHideNavPrimary<T extends HTMLElement>(place: string, active = true) {
  const box = useRef<T>(null)
  useEffect(() => {
    if (!active || !box.current) return
    // 메뉴(88px) 아래로 버튼이 조금이라도 보이면 '보임' (화면 아래에 걸칠 때도 두 개가 되지 않게)
    const io = new IntersectionObserver(([e]) => setInlineShown(place, e.isIntersecting), { rootMargin: '-88px 0px 0px 0px', threshold: 0 })
    io.observe(box.current)
    return () => {
      io.disconnect()
      setInlineShown(place, false)
    }
  }, [place, active])
  return box
}

/** 주 행동 버튼. place가 nav면 상단 메뉴용(섹션 버튼이 보이면 숨김), 아니면 섹션 안 버튼(보이는지 알림) */
export function PrimaryAction({ place = 'nav', inverse = false }: { place?: string; inverse?: boolean }) {
  const hidden = useInlineShown()
  const box = useHideNavPrimary<HTMLSpanElement>(place, place !== 'nav')
  if (place === 'nav')
    return (
      <span
        className={`inline-flex transition-[opacity,visibility] duration-200 ${hidden ? 'invisible opacity-0' : ''}`}
        aria-hidden={hidden || undefined}
      >
        <PrimaryButton place={place} inverse={inverse} />
      </span>
    )
  return (
    <span ref={box} className="inline-flex">
      <PrimaryButton place={place} inverse={inverse} />
    </span>
  )
}

/** [신청하기] / [✓ 신청 완료] / [다음 기수 알림 받기]. 동작은 Phase 2에서 붙인다.
 *  place: 어디에 있는 버튼인지 (클릭 기록용), inverse: ink 바탕 위에 놓일 때 */
function PrimaryButton({ place, inverse }: { place: string; inverse: boolean }) {
  const { me, reload } = useMe()
  const { confirm, toast } = useFeedback()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const main = inverse ? 'inverse' : 'primary'

  if (me === null) return <div className="h-[50px] w-[120px]" aria-hidden />

  if (!me.logged_in) {
    return (
      <Button
        variant={main}
        onClick={() => {
          track('click', `${place}:apply(logged-out)`)
          confirm({
            title: '로그인이 필요해요',
            body: '사내 계정으로 자동 로그인되지 않았어요. 화면은 그대로 둘러볼 수 있어요.',
            confirmLabel: '알겠어요',
            cancelLabel: '닫기',
          })
        }}
      >
        신청하기
      </Button>
    )
  }

  const fail = (e: unknown) => toast(e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요')

  if (!me.recruiting) {
    if (me.interested) {
      return (
        <Button variant="secondary" disabled>
          <span className="font-mono">✓</span> 알림 신청됨
        </Button>
      )
    }
    return (
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          track('click', `${place}:interest`)
          setBusy(true)
          try {
            await postInterest()
            await reload()
            toast('알림을 신청했어요. 다음 기수 모집이 열리면 알려 드릴게요')
          } catch (e) {
            fail(e)
          } finally {
            setBusy(false)
          }
        }}
      >
        다음 기수 알림 받기
      </Button>
    )
  }

  if (me.applied_current) {
    return (
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          track('click', `${place}:applied`)
          // 되돌릴 수 없는 일은 한 번 더 묻는다 (취소한 뒤 다시 신청할 수는 있다)
          const ok = await confirm({
            title: '신청을 취소할까요?',
            body: '취소해도 모집 기간 안에는 다시 신청할 수 있어요.',
            confirmLabel: '신청 취소',
            cancelLabel: '그대로 두기',
            danger: true,
          })
          if (!ok) return
          track('click', `${place}:cancel`)
          setBusy(true)
          try {
            await cancelApply()
            await reload()
            toast('신청을 취소했어요')
          } catch (e) {
            fail(e)
          } finally {
            setBusy(false)
          }
        }}
      >
        <span className="font-mono">✓</span> 신청 완료
      </Button>
    )
  }

  return (
    <Button
      variant={main}
      onClick={() => {
        track('click', `${place}:apply`)
        navigate('/apply')
      }}
    >
      신청하기
    </Button>
  )
}
