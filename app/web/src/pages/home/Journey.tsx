// 홈 섹션 6과 7 사이: 모험길. 스크롤하는 동안 화면에 머물고, 길이 옆으로 흐른다.
// 오리가 점선 길을 걸어 이정표 4개(배우는 흐름 4단계)를 지나며 알에서 나온 오리 → 아기 오리 → 어린 백조로 자라고,
// 길 끝에서 깃발을 든 강사가 기다린다.
// 그림: public/frames/walk-*/ (블렌더 swan.blend의 walk 동작을 렌더, 24장 반복, 네 캐릭터가 같은 바닥선)
//       public/images/journey/signpost-1~4.webp (이정표, 판은 비워 두고 글자는 여기서 얹는다)
import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FrameCanvas, frameUrls, type FrameCanvasHandle } from '../../components/FrameCanvas'
import { Mark, Section, SectionTitle } from '../../components/Section'
import { PetalRain, type PetalRainHandle } from '../../components/PetalRain'
import { prefersReducedMotion } from '../../lib/motion'

/* 길 위의 좌표 (px). 길 전체 너비 TRACK_W 안에서 정한다 */
const TRACK_W = 3360
const GROUND = 470 // 패널 위에서 바닥선까지
const WALK_FROM = 160
const WALK_TO = 2720 // 강사 바로 앞에서 멈춘다
const TEACHER_X = 3060
const CHAR = 400 // 캐릭터 그림 한 변 (그림 아래 1.4%가 발밑 여백)
const STEP_PX = 16 // 이만큼 걸을 때마다 다음 그림
const SIGN_SCALE = 0.75

/* 배경: 이정표에 다가갈 때마다 장면이 바뀐다 (Higgsfield로 만든 3D 게임풍 4장, public/images/journey/bg-1~4.webp)
 * ① 새벽 호숫가 → ② 아침 숲길 → ③ 한낮 개울 다리 → ④ 노을 호수. 그림 아래 22%가 풀밭 띠라, 띠 윗선을 길보다 조금 위에 맞춘다 */
const BACKGROUNDS = [1, 2, 3, 4].map((i) => `/images/journey/bg-${i}.webp`)
const BG_SWITCH_BEFORE = 160 // 이정표보다 이만큼 앞에서 바뀐다
const BG_BAND_TOP = 0.78 // 그림 높이 중 풀밭 띠가 시작하는 곳
const BG_PARALLAX = 0.06 // 길이 움직인 거리 대비 배경이 움직이는 비율

/** 이정표: 그림 크기와 판의 위치(그림 원본 px)를 함께 둔다 */
const SIGNS = [
  { x: 560, img: 1, w: 169, h: 240, board: [10, 33, 159, 129], mark: '①', name: '다지기', note: '// 환경 구성 · 함수 활용법' },
  { x: 1220, img: 2, w: 189, h: 331, board: [11, 78, 178, 184], mark: '②', name: '깊어지기', note: '// 고급 개념 · 알고리즘 · 객체지향' },
  { x: 1880, img: 3, w: 205, h: 411, board: [10, 94, 193, 212], mark: '③', name: '만들기', note: '// 실습 프로젝트 11개' },
  { x: 2440, img: 4, w: 226, h: 478, board: [11, 103, 214, 235], mark: '④', name: 'AI와 함께 만들기', note: '// 바이브코딩', isNew: true },
]

/** 걷는 사람: 이정표 ②를 지나면 아기 오리, ④를 지나면 어린 백조.
 *  head: 그림(한 변) 안에서 머리 꼭대기 높이 비율 — 이름표를 머리 위에 띄우는 데 쓴다 */
const WALKERS = [
  { key: 'hatchling', from: -Infinity, head: 151 / 360 },
  { key: 'duck', from: SIGNS[1].x + 40, head: 104 / 360 },
  { key: 'cygnet', from: SIGNS[3].x + 40, head: 25 / 360 },
] as const
/* 도착 축하: 강사가 학사모를 씌워 주는 장면 (블렌더에서 둘을 한 장면에 세워 렌더, public/frames/cap-scene 84장)
 * 0~15 강사가 학사모를 들고 통통 다가옴 · 16~35 들어 올려 넘겨 씌움 · 36~43 날개를 내림
 * 44~59 어린 백조가 콩콩 + 강사가 원래 간격으로 돌아감(여기서 꽃비) · 60~83 둘이 손 흔들기
 * 장면 그림은 걷기 그림과 같은 카메라라, 어린 백조(렌더 x 389)를 걷기 그림의 어린 백조(렌더 x 279) 위치에 겹친다 */
const SCENE = frameUrls('cap-scene', 84)
// 걷기 그림 자르기 영역 (tools: crop_walk.py가 네 캐릭터 전체 프레임을 감싸도록 정한 값, 렌더 px)
const WALK_CROP = { left: 30, top: 126, side: 424 }
const SCENE_S = 400 / WALK_CROP.side // 렌더 px → 화면 px (걷기 그림과 같은 비율)
const SCENE_W = Math.round(1120 * SCENE_S)
const SCENE_H = Math.round(560 * SCENE_S)
const SCENE_LEFT = WALK_TO - CHAR / 2 - (389 - 279 + WALK_CROP.left) * SCENE_S // 어린 백조를 걷기 그림과 같은 자리에
const SCENE_TOP = GROUND - CHAR * 0.986 - WALK_CROP.top * SCENE_S
const PAIR_CENTER = { x: 568 * SCENE_S, y: 344 * SCENE_S } // 장면 그림 안에서 둘의 가운데
const RAIN_AT = 44
const UNLOCK_AT = RAIN_AT + 10 // 꽃비가 내리기 시작하고 조금 뒤에 스크롤을 풀어 준다

/** 축하 장면이 화면 가운데에서 보이도록 잠깐 스크롤을 멈춘다. 스크롤바는 그대로 두어 화면이 흔들리지 않게 한다.
 *  휠·터치·키 입력을 막는 것만으로는 부족했다: 실제 브라우저는 휠을 세게 굴리면 이미 시작된 부드러운 스크롤이 계속 흘러가고,
 *  터치패드 관성이나 스크롤바 끌기도 막지 못한다. 그래서 holdY(도착한 자리)에서 벗어나면 바로 되돌려 놓는다.
 *  돌려주는 함수를 부르면 풀린다 */
function lockScroll(holdY: number): () => void {
  const stop = (e: Event) => e.preventDefault()
  const keys = (e: KeyboardEvent) => {
    if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault()
  }
  const hold = () => {
    if (Math.abs(window.scrollY - holdY) > 1) window.scrollTo({ top: holdY, behavior: 'instant' })
  }
  window.addEventListener('wheel', stop, { passive: false })
  window.addEventListener('touchmove', stop, { passive: false })
  window.addEventListener('keydown', keys)
  window.addEventListener('scroll', hold)
  hold()
  return () => {
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchmove', stop)
    window.removeEventListener('keydown', keys)
    window.removeEventListener('scroll', hold)
  }
}
const GLIDE_MS = 400
const SCENE_FPS = 20 // 축하 장면 재생 속도 (84장 → 약 4.2초)
type Celebrate = 'idle' | 'playing' | 'done'
const HOP_EVERY = 110 // 알 단계는 이 거리마다 한 번 통통 뛴다 (px)
const HOP_HEIGHT = 46
const walkerAt = (x: number) => WALKERS.reduce((cur, w, i) => (x >= w.from ? i : cur), 0)

const urls = {
  hatchling: frameUrls('walk-hatchling', 24),
  duck: frameUrls('walk-duck', 24),
  cygnet: frameUrls('walk-cygnet', 24),
  instructor: frameUrls('walk-instructor', 24),
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
/** 스크롤 구간 0.04~0.94에서 걷는다 */
const walkX = (p: number) => WALK_FROM + (WALK_TO - WALK_FROM) * clamp((p - 0.04) / 0.9, 0, 1)

/** 점선 길: 바닥선을 따라 완만하게 오르내린다 */
const PATH = (() => {
  const y = GROUND + 6
  let d = `M 0 ${y}`
  for (let x = 0; x < TRACK_W; x += 400) d += ` Q ${x + 200} ${(x / 400) % 2 === 0 ? y + 14 : y - 10} ${x + 400} ${y}`
  return d
})()

export function Journey() {
  const reduced = prefersReducedMotion()
  const outer = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const walker = useRef<HTMLDivElement>(null)
  const bounce = useRef<HTMLDivElement>(null)
  const walked = useRef<SVGRectElement>(null)
  const canvases = useRef<(FrameCanvasHandle | null)[]>([])
  const teacher = useRef<FrameCanvasHandle>(null)
  const [stage, setStage] = useState(0)
  const [scene, setScene] = useState(0)
  const bgLayer = useRef<HTMLDivElement>(null)
  const [arrived, setArrived] = useState(false)
  const rain = useRef<PetalRainHandle>(null)
  const wasArrived = useRef(false)
  const lastP = useRef(0) // 바로 앞 스크롤 진행값. 걸어서 왔는지, 건너뛰어 왔는지 가린다
  const [celebrate, setCelebrate] = useState<Celebrate>('idle')
  const capScene = useRef<FrameCanvasHandle>(null)
  const sceneBox = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const unlock = useRef<(() => void) | null>(null)
  const releaseScroll = () => {
    unlock.current?.()
    unlock.current = null
  }

  // 도착 축하: 가운데로 나옴 → 학사모 씌우기·꽃비 → 원래 자리로 돌아감 (돌아간 뒤에는 마지막 장면에 머문다)
  const stopCelebration = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current.forEach((t) => window.clearInterval(t))
    timers.current = []
    if (sceneBox.current) sceneBox.current.style.transform = ''
    releaseScroll()
    setCelebrate('idle')
  }
  /** holdY: 축하하는 동안 붙잡아 둘 스크롤 위치 (고정 구간 안) */
  const startCelebration = (holdY: number) => {
    stopCelebration()
    if (prefersReducedMotion()) {
      setCelebrate('done')
      return
    }
    setCelebrate('playing')
    unlock.current = lockScroll(holdY) // 학사모를 쓰고 꽃비가 내릴 때까지
    capScene.current?.draw(0)
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
    // 다음 그림에서 위치를 재고 화면 가운데로 옮긴다 (1.15배)
    later(() => {
      const el = sceneBox.current
      const panel = el?.closest('[data-journey-panel]')
      if (!el || !panel) return
      const r = el.getBoundingClientRect()
      const pr = panel.getBoundingClientRect()
      const dx = pr.left + pr.width / 2 - (r.left + PAIR_CENTER.x)
      const dy = pr.top + pr.height * 0.55 - (r.top + PAIR_CENTER.y)
      el.style.transform = `translate(${dx}px,${dy}px) scale(1.15)`
    }, 30)
    later(() => {
      let f = 0
      const id = window.setInterval(() => {
        f += 1
        capScene.current?.draw(f)
        if (f === RAIN_AT) rain.current?.start()
        if (f === UNLOCK_AT) releaseScroll()
        if (f >= SCENE.length - 1) {
          window.clearInterval(id)
          if (sceneBox.current) sceneBox.current.style.transform = ''
          later(() => setCelebrate('done'), GLIDE_MS)
        }
      }, 1000 / SCENE_FPS)
      timers.current.push(id)
    }, GLIDE_MS + 40)
  }
  useEffect(() => () => stopCelebration(), [])

  // 스크롤 → 길 이동, 걷는 그림, 자라기. 매 스크롤마다 리렌더하지 않도록 DOM을 직접 바꾼다
  useEffect(() => {
    if (reduced || !outer.current) return
    // endY: 고정 구간이 끝나는 스크롤 위치. 세게 굴려 지나쳤어도 축하는 화면이 고정된 자리에서 보이게 한다
    const apply = (p: number, endY = Infinity) => {
      const x = walkX(p)
      const vw = track.current?.parentElement?.clientWidth ?? window.innerWidth
      const shift = clamp(x - vw * 0.38, 0, TRACK_W - vw)
      if (track.current) track.current.style.transform = `translate3d(${-shift}px,0,0)`
      if (bgLayer.current) bgLayer.current.style.transform = `translate3d(${-shift * BG_PARALLAX}px,-${BG_BAND_TOP * 100}%,0)`
      setScene(SIGNS.reduce((cur, sg, i) => (i > 0 && x >= sg.x - BG_SWITCH_BEFORE ? i : cur), 0))
      if (walker.current) walker.current.style.transform = `translate3d(${x - CHAR / 2}px,0,0)`
      if (walked.current) walked.current.setAttribute('width', String(x))
      const s = walkerAt(x)
      const moving = x > WALK_FROM && x < WALK_TO
      canvases.current[s]?.draw(moving ? Math.floor(x / STEP_PX) % 24 : 0)
      // 알 단계는 통통 튀며 간다: 거리마다 포물선으로 떴다가 내려앉는다
      if (bounce.current) {
        const t = (x / HOP_EVERY) % 1
        const up = s === 0 && moving ? HOP_HEIGHT * 4 * t * (1 - t) : 0
        bounce.current.style.transform = `translate3d(0,${-up}px,0)`
      }
      setStage(s)
      const here = x >= WALK_TO - 1
      setArrived(here)
      // 길 끝에 닿는 순간(다시 걸어 들어올 때마다) 화면 전체에 꽃비
      // 위에서 길을 걸어 내려와 닿았을 때만 축하하며 스크롤을 붙잡는다.
      // 메뉴 이동처럼 건너뛰어 왔거나 아래에서 올라왔으면 붙잡지 않고 마지막 자세만 보여 준다 (붙잡으면 가려던 곳에 못 간다)
      const walkedIn = lastP.current > 0 && lastP.current < 1 && p > lastP.current
      if (here && !wasArrived.current) {
        if (walkedIn) startCelebration(Math.min(window.scrollY, endY - 2))
        else setCelebrate('done')
      }
      lastP.current = p
      if (!here && wasArrived.current) stopCelebration()
      wasArrived.current = here
    }
    apply(0)
    const st = ScrollTrigger.create({
      trigger: outer.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => apply(self.progress, self.end),
      onRefresh: (self) => apply(self.progress, self.end),
    })
    return () => st.kill()
  }, [reduced])

  // 강사는 시간에 따라 숨쉰다 (12장/초). 화면에 보일 때만 돈다
  useEffect(() => {
    if (reduced || !outer.current) return
    let timer = 0
    let i = 0
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer)
      if (e.isIntersecting) timer = window.setInterval(() => teacher.current?.draw((i = (i + 1) % 24)), 1000 / 12)
    })
    io.observe(outer.current)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [reduced])

  return (
    <Section name="home:06b-journey" className="relative border-t border-line">
      <PetalRain ref={rain} />
      <div ref={outer} style={{ height: reduced ? 'auto' : '320vh' }}>
        <div data-journey-panel data-celebrate={celebrate} className={`${reduced ? '' : 'sticky top-[88px]'} flex h-[max(640px,calc(100vh-88px))] flex-col overflow-hidden`}>
          {/* 설명은 제목 바로 아래에 (사용자 요청 2026-10-18: 오른쪽 끝에 떨어져 있으면 제목과 따로 읽혔다) */}
          <div className="page flex w-full flex-col gap-3 pt-14">
            <Mark>{'// 배우는 흐름을 걸어 보면'}</Mark>
            <SectionTitle>3개월 동안, 이 길을 걸어요</SectionTitle>
            <p data-reveal className="relative z-10 max-w-[560px] text-[17px] leading-[1.65] font-medium text-ink/80">
              이정표를 하나씩 지날 때마다 자라요. 길 끝에서는 강사가 기다리고 있어요.
              {reduced && <span className="mt-1 block font-mono text-[13px] text-muted">{'// 길은 옆으로 넘겨 볼 수 있어요 →'}</span>}
            </p>
          </div>

          <div className={`relative my-auto h-[560px] shrink-0 ${reduced ? 'overflow-x-auto' : ''}`}>
            {/* 배경 장면: 위아래 끝은 종이색으로 사라지게 한다 */}
            <div
              ref={bgLayer}
              className="pointer-events-none absolute left-0 aspect-[1344/576] w-[calc(100%+120px)]"
              style={{
                top: GROUND - 34,
                transform: `translate3d(0,-${BG_BAND_TOP * 100}%,0)`,
                maskImage: 'linear-gradient(to bottom, transparent 0%, #000 16%, #000 86%, transparent 100%)',
              }}
              aria-hidden
            >
              {BACKGROUNDS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`absolute inset-0 h-full w-full transition-opacity duration-[800ms] ${scene === i ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
            </div>
            <div ref={track} className="absolute top-0 left-0 h-full will-change-transform" style={{ width: TRACK_W }}>
              <svg className="absolute inset-0" width={TRACK_W} height={560} aria-hidden>
                <defs>
                  <clipPath id="journey-walked">
                    <rect ref={walked} x="0" y="0" width={reduced ? TRACK_W : WALK_FROM} height="560" />
                  </clipPath>
                </defs>
                <path d={PATH} fill="none" stroke="#c9d0dc" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
                <path d={PATH} fill="none" stroke="#7d93b0" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" clipPath="url(#journey-walked)" />
              </svg>

              {/* 축하하는 동안에는 이정표를 흐리게 해서 가운데로 나온 둘이 돋보이게 한다 */}
              <div className={`transition-opacity duration-500 ${celebrate === 'playing' ? 'opacity-15' : ''}`}>
                {SIGNS.map((s) => (
                  <Signpost key={s.name} sign={s} />
                ))}
              </div>

              {/* 도착 축하 장면: 강사가 학사모를 씌워 준다. 축하 중에는 따로 그린 강사·어린 백조 대신 이 장면을 보인다 */}
              {!reduced && (
                <div
                  ref={sceneBox}
                  className={`absolute z-10 ${celebrate === 'idle' ? 'invisible' : ''}`}
                  style={{
                    left: SCENE_LEFT,
                    top: SCENE_TOP,
                    width: SCENE_W,
                    height: SCENE_H,
                    transformOrigin: `${PAIR_CENTER.x}px ${PAIR_CENTER.y}px`,
                    transition: `transform ${GLIDE_MS}ms cubic-bezier(.3,.7,.2,1)`,
                  }}
                >
                  <FrameCanvas ref={capScene} urls={SCENE} size={SCENE_W} height={SCENE_H} />
                  {celebrate === 'done' && (
                    <span
                      className="absolute -translate-x-1/2 rounded-badge bg-surface/90 px-2 py-0.5 font-mono text-[14px] whitespace-nowrap text-ink"
                      style={{ left: 389 * SCENE_S, top: 132 * SCENE_S - 34 }}
                    >
                      // 3개월 뒤의 나
                    </span>
                  )}
                </div>
              )}

              {/* 길 끝: 깃발을 든 강사 */}
              <div className="absolute" style={{ left: TEACHER_X - CHAR / 2, top: GROUND - CHAR * 0.986 }}>
                <FrameCanvas ref={teacher} urls={urls.instructor} size={CHAR} className={celebrate === 'idle' ? '' : 'invisible'} />
                <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 font-mono text-[14px] whitespace-nowrap text-muted">// 강사</span>
              </div>

              {/* 걷는 나 (움직임 줄이기면 단계별 정지 그림을 길 위에 세워 둔다) */}
              {reduced ? (
                <StillWalkers />
              ) : (
                <div
                  ref={walker}
                  className={`absolute left-0 will-change-transform ${celebrate === 'idle' ? '' : 'invisible'}`}
                  style={{ top: GROUND - CHAR * 0.986, width: CHAR, height: CHAR }}
                >
                  <div ref={bounce} className="absolute inset-0">
                    {WALKERS.map((w, i) => (
                      <FrameCanvas
                        key={w.key}
                        ref={(h) => {
                          canvases.current[i] = h
                        }}
                        urls={urls[w.key]}
                        size={CHAR}
                        className={`absolute top-0 left-0 transition-[opacity,transform] duration-300 ${stage === i ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                        style={{ transformOrigin: '50% 98%' }}
                      />
                    ))}
                    {/* 이름표: 지금 단계 캐릭터의 머리 위 */}
                    <span
                      className="absolute left-1/2 -translate-x-1/2 rounded-badge bg-surface/90 px-2 py-0.5 font-mono text-[14px] whitespace-nowrap text-ink transition-[top] duration-300"
                      style={{ top: WALKERS[stage].head * CHAR - 34 }}
                    >
                      {arrived ? '// 3개월 뒤의 나' : '// 5기의 나'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function Signpost({ sign }: { sign: (typeof SIGNS)[number] }) {
  const w = sign.w * SIGN_SCALE
  const h = sign.h * SIGN_SCALE
  const [bx0, by0, bx1, by1] = sign.board.map((v) => v * SIGN_SCALE)
  return (
    <div className="absolute" style={{ left: sign.x - w / 2, top: GROUND - h + 4, width: w, height: h }}>
      <img src={`/images/journey/signpost-${sign.img}.webp`} alt="" className="h-full w-full" draggable={false} />
      {/* 판 위의 글자 */}
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ left: bx0, top: by0, width: bx1 - bx0, height: by1 - by0 }}
      >
        {/* 번호: 동그라미 문자(①)는 글꼴 안에서 작게 그려져 판 위에서 거의 안 보였다 → 남색 원 안의 숫자로 (2026-10-19) */}
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ink font-mono text-[13px] leading-none font-semibold text-white">
          {'①②③④'.indexOf(sign.mark) + 1}
        </span>
        <span className="mt-1 px-1 font-display text-[16px] leading-[1.25] font-extrabold">{sign.name}</span>
      </div>
      <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 whitespace-nowrap" style={{ top: h + 14 }}>
        <span className="font-mono text-[13px] text-muted">{sign.note}</span>
        {'isNew' in sign && sign.isNew && <span className="rounded-badge bg-ink px-2 py-0.5 text-[12px] font-semibold text-white">5기 신설</span>}
      </div>
    </div>
  )
}

/** 움직임 줄이기 설정: 걷지 않고, 단계마다 첫 그림을 길 위에 세워 둔다 */
function StillWalkers() {
  const spots = [
    { key: 'hatchling', x: 300 },
    { key: 'duck', x: 1550 },
    { key: 'cygnet', x: WALK_TO },
  ] as const
  return (
    <>
      {spots.map((s) => (
        <img
          key={s.key}
          src={`/frames/walk-${s.key}/000.webp`}
          alt=""
          width={CHAR}
          height={CHAR}
          className="absolute"
          style={{ left: s.x - CHAR / 2, top: GROUND - CHAR * 0.986 }}
        />
      ))}
    </>
  )
}
