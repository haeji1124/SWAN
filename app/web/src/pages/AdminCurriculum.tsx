// 관리자 · 커리큘럼 (Phase 6): 단원 고치기 · 실습 프로젝트 추가·수정·삭제·순서 바꾸기(미리보기 그림·영상 올리기)
// 고치면 홈의 커리큘럼 섹션(/api/home)에 바로 반영된다. 단원 수는 curriculum.md를 따르므로 더하거나 지우지 않는다
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { useFeedback } from '../components/Feedback'
import { Placeholder } from '../components/Section'
import {
  deletePractice,
  editUnit,
  getCurriculum,
  movePractice,
  savePractice,
  type AdminPractice,
  type AdminUnit,
  type PracticeForm,
} from '../lib/adminApi'
import { track } from '../lib/track'
import { Badge, LoadState, Title, errText, useLoad } from './Admin'

const inputCls =
  'w-full rounded-btn border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]'

export function CurriculumAdmin() {
  const { data, error, load } = useLoad(getCurriculum, [])
  const { toast, confirm } = useFeedback()
  const [editingUnit, setEditingUnit] = useState<number | null>(null)
  const [dialog, setDialog] = useState<AdminPractice | 'new' | null>(null)

  const move = async (p: AdminPractice, dir: 'up' | 'down') => {
    track('click', `admin:curriculum:move:${p.id}:${dir}`)
    try {
      await movePractice(p.id, dir)
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  const remove = async (p: AdminPractice) => {
    const ok = await confirm({
      title: '실습 프로젝트를 지울까요?',
      body: `"${p.title}" — 홈의 실습 프로젝트 모음에서 사라지고, 올린 미리보기 파일도 함께 지워져요. 되돌릴 수 없어요.`,
      confirmLabel: '지우기',
      danger: true,
    })
    if (!ok) return
    try {
      await deletePractice(p.id)
      toast('실습 프로젝트를 지웠어요')
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  return (
    <div>
      <Title
        text="커리큘럼"
        sub="고치면 홈의 커리큘럼 섹션에 바로 반영돼요."
        right={
          <Link to="/#curriculum" className="text-[15px] font-semibold underline-offset-4 hover:underline">
            홈에서 보기 →
          </Link>
        }
      />
      {!data ? (
        <LoadState error={error} onRetry={load} />
      ) : (
        <div className="flex flex-col gap-14">
          {/* ---------- 단원 ---------- */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[20px] font-bold">
              배우는 흐름 · 단원 <span className="font-mono text-[14px] font-normal text-muted">{data.units.length}</span>
            </h2>
            <table className="w-full table-fixed border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-y border-ink text-[13px] text-muted">
                  <th className="w-[150px] py-3 font-semibold">단계</th>
                  <th className="w-[280px] font-semibold">단원</th>
                  <th className="font-semibold">배우는 것</th>
                  <th className="w-[80px] text-right font-semibold">고치기</th>
                </tr>
              </thead>
              <tbody>
                {data.units.map((u) =>
                  editingUnit === u.id ? (
                    <UnitEditRow
                      key={u.id}
                      unit={u}
                      stages={data.stages}
                      onCancel={() => setEditingUnit(null)}
                      onSaved={() => {
                        setEditingUnit(null)
                        toast('단원을 고쳤어요. 홈에 바로 보여요')
                        load()
                      }}
                    />
                  ) : (
                    <tr key={u.id} className="border-b border-line align-top">
                      <td className="py-3.5">
                        <Badge tone={u.stage === 4 ? 'sky' : 'gray'}>{u.stage_label}</Badge>
                      </td>
                      <td className="py-3.5 pr-4 font-semibold">{u.title}</td>
                      <td className="py-3.5 pr-4 text-[14px] text-muted">
                        <span className="line-clamp-2 whitespace-pre-line">{u.content}</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button type="button" onClick={() => setEditingUnit(u.id)} className="text-[14px] font-semibold underline-offset-4 hover:underline">
                          고치기
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </section>

          {/* ---------- 실습 프로젝트 ---------- */}
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <h2 className="text-[20px] font-bold">
                실습 프로젝트 <span className="font-mono text-[14px] font-normal text-muted">{data.projects.length}</span>
              </h2>
              <Button variant="secondary" className="px-5! py-2.5! text-[15px]!" onClick={() => setDialog('new')}>
                프로젝트 추가
              </Button>
            </div>
            {data.projects.length === 0 ? (
              <p className="border-y border-line py-10 text-center text-[16px] text-muted">실습 프로젝트가 없어요. 첫 프로젝트를 추가해 주세요</p>
            ) : (
              <ol className="flex flex-col border-t border-ink">
                {data.projects.map((p, k) => (
                  <li key={p.id} className="grid grid-cols-[40px_120px_minmax(0,1fr)_180px_200px] items-center gap-5 border-b border-line py-3.5">
                    <span className="font-mono text-[14px] text-mark">{String(p.order).padStart(2, '0')}</span>
                    <Preview p={p} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-semibold">{p.title}</span>
                      <span className="truncate text-[14px] text-muted">{p.one_liner}</span>
                    </div>
                    <div className="flex min-w-0 flex-col items-start gap-1">
                      <Badge tone="sky">{p.topic}</Badge>
                      <span className="w-full truncate font-mono text-[12px] text-muted">// {p.skill}</span>
                    </div>
                    <div className="flex items-center justify-end gap-3 text-[14px] font-semibold">
                      <span className="flex">
                        <IconBtn label={`${p.title} 위로`} disabled={k === 0} onClick={() => move(p, 'up')}>
                          ↑
                        </IconBtn>
                        <IconBtn label={`${p.title} 아래로`} disabled={k === data.projects.length - 1} onClick={() => move(p, 'down')}>
                          ↓
                        </IconBtn>
                      </span>
                      <button type="button" onClick={() => setDialog(p)} className="underline-offset-4 hover:underline">
                        고치기
                      </button>
                      <button type="button" onClick={() => remove(p)} className="text-error underline-offset-4 hover:underline">
                        지우기
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
      {dialog && data && (
        <PracticeDialog
          initial={dialog === 'new' ? null : dialog}
          topics={data.topics}
          onClose={() => setDialog(null)}
          onSaved={(isNew) => {
            setDialog(null)
            toast(isNew ? '실습 프로젝트를 추가했어요. 홈 목록 맨 뒤에 보여요' : '실습 프로젝트를 고쳤어요')
            load()
          }}
        />
      )}
    </div>
  )
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-8 w-8 rounded-btn font-mono text-[15px] hover:bg-sky disabled:text-disabled-ink disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

/** 미리보기: 영상 > 그림 > 줄무늬 빈 자리 (홈과 같은 순서) */
function Preview({ p }: { p: Pick<AdminPractice, 'preview_image' | 'preview_video'> }) {
  const box = 'h-[68px] w-[120px] overflow-hidden rounded-[8px] border border-line'
  if (p.preview_video)
    return <video src={p.preview_video} poster={p.preview_image ?? undefined} muted playsInline className={`${box} object-cover`} aria-label="미리보기 영상" />
  if (p.preview_image) return <img src={p.preview_image} alt="" className={`${box} object-cover`} />
  return <Placeholder label="미리보기 없음" className={box} />  // 홈과 같은 자리 그림
}

function UnitEditRow({
  unit,
  stages,
  onCancel,
  onSaved,
}: {
  unit: AdminUnit
  stages: { value: number; label: string }[]
  onCancel: () => void
  onSaved: () => void
}) {
  const { toast } = useFeedback()
  const [f, setF] = useState({ stage: unit.stage, title: unit.title, content: unit.content })
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      await editUnit(unit.id, f)
      onSaved()
    } catch (e) {
      toast(errText(e))
      setBusy(false)
    }
  }
  return (
    <tr className="border-b border-line bg-sky/30 align-top">
      <td className="py-3 pr-3">
        <select aria-label="단계" value={f.stage} onChange={(e) => setF({ ...f, stage: Number(e.target.value) })} className={inputCls}>
          {stages.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-3">
        <input aria-label="단원 제목" value={f.title} maxLength={100} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} />
      </td>
      <td className="py-3 pr-3">
        <textarea
          aria-label="배우는 것"
          value={f.content}
          rows={3}
          onChange={(e) => setF({ ...f, content: e.target.value })}
          className={`${inputCls} resize-y`}
        />
        <span className="text-[12px] text-muted">한 줄에 하나씩 적으면 홈에서도 줄을 나눠 보여요</span>
      </td>
      <td className="py-3">
        <div className="flex flex-col items-end gap-2">
          <Button className="px-4! py-2! text-[14px]!" disabled={busy} onClick={save}>
            저장
          </Button>
          <button type="button" onClick={onCancel} className="text-[14px] font-semibold underline-offset-4 hover:underline">
            그만두기
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ---------- 실습 프로젝트 추가 · 고치기 창 ---------- */

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return setUrl(null)
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

const NEW_TOPIC = '__new__'

function PracticeDialog({
  initial,
  topics,
  onClose,
  onSaved,
}: {
  initial: AdminPractice | null
  topics: string[]
  onClose: () => void
  onSaved: (isNew: boolean) => void
}) {
  const { toast } = useFeedback()
  const [f, setF] = useState<PracticeForm>({
    title: initial?.title ?? '',
    one_liner: initial?.one_liner ?? '',
    detail: initial?.detail ?? '',
    topic: initial?.topic ?? topics[0] ?? '',
    skill: initial?.skill ?? '',
  })
  const [topicMode, setTopicMode] = useState<'pick' | 'new'>(topics.length ? 'pick' : 'new')
  const [image, setImage] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [busy, setBusy] = useState(false)
  const imageUrl = useObjectUrl(image)
  const first = useRef<HTMLInputElement>(null)
  const pickImage = useRef<HTMLInputElement>(null)
  const pickVideo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (k: keyof PracticeForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Object.values(f).some((v) => !v.trim())) return toast('칸을 모두 채워 주세요 (미리보기는 선택)')
    setBusy(true)
    try {
      await savePractice(initial?.id ?? null, f, { image, video, removeImage, removeVideo })
      onSaved(!initial)
    } catch (err) {
      toast(errText(err))
      setBusy(false)
    }
  }

  const shownImage = imageUrl ?? (removeImage ? null : initial?.preview_image ?? null)
  const shownVideo = video ? video.name : removeVideo ? null : initial?.preview_video ? '지금 올린 영상' : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-dialog-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100vh-48px)] w-[640px] flex-col gap-5 overflow-y-auto rounded-dialog bg-surface p-8 shadow-dialog"
      >
        <h2 id="practice-dialog-title" className="text-[24px] font-bold">
          {initial ? '실습 프로젝트 고치기' : '실습 프로젝트 추가'}
        </h2>
        <Row label="제목">
          <input ref={first} value={f.title} maxLength={100} onChange={set('title')} className={inputCls} placeholder="예: 테트리스" />
        </Row>
        <Row label="한 줄 설명">
          <input value={f.one_liner} maxLength={200} onChange={set('one_liner')} className={inputCls} placeholder="무엇을 만드는지 한 줄로" />
        </Row>
        <Row label="세부 내용" help="한 줄에 하나씩">
          <textarea value={f.detail} rows={4} onChange={set('detail')} className={`${inputCls} resize-y`} />
        </Row>
        <Row label="주제 묶음" help="홈의 주제 필터가 이 이름으로 묶여요">
          <div className="flex gap-2">
            {topicMode === 'pick' ? (
              <select
                aria-label="주제 묶음"
                value={f.topic}
                onChange={(e) => (e.target.value === NEW_TOPIC ? (setTopicMode('new'), setF({ ...f, topic: '' })) : setF({ ...f, topic: e.target.value }))}
                className={inputCls}
              >
                {topics.map((t) => (
                  <option key={t}>{t}</option>
                ))}
                <option value={NEW_TOPIC}>+ 새 묶음 적기</option>
              </select>
            ) : (
              <>
                <input aria-label="새 주제 묶음" value={f.topic} maxLength={50} onChange={set('topic')} className={inputCls} placeholder="새 묶음 이름" />
                {topics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => (setTopicMode('pick'), setF({ ...f, topic: topics[0] }))}
                    className="shrink-0 text-[14px] font-semibold underline-offset-4 hover:underline"
                  >
                    있는 묶음에서 고르기
                  </button>
                )}
              </>
            )}
          </div>
        </Row>
        <Row label="기르는 힘">
          <input value={f.skill} maxLength={200} onChange={set('skill')} className={inputCls} placeholder="예: 기능이 늘어도 무너지지 않는 구조" />
        </Row>
        <Row label="미리보기 그림" help="png · jpg · webp · gif, 5MB까지 (선택)">
          <div className="flex items-center gap-4">
            <span className="flex h-[68px] w-[120px] items-center justify-center overflow-hidden rounded-[8px] border border-line bg-paper text-[12px] text-muted">
              {shownImage ? <img src={shownImage} alt="" className="h-full w-full object-cover" /> : '없음'}
            </span>
            <Button type="button" variant="secondary" className="px-4! py-2! text-[14px]!" onClick={() => pickImage.current?.click()}>
              {shownImage ? '바꾸기' : '고르기'}
            </Button>
            {shownImage && (
              <button
                type="button"
                onClick={() => (setImage(null), setRemoveImage(true))}
                className="text-[14px] font-semibold text-error underline-offset-4 hover:underline"
              >
                빼기
              </button>
            )}
            <input
              ref={pickImage}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) (setImage(file), setRemoveImage(false))
                e.target.value = ''
              }}
            />
          </div>
        </Row>
        <Row label="미리보기 영상" help="mp4 · webm, 30MB까지 (선택). 홈에서 마우스를 올리면 소리 없이 재생돼요">
          <div className="flex items-center gap-4">
            <span className="min-w-[120px] font-mono text-[13px] text-muted">{shownVideo ?? '없음'}</span>
            <Button type="button" variant="secondary" className="px-4! py-2! text-[14px]!" onClick={() => pickVideo.current?.click()}>
              {shownVideo ? '바꾸기' : '고르기'}
            </Button>
            {shownVideo && (
              <button
                type="button"
                onClick={() => (setVideo(null), setRemoveVideo(true))}
                className="text-[14px] font-semibold text-error underline-offset-4 hover:underline"
              >
                빼기
              </button>
            )}
            <input
              ref={pickVideo}
              type="file"
              accept=".mp4,.webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && file.size > 30 * 1024 * 1024) toast('영상이 너무 커요 (30MB까지)')
                else if (file) (setVideo(file), setRemoveVideo(false))
                e.target.value = ''
              }}
            />
          </div>
        </Row>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            그만두기
          </Button>
          <Button type="submit" disabled={busy}>
            {initial ? '고친 내용 저장' : '추가하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Row({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
      <span className="flex flex-col pt-2">
        <span className="text-[15px] font-bold">{label}</span>
      </span>
      <div className="flex flex-col gap-1">
        {children}
        {help && <span className="text-[12px] text-muted">{help}</span>}
      </div>
    </div>
  )
}
