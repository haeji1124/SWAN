// 관리자 · 완성작 검수 (Phase 4): 승인 대기 목록 → 미리보기(공개됐을 때와 같은 모습) → [승인] / [반려](이유 필수)
// 공개된 완성작도 이유를 적고 내릴 수 있다. 반려·내리기 이유는 올린 사람에게 보인다.
import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { useFeedback } from '../components/Feedback'
import { StatusBadge, authorLine } from '../components/ProjectParts'
import { getProject, adminProjects, approveProject, rejectProject, type ProjectFull, type ProjectStatus } from '../lib/projectsApi'
import { track } from '../lib/track'
import { LoadState, Title, errText, useLoad } from './Admin'
import { ProjectView } from './Projects'

const TABS: { status: ProjectStatus; label: string }[] = [
  { status: 'pending', label: '승인 대기' },
  { status: 'published', label: '공개됨' },
  { status: 'rejected', label: '반려됨' },
]

export function ProjectsAdmin() {
  return (
    <Routes>
      <Route index element={<ReviewList status="pending" />} />
      <Route path="published" element={<ReviewList status="published" />} />
      <Route path="rejected" element={<ReviewList status="rejected" />} />
      <Route path="view/:id" element={<ReviewOne />} />
    </Routes>
  )
}

function ReviewList({ status }: { status: ProjectStatus }) {
  const { data, error, load } = useLoad(() => adminProjects(status), [status])
  return (
    <div>
      <Title
        text="완성작 검수"
        sub="승인하면 사내 모든 임직원에게 공개돼요. 반려할 때는 올린 사람이 고칠 수 있게 이유를 적어 주세요."
      />
      <div className="mb-6 flex gap-2" role="tablist">
        {TABS.map((t) => (
          <NavLink
            key={t.status}
            to={t.status === 'pending' ? '/admin/projects' : `/admin/projects/${t.status}`}
            end
            role="tab"
            className={({ isActive }) =>
              `rounded-btn px-4 py-2 text-[15px] font-semibold ${isActive ? 'bg-ink text-white' : 'bg-sky hover:bg-sky-hover'}`
            }
          >
            {t.label} <span className="ml-1 font-mono text-[13px] opacity-75">{data?.counts[t.status] ?? ''}</span>
          </NavLink>
        ))}
      </div>
      {!data ? (
        <LoadState error={error} onRetry={load} />
      ) : data.items.length === 0 ? (
        <p className="border-y border-line py-10 text-center text-[16px] text-muted">
          {status === 'pending' ? '승인을 기다리는 완성작이 없어요' : '아직 없어요'}
        </p>
      ) : (
        <table className="w-full table-fixed border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-y border-ink text-[13px] text-muted">
              <th className="w-[120px] py-3 font-semibold">대표 그림</th>
              <th className="font-semibold">제목</th>
              <th className="w-[280px] font-semibold">만든 사람</th>
              <th className="w-[120px] font-semibold">올린 날</th>
              {status !== 'pending' && <th className="w-[80px] text-right font-semibold">좋아요</th>}
              <th className="w-[120px] pl-6 font-semibold">검수</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="py-3">
                  <div className="h-[60px] w-[96px] overflow-hidden rounded-[8px] bg-sky">
                    {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover" />}
                  </div>
                </td>
                <td className="pr-4">
                  <span className="block truncate font-semibold">{p.title}</span>
                  {p.reject_reason && <span className="block truncate text-[13px] text-error">이유: {p.reject_reason}</span>}
                </td>
                <td className="truncate pr-4">{authorLine(p.author)}</td>
                <td className="font-mono text-[14px]">{p.created_at.replace('T', ' ').slice(5, 10)}</td>
                {status !== 'pending' && <td className="text-right font-mono">{p.likes}</td>}
                <td className="pl-6">
                  <Link
                    to={`/admin/projects/view/${p.id}`}
                    onClick={() => track('click', `admin:projects:view:${p.id}`)}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    미리보기 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ReviewOne() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, confirm } = useFeedback()
  const [p, setP] = useState<ProjectFull | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getProject(Number(id))
      .then(setP)
      .catch((e) => setError(errText(e)))
  }, [id])

  if (!p) return <LoadState error={error} onRetry={() => navigate(0)} />
  const back = p.status === 'pending' ? '/admin/projects' : `/admin/projects/${p.status}`

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true)
    try {
      await fn()
      toast(done)
      navigate(back)
    } catch (e) {
      toast(errText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-6">
        <Link to={back} className="font-semibold underline-offset-4 hover:underline">
          ← 목록으로
        </Link>
        <span className="flex items-center gap-3">
          <StatusBadge status={p.status} label={p.status_label} />
          <span className="font-mono text-[13px] text-muted">// 공개됐을 때와 같은 모습</span>
        </span>
      </div>

      <div className="rounded-dialog border border-dashed border-mark p-10">
        <ProjectView p={p} preview />
      </div>

      {/* 검수 버튼 줄: 화면 아래에 붙어 있어 긴 내용을 읽은 뒤 바로 누를 수 있다 */}
      <div className="sticky bottom-0 z-10 -mx-14 flex flex-col gap-4 border-t border-ink bg-paper px-14 py-5">
        {p.reject_reason && p.status === 'rejected' && <p className="text-[15px] text-error">반려 이유: {p.reject_reason}</p>}
        {rejecting ? (
          <div className="flex items-end gap-4">
            <label className="flex flex-1 flex-col gap-2 text-[14px] font-semibold text-muted">
              {p.status === 'published' ? '내리는 이유 (올린 사람에게 보여요)' : '반려 이유 (올린 사람에게 보여요)'}
              <textarea
                autoFocus
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 화면 캡처에 실제 장비 이름이 보여요. 가리거나 예시 데이터로 바꿔 주세요."
                className="rounded-btn border border-line bg-surface px-3 py-2.5 text-[16px] font-normal text-ink outline-none focus:border-ink"
              />
            </label>
            <Button
              variant="danger"
              disabled={!reason.trim() || busy}
              onClick={() => act(() => rejectProject(p.id, reason.trim()), p.status === 'published' ? '완성작을 내렸어요' : '반려했어요')}
            >
              {p.status === 'published' ? '내리기' : '반려하기'}
            </Button>
            <Button variant="text" onClick={() => setRejecting(false)}>
              그만두기
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {p.status === 'pending' && (
              <>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: '이 완성작을 공개할까요?',
                      body: '승인하면 사내 모든 임직원이 볼 수 있어요. 민감한 내용이 없는지 확인해 주세요.',
                      confirmLabel: '승인',
                    })
                    if (ok) act(() => approveProject(p.id), '승인했어요. 이제 갤러리에 보여요')
                  }}
                >
                  승인
                </Button>
                <Button variant="secondary" onClick={() => setRejecting(true)}>
                  반려
                </Button>
              </>
            )}
            {p.status === 'published' && (
              <Button variant="secondary" onClick={() => setRejecting(true)}>
                공개 내리기
              </Button>
            )}
            {p.status === 'rejected' && <span className="text-[15px] text-muted">올린 사람이 고쳐 다시 올리면 승인 대기로 돌아와요.</span>}
          </div>
        )}
      </div>
    </div>
  )
}
