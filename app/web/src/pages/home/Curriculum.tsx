// 홈 섹션 6: 커리큘럼. 배우는 흐름 4단계 + 실습 프로젝트 모음(중심) + 목표·수강 안내·맞는 사람
// 내용은 planning/v3-1013/curriculum.md (실제 4기 자료 + 5기 바이브코딩 단원 잠정안)
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Mark, Placeholder, Section, SectionTitle } from '../../components/Section'
import { prefersReducedMotion } from '../../lib/motion'
import { track } from '../../lib/track'
import { DataNote } from '../../components/DataNote'
import type { HomeData, HomeLoad, PracticeProject, Unit } from './types'

const STAGES = [
  { n: 4, mark: '④', name: 'AI와 함께 만들기', summary: '' },
  { n: 3, mark: '③', name: '만들기', summary: '실습 프로젝트 11개 — 아래에서 미리 볼 수 있어요' },
  { n: 2, mark: '②', name: '깊어지기', summary: '파이썬 고급 개념 · 알고리즘 기초(재귀 함수) · 객체지향과 디자인 패턴' },
  { n: 1, mark: '①', name: '다지기', summary: '파이썬 환경 구성(윈도우) · 함수 활용법(map/reduce)' },
]

const TOPICS = ['재귀와 파싱', '탐색 알고리즘', '아키텍처 (MVP)', '객체지향·함수형', '수학과 시각화', '우리 업무와 닿는 과제']

export function Curriculum({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  return (
    <Section name="home:06-curriculum" id="curriculum" className="page flex scroll-mt-24 flex-col gap-30 pt-36 pb-32">
      <Stages units={data?.units ?? []} load={load} />
      {data ? (
        <Projects projects={data.projects} />
      ) : (
        // 실습 프로젝트 모음 자리: 오기 전·못 받았을 때도 자리를 지킨다
        <div className="flex min-h-[320px] flex-col justify-center gap-3 rounded-card border border-dashed border-dash px-10">
          <p className="font-display text-[28px] font-extrabold">실습 프로젝트 11개</p>
          <DataNote load={load} what="실습 프로젝트를" />
        </div>
      )}
      <Facts />
    </Section>
  )
}

/* ---------- 배우는 흐름 4단계 ---------- */
function Stages({ units, load }: { units: Unit[]; load: HomeLoad }) {
  const [open, setOpen] = useState<number>(4)
  const [openUnit, setOpenUnit] = useState<number | null>(null)
  const byStage = (n: number) => units.filter((u) => u.stage === n && !u.title.startsWith('참고'))
  const note = units.find((u) => u.title.startsWith('참고'))

  const toggle = (n: number) => {
    setOpen((o) => (o === n ? 0 : n))
    setOpenUnit(null)
    track('click', `home:curriculum:stage-${n}`)
  }

  // 단계 등장 (구현 전달 4장 움직임 표): ①부터 아래에서 위로 0.1초 간격으로 쌓이고, ④는 위에서 내려와 얹힌다.
  // 섹션 공통 등장([data-reveal])은 위에서부터 차례로 올라와서 이 순서가 거꾸로 보였다
  const stack = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion() || !stack.current) return
      const items = [...stack.current.querySelectorAll<HTMLElement>('[data-stage]')]
      const lower = items.filter((el) => el.dataset.stage !== '4').reverse() // ① ② ③ 순서
      const top = items.find((el) => el.dataset.stage === '4')
      // 도착 값을 못 박는다(fromTo): from만 쓰면 다시 실행될 때 움직이던 중간 값을 도착 값으로 잡아 반쯤 투명한 채 멈췄다
      const tl = gsap.timeline({ scrollTrigger: { trigger: stack.current, start: 'top 78%', once: true } })
      tl.fromTo(lower, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.1 })
      if (top) tl.fromTo(top, { y: -32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, '-=0.1')
    },
    { scope: stack },
  )

  return (
    <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-18">
      <div className="flex flex-col gap-5">
        <SectionTitle>
          3개월 동안
          <br />
          배우는 것
        </SectionTitle>
        <p data-reveal className="text-[18px] leading-relaxed text-ink/80">
          이론 5단원과 실습 프로젝트 11개.
          <br />
          아래 세 단계 위에 AI와 함께 만들기가 얹힙니다.
        </p>
      </div>
      <div ref={stack} className="flex flex-col">
        {STAGES.map((s) => {
          const isOpen = open === s.n
          const list = byStage(s.n)
          if (s.n === 4) {
            return (
              <div key={s.n} data-stage={s.n} className="mb-3 flex flex-col gap-6 rounded-dialog bg-sky px-9 py-8">
                <button className="flex items-center gap-4 text-left" onClick={() => toggle(4)} aria-expanded={isOpen}>
                  <span className="font-mono text-[15px] text-ink/70">④</span>
                  <span className="font-display text-[30px] font-extrabold">AI와 함께 만들기</span>
                  <span className="rounded-badge bg-ink px-2.5 py-1 text-[13px] font-bold text-white">5기 신설</span>
                  <span className="ml-auto font-mono text-[13px] text-ink/70">{isOpen ? '접기 ↑' : '펼치기 ↓'}</span>
                </button>
                {isOpen && <DataNote load={load} what="단원을" />}
                {isOpen && (
                  <>
                    <ol className="grid grid-cols-2 gap-x-10 gap-y-1">
                      {list.map((u, i) => (
                        <UnitItem key={u.id} unit={u} num={`4.${i + 1}`} open={openUnit === u.id} onToggle={() => setOpenUnit(openUnit === u.id ? null : u.id)} />
                      ))}
                    </ol>
                    {note && (
                      <p className="border-t border-ink/15 pt-4 text-[14px] text-ink/70">
                        <span className="font-mono">참고</span> · {note.title.replace('참고 · ', '')} — {note.content}
                      </p>
                    )}
                  </>
                )}
              </div>
            )
          }
          return (
            <div key={s.n} data-stage={s.n} className={`border-t border-line ${s.n === 1 ? 'border-b' : ''}`}>
              <button
                className="grid w-full grid-cols-[40px_180px_minmax(0,1fr)_auto] items-baseline px-9 py-6 text-left text-[17px] leading-relaxed hover:bg-sky/30"
                onClick={() => toggle(s.n)}
                aria-expanded={isOpen}
              >
                <span className="font-mono text-[15px] text-mark">{s.mark}</span>
                <span className="text-[22px] font-bold">{s.name}</span>
                <span className="text-ink/75">{s.summary}</span>
                <span className="pl-4 font-mono text-[13px] text-muted">{s.n === 3 ? '' : isOpen ? '↑' : '↓'}</span>
              </button>
              {isOpen && s.n === 3 && (
                <p className="px-9 pb-6 pl-[256px] text-[16px] text-muted">
                  실습 프로젝트는 바로 아래 "모든 실습은 무엇을 만들지 미리 보여 드려요"에서 하나씩 열어 볼 수 있어요.
                </p>
              )}
              {isOpen && list.length > 0 && (
                <ol className="flex flex-col gap-1 px-9 pb-6 pl-[256px]">
                  {list.map((u, i) => (
                    <UnitItem key={u.id} unit={u} num={`${s.n}.${i + 1}`} open={openUnit === u.id} onToggle={() => setOpenUnit(openUnit === u.id ? null : u.id)} />
                  ))}
                </ol>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UnitItem({ unit, num, open, onToggle }: { unit: Unit; num: string; open: boolean; onToggle: () => void }) {
  return (
    <li>
      <button className="flex w-full items-baseline gap-3.5 py-1.5 text-left text-[18px] leading-normal hover:underline underline-offset-4" onClick={onToggle} aria-expanded={open}>
        <span className="font-mono text-[13px] text-muted">{num}</span>
        {unit.title}
      </button>
      {open && (
        <ul className="mb-2 ml-[42px] flex flex-col gap-1 text-[15px] leading-relaxed text-ink/75">
          {unit.content.split('\n').map((line) => (
            <li key={line}>— {line}</li>
          ))}
        </ul>
      )}
    </li>
  )
}

/* ---------- 실습 프로젝트 모음 (이 섹션의 중심) ---------- */
function Projects({ projects }: { projects: PracticeProject[] }) {
  const [topic, setTopic] = useState<string | null>(null)
  const filtered = useMemo(() => (topic ? projects.filter((p) => p.topic === topic) : projects), [projects, topic])
  const [selected, setSelected] = useState<number>(projects[0]?.id)
  const [fading, setFading] = useState(false)
  const featureRef = useRef<HTMLDivElement>(null)

  // 필터를 바꾸면 고른 프로젝트가 목록 안에 있게 한다
  useEffect(() => {
    if (!filtered.some((p) => p.id === selected) && filtered[0]) setSelected(filtered[0].id)
  }, [filtered, selected])

  const pickTopic = (t: string | null) => {
    setFading(true)
    setTimeout(() => {
      setTopic(t)
      setFading(false)
    }, 150)
    track('click', `home:projects:topic:${t ?? '전체'}`)
  }
  const pick = (id: number) => {
    setSelected(id)
    track('click', `home:projects:open:${id}`)
    featureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const feature = filtered.find((p) => p.id === selected) ?? filtered[0]
  const others = filtered.filter((p) => p.id !== feature?.id)

  return (
    <div className="flex flex-col gap-10">
      <SectionTitle as="h3" className="max-w-[1000px]">
        모든 실습은 무엇을 만들지
        <br />
        미리 보여 드려요
      </SectionTitle>
      <div data-reveal className="flex flex-wrap gap-2 text-[15px] font-semibold" role="group" aria-label="주제로 거르기">
        <Chip active={topic === null} onClick={() => pickTopic(null)}>
          전체 {projects.length}
        </Chip>
        {TOPICS.map((t) => (
          <Chip key={t} active={topic === t} onClick={() => pickTopic(t)}>
            {t} <span className="font-mono text-[13px] opacity-70">{projects.filter((p) => p.topic === t).length}</span>
          </Chip>
        ))}
      </div>

      <div className={`flex flex-col gap-10 transition-opacity duration-150 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        {feature && (
          <div ref={featureRef} className="grid scroll-mt-28 grid-cols-[1.5fr_1fr] gap-12 rounded-dialog border border-line bg-surface p-8">
            <Preview project={feature} className="h-[420px]" />
            <div className="flex flex-col gap-5 pt-2">
              <Mark className="text-muted"># {feature.topic}</Mark>
              <span className="font-display text-[34px] leading-snug font-extrabold">{feature.title}</span>
              <p className="text-[18px] leading-relaxed text-ink/80">{feature.one_liner}</p>
              <div className="flex flex-col gap-2 border-t border-line pt-4 text-[16px] leading-relaxed">
                <span className="font-bold">이 과제로 하는 것</span>
                {feature.detail.split('\n').map((line) => (
                  <span key={line}>— {line}</span>
                ))}
              </div>
              <p className="mt-auto font-mono text-[13px] text-muted">// 기르는 힘: {feature.skill}</p>
            </div>
          </div>
        )}
        {others.length > 0 && (
          <div className="grid grid-cols-4 gap-x-7 gap-y-10">
            {others.map((p, i) => (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                className={`group flex flex-col gap-2.5 text-left ${i === 0 && others.length > 4 ? 'col-span-2' : ''}`}
              >
                <Preview project={p} className="h-[200px] transition-transform duration-200 group-hover:-translate-y-1" />
                <Mark className="text-[12px] text-muted"># {p.topic}</Mark>
                <span className="text-[19px] font-bold group-hover:underline underline-offset-4">{p.title}</span>
                <span className="text-[15px] leading-relaxed text-ink/75">{p.one_liner}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[8px] px-4 py-2.5 transition-colors ${active ? 'bg-ink text-white' : 'bg-[#eef1f5] hover:bg-sky'}`}
    >
      {children}
    </button>
  )
}

/** 미리보기: 영상이 있으면 마우스를 올릴 때 재생, 없으면 그림, 둘 다 없으면 자리 그림 */
function Preview({ project, className }: { project: PracticeProject; className: string }) {
  if (project.preview_video) {
    return (
      <video
        src={project.preview_video}
        poster={project.preview_image ?? undefined}
        muted
        loop
        playsInline
        className={`w-full rounded-btn object-cover ${className}`}
        onMouseEnter={(e) => e.currentTarget.play()}
        onMouseLeave={(e) => e.currentTarget.pause()}
      />
    )
  }
  if (project.preview_image) return <img src={project.preview_image} alt="" className={`w-full rounded-btn object-cover ${className}`} />
  return <Placeholder label={`미리보기 영상 자리 · ${project.title}`} className={`w-full rounded-btn ${className}`} />
}

/* ---------- 목표 · 수강 안내 · 맞는 사람 ---------- */
function Facts() {
  const cols = [
    { title: '교육 목표', items: ['부서에 필요한 SW를 직접 만든다', '실습 위주로 만드는 힘을 기른다', '다시 쓸 수 있는 SW를 짠다'] },
    { title: '수강 안내', items: ['목·금 중 주 1회 1시간 30분', '온라인 강의', '복습과 실습까지 주 3~4시간'] },
    { title: '이런 분께 맞아요', items: ['업무를 자동화하고 싶은 의지가 높은 분', '부서에서 SW 인력으로 키울 분', '주 3~4시간을 낼 수 있는 분'] },
  ]
  return (
    <div className="grid grid-cols-[1.2fr_0.8fr_1fr] gap-14 border-t border-ink pt-10 text-[17px] leading-relaxed">
      {cols.map((c) => (
        <div key={c.title} data-reveal className="flex flex-col gap-3.5">
          <span className="text-[20px] font-bold">{c.title}</span>
          {c.items.map((i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
      ))}
    </div>
  )
}
