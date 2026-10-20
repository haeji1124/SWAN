// 제작 과정 /making (Phase 6): "이 사이트도 바이브코딩으로 만들었다"를 과정과 함께 보여 준다
// 위에서 아래로 7구획: 머리말 → 숫자 → 타임라인 → 실제로 쓴 프롬프트 → 막혔던 순간과 해결(가장 중요) → SWAN 단원과의 연결 → [신청하기]
// 내용은 src/content/making.md 한 파일에서 읽는다 (글만 고쳐도 화면이 바뀐다)
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useFeedback } from '../components/Feedback'
import { Mark, Section, SectionTitle } from '../components/Section'
import { PrimaryAction } from '../components/TopNav'
import { section, type MakingItem } from '../lib/making'
import { track } from '../lib/track'

const UNSET = '확정 전'

export function Making() {
  const head = section('머리말').fields
  return (
    <div className="pb-0">
      {/* 1. 머리말 */}
      <Section name="making:01-head" className="page flex flex-col gap-8 pt-20 pb-20">
        <Mark>// 이렇게 만들었어요</Mark>
        <h1 data-reveal className="max-w-[980px] font-display text-[64px] leading-[1.2] font-extrabold tracking-[-0.03em] break-keep">
          {head['제목']}
        </h1>
        <p data-reveal className="max-w-[760px] text-[20px] leading-[1.7] text-ink/85">
          {head['요약']}
        </p>
        <dl data-reveal className="grid max-w-[980px] grid-cols-[120px_minmax(0,1fr)] gap-x-6 gap-y-2.5 border-t border-ink pt-6 text-[16px]">
          {['만든 사람', '걸린 기간', '쓴 도구'].map((k) => (
            <Row key={k} label={k} value={head[k]} />
          ))}
        </dl>
      </Section>

      <Numbers />
      <Timeline />
      <Prompts />
      <Stuck />
      <Connect />

      {/* 7. 신청하기 */}
      <Section name="making:07-apply" className="bg-ink text-white">
        <div className="page flex items-end justify-between gap-12 py-24">
          <div className="flex flex-col gap-4">
            {/* 홈 마지막 신청 섹션과 같은 문장 (바로 위 6구획 제목과 겹치지 않게) */}
            <h2 data-reveal className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">
              AI가 짠 코드,
              <br />
              이제 직접 판단해 보세요.
            </h2>
            <p data-reveal className="text-[18px] text-white/80">
              Python 중고급 · 바이브코딩 · 주 1회 온라인 3개월
            </p>
          </div>
          <div data-reveal className="flex items-center gap-8">
            <Link to="/" onClick={() => track('click', 'making:home')} className="text-[16px] font-semibold text-white underline-offset-4 hover:underline">
              홈으로 →
            </Link>
            <PrimaryAction place="making:apply" inverse />
          </div>
        </div>
      </Section>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <dt className="font-mono text-[14px] text-mark">{label}</dt>
      <dd className={value ? 'font-semibold' : 'text-muted'}>{value || UNSET}</dd>
    </>
  )
}

/* ---------- 2. 숫자 ---------- */
function Numbers() {
  const items = section('숫자').items
  return (
    <Section name="making:02-numbers" className="page border-t border-line py-20">
      <div className="grid grid-cols-[1fr_1fr_1fr] border-y border-line">
        {items.map((n, i) => (
          <div key={n.sub} data-reveal className={`flex flex-col gap-3 py-10 ${i > 0 ? 'border-l border-line pl-12' : 'pr-12'}`}>
            {n.title ? (
              <span className="font-display text-[96px] leading-[0.9] font-extrabold tracking-[-0.03em]">{n.title}</span>
            ) : (
              // 아직 모르는 숫자는 지어내지 않고 비워 둔다
              <span className="flex h-[86px] items-end font-display text-[40px] leading-none font-extrabold text-disabled-ink">{UNSET}</span>
            )}
            <span className="text-[18px] font-bold">{n.sub}</span>
            <span className="font-mono text-[13px] text-muted">// {n.fields['설명'] || UNSET}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ---------- 3. 타임라인 ---------- */
function Timeline() {
  const items = section('타임라인').items
  return (
    <Section name="making:03-timeline" className="page flex flex-col gap-12 py-24">
      <SectionTitle>기획에서 다듬기까지</SectionTitle>
      <ol className="flex flex-col border-t border-ink">
        {items.map((t, i) => (
          <li key={t.title} data-reveal className="grid grid-cols-[64px_260px_minmax(0,1fr)] gap-8 border-b border-line py-9">
            <Mark className="pt-2 text-[15px]">{String(i + 1).padStart(2, '0')}</Mark>
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[30px] leading-tight font-extrabold">{t.title}</span>
              <span className="font-mono text-[13px] text-muted">// {t.sub}</span>
            </div>
            <div className="flex max-w-[760px] flex-col gap-3 text-[17px] leading-[1.75]">
              {t.body.map((p, k) => (
                <p key={k} className={k === 0 && t.title === '기획' ? 'font-semibold' : ''}>
                  {p}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/* ---------- 4. 실제로 쓴 프롬프트 ---------- */
function Prompts() {
  const items = section('프롬프트').items
  const all = section('전체 프롬프트').items
  const [showAll, setShowAll] = useState(false)
  return (
    <Section name="making:04-prompts" className="border-t border-line bg-surface">
      <div className="page flex flex-col gap-14 py-24">
        <div className="flex flex-col gap-3">
          <SectionTitle>이렇게 시켰더니, 이게 나왔다</SectionTitle>
          <p data-reveal className="text-[17px] text-muted">
            단계마다 실제로 쓴 프롬프트입니다. 기획은 AI가 묻고 사람이 답하는 대화로 했어요.
          </p>
        </div>
        {items.map((p) => (
          <PromptCard key={p.title + p.sub} p={p} />
        ))}
        <div className="flex flex-col gap-5 border-t border-ink pt-8">
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => {
              setShowAll(!showAll)
              track('click', 'making:prompts:all')
            }}
            className="self-start text-[17px] font-semibold underline-offset-4 hover:underline"
          >
            {showAll ? '전체 프롬프트 접기 ↑' : '전체 프롬프트 보기 ↓'}
          </button>
          {showAll && (
            <ol className="grid grid-cols-3 gap-x-10 gap-y-6">
              {all.map((a) => (
                <li key={a.title} className="flex flex-col gap-1 border-t border-dashed border-dash pt-4">
                  <Mark>{a.title}</Mark>
                  <span className="text-[17px] font-bold">{a.sub}</span>
                  <span className="text-[14px] text-muted">{a.fields['설명']}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Section>
  )
}

/** 프롬프트 복사: 사내망 http에서는 clipboard API가 막힐 수 있어 고른 뒤 복사하는 방법으로 한 번 더 시도한다 */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

const COLLAPSED_LINES = 7

function PromptCard({ p }: { p: MakingItem }) {
  const { toast } = useFeedback()
  const [open, setOpen] = useState(false)
  const lines = (p.code ?? '').split('\n')
  const long = lines.length > COLLAPSED_LINES
  const before = p.fields['그림 전']
  const after = p.fields['그림']
  return (
    <article data-reveal className="grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] items-start gap-6">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="rounded-badge bg-ink px-2.5 py-1 text-[13px] font-bold text-white">{p.title}</span>
          <span className="text-[17px] font-bold">{p.sub}</span>
        </div>
        <Mark>// 이렇게 시켰더니</Mark>
        <div className="rounded-card border border-line bg-paper">
          <pre
            className={`overflow-hidden px-5 pt-4 font-mono text-[13px] leading-[1.75] whitespace-pre-wrap break-words ${open || !long ? 'pb-4' : 'max-h-[170px]'}`}
          >
            {p.code}
          </pre>
          <div className="flex items-center justify-between gap-4 border-t border-dashed border-dash px-5 py-2.5 text-[14px] font-semibold">
            {long ? (
              <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="underline-offset-4 hover:underline">
                {open ? '접기 ↑' : `펼쳐 보기 ↓ (${lines.length}줄)`}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={async () => {
                track('click', `making:prompt:copy:${p.title}`)
                toast((await copyText(p.code ?? '')) ? '프롬프트를 복사했어요' : '복사하지 못했어요. 펼쳐서 직접 골라 주세요')
              }}
              className="underline-offset-4 hover:underline"
            >
              복사하기
            </button>
          </div>
        </div>
      </div>
      <span className="pt-24 text-center font-display text-[32px] text-mark" aria-hidden>
        →
      </span>
      <div className="flex min-w-0 flex-col gap-3 pt-[42px]">
        <Mark>// 이게 나왔다</Mark>
        <p className="text-[17px] leading-[1.7]">{p.fields['결과']}</p>
        {before && after ? (
          <div className="grid grid-cols-2 gap-3">
            <Figure src={before} caption="고치기 전" />
            <Figure src={after} caption="고친 뒤" />
          </div>
        ) : (
          after && <Figure src={after} />
        )}
      </div>
    </article>
  )
}

function Figure({ src, caption }: { src: string; caption?: string }) {
  return (
    <figure className="flex flex-col gap-1.5">
      <img src={src} alt="" loading="lazy" className="w-full rounded-card border border-line" />
      {caption && <figcaption className="font-mono text-[12px] text-muted">// {caption}</figcaption>}
    </figure>
  )
}

/* ---------- 5. 막혔던 순간과 해결 (가장 중요) ---------- */
function Stuck() {
  const items = section('막혔던 순간').items
  return (
    <Section name="making:05-stuck" className="page flex flex-col gap-12 py-28">
      <div className="flex flex-col gap-4">
        <SectionTitle>AI가 틀렸던 순간과 바로잡은 방법</SectionTitle>
        <p data-reveal className="max-w-[760px] text-[18px] leading-[1.7] text-ink/85">
          AI는 자주 <mark className="rounded-[4px] bg-sky px-1 text-ink">거의 맞지만 틀린</mark> 결과를 냈습니다. 그걸 알아본 건 사람이었고, 알아보는 눈이 SWAN에서 기르는 것입니다.
        </p>
      </div>
      <ol className="flex flex-col border-t border-ink">
        {items.map((s, i) => (
          <li key={s.title} data-reveal className="grid grid-cols-[64px_320px_minmax(0,1fr)] gap-8 border-b border-line py-10">
            <Mark className="pt-1.5 text-[15px]">{String(i + 1).padStart(2, '0')}</Mark>
            <div className="flex flex-col items-start gap-2.5">
              <span className="rounded-badge bg-disabled px-2.5 py-1 text-[13px] font-bold text-muted">{s.sub}</span>
              <h3 className="text-[24px] leading-snug font-bold break-keep">{s.title}</h3>
            </div>
            <dl className="grid max-w-[760px] grid-cols-[88px_minmax(0,1fr)] gap-x-5 gap-y-3.5 text-[16px] leading-[1.7]">
              <Step label="틀린 것" tone="text-error" text={s.fields['틀린 것']} />
              <Step label="알아챈 것" tone="text-ink" text={s.fields['알아챈 것']} />
              <Step label="고친 것" tone="text-success" text={s.fields['고친 것']} />
            </dl>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Step({ label, tone, text }: { label: string; tone: string; text?: string }) {
  return (
    <>
      <dt className={`pt-0.5 font-mono text-[13px] font-semibold ${tone}`}>{label}</dt>
      <dd>{text}</dd>
    </>
  )
}

/* ---------- 6. SWAN에서 배우는 것과의 연결 ---------- */
function Connect() {
  const items = section('SWAN과의 연결').items
  return (
    <Section name="making:06-connect" className="bg-sky">
      <div className="page flex flex-col gap-12 py-24">
        <div className="flex flex-col gap-3">
          <SectionTitle>이 과정에서 쓴 방법을, SWAN에서 배웁니다</SectionTitle>
          <p data-reveal className="text-[17px] text-ink/80">
            5기에 새로 생기는 "AI와 함께 만들기" 단원에서 다룹니다.
          </p>
        </div>
        <ol className="grid grid-cols-3 border-t border-ink">
          {items.map((c, i) => (
            <li key={c.title} data-reveal className={`flex flex-col gap-3 py-8 ${i > 0 ? 'border-l border-ink/20 pl-10' : 'pr-10'}`}>
              <span className="font-mono text-[14px] text-ink/70">// 이 사이트의 {c.title}</span>
              <Arrow>{c.sub}</Arrow>
              <span className="text-[16px] leading-[1.7] text-ink/85">{c.fields['설명']}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

function Arrow({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-baseline gap-2 text-[24px] font-bold">
      <span className="text-mark">→</span>
      {children}
    </span>
  )
}
