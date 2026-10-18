// 완성작 올리기 /projects/new · 고치기 /projects/:id/edit (졸업생만, Phase 4)
// 올리면 승인 대기 → 관리자가 승인하면 공개. 공개된 것을 고치면 다시 승인 대기.
// "민감한 내용이 없는지 확인했습니다"에 체크해야 올릴 수 있다. 파일 종류·크기는 서버가 다시 확인한다.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { useFeedback } from '../components/Feedback'
import { MarkdownEditor, type MarkdownEditorHandle } from '../components/Markdown'
import { Mark } from '../components/Section'
import { ApiError } from '../lib/api'
import { useMe } from '../lib/me'
import { createProject, getProject, updateProject, type ProjectFull } from '../lib/projectsApi'
import { track } from '../lib/track'

const SUMMARY_MAX = 80
const MAX_SHOTS = 8
const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif'
const SLIDES_ACCEPT = '.pdf,.ppt,.pptx'
const MB = 1024 * 1024

const inputCls =
  'w-full rounded-btn border border-line bg-surface px-4 py-3 text-[16px] outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]'

function Field({ label, need, help, error, children }: { label: string; need?: boolean; help?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-8 border-t border-line py-7">
      <div className="flex flex-col gap-1 pt-2.5">
        <span className="text-[17px] font-bold">
          {label} {need ? <span className="text-error">필수</span> : <span className="text-[14px] font-normal text-muted">선택</span>}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {children}
        {error ? <p className="text-[13px] font-semibold text-error">{error}</p> : help && <p className="text-[13px] text-muted">{help}</p>}
      </div>
    </div>
  )
}

/** 고른 이미지 파일의 미리보기 주소 (화면을 떠나면 정리한다).
 *  만들기와 정리를 같은 effect에서 해야, 개발 모드의 두 번 실행(StrictMode)에서도 지운 주소를 쓰지 않는다 */
function usePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return setUrl(null)
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

export function ProjectForm() {
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const { me } = useMe()
  const [orig, setOrig] = useState<ProjectFull | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!editId) return
    getProject(editId)
      .then((p) => (p.mine ? setOrig(p) : setLoadError('내가 올린 완성작만 고칠 수 있어요')))
      .catch(() => setLoadError('완성작을 불러오지 못했어요'))
  }, [editId])

  let body: ReactNode
  if (me === null) body = null
  else if (!me.logged_in) body = <Blocked title="로그인이 필요해요" text="로그인한 졸업생만 완성작을 올릴 수 있어요." />
  else if (me.type !== 'alumni') body = <Blocked title="완성작은 졸업생만 올릴 수 있어요" text="SWAN을 수료하면 내가 만든 도구를 이곳에 올릴 수 있어요." />
  else if (loadError) body = <Blocked title={loadError} text="" />
  else if (editId && !orig) body = <p className="font-mono text-[15px] text-muted motion-safe:animate-pulse">// 완성작을 불러오는 중…</p>
  else body = <Form orig={orig} />

  return (
    <section className="page pt-12 pb-32">
      <Link to={editId ? `/projects/${editId}` : '/projects'} className="font-semibold underline-offset-4 hover:underline">
        ← {editId ? '완성작으로' : '완성작'}
      </Link>
      <div className="mt-8 max-w-[1040px]">{body}</div>
    </section>
  )
}

function Blocked({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-16">
      <p className="font-display text-[34px] font-extrabold">{title}</p>
      {text && <p className="text-[17px] text-muted">{text}</p>}
      <Link to="/projects" className="mt-3 font-semibold underline underline-offset-4">
        완성작 보러 가기 →
      </Link>
    </div>
  )
}

function Form({ orig }: { orig: ProjectFull | null }) {
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const editor = useRef<MarkdownEditorHandle>(null)
  const [f, setF] = useState({
    title: orig?.title ?? '',
    summary: orig?.summary ?? '',
    problem: orig?.problem ?? '',
    effect: orig?.effect ?? '',
    repo_url: orig?.repo_url ?? '',
  })
  const [cover, setCover] = useState<File | null>(null)
  const [keepShots, setKeepShots] = useState<string[]>(orig?.screenshots ?? [])
  const [newShots, setNewShots] = useState<File[]>([])
  const [slides, setSlides] = useState<File | null>(null)
  const [removeSlides, setRemoveSlides] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const coverUrl = usePreview(cover)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })

  const checkImage = (file: File, what: string) => {
    if (file.size > 5 * MB) return `${what}이(가) 너무 커요 (5MB까지)`
    if (!/\.(png|jpe?g|webp|gif)$/i.test(file.name)) return `${what}은(는) png, jpg, webp, gif 파일만 올릴 수 있어요`
    return null
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = '제목을 적어 주세요'
    if (!f.summary.trim()) e.summary = '짧은 설명을 적어 주세요'
    if (!f.problem.trim()) e.problem = '무슨 문제를 풀었는지 적어 주세요'
    if (!orig && !cover) e.cover = '대표 이미지를 골라 주세요'
    if (f.repo_url.trim() && !/^https?:\/\/\S+$/.test(f.repo_url.trim())) e.repo_url = 'http:// 또는 https:// 로 시작하는 주소를 적어 주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setServerError(null)
    if (!validate()) return
    const body = new FormData()
    Object.entries(f).forEach(([k, v]) => body.append(k, v))
    body.append('detail', editor.current?.getMarkdown() ?? '')
    body.append('confirmed', String(confirmed))
    if (cover) body.append('cover', cover)
    newShots.forEach((s) => body.append('screenshots', s))
    if (slides) body.append('slides', slides)
    if (orig) {
      body.append('keep_screenshots', JSON.stringify(keepShots))
      body.append('remove_slides', String(removeSlides))
    }
    setSaving(true)
    track('click', orig ? `project:edit:${orig.id}` : 'project:create')
    try {
      const p = orig ? await updateProject(orig.id, body) : await createProject(body)
      toast(orig ? '고쳤어요. 관리자가 확인하면 다시 공개돼요' : '올렸어요. 관리자가 확인하면 공개돼요')
      navigate(`/projects/${p.id}`)
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요')
    } finally {
      setSaving(false)
    }
  }

  const shotCount = keepShots.length + newShots.length

  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      <div className="flex flex-col gap-3 pb-8">
        <Mark>// {orig ? '완성작 고치기' : '완성작 올리기'}</Mark>
        <h1 className="font-display text-[48px] leading-[1.25] font-extrabold tracking-[-0.03em]">
          {orig ? orig.title : '내가 만든 도구를 보여 주세요'}
        </h1>
      </div>

      {/* 맨 위 안내 (기획: 민감 정보) */}
      <div className="mb-10 flex flex-col gap-2 rounded-card bg-warning-bg px-7 py-6 text-[16px] leading-[1.7]">
        <p className="font-bold text-warning">올리기 전에 확인해 주세요</p>
        <p>등록한 완성작은 관리자 승인을 거쳐 사내 모든 임직원에게 공개됩니다.</p>
        <p>화면 캡처나 설명에 공정 조건, 장비 정보, 수율, 고객사·제품명처럼 민감한 내용이 보이면 지우거나 가린 뒤 올려 주세요.</p>
        <p>가리기 어려우면 실제 데이터 대신 예시 데이터로 바꾼 화면을 써도 좋습니다.</p>
        {orig?.status === 'published' && <p className="mt-1 font-semibold">공개된 완성작을 고치면 다시 승인을 기다려요.</p>}
      </div>

      <Field label="제목" need error={errors.title}>
        <input value={f.title} onChange={set('title')} maxLength={100} className={inputCls} placeholder="예: 설비 로그 자동 요약기" />
      </Field>
      <Field label="짧은 설명" need error={errors.summary} help={`카드에 마우스를 올리면 보이는 한두 줄 · ${f.summary.length} / ${SUMMARY_MAX}`}>
        <input value={f.summary} onChange={set('summary')} maxLength={SUMMARY_MAX} className={inputCls} placeholder="무엇을 해 주는 도구인지 한두 줄로" />
      </Field>
      <Field label="대표 이미지" need error={errors.cover} help="png · jpg · webp · gif, 5MB까지. 갤러리 카드와 상세 맨 위에 보여요">
        <div className="flex items-end gap-5">
          <div className="h-[150px] w-[220px] shrink-0 overflow-hidden rounded-card border border-line bg-sky">
            {(coverUrl || orig?.cover) && <img src={coverUrl ?? orig?.cover ?? ''} alt="" className="h-full w-full object-cover" />}
          </div>
          <FilePick
            accept={IMAGE_ACCEPT}
            label={cover || orig ? '다른 이미지 고르기' : '이미지 고르기'}
            onPick={(files) => {
              const msg = checkImage(files[0], '대표 이미지')
              if (msg) return setErrors({ ...errors, cover: msg })
              setErrors({ ...errors, cover: '' })
              setCover(files[0])
            }}
          />
        </div>
      </Field>
      <Field label="무슨 문제를 풀었나" need error={errors.problem}>
        <textarea value={f.problem} onChange={set('problem')} rows={4} className={inputCls} placeholder="이 도구가 없을 때 무엇이 불편했나요?" />
      </Field>
      <Field label="효과" help="예: 주 2시간 → 5분">
        <input value={f.effect} onChange={set('effect')} maxLength={200} className={inputCls} />
      </Field>
      <Field label="화면 캡처" help={`png · jpg · webp · gif, 한 장 5MB, ${MAX_SHOTS}장까지 · ${shotCount} / ${MAX_SHOTS}`} error={errors.shots}>
        <div className="flex flex-wrap gap-3">
          {keepShots.map((s) => (
            <Thumb key={s} src={s} onRemove={() => setKeepShots(keepShots.filter((x) => x !== s))} />
          ))}
          {newShots.map((s, i) => (
            <FileThumb key={`${s.name}-${i}`} file={s} onRemove={() => setNewShots(newShots.filter((_, k) => k !== i))} />
          ))}
          {shotCount < MAX_SHOTS && (
            <FilePick
              accept={IMAGE_ACCEPT}
              multiple
              label="캡처 더하기"
              onPick={(files) => {
                const bad = files.map((x) => checkImage(x, '화면 캡처')).find(Boolean)
                if (bad) return setErrors({ ...errors, shots: bad })
                const room = MAX_SHOTS - shotCount
                setErrors({ ...errors, shots: files.length > room ? `${MAX_SHOTS}장까지라 ${room}장만 더했어요` : '' })
                setNewShots([...newShots, ...files.slice(0, room)])
              }}
            />
          )}
        </div>
      </Field>
      <Field label="발표자료" help="PDF 또는 PPT 한 개, 30MB까지" error={errors.slides}>
        <div className="flex items-center gap-5">
          {slides ? (
            <span className="font-mono text-[15px]">{slides.name}</span>
          ) : orig?.slides && !removeSlides ? (
            <a href={orig.slides} target="_blank" rel="noreferrer" className="font-mono text-[15px] underline underline-offset-4">
              지금 올린 발표자료
            </a>
          ) : (
            <span className="text-[15px] text-muted">없음</span>
          )}
          <FilePick
            accept={SLIDES_ACCEPT}
            label={slides || orig?.slides ? '다른 파일 고르기' : '파일 고르기'}
            onPick={(files) => {
              const x = files[0]
              if (x.size > 30 * MB) return setErrors({ ...errors, slides: '발표자료가 너무 커요 (30MB까지)' })
              if (!/\.(pdf|pptx?)$/i.test(x.name)) return setErrors({ ...errors, slides: 'PDF 또는 PPT 파일만 올릴 수 있어요' })
              setErrors({ ...errors, slides: '' })
              setSlides(x)
              setRemoveSlides(false)
            }}
          />
          {(slides || (orig?.slides && !removeSlides)) && (
            <button
              type="button"
              className="text-[15px] font-semibold text-error"
              onClick={() => {
                setSlides(null)
                setRemoveSlides(true)
              }}
            >
              빼기
            </button>
          )}
        </div>
      </Field>
      <Field label="저장소 주소" error={errors.repo_url}>
        <input value={f.repo_url} onChange={set('repo_url')} className={`${inputCls} font-mono`} placeholder="https://" />
      </Field>
      <div className="flex flex-col gap-4 border-t border-line py-7">
        <span className="text-[17px] font-bold">
          자세한 설명 <span className="text-[14px] font-normal text-muted">선택 · 만든 과정, 쓰는 법, 배운 것</span>
        </span>
        <MarkdownEditor ref={editor} initialValue={orig?.detail ?? ''} />
      </div>

      <div className="flex flex-col gap-5 border-t border-ink pt-8">
        <label className="flex cursor-pointer items-center gap-3 text-[17px] font-semibold">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="size-5 accent-[#1f2a44]" />
          민감한 내용이 없는지 확인했습니다
        </label>
        {serverError && (
          <p role="alert" className="text-[15px] font-semibold text-error">
            {serverError}
          </p>
        )}
        <div className="flex items-center gap-6">
          <Button type="submit" disabled={!confirmed || saving}>
            {saving ? '올리는 중…' : orig ? '고쳐서 다시 올리기' : '올리기'}
          </Button>
          {!confirmed && <span className="text-[14px] text-muted">확인에 체크하면 올릴 수 있어요</span>}
        </div>
      </div>
    </form>
  )
}

function FilePick({ accept, label, multiple, onPick }: { accept: string; label: string; multiple?: boolean; onPick: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onPick(files)
          e.target.value = ''
        }}
      />
      <Button type="button" variant="secondary" className="px-4! py-2.5!" onClick={() => input.current?.click()}>
        {label}
      </Button>
    </>
  )
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative h-[96px] w-[140px] overflow-hidden rounded-card border border-line bg-surface">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="이 캡처 빼기"
        className="absolute top-1.5 right-1.5 rounded-badge bg-ink/85 px-2 py-0.5 text-[12px] font-bold text-white"
      >
        빼기
      </button>
    </div>
  )
}

function FileThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = usePreview(file)
  return url ? <Thumb src={url} onRemove={onRemove} /> : null
}
