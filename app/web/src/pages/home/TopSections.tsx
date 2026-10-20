// 홈 섹션 2~5: 한 줄 소개 · 숫자와 띠 · 완성작 미리보기 · 강사 소개
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FrameCanvas, frameUrls, type FrameCanvasHandle } from '../../components/FrameCanvas'
import { Mark, Section, SectionTitle } from '../../components/Section'
import { ProjectCard } from '../../components/ProjectParts'
import { PrimaryAction } from '../../components/TopNav'
import { VIRTUAL_INSTRUCTOR } from '../../data/virtual'
import { CountUp, prefersReducedMotion } from '../../lib/motion'
import { CHARACTER_FILTER } from './Hero'
import { track } from '../../lib/track'
import { DataNote } from '../../components/DataNote'
import { EmptyState } from '../../components/EmptyState'
import { dLabel, type HomeData, type HomeLoad } from './types'

/* ---------- 2. 한 줄 소개 ---------- */
const POINTS = [
  ['사내 환경을 아는 사내 강사가 가르칩니다', '사내망, 사내 도구, 우리 업무의 데이터를 아는 사람이 옆에서 봐 줍니다.'],
  ['주 1회 온라인, 3개월, 주 3~4시간이면 됩니다', '목·금 중 하루 1시간 30분 강의, 나머지는 복습과 실습이에요.'],
  ['끝나도 물어볼 사람이 남습니다', '같은 기수 동료와 강사, 그리고 먼저 졸업한 선배들이 있어요.'],
]

export function Summary({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  const r = data?.recruit
  return (
    <Section name="home:02-summary" id="summary" className="page grid grid-cols-2 items-start gap-24 pt-36 pb-32">
      <div className="flex flex-col gap-10">
        <SectionTitle>
          AI 시대,
          <br />
          SW를 보는 눈을
          <br />
          기릅니다.
        </SectionTitle>
        <div data-reveal className="flex flex-col gap-5">
          <DataNote load={load} what="모집 정보를" />
          {data &&
            (r ? (
              <p className="flex items-baseline gap-3 text-[18px]">
                <span className="rounded-badge bg-sky px-2.5 py-1 font-semibold">{r.number}기 모집 중</span>
                <span className="font-mono text-[15px]">
                  마감 {dLabel(r.days_left)} · {r.recruit_end_label} · 개강 {r.start_label}
                </span>
              </p>
            ) : (
              <p className="text-[18px] text-muted">지금은 모집 기간이 아니에요. {data.next_number}기 모집이 열리면 알려 드릴게요.</p>
            ))}
          <div className="flex items-center gap-6">
            <PrimaryAction place="home:summary" />
            <Link to="/quiz" className="text-[16px] font-semibold underline-offset-4 hover:underline" onClick={() => track('click', 'home:summary:quiz')}>
              수준 테스트 먼저 해 보기 →
            </Link>
          </div>
        </div>
      </div>
      <ol className="flex flex-col">
        {POINTS.map(([title, desc], i) => (
          <li key={title} data-reveal className="grid grid-cols-[56px_1fr] gap-2 border-t border-line py-8 last:border-b">
            <Mark className="pt-1.5 text-[15px]">{String(i + 1).padStart(2, '0')}</Mark>
            <div>
              <p className="text-[24px] leading-snug font-bold">{title}</p>
              <p className="mt-2 text-[17px] leading-relaxed text-muted">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/* ---------- 3. 숫자와 띠 ---------- */
function Marquee({ items, reverse, big }: { items: string[]; reverse?: boolean; big?: boolean }) {
  const loop = [...items, ...items]
  return (
    <div className="group overflow-hidden">
      <div
        className={`marquee flex w-max group-hover:[animation-play-state:paused] ${reverse ? 'animate-[marquee-r_45s_linear_infinite]' : 'animate-[marquee_45s_linear_infinite]'}`}
      >
        {loop.map((n, i) => (
          <span key={i} className="flex items-center gap-7 pr-7">
            <span className={`font-display font-extrabold whitespace-nowrap ${big ? 'text-[38px]' : 'text-[26px] text-ink/80'}`}>{n}</span>
            <span className="font-mono text-[18px] text-mark">//</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function Numbers({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  const s = data?.stats
  // 운영 DB를 막 만들어 졸업생 명단이 아직 없을 때: "0기 동안 · 0 · 0 · 0"과 빈 띠 대신 안내 한 줄 (Phase 8 빈 DB 확인)
  const none = !!s && s.alumni === 0
  return (
    <Section name="home:03-numbers">
      <div className="page flex flex-col gap-10 border-t border-line pt-22 pb-18">
        {/* 섹션 제목 (UI 체크리스트 02-3: 제목만 읽어도 무엇이 나올지 알게). 보조 줄은 다른 섹션처럼 "//" 주석 */}
        {/* 이 섹션만 가운데 정렬 (사용자 요청 2026-10-18): 숫자 세 개가 왼쪽에 몰려 오른쪽이 비어 보였다 */}
        <div className="flex flex-col items-center gap-3 text-center">
          <SectionTitle>{s && !none ? `${s.cohorts}기 동안 함께한 사람들` : '지금까지 함께한 사람들'}</SectionTitle>
          {s?.first_cohort && (
            // 읽어야 하는 정보라 줄 번호 색(mark) 대신 muted (Phase 8 접근성)
            <span className="font-mono text-[15px] text-muted">{`// ${s.first_cohort}기 → ${s.last_cohort}기 수료생과 부서`}</span>
          )}
        </div>
        {/* 숫자가 오기 전·못 받았을 때도 자리를 지켜 아래 섹션이 들썩이지 않게 한다 */}
        {!s && (
          <div className="flex min-h-[176px] items-center justify-center">
            <DataNote load={load} what="수료 숫자를" />
          </div>
        )}
        {none && <p className="text-center text-[17px] text-muted">졸업생 명단이 올라오면 함께한 기수와 수료생, 부서 수가 여기에 보여요.</p>}
        {s && !none && (
          <div data-reveal className="flex items-end justify-center">
            <div className="flex flex-col gap-1.5 pr-12">
              <CountUp value={s.cohorts} className="font-display text-[96px] leading-[0.9] font-extrabold tracking-[-0.03em]" />
              <span className="text-[17px] font-semibold">개 기수</span>
            </div>
            <div className="flex flex-col gap-1.5 border-l border-line px-12">
              <CountUp value={s.alumni} className="font-display text-[168px] leading-[0.85] font-extrabold tracking-[-0.04em]" />
              <span className="text-[17px] font-semibold">명이 수료했습니다</span>
            </div>
            <div className="flex flex-col gap-1.5 border-l border-line pl-12">
              <CountUp value={s.depts} className="font-display text-[96px] leading-[0.9] font-extrabold tracking-[-0.03em]" />
              <span className="text-[17px] font-semibold">곳의 부서가 함께</span>
            </div>
          </div>
        )}
      </div>
      {data && data.alumni_names.length > 0 && (
        <div className="relative">
          <PeekingDuck />
          {/* 이름 띠가 오리보다 앞에 있어서, 오리가 띠 뒤에서 고개를 내미는 것처럼 보인다 */}
          <div className="relative z-10 flex flex-col gap-3.5 bg-sky py-6" aria-label="졸업생 이름과 참여 부서">
            <Marquee items={data.alumni_names} big />
            <Marquee items={data.dept_names} reverse />
          </div>
        </div>
      )}
    </Section>
  )
}

// 이름 띠 뒤에서 오리가 고개만 쏙 내밀고 갸웃한 뒤 다시 들어간다 (생동감, 2026-10-19).
// 프레임은 히어로의 오리 갸웃(duck-tilt 27장, 처음과 끝이 같은 자세)을 다시 쓴다. 섹션이 보이는 동안 9초마다 한 번
const PEEK = frameUrls('duck-tilt', 27)
const PEEK_SIZE = 240 // 프레임 720 → 1/3. 머리 꼭대기가 캔버스 위에서 약 90px
const PEEK_UP = 96 // 띠 위로 올라오는 높이 (머리와 안경까지)
function PeekingDuck() {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<FrameCanvasHandle>(null)
  const [up, setUp] = useState(false)
  useEffect(() => {
    if (prefersReducedMotion()) return
    canvas.current?.draw(0)
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
    const peek = () => {
      setUp(true)
      // 올라온 뒤 갸웃 프레임을 한 번 재생하고 (초당 18장, 1.5초) 다시 들어간다
      later(() => {
        let f = 0
        const id = window.setInterval(() => {
          f += 1
          canvas.current?.draw(f)
          if (f >= PEEK.length - 1) window.clearInterval(id)
        }, 1000 / 18)
        timers.push(id)
      }, 600)
      later(() => setUp(false), 600 + 1500 + 700)
    }
    let loop = 0
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearInterval(loop)
        if (!e.isIntersecting) return
        later(peek, 700)
        loop = window.setInterval(peek, 9000)
      },
      { threshold: 0.6 },
    )
    if (box.current) io.observe(box.current.parentElement!)
    return () => {
      io.disconnect()
      window.clearInterval(loop)
      timers.forEach((t) => (window.clearTimeout(t), window.clearInterval(t)))
    }
  }, [])
  return (
    // 띠 윗변 위의 얇은 창. 오리는 창 아래에 숨어 있다가 올라온다
    <div ref={box} className="pointer-events-none absolute right-[12%] bottom-full h-[110px] w-[240px] overflow-hidden" aria-hidden>
      <div
        className="absolute left-0 transition-transform duration-500 ease-out"
        style={{ top: 110 - 90 + 8, transform: `translateY(${up ? -PEEK_UP : 0}px)` }}
      >
        <FrameCanvas ref={canvas} urls={PEEK} size={PEEK_SIZE} />
      </div>
    </div>
  )
}

/* ---------- 4. 완성작 미리보기 (가상 카드, Phase 4에서 실제 데이터로) ---------- */
export function Showcase({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  // 좋아요 많은 순 5개 (서버 /api/home의 showcase). 첫 번째는 크게, 나머지는 오른쪽 2×2
  const items = data?.showcase ?? []
  const [first, ...rest] = items
  return (
    <Section name="home:04-showcase" className="page flex flex-col gap-12 pt-34 pb-30">
      <div className="flex items-end justify-between">
        <SectionTitle>졸업생이 만든 것들</SectionTitle>
        {items.length > 0 && (
          <Link to="/projects" className="text-[17px] font-semibold underline-offset-4 hover:underline" onClick={() => track('click', 'home:showcase:all')}>
            완성작 전체 보기 →
          </Link>
        )}
      </div>
      {!data ? (
        <div className="flex min-h-[240px] items-center">
          <DataNote load={load} what="완성작을" />
        </div>
      ) : !first ? (
        // 0개 상태 (UI 체크리스트 06-2): 빈 칸 대신 곧 걸린다는 안내
        <div data-reveal>
          <EmptyState title="곧 졸업생들의 작품이 걸립니다" body="승인된 완성작이 생기면 이곳에 좋아요가 많은 순으로 보여요." />
        </div>
      ) : (
        <div className={`grid gap-x-8 gap-y-10 ${rest.length ? 'grid-cols-[1.5fr_1fr_1fr] grid-rows-[auto_auto]' : 'grid-cols-[minmax(0,860px)]'}`}>
          <div data-reveal className="row-span-2">
            <ProjectCard p={first} big place="home:showcase" />
          </div>
          {rest.map((p) => (
            <div key={p.id} data-reveal>
              <ProjectCard p={p} place="home:showcase" />
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

/* ---------- 5. 강사 소개 ---------- */
// 강사는 날개를 펴서 설명하듯 움직이고(블렌더 instructor_teach, 36장 반복), 옆 말풍선의 말이 3초마다 바뀐다.
// 말풍선이 "이 줄은 왜 필요할까요?"일 때는 고개를 갸웃한다(instructor_tilt를 2칸씩 27장, 2026-10-19).
// 설명은 날개를 든 자세, 갸웃은 내린 자세라 바로 바꾸면 날개가 튀어서 두 캔버스를 0.3초 겹쳐 넘긴다
const TEACH = frameUrls('instructor-teach', 36)
const TILT = frameUrls('instructor-tilt', 27)
const TEACH_SIZE = 667 // 캐릭터 키가 500px이 되는 캔버스 크기 (프레임 720 안에서 키 540)
const TEACH_LINES = ['// 돌아가는 코드와 맞는 코드는 달라요', '// 이 줄은 왜 필요할까요?', '// AI에게는 이렇게 물어보세요']
const TILT_LINE = 1

export function Instructor() {
  const t = VIRTUAL_INSTRUCTOR
  const box = useRef<HTMLDivElement>(null)
  const frames = useRef<FrameCanvasHandle>(null)
  const tiltFrames = useRef<FrameCanvasHandle>(null)
  const [line, setLine] = useState(0)
  const tilting = line === TILT_LINE
  useEffect(() => {
    if (!box.current) return
    if (prefersReducedMotion()) {
      frames.current?.draw(0)
      return
    }
    let timer = 0
    let i = 0
    let tick = 0
    let current = 0
    tiltFrames.current?.draw(0)
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer)
      if (!e.isIntersecting) return
      timer = window.setInterval(() => {
        const k = ++tick % 36
        if (current === TILT_LINE) tiltFrames.current?.draw(Math.min(k, TILT.length - 1)) // 27장 갸웃 뒤 남은 시간은 마지막 장면
        else frames.current?.draw((i = (i + 1) % TEACH.length))
        if (k === 0) {
          current = (current + 1) % TEACH_LINES.length
          if (current === TILT_LINE) tiltFrames.current?.draw(0)
          setLine(current) // 12장/초로 36장 = 3초
        }
      }, 1000 / 12)
    })
    io.observe(box.current)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [])
  return (
    <Section name="home:05-instructor" className="bg-sky">
      <div className="page grid grid-cols-[440px_minmax(0,1fr)] items-center gap-24 py-30">
        <div ref={box} data-reveal className="relative flex h-[516px] items-end justify-center">
          <div className="absolute bottom-3 h-[30px] w-[260px] rounded-[50%] bg-ink/15 blur-[10px]" />
          <div
            className="absolute"
            style={{ width: TEACH_SIZE, height: TEACH_SIZE, left: -76, bottom: -58, filter: CHARACTER_FILTER }}
            role="img"
            aria-label="남색 조끼를 입고 안경을 쓴 강사 백조가 날개를 펴서 설명하고 있다"
          >
            <FrameCanvas
              ref={frames}
              urls={TEACH}
              size={TEACH_SIZE}
              className="absolute inset-0 transition-opacity duration-300"
              style={{ opacity: tilting ? 0 : 1 }}
            />
            <FrameCanvas
              ref={tiltFrames}
              urls={TILT}
              size={TEACH_SIZE}
              className="absolute inset-0 transition-opacity duration-300"
              style={{ opacity: tilting ? 1 : 0 }}
            />
          </div>
          {/* 말풍선: 강사 머리 오른쪽 위 */}
          <div className="absolute top-6 left-[318px] rounded-dialog bg-surface px-4 py-3 shadow-dialog" aria-live="polite">
            <span key={line} className="block font-mono text-[14px] whitespace-nowrap text-ink motion-safe:animate-[toast-in_.3s_ease-out]">
              {TEACH_LINES[line]}
            </span>
            <span className="absolute -bottom-[7px] left-6 h-3.5 w-3.5 rotate-45 bg-surface" aria-hidden />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {/* 섹션 제목 (UI 체크리스트 02-3). 인용문은 제목 아래 한 단계 작게 */}
          <SectionTitle>가르치는 사람</SectionTitle>
          <p data-reveal className="font-display text-[34px] leading-[1.4] font-extrabold tracking-[-0.02em]">
            “{t.quote}”
          </p>
          <div data-reveal className="flex flex-col gap-1">
            <span className="text-[22px] font-bold">{t.name}</span>
            <span className="text-[17px] text-ink/75">{t.role}</span>
          </div>
          <p data-reveal className="font-mono text-[15px] text-ink/70">
            // 요청하면 직접 만날 수 있어요
          </p>
        </div>
      </div>
    </Section>
  )
}
