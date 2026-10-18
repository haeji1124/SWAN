// 홈 섹션 7~10: 수준 테스트 안내 · 파트 소개 · 아이디어 보드 미리보기 · 마지막 신청 안내
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mark, Section, SectionTitle } from '../../components/Section'
import { PrimaryAction } from '../../components/TopNav'
import { VIRTUAL_IDEAS, VIRTUAL_PART_WORKS } from '../../data/virtual'
import { track } from '../../lib/track'
import { DataNote } from '../../components/DataNote'
import { FrameCanvas, frameUrls, type FrameCanvasHandle } from '../../components/FrameCanvas'
import { prefersReducedMotion } from '../../lib/motion'
import { dLabel, type HomeData, type HomeLoad } from './types'

/* ---------- 7. 수준 테스트 안내 ---------- */
// idle: 평소 움직임 (알은 뒤뚱, 오리·백조는 숨쉬듯 들썩). 박자를 서로 다르게 해서 따로 살아 있는 느낌을 준다
const STAGE_PICS = [
  {
    src: '/images/stage-1.webp',
    name: '알에서 나온 오리',
    h: 'h-[170px]',
    idle: 'motion-safe:animate-[wobble_1.6s_ease-in-out_infinite]',
  },
  {
    src: '/images/stage-2.webp',
    name: '아기 오리',
    h: 'h-[220px]',
    idle: 'motion-safe:animate-[breathe_2.4s_ease-in-out_infinite]',
  },
  {
    src: '/images/stage-3.webp',
    name: '어린 백조',
    h: 'h-[290px]',
    idle: 'motion-safe:animate-[breathe_3.1s_ease-in-out_.4s_infinite]',
  },
]

/** 성장 단계 캐릭터 하나. 섹션에 들어오면 차례로 한 번 콩 뛰고, 마우스를 올리면 다시 뛴다 */
function StageChar({ pic, index, entered }: { pic: (typeof STAGE_PICS)[number]; index: number; entered: boolean }) {
  const [hop, setHop] = useState(false)
  useEffect(() => {
    if (!entered) return
    const id = window.setTimeout(() => setHop(true), 250 + index * 180)
    return () => window.clearTimeout(id)
  }, [entered, index])
  return (
    <div className="origin-bottom motion-reduce:animate-none" onMouseEnter={() => setHop(true)}>
      <div
        className={`origin-bottom motion-reduce:animate-none ${hop ? 'motion-safe:animate-[hop_.55s_cubic-bezier(.3,.7,.2,1)]' : ''}`}
        onAnimationEnd={() => setHop(false)}
      >
        <img src={pic.src} alt={pic.name} className={`${pic.h} origin-bottom ${pic.idle}`} />
      </div>
    </div>
  )
}

export function QuizTeaser() {
  const row = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!row.current) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setEntered(true), { threshold: 0.4 })
    io.observe(row.current)
    return () => io.disconnect()
  }, [])
  return (
    <Section name="home:07-quiz" className="page grid grid-cols-[0.9fr_1.1fr] items-end gap-18 border-t border-line py-30">
      <div className="flex flex-col gap-6 pb-6">
        <SectionTitle>
          3분이면 내 수준을
          <br />알 수 있어요
        </SectionTitle>
        <p data-reveal className="max-w-[440px] text-[18px] leading-relaxed text-ink/80">
          문제 6개. 마지막 문제는 AI가 고친 코드에서 틀린 줄을 찾는 거예요. 결과는 바로 나오고, 신청한 분은 결과와 상관없이 모두 수강할 수 있어요.
        </p>
        <div data-reveal>
          <Link
            to="/quiz"
            onClick={() => track('click', 'home:quiz:start')}
            className="inline-flex rounded-btn bg-sky px-[26px] py-[13px] text-[16px] font-bold hover:bg-sky-hover active:bg-sky-press"
          >
            테스트 시작하기
          </Link>
        </div>
      </div>
      <div ref={row} className="flex items-end justify-around border-b border-line">
        {STAGE_PICS.map((s, i) => (
          <figure key={s.name} data-reveal className="flex flex-col items-center gap-3 pb-5">
            <StageChar pic={s} index={i} entered={entered} />
            <figcaption className="flex items-baseline gap-2 text-[16px] font-semibold">
              <Mark>{i + 1}</Mark>
              {s.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}

/* ---------- 8. 파트 소개 ---------- */
export function PartIntro() {
  return (
    <Section name="home:08-part" className="page flex flex-col gap-16 border-t border-line pt-34 pb-32">
      <div className="flex items-end justify-between gap-12">
        <SectionTitle className="max-w-[900px]">
          SWAN을 운영하는 Design Technology팀 IPS 파트는 현업에 필요한 <span className="rounded-btn bg-sky px-2">웹과 툴</span>을 만듭니다.
        </SectionTitle>
        <Link
          to="/ideas"
          data-reveal
          onClick={() => track('click', 'home:part:idea')}
          className="shrink-0 rounded-btn bg-sky px-[26px] py-[13px] text-[16px] font-bold hover:bg-sky-hover"
        >
          아이디어 남기기
        </Link>
      </div>
      <ol className="grid grid-cols-3 border-t border-ink">
        {VIRTUAL_PART_WORKS.map((w, i) => (
          <li key={w.title} data-reveal className={`flex flex-col gap-3 py-8 pr-10 ${i > 0 ? 'border-l border-line pl-10' : ''}`}>
            <Mark>{String(i + 1).padStart(2, '0')}</Mark>
            <span className="text-[24px] font-bold">{w.title}</span>
            <span className="text-[17px] text-ink/80">{w.desc}</span>
            <span className="font-mono text-[13px] text-muted">// {w.who}</span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/* ---------- 9. 아이디어 보드 미리보기 (가상, Phase 5에서 실제 데이터로) ---------- */
export function IdeasPreview() {
  return (
    <Section name="home:09-ideas" className="page grid grid-cols-[500px_minmax(0,1fr)] gap-18 border-t border-line py-30">
      <div className="flex flex-col gap-6">
        <SectionTitle>
          부서장님께 말하긴
          <br />
          애매한 작은 불편,
          <br />
          여기 남겨 주세요
        </SectionTitle>
      </div>
      {/* '전체 보기' 링크는 목록 바로 위 오른쪽 끝 (④ 완성작과 같은 규칙, UI 체크리스트 04-8) */}
      <div className="flex flex-col gap-5">
        <Link
          to="/ideas"
          data-reveal
          onClick={() => track('click', 'home:ideas:all')}
          className="self-end text-[17px] font-semibold underline-offset-4 hover:underline"
        >
          아이디어 보드 보기 →
        </Link>
        <ol className="flex flex-col">
          {VIRTUAL_IDEAS.map((idea) => (
            <li
              key={idea.title}
              data-reveal
              className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-6 border-b border-line py-6 first:border-t"
            >
              <div className="flex flex-col items-start">
                <span className="font-display text-[34px] leading-none font-extrabold">{idea.votes}</span>
                <span className="font-mono text-[12px] text-muted">공감</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[20px] font-bold">{idea.title}</span>
                <span className="text-[16px] text-muted">{idea.desc}</span>
              </div>
              <StatusBadge status={idea.status} />
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === '만드는 중' ? 'bg-success-bg text-success' : status === '검토 중' ? 'bg-sky text-ink' : 'bg-disabled text-muted'
  return <span className={`rounded-badge px-2.5 py-1 text-[13px] font-bold ${tone}`}>{status}</span>
}

/* ---------- 10. 마지막 신청 안내 ---------- */
// 어린 백조가 날개를 펴고 날아오른다 (Higgsfield Kling O3로 만든 5초 영상 → 배경 제거 → 투명 프레임 61장, 원본 design/fly/)
// 섹션이 보이면 한 번 날아오르고, 그 뒤에는 마지막 구간(공중에서 날갯짓)을 앞뒤로 오가며 계속 날갯짓한다
const FLY = frameUrls('cygnet-fly', 61)
const FLY_FPS = 12
const HOVER_FROM = 44 // 이 장면부터 끝까지가 공중에서 날갯짓하는 구간

function FlyingCygnet() {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<FrameCanvasHandle>(null)
  useEffect(() => {
    const last = FLY.length - 1
    if (prefersReducedMotion()) {
      canvas.current?.draw(last) // 움직임 줄이기: 날개를 편 마지막 장면으로 멈춰 둔다
      return
    }
    canvas.current?.draw(0)
    let timer = 0
    let f = 0
    let dir = 1
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearInterval(timer)
        if (!e.isIntersecting) return
        timer = window.setInterval(() => {
          f += dir
          if (f >= last) dir = -1 // 끝에 닿으면 날갯짓 구간을 거꾸로
          else if (dir < 0 && f <= HOVER_FROM) dir = 1
          canvas.current?.draw(f)
        }, 1000 / FLY_FPS)
      },
      { threshold: 0.35 },
    )
    if (box.current) io.observe(box.current)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [])
  return (
    <div ref={box} className="pointer-events-none -mb-24 self-end" aria-hidden>
      <FrameCanvas ref={canvas} urls={FLY} size={440} />
    </div>
  )
}

export function FinalCta({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  const r = data?.recruit
  return (
    <Section name="home:10-final" className="bg-ink text-white">
      <div className="page grid grid-cols-[minmax(0,1fr)_440px] items-end gap-12 pt-24 pb-24">
        <div className="flex flex-col gap-10 pb-8">
          {/* 마무리 강조: 섹션 제목 중 이곳만 64px (SectionTitle 주석의 예외) */}
          <h2 data-reveal className="font-display text-[64px] leading-[1.25] font-extrabold tracking-[-0.03em]">
            AI가 짠 코드,
            <br />
            이제 직접 판단해 보세요.
          </h2>
          <div data-reveal className="flex items-center gap-8">
            <PrimaryAction place="home:final" inverse />
            {r ? (
              <span className="font-mono text-[15px] text-white/80">
                {r.number}기 모집 마감 · {r.recruit_end_label} · {dLabel(r.days_left)} · 개강 {r.start_label}
              </span>
            ) : data ? (
              <span className="text-[16px] text-white/80">{data.next_number}기 모집이 열리면 알려 드릴게요</span>
            ) : (
              <DataNote load={load} what="모집 정보를" tone="ink" />
            )}
          </div>
        </div>
        <FlyingCygnet />
      </div>
      <div className="border-t border-white/15">
        <div className="page flex items-center justify-between py-7 text-[15px] text-white/70">
          <Link
            to="/making"
            onClick={() => track('click', 'home:final:making')}
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            이 사이트는 바이브코딩으로 만들었습니다 →
          </Link>
          <span className="font-mono text-[13px]">SWAN · Design Technology팀 IPS 파트</span>
        </div>
      </div>
    </Section>
  )
}
