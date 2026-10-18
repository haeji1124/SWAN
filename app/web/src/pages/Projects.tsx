// 완성작 갤러리 (Phase 4): 목록 /projects · 상세 /projects/:id
// "교육 뒤의 내 모습"을 같은 부서 사람의 결과물로 보여주는, 이 사이트에서 가장 설득력 있는 증거.
// 공개된 완성작만 목록에 나온다. 승인 전 완성작은 올린 사람과 관리자만 상세를 볼 수 있다.
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { useFeedback } from '../components/Feedback'
import { MarkdownView } from '../components/Markdown'
import { Heart, ProjectCard, StatusBadge, authorLine } from '../components/ProjectParts'
import { Mark } from '../components/Section'
import { PrimaryAction } from '../components/TopNav'
import { ApiError } from '../lib/api'
import { useMe } from '../lib/me'
import {
  deleteProject,
  getProject,
  listProjects,
  myProjects,
  type ProjectCard as Card,
  type ProjectFull,
  type ProjectList,
  type ProjectSort,
} from '../lib/projectsApi'
import { track } from '../lib/track'

const errText = (e: unknown) => (e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요')

function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="text-[20px] font-bold">{what}를 불러오지 못했어요</p>
      <Button variant="secondary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  )
}

/* ================= 목록 ================= */
export function Projects() {
  const { me } = useMe()
  const [cohort, setCohort] = useState<number | null>(null)
  const [dept, setDept] = useState<string | null>(null)
  const [sort, setSort] = useState<ProjectSort>('latest')
  const [data, setData] = useState<ProjectList | null>(null)
  const [error, setError] = useState(false)
  const [fading, setFading] = useState(false)
  const [mine, setMine] = useState<Card[]>([])

  const load = useCallback(() => {
    setError(false)
    setFading(true)
    listProjects({ cohort, dept, sort })
      .then((d) => {
        setData(d)
        setFading(false)
      })
      .catch(() => setError(true))
  }, [cohort, dept, sort])
  useEffect(load, [load])

  // 졸업생에게는 내 완성작(승인 대기·반려 포함)을 위에 따로 보여 준다
  useEffect(() => {
    if (me?.logged_in && me.type === 'alumni') myProjects().then(setMine).catch(() => setMine([]))
  }, [me])

  const filter = (label: string, on: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-btn px-3.5 py-2 text-[15px] font-semibold ${on ? 'bg-ink text-white' : 'bg-sky hover:bg-sky-hover'}`}
    >
      {label}
    </button>
  )

  return (
    <section className="page pt-16 pb-32">
      <div className="flex items-end justify-between gap-8 border-b border-ink pb-8">
        <div className="flex flex-col gap-3">
          <Mark>// 졸업생이 직접 만든 업무 도구</Mark>
          <h1 className="font-display text-[54px] leading-[1.25] font-extrabold tracking-[-0.03em]">
            완성작 <span className="font-mono text-[28px] font-normal text-mark">{data ? data.total : ''}</span>
          </h1>
        </div>
        {data?.can_upload && (
          <Link
            to="/projects/new"
            onClick={() => track('click', 'projects:new')}
            className="inline-flex rounded-btn bg-ink px-[26px] py-[13px] text-[16px] font-bold text-white hover:bg-ink-hover"
          >
            완성작 올리기
          </Link>
        )}
      </div>

      {mine.length > 0 && <MineStrip items={mine} />}

      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-6 py-8">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="기수">
            {filter('전체 기수', cohort === null, () => setCohort(null))}
            {data.cohorts.map((c) => filter(`${c}기`, cohort === c, () => setCohort(c)))}
            <select
              aria-label="부서"
              value={dept ?? ''}
              onChange={(e) => setDept(e.target.value || null)}
              className="ml-3 rounded-btn border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-ink"
            >
              <option value="">모든 부서</option>
              {data.depts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 font-semibold" role="group" aria-label="정렬">
            {(['latest', 'likes'] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sort === s}
                onClick={() => setSort(s)}
                className={`px-3 py-2 text-[15px] ${sort === s ? 'text-ink underline decoration-2 underline-offset-8' : 'text-muted hover:text-ink'}`}
              >
                {s === 'latest' ? '최신순' : '좋아요순'}
              </button>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <LoadFailed what="완성작" onRetry={load} />
      ) : !data ? (
        <p className="py-10 font-mono text-[15px] text-muted motion-safe:animate-pulse">// 완성작을 불러오는 중…</p>
      ) : data.total === 0 ? (
        <div className="flex flex-col items-start gap-3 py-20">
          <p className="font-display text-[34px] font-extrabold">곧 졸업생들의 작품이 걸립니다</p>
          <p className="text-[17px] text-muted">승인된 완성작이 생기면 이곳에 모여요.</p>
        </div>
      ) : data.items.length === 0 ? (
        <p className="border-y border-line py-16 text-center text-[17px] text-muted">
          이 조건에 맞는 완성작이 아직 없어요.{' '}
          <button type="button" className="font-semibold text-ink underline underline-offset-4" onClick={() => { setCohort(null); setDept(null) }}>
            조건 지우기
          </button>
        </p>
      ) : (
        <div className={`grid grid-cols-3 gap-x-8 gap-y-12 transition-opacity duration-150 ${fading ? 'opacity-40' : ''}`}>
          {data.items.map((p) => (
            <ProjectCard key={p.id} p={p} place="projects" />
          ))}
        </div>
      )}
    </section>
  )
}

/** 졸업생의 내 완성작: 상태와 반려 이유, 고치기 */
function MineStrip({ items }: { items: Card[] }) {
  return (
    <div className="mt-8 flex flex-col gap-3 rounded-card border border-line bg-surface p-6">
      <p className="text-[17px] font-bold">내 완성작</p>
      <ul className="flex flex-col">
        {items.map((p) => (
          <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-t border-dashed border-dash py-3.5 first:border-t-0">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex items-center gap-3">
                <StatusBadge status={p.status} label={p.status_label} />
                <Link to={`/projects/${p.id}`} className="truncate text-[16px] font-semibold hover:underline">
                  {p.title}
                </Link>
              </span>
              {p.status === 'rejected' && p.reject_reason && (
                <span className="text-[14px] text-error">반려 이유: {p.reject_reason}</span>
              )}
              {p.status === 'pending' && <span className="text-[14px] text-muted">관리자가 확인하면 공개돼요</span>}
            </div>
            <Link to={`/projects/${p.id}/edit`} className="text-[15px] font-semibold underline-offset-4 hover:underline">
              {p.status === 'rejected' ? '고쳐서 다시 올리기 →' : '고치기 →'}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ================= 상세 ================= */
export function ProjectDetail() {
  const { id } = useParams()
  const [p, setP] = useState<ProjectFull | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    setError(null)
    setP(null)
    getProject(Number(id))
      .then(setP)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'notfound' : 'fail'))
  }, [id])
  useEffect(load, [load])

  return (
    <section className="page pt-12 pb-32">
      <Link to="/projects" className="font-semibold underline-offset-4 hover:underline" onClick={() => track('click', 'project:back')}>
        ← 완성작
      </Link>
      <div className="mt-8">
        {error === 'notfound' ? (
          <div className="flex flex-col items-start gap-3 py-16">
            <p className="font-display text-[34px] font-extrabold">찾는 완성작이 없어요</p>
            <p className="text-[17px] text-muted">지워졌거나 아직 공개되지 않은 완성작이에요.</p>
          </div>
        ) : error ? (
          <LoadFailed what="완성작" onRetry={load} />
        ) : !p ? (
          <p className="font-mono text-[15px] text-muted motion-safe:animate-pulse">// 완성작을 불러오는 중…</p>
        ) : (
          <>
            {p.mine && <OwnerBar p={p} />}
            <ProjectView p={p} />
          </>
        )}
      </div>
    </section>
  )
}

/** 올린 사람에게만: 상태, 반려 이유, 고치기, 지우기 */
function OwnerBar({ p }: { p: ProjectFull }) {
  const { confirm, toast } = useFeedback()
  const navigate = useNavigate()
  return (
    <div className="mb-8 flex items-center justify-between gap-6 rounded-card border border-line bg-surface px-6 py-4">
      <div className="flex items-center gap-4">
        <StatusBadge status={p.status} label={p.status_label} />
        <span className={`text-[15px] ${p.status === 'rejected' ? 'text-error' : 'text-muted'}`}>
          {p.status === 'pending' && '관리자가 확인하면 공개돼요. 그 전에는 나와 관리자만 볼 수 있어요.'}
          {p.status === 'rejected' && `반려 이유: ${p.reject_reason}`}
          {p.status === 'published' && '공개된 완성작이에요. 고치면 다시 승인을 기다려요.'}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-5">
        <Link to={`/projects/${p.id}/edit`} className="text-[15px] font-semibold underline-offset-4 hover:underline">
          고치기
        </Link>
        <button
          type="button"
          className="text-[15px] font-semibold text-error underline-offset-4 hover:underline"
          onClick={async () => {
            const ok = await confirm({
              title: '이 완성작을 지울까요?',
              body: '올린 그림과 발표자료까지 모두 지워지고 되돌릴 수 없어요.',
              confirmLabel: '지우기',
              danger: true,
            })
            if (!ok) return
            try {
              await deleteProject(p.id)
              toast('완성작을 지웠어요')
              navigate('/projects')
            } catch (e) {
              toast(errText(e))
            }
          }}
        >
          지우기
        </button>
      </div>
    </div>
  )
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line pt-8">
      <h2 className="text-[22px] font-bold">{label}</h2>
      {children}
    </div>
  )
}

/** 완성작 내용 (상세 화면과 관리자 검수 미리보기가 함께 쓴다 — 공개됐을 때와 같은 모습) */
export function ProjectView({ p, preview }: { p: ProjectFull; preview?: boolean }) {
  const [zoom, setZoom] = useState<string | null>(null)
  useEffect(() => {
    if (!zoom) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(null)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [zoom])

  return (
    <article className="flex flex-col gap-12">
      <div className="h-[520px] overflow-hidden rounded-card bg-sky">
        {p.cover && <img src={p.cover} alt={`${p.title} 대표 이미지`} className="h-full w-full object-cover" />}
      </div>

      <div className="flex items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[48px] leading-[1.25] font-extrabold tracking-[-0.03em]">{p.title}</h1>
          <p className="text-[18px]">
            <b className="font-semibold">{p.author.name}</b>
            <span className="text-muted">
              {' '}
              · {p.author.dept}
              {p.author.cohort && ` · ${p.author.cohort}기 수료`}
            </span>
          </p>
          <p className="max-w-[760px] text-[18px] text-ink/80">{p.summary}</p>
        </div>
        {p.status === 'published' && !preview && <Heart id={p.id} likes={p.likes} liked={p.liked} size="lg" />}
      </div>

      <div className="flex max-w-[980px] flex-col gap-12">
        {p.problem && (
          <Block label="무슨 문제를 풀었나">
            <p className="text-[17px] leading-[1.75] whitespace-pre-line">{p.problem}</p>
          </Block>
        )}
        {p.effect && (
          <Block label="효과">
            <p className="font-display text-[34px] leading-[1.35] font-extrabold">
              <mark className="bg-sky px-1.5 text-ink">{p.effect}</mark>
            </p>
          </Block>
        )}
        {p.screenshots.length > 0 && (
          <Block label="화면 캡처">
            <div className="grid grid-cols-3 gap-4">
              {p.screenshots.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    track('click', `project:shot:${p.id}`)
                    setZoom(s)
                  }}
                  className="overflow-hidden rounded-card border border-line bg-surface hover:border-ink"
                  aria-label={`화면 캡처 ${i + 1} 크게 보기`}
                >
                  <img src={s} alt="" loading="lazy" className="h-[180px] w-full object-cover" />
                </button>
              ))}
            </div>
            <p className="font-mono text-[13px] text-muted">// 누르면 크게 보여요</p>
          </Block>
        )}
        {p.slides && (
          <Block label="발표자료">
            <a
              href={p.slides}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('click', `project:slides:${p.id}`)}
              className="inline-flex w-fit items-center gap-3 rounded-btn bg-sky px-5 py-3 text-[16px] font-bold hover:bg-sky-hover"
            >
              발표자료 보기 <span className="font-mono text-[13px] font-normal text-muted">{p.slides.split('.').pop()?.toUpperCase()}</span>
            </a>
          </Block>
        )}
        {p.detail && (
          <Block label="자세한 설명">
            <MarkdownView value={p.detail} />
          </Block>
        )}
        {p.repo_url && (
          <Block label="저장소">
            <a href={p.repo_url} target="_blank" rel="noreferrer" className="w-fit font-mono text-[16px] break-all underline underline-offset-4">
              {p.repo_url}
            </a>
          </Block>
        )}
      </div>

      {!preview && (
        <>
          <div className="flex items-center justify-between gap-8 rounded-result bg-ink px-12 py-10 text-white">
            <div className="flex flex-col gap-2">
              <p className="font-display text-[30px] font-extrabold">나도 이런 걸 만들고 싶다면</p>
              <p className="text-[16px] text-white/75">
                {p.author.name}님도 {p.author.cohort ? `${p.author.cohort}기 ` : ''}SWAN에서 시작했어요.
              </p>
            </div>
            <PrimaryAction place="project:detail" inverse />
          </div>
          {p.related.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-[22px] font-bold">
                같은 부서·같은 기수의 다른 완성작 <span className="font-mono text-[15px] font-normal text-muted">// {authorLine(p.author)}</span>
              </h2>
              <div className="grid grid-cols-3 gap-8">
                {p.related.map((r) => (
                  <ProjectCard key={r.id} p={r} place="project:related" />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {zoom && (
        <div
          role="dialog"
          aria-label="화면 캡처 크게 보기"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-12"
          onClick={() => setZoom(null)}
        >
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-card shadow-dialog" />
          <button type="button" className="absolute top-6 right-8 text-[16px] font-semibold text-white" onClick={() => setZoom(null)}>
            닫기 ✕
          </button>
        </div>
      )}
    </article>
  )
}
