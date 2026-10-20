// 홈 섹션 7~10: 수준 테스트 안내 · 파트 소개 · 아이디어 보드 미리보기 · 마지막 신청 안내
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mark, Section, SectionTitle } from '../../components/Section'
import { PrimaryAction } from '../../components/TopNav'
import { VIRTUAL_PART_WORKS } from '../../data/virtual'
import { IdeaBadge } from '../../components/BoardParts'
import { EmptyState } from '../../components/EmptyState'
import { track } from '../../lib/track'
import { DataNote } from '../../components/DataNote'
import { FrameCanvas, frameUrls, type FrameCanvasHandle } from '../../components/FrameCanvas'
import { prefersReducedMotion } from '../../lib/motion'
import { SwanLogoMark } from '../../components/SwanLogo'
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

/* ---------- 9. 아이디어 보드 미리보기 ---------- */
// 공감 많은 순 3개 (서버 /api/home의 ideas). 0개면 첫 아이디어를 부르는 안내, 3개보다 적으면 남은 자리에 남기러 가는 줄 (UI 체크리스트 06-2·06-3)
export function IdeasPreview({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  const items = data?.ideas ?? []
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
        {!data ? (
          <div className="flex min-h-[200px] items-center border-t border-line">
            <DataNote load={load} what="아이디어를" />
          </div>
        ) : items.length === 0 ? (
          <div data-reveal>
            <EmptyState
              title="아직 남겨진 아이디어가 없어요"
              body="매주 손으로 반복하는 일이 있다면 첫 번째로 남겨 주세요."
              action={
                <Link to="/ideas" onClick={() => track('click', 'home:ideas:first')} className="text-[16px] font-semibold underline underline-offset-4">
                  첫 아이디어 남기기 →
                </Link>
              }
            />
          </div>
        ) : (
          <ol className="flex flex-col">
            {items.map((idea) => (
              <li key={idea.id} data-reveal className="border-b border-line first:border-t">
                <Link
                  to="/ideas"
                  onClick={() => track('click', `home:ideas:${idea.id}`)}
                  className="group grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-6 py-6"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-display text-[34px] leading-none font-extrabold">{idea.votes}</span>
                    <span className={`font-mono text-[12px] ${idea.voted ? 'font-semibold text-ink' : 'text-muted'}`}>
                      {idea.voted ? '✓ 나도 공감' : '공감'}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-[20px] font-bold group-hover:underline group-hover:underline-offset-4">{idea.title}</span>
                    <span className="truncate text-[16px] text-muted">{idea.reply ? `↳ IPS 파트: ${idea.reply}` : idea.description}</span>
                  </div>
                  <IdeaBadge status={idea.status} label={idea.status_label} />
                </Link>
              </li>
            ))}
            {items.length < 3 && (
              // 1~2개일 때 빈 자리를 남기러 가는 줄로 (목록이 끊겨 보이지 않게)
              <li data-reveal className="border-b border-dashed border-dash">
                <Link
                  to="/ideas"
                  onClick={() => track('click', 'home:ideas:more')}
                  className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-6 py-6 text-muted hover:text-ink"
                >
                  <span className="font-display text-[34px] leading-none font-extrabold text-line">+</span>
                  <span className="text-[17px] font-semibold">비슷한 불편이 있다면 아이디어를 더 남겨 주세요 →</span>
                </Link>
              </li>
            )}
          </ol>
        )}
      </div>
    </Section>
  )
}

/* ---------- 10. 마지막 신청 안내 ---------- */
// 어린 백조가 날개를 펴고 날아오른다 (Higgsfield Kling O3로 만든 5초 영상 → 배경 제거 → 투명 프레임 61장, 원본 design/fly/)
// 섹션이 보이면 한 번만: 날아오름 → 꼭대기에서 머리 위에 `>_ SWAN` 로고 → 공중 날갯짓 두 번 → 같은 장면을 거꾸로 돌려 내려앉음
// (계속 떠 있으면 날다가 실패하는 것처럼 보인다는 의견, 2026-10-19). 로고는 하늘에 남는다
const FLY = frameUrls('cygnet-fly', 61)
const FLY_FPS = 16
const HOVER_FROM = 44 // 이 장면부터 끝까지가 공중에서 날갯짓하는 구간
const FLY_LAST = FLY.length - 1
const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.floor(Math.abs(to - from) / step) + 1 }, (_, i) => from + (to > from ? i : -i) * step)
// 장면 순서: 날아오름 0→60 · 날갯짓 60→44→60 한 번 · 내려앉음 60→0(한 장씩 건너뛰어 빠르게). 모두 약 8초
// (처음엔 초당 12장·날갯짓 두 번·한 장씩 내려와 약 15초였는데 너무 길다는 의견, 2026-10-19)
const FLY_SEQ = [
  ...range(0, FLY_LAST),
  ...range(FLY_LAST - 1, HOVER_FROM),
  ...range(HOVER_FROM + 1, FLY_LAST),
  ...range(FLY_LAST - 2, 0, 2),
]

function FlyingCygnet() {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<FrameCanvasHandle>(null)
  const [logo, setLogo] = useState(false)
  useEffect(() => {
    canvas.current?.draw(0)
    if (prefersReducedMotion()) {
      setLogo(true) // 움직임 줄이기: 서 있는 장면 + 로고로 끝 상태를 바로 보여 준다
      return
    }
    let timer = 0
    let step = 0
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearInterval(timer)
        if (!e.isIntersecting || step >= FLY_SEQ.length) return
        timer = window.setInterval(() => {
          step += 1
          if (step >= FLY_SEQ.length) return window.clearInterval(timer)
          if (step === FLY_LAST) setLogo(true) // 꼭대기에 닿는 순간
          canvas.current?.draw(FLY_SEQ[step])
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
    <div ref={box} className="pointer-events-none relative -mb-24 self-end" aria-hidden>
      {/* 꼭대기 장면의 머리 위 (캔버스 윗변 바로 위) */}
      <div
        className="absolute bottom-full left-1/2 mb-1 transition-all duration-500 ease-out"
        style={{
          transform: `translateX(-50%) translateY(${logo ? 0 : 16}px) scale(${logo ? 1 : 0.6})`,
          opacity: logo ? 1 : 0,
        }}
      >
        <SwanLogoMark onInk />
      </div>
      <FrameCanvas ref={canvas} urls={FLY} size={440} />
    </div>
  )
}

export function FinalCta({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  const r = data?.recruit
  return (
    <Section name="home:10-final" className="bg-ink text-white">
      <div className="page grid grid-cols-[minmax(0,1fr)_440px] items-end gap-12 pt-32 pb-24">
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
