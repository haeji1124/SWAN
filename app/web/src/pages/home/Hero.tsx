// 홈 섹션 1: 인트로(히어로). 스크롤하는 동안 화면에 머물고, 오리가 어린 백조로 변신한다.
// 캐릭터는 그림 프레임(기본) 또는 3D로 띄운다. 둘 다 같은 스크롤 진행값(0~1)을 받는다.
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FrameCanvas, frameUrls, type FrameCanvasHandle } from '../../components/FrameCanvas'
import { Section } from '../../components/Section'
import { Confetti, type ConfettiHandle } from '../../components/Confetti'
import { getHeroMode, getMorphMode, webglAvailable } from '../../lib/heroMode'
import { prefersReducedMotion } from '../../lib/motion'
import { DataNote } from '../../components/DataNote'
import { dLabel, type HomeData, type HomeLoad } from './types'

const Hero3D = lazy(() => import('./Hero3D'))

/** 스크롤 진행값을 구독하는 작은 저장소 (값이 바뀔 때마다 리렌더하지 않으려고) */
export type Progress = { get: () => number; subscribe: (fn: (p: number) => void) => () => void }
function createProgress(): Progress & { set: (p: number) => void } {
  let value = 0
  const subs = new Set<(p: number) => void>()
  return {
    get: () => value,
    set: (p) => {
      value = p
      subs.forEach((f) => f(p))
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
/** 스크롤 구간: 0.06~0.86에서 변신한다 */
export const transformAmount = (p: number) => clamp01((p - 0.06) / 0.8)
const MORPH = getMorphMode()
/** pop 연출에서 오리가 백조로 바뀌는 지점 (변신 정도 0~1 중) */
const POP_AT = 0.64
const isGrown = (a: number, pop: boolean) => (pop ? a >= POP_AT : a > 0.97)
/* pop 연출의 순서 (변신 정도 a 기준). 귓속말을 넉넉히 보도록 히어로 고정 구간을 340vh로 늘렸다
 * 0.04~0.18 강사가 오리 쪽으로 기울어 날개로 부리를 가린다 (귓속말)
 * 0.10~0.22 오리가 고개를 갸웃하며 듣는다
 * 0.16~POP_AT 강사 부리에서 오리 머리로 커리큘럼 용어 꼬리표가 흘러 들어간다 (지식 주입)
 * 0.52~POP_AT 오리가 움츠린다 → POP_AT 컨페티와 함께 어린 백조로 → ~0.76 강사가 다시 바로 선다
 * GREET_AT 이후 처음 들어오면 어린 백조가 손을 두 번 흔들고, 강사는 눈웃음을 짓는다 */
const WHISPER_FROM = 0.16
const SQUASH_FROM = 0.52
const GREET_AT = 0.78
const leanAt = (a: number) => (a < POP_AT ? clamp01((a - 0.04) / 0.14) : 1 - clamp01((a - POP_AT) / 0.12))
const tiltAt = (a: number) => clamp01((a - 0.1) / 0.12)
const isWhispering = (a: number) => a >= WHISPER_FROM && a < POP_AT

export function Hero({ data, load }: { data: HomeData | null; load: HomeLoad }) {
  const reduced = prefersReducedMotion()
  const [mode] = useState(() => (getHeroMode() === '3d' && webglAvailable() ? '3d' : 'frames'))
  const pop = mode === 'frames' && MORPH === 'pop'
  const outer = useRef<HTMLDivElement>(null)
  const progress = useRef(createProgress()).current
  const [done, setDone] = useState(false) // 변신을 마쳤는지 (문구용)
  const [started, setStarted] = useState(false)
  const [logo, setLogo] = useState(false)
  const [whisper, setWhisper] = useState(false)

  useEffect(() => {
    if (reduced || !outer.current) return
    const st = ScrollTrigger.create({
      trigger: outer.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.set(self.progress)
        setStarted(self.progress > 0.03)
        const a = transformAmount(self.progress)
        setDone(isGrown(a, pop))
        setWhisper(pop && a >= 0.08 && a < POP_AT)
        // 목이 길어지기 시작하면(pop은 백조로 바뀌면) 머리 위에 로고가 뜬다
        setLogo(pop ? a >= POP_AT : a > 0.45)
      },
    })
    return () => st.kill()
  }, [reduced, progress, pop])

  return (
    <Section name="home:01-intro" className="relative">
      <div ref={outer} style={{ height: reduced ? 'auto' : pop ? '340vh' : '260vh' }}>
        <div className={`${reduced ? '' : 'sticky top-[88px]'} h-[max(680px,calc(100vh-88px))] overflow-hidden`}>
          <div className="page grid h-full grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] items-center">
            <div className="relative pb-10">
              <div className="absolute top-0 -left-14 flex w-8 flex-col text-right font-mono text-[13px] leading-[98px] text-disabled-ink" aria-hidden>
                <span>01</span>
                <span>02</span>
                <span>03</span>
                <span>04</span>
              </div>
              <h1 className="font-display text-[76px] leading-[98px] font-extrabold tracking-[-0.03em]">
                <span className="block">날개는 AI가</span>
                <span className="block">달아 줍니다.</span>
                <span className="block">
                  <span className="relative -ml-2.5 px-2.5">
                    <span
                      className="absolute inset-0 -z-10 origin-left rounded-btn bg-sky transition-transform duration-500"
                      style={{ transform: `scaleX(${reduced || done || !started ? 1 : 0.15})` }}
                    />
                    나는 법
                  </span>
                  은
                </span>
                <span className="block">여기서 배웁니다.</span>
              </h1>
              {/* 모집 상태: 메일로 들어온 사람이 가장 먼저 궁금한 '지금 받는지 · 언제까지'를 첫 화면에 둔다
                  (UI 체크리스트 01-6 · 02-6). 주 버튼은 상단 메뉴 하나만 두는 규칙이라 여기에는 버튼을 더하지 않는다 */}
              <div className="mt-9 h-[34px]">
                <DataNote load={load} what="모집 정보를" className="pt-1.5" />
                {data &&
                  (data.recruit ? (
                    <p className="flex items-baseline gap-3 text-[18px]">
                      <span className="rounded-badge bg-sky px-2.5 py-1 font-semibold">{data.recruit.number}기 모집 중</span>
                      <span className="font-mono text-[15px]">
                        마감 {dLabel(data.recruit.days_left)} · {data.recruit.recruit_end_label} · 개강 {data.recruit.start_label}
                      </span>
                    </p>
                  ) : (
                    <p className="text-[17px] text-muted">지금은 모집 기간이 아니에요. {data.next_number}기 모집이 열리면 알려 드릴게요.</p>
                  ))}
              </div>
              <p className="mt-5 h-6 font-mono text-[15px] text-muted transition-opacity duration-300">
                {done
                  ? '// 3개월 뒤, 날개를 단 나'
                  : whisper
                    ? '// 강사가 비법을 속삭이는 중…'
                    : started
                      ? '// 자라는 중…'
                      : '// 스크롤하면 오리가 자라요 ↓'}
              </p>
            </div>
            <Stage>
              {mode === '3d' ? (
                <Suspense fallback={<FrameStage progress={progress} reduced={reduced} />}>
                  <Hero3D progress={progress} reduced={reduced} />
                </Suspense>
              ) : (
                <FrameStage progress={progress} reduced={reduced} />
              )}
              <SwanLogo show={logo} />
              {/* 이름표는 연못 아래에 둬서 자란 백조를 가리지 않게 한다 */}
              <span className="absolute bottom-[4px] left-[330px] -translate-x-1/2 font-mono text-[15px] whitespace-nowrap text-muted">
                {done ? '// 3개월 뒤의 나' : '// 5기의 나'}
              </span>
              <span className="absolute bottom-[4px] left-[625px] -translate-x-1/2 font-mono text-[15px] whitespace-nowrap text-muted">// 강사</span>
            </Stage>
          </div>
          {!reduced && (
            <span
              className={`absolute bottom-6 left-1/2 font-mono text-[13px] text-muted transition-opacity duration-300 motion-safe:animate-[bob_2s_ease-in-out_infinite] ${started ? 'opacity-0' : 'opacity-100'}`}
            >
              아래로 스크롤 ↓
            </span>
          )}
        </div>
      </div>
    </Section>
  )
}

/* ---------- 캐릭터 무대 ----------
 * 860×760 크기로 설계한 무대를 오른쪽 단의 크기에 맞춰 통째로 줄인다 (창이 좁아도 잘리지 않게).
 * 무대 안 좌표: 오리 중심 x=330, 강사 중심 x=625, 연못 가운데(발이 닿는 곳) 아래에서 110px */
export const STAGE_W = 860
export const STAGE_H = 760
const BLEED = 96 // 오른쪽 화면 여백까지 무대를 쓴다
// 무대 아래 여백: 무대 맨 아래의 이름표("// 5기의 나", "// 강사")가 낮은 창(1280×800 등)에서도 화면 안에 들어오게 (UI 체크리스트 06-10)
const STAGE_FOOT = 40

function Stage({ children }: { children: React.ReactNode }) {
  const col = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (!col.current) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setScale(Math.min(1, (width + BLEED) / STAGE_W, ((height - STAGE_FOOT) * 0.98) / STAGE_H))
    })
    ro.observe(col.current)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={col} className="relative h-full">
      <div
        className="absolute"
        style={{ bottom: STAGE_FOOT, right: -BLEED, width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'bottom right' }}
      >
        {/* 흰 백조가 종이 바탕에 묻히지 않게 뒤에 옅은 하늘색 무대를 깐다 */}
        <div className="absolute bottom-[80px] left-[130px] h-[640px] w-[640px] rounded-full bg-[#e6f2fb]" />
        <div className="absolute bottom-[40px] left-[90px] h-[140px] w-[720px] rounded-[50%] bg-sky" />
        {children}
      </div>
    </div>
  )
}

/** 변신할 때 다 자란 백조의 머리 위(무대 아래에서 약 660px)에 반짝이며 뜨는 SWAN 로고 */
function SwanLogo({ show }: { show: boolean }) {
  const star = (x: number, y: number, s: number, delay: number, color: string) => (
    <svg
      key={`${x}-${y}`}
      viewBox="0 0 20 20"
      className="absolute motion-safe:animate-[twinkle_1.6s_ease-in-out_infinite]"
      style={{ left: x, top: y, width: s, height: s, animationDelay: `${delay}s` }}
      aria-hidden
    >
      <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill={color} />
    </svg>
  )
  return (
    <div
      className="pointer-events-none absolute bottom-[662px] left-[330px] transition-all duration-500 ease-out"
      style={{
        transform: `translateX(-50%) translateY(${show ? 0 : 16}px) scale(${show ? 1 : 0.6})`,
        opacity: show ? 1 : 0,
      }}
      aria-hidden={!show}
    >
      <div className="relative motion-safe:animate-[float_3s_ease-in-out_infinite]">
        <div className="flex items-baseline gap-1.5 rounded-full bg-ink px-5 py-2 text-white shadow-dialog">
          <span className="font-mono text-[14px] text-sky">&gt;_</span>
          <span className="font-display text-[26px] font-extrabold tracking-[0.06em]">SWAN</span>
        </div>
        {star(-26, -12, 18, 0, '#f28c38')}
        {star(130, -18, 14, 0.5, '#f3a6bd')}
        {star(62, -30, 11, 0.3, '#7cc9a5')}
        {star(146, 28, 12, 1, '#9ccbf2')}
        {star(-16, 38, 11, 0.8, '#7cc9a5')}
        {star(170, 4, 9, 1.3, '#f28c38')}
        {star(-40, 16, 8, 1.1, '#f3a6bd')}
      </div>
    </div>
  )
}

/** 흰 캐릭터의 가장자리를 살짝 세워 주는 그림자 */
export const CHARACTER_FILTER = 'drop-shadow(0 0 0.6px rgba(31,42,68,.45)) drop-shadow(0 8px 18px rgba(31,42,68,.12))'

/* ---------- 그림 프레임 방식 ---------- */
const DUCK_IDLE = frameUrls('duck-idle', 36)
const DUCK_WAVE = frameUrls('duck-wave', 30)
const DUCK_TILT = frameUrls('duck-tilt', 27) // 고개 갸웃: 6번째 장에서 가장 많이 기운다
const TILT_PEAK = 6
const WAVE_TIMES = 2 // 처음 들어오면 손을 두 번 흔든다 (12장/초로 약 5초)
const TRANSFORM = frameUrls('transform', 61)
const TEACHER_IDLE = frameUrls('instructor-idle', 36)
const TEACHER_WHISPER = frameUrls('instructor-whisper', 24) // 오리 쪽으로 기울어 날개로 부리를 가린다
const GROWN_IDLE = frameUrls('cygnet-idle', 36) // 변신을 마친 "3개월 뒤의 나"의 숨쉬기
const GROWN_WAVE = frameUrls('cygnet-wave', 30) // 변신 뒤 강사와 함께 손 흔들기
// 변신 뒤 어린 백조가 손을 흔드는 동안 강사는 숨쉬며 눈웃음("^ ^")을 짓는다 (블렌더 smile_arc + 눈동자 지우기)
const TEACHER_WAVE = frameUrls('instructor-smile', 36)
const GREET_TIMES = 2
const SIZE = 720 // 캔버스 한 변 (프레임은 모두 같은 카메라로 찍어 캐릭터 크기가 맞는다)

type Phase = 'wave' | 'duck' | 'tilt' | 'morph' | 'grown'

function FrameStage({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  const duck = useRef<FrameCanvasHandle>(null)
  const tilt = useRef<FrameCanvasHandle>(null)
  const morph = useRef<FrameCanvasHandle>(null)
  const teacher = useRef<FrameCanvasHandle>(null)
  const whisper = useRef<FrameCanvasHandle>(null)
  const wave = useRef<FrameCanvasHandle>(null)
  const grown = useRef<FrameCanvasHandle>(null)
  const grownWave = useRef<FrameCanvasHandle>(null)
  const teacherWave = useRef<FrameCanvasHandle>(null)
  const greetStart = useRef(-1) // 함께 손 흔들기를 시작한 시각 (performance.now), 아니면 -1
  const [greeting, setGreeting] = useState(false)
  const [phase, setPhase] = useState<Phase>(reduced ? 'duck' : 'wave')
  const [leaning, setLeaning] = useState(false)
  const [flowing, setFlowing] = useState(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const waved = useRef(reduced)

  // 숨쉬기와 손 흔들기는 초당 12장으로 돌린다. 오리·다 자란 백조·강사 모두 숨쉰다
  useEffect(() => {
    if (reduced) {
      duck.current?.draw(0)
      teacher.current?.draw(0)
      grown.current?.draw(0)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const waveLen = DUCK_WAVE.length * WAVE_TIMES
    const tick = (t: number) => {
      const f = Math.floor(((t - t0) / 1000) * 12)
      teacher.current?.draw(f % 36)
      grown.current?.draw(f % 36)
      if (f < waveLen) wave.current?.draw(f % DUCK_WAVE.length)
      if (greetStart.current >= 0) {
        const g = Math.floor(((t - greetStart.current) / 1000) * 12)
        if (g < GROWN_WAVE.length * GREET_TIMES) {
          grownWave.current?.draw(g % GROWN_WAVE.length)
          teacherWave.current?.draw(g % TEACHER_WAVE.length) // 눈웃음
        } else {
          greetStart.current = -1
          setGreeting(false)
        }
      }
      else if (!waved.current) {
        waved.current = true
        if (phaseRef.current === 'wave') setPhase('duck')
      }
      duck.current?.draw(f % 36)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  // 스크롤에 맞춰 변신한다.
  // pop: 강사가 귓속말로 코드를 불어넣고 → 오리가 움츠렸다가 POP_AT에서 컨페티와 함께 어린 백조로 바뀐다
  // video: 변신 영상 프레임을 넘기고, 영상에 반짝이가 찍힌 구간(0.4·0.65)에서 컨페티를 터뜨려 눈길을 돌린다
  const confetti = useRef<ConfettiHandle>(null)
  const duckBox = useRef<HTMLDivElement>(null)
  const grownBox = useRef<HTMLDivElement>(null)
  const lastA = useRef(0)
  useEffect(
    () =>
      progress.subscribe((p) => {
        const a = transformAmount(p)
        const prev = lastA.current
        lastA.current = a
        const crossed = (at: number) => (prev < at) !== (a < at)
        const atRest = p <= 0.03
        if (MORPH === 'pop') {
          // 강사: 기울기 정도에 맞춰 귓속말 장면을 넘긴다
          const lean = atRest ? 0 : leanAt(a)
          whisper.current?.draw(lean * (TEACHER_WHISPER.length - 1))
          setLeaning(lean > 0.02)
          // 오리: 고개를 갸웃하며 듣는다
          const t = tiltAt(a)
          tilt.current?.draw(t * TILT_PEAK)
          setFlowing(isWhispering(a))
          // 바뀌기 직전까지 납작하게 움츠린다
          const squash = clamp01((a - SQUASH_FROM) / (POP_AT - SQUASH_FROM))
          if (duckBox.current) duckBox.current.style.transform = a < POP_AT ? `scale(${1 + 0.06 * squash}, ${1 - 0.1 * squash})` : ''
          if (crossed(POP_AT)) {
            confetti.current?.burst(330, 470)
            if (a >= POP_AT && !reduced)
              grownBox.current?.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], {
                duration: 450,
                easing: 'cubic-bezier(.3,.7,.2,1)',
              })
          }
          // 강사가 다시 바로 서고 나면 둘이 함께 손을 흔든다 (아래로 내려올 때마다 한 번)
          if (crossed(GREET_AT) && a >= GREET_AT && !reduced) {
            greetStart.current = performance.now()
            setGreeting(true)
          }
          if (a < POP_AT && greetStart.current >= 0) {
            greetStart.current = -1
            setGreeting(false)
          }
          setPhase(atRest ? (waved.current ? 'duck' : 'wave') : a >= POP_AT ? 'grown' : t > 0 ? 'tilt' : 'duck')
          return
        }
        morph.current?.draw(a * (TRANSFORM.length - 1))
        if (a > prev && (crossed(0.4) || crossed(0.65))) confetti.current?.burst(330, 470)
        setPhase(atRest ? (waved.current ? 'duck' : 'wave') : a >= 0.995 ? 'grown' : 'morph')
      }),
    [progress, reduced],
  )
  const show = (p: Phase) => `absolute inset-0 ${phase === p ? '' : 'invisible'}`
  const showDuck = phase === 'duck' || phase === 'tilt'

  // 프레임 안에서 발은 아래에서 11% 지점에 있다. 그만큼 내려서 발이 연못 가운데(아래 110px)에 닿게 한다.
  // 캐릭터는 프레임 가로 가운데에 있으니, 캔버스 왼쪽 = 캐릭터 중심 - SIZE/2
  const bottom = 110 - SIZE * 0.11
  // 움츠리기·튀어나오기는 발(프레임 아래 11%)을 기준으로 한다
  const origin = { transformOrigin: '50% 89%' }
  return (
    <>
      <div className="absolute inset-0" style={{ filter: CHARACTER_FILTER }}>
        <div className="absolute" style={{ left: 625 - SIZE / 2, bottom, width: SIZE, height: SIZE }}>
          <FrameCanvas ref={teacher} urls={TEACHER_IDLE} size={SIZE} className={`absolute inset-0 ${leaning || greeting ? 'invisible' : ''}`} />
          {MORPH === 'pop' && (
            <FrameCanvas ref={teacherWave} urls={TEACHER_WAVE} size={SIZE} className={`absolute inset-0 ${greeting && !leaning ? '' : 'invisible'}`} />
          )}
          {MORPH === 'pop' && (
            <FrameCanvas ref={whisper} urls={TEACHER_WHISPER} size={SIZE} className={`absolute inset-0 ${leaning ? '' : 'invisible'}`} />
          )}
        </div>
        <div className="absolute" style={{ left: 330 - SIZE / 2, bottom, width: SIZE, height: SIZE }}>
          <FrameCanvas ref={wave} urls={DUCK_WAVE} size={SIZE} className={show('wave')} />
          <div ref={duckBox} className={`absolute inset-0 ${showDuck ? '' : 'invisible'}`} style={origin}>
            <FrameCanvas ref={duck} urls={DUCK_IDLE} size={SIZE} className={`absolute inset-0 ${phase === 'duck' ? '' : 'invisible'}`} />
            {MORPH === 'pop' && (
              <FrameCanvas ref={tilt} urls={DUCK_TILT} size={SIZE} className={`absolute inset-0 ${phase === 'tilt' ? '' : 'invisible'}`} />
            )}
          </div>
          {MORPH === 'video' && <FrameCanvas ref={morph} urls={TRANSFORM} size={SIZE} className={show('morph')} />}
          <div ref={grownBox} className={show('grown')} style={origin}>
            <FrameCanvas ref={grown} urls={GROWN_IDLE} size={SIZE} className={`absolute inset-0 ${greeting ? 'invisible' : ''}`} />
            {MORPH === 'pop' && (
              <FrameCanvas ref={grownWave} urls={GROWN_WAVE} size={SIZE} className={`absolute inset-0 ${greeting ? '' : 'invisible'}`} />
            )}
          </div>
        </div>
      </div>
      {MORPH === 'pop' && !reduced && <KnowledgeFlow active={flowing} />}
      <Confetti ref={confetti} width={STAGE_W} height={STAGE_H} className="absolute inset-0" />
    </>
  )
}

/* ---------- 지식 주입 ----------
 * 귓속말하는 강사의 부리 끝(무대 좌표 약 457,259) 아래에서 코드 글자가 나와, 바로 위의 안경을 피해
 * 먼저 왼쪽으로 나간 뒤 낮게 휘어 갸웃한 오리의 정수리(약 362,312)로 쏙 들어간다. 글자는 개발자 노트 느낌의 고정폭 꼬리표. */
// 커리큘럼(planning/v3-1013/curriculum.md) 2부의 고급 문법·알고리즘·디자인 패턴에서 가져온 말
const KNOWLEDGE = ['map()', '@decorator', 'class', 'coroutine', 'closure', 'generator', 'reduce()', '재귀', 'Strategy', 'Observer', 'Singleton', 'MVP']
const KNOWLEDGE_GAP = 0.5 // 꼬리표 사이 간격(초). 한 바퀴 = 개수 × 간격
const KNOWLEDGE_PATH = "path('M 440 290 C 405 268, 350 236, 362 312')"

function KnowledgeFlow({ active }: { active: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} aria-hidden>
      {active &&
        KNOWLEDGE.map((word, i) => (
          <span
            key={word}
            className="absolute top-0 left-0 rounded-badge bg-surface px-2 py-1 font-mono text-[18px] leading-none font-semibold whitespace-nowrap text-ink shadow-[0_2px_6px_rgba(31,42,68,.12)] ring-1 ring-sky"
            style={{
              offsetPath: KNOWLEDGE_PATH,
              offsetRotate: '0deg',
              animation: `knowledge ${KNOWLEDGE.length * KNOWLEDGE_GAP}s cubic-bezier(.45,.05,.4,1) ${i * KNOWLEDGE_GAP}s infinite both`,
            }}
          >
            {word}
          </span>
        ))}
    </div>
  )
}
