// 개발용 "테스트 사용자 고르기" 상자. 서버의 개발 로그인이 꺼져 있으면(/api/dev/users가 404) 나타나지 않는다.
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getHeroMode, setHeroMode } from '../lib/heroMode'
import { useMe } from '../lib/me'

type DevUser = { id: number; name: string; dept: string; type: string; is_admin: boolean }

const TYPE_LABEL: Record<string, string> = { employee: '직원', student: '수강생', alumni: '졸업생' }

export function DevUserPicker() {
  const { me, reload } = useMe()
  const [users, setUsers] = useState<DevUser[] | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    api<DevUser[]>('/api/dev/users')
      .then(setUsers)
      .catch(() => setUsers(null))
  }, [])

  if (!users) return null

  const current = me?.logged_in ? String(me.id) : 'fail'

  const pick = async (value: string) => {
    await api('/api/dev/login', {
      method: 'POST',
      body: JSON.stringify({ user_id: value === 'fail' ? null : Number(value) }),
    })
    await reload()
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[300px] rounded-dialog border border-dashed border-mark bg-surface text-[13px] shadow-dialog">
      <button
        className="flex w-full items-center justify-between px-4 py-2.5 font-mono text-muted"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>// 개발용 · 테스트 사용자</span>
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="max-h-[360px] overflow-auto border-t border-line px-2 py-2">
          {users.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-badge px-2 py-1.5 hover:bg-sky/50">
              <input type="radio" name="dev-user" checked={current === String(u.id)} onChange={() => pick(String(u.id))} />
              <span className="font-semibold">{u.name}</span>
              <span className="text-muted">{u.dept}</span>
              <span className="ml-auto font-mono text-[11px] text-mark">
                {TYPE_LABEL[u.type]}
                {u.is_admin ? '·관리자' : ''}
              </span>
            </label>
          ))}
          <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-badge border-t border-line px-2 pt-2.5 pb-1.5 hover:bg-sky/50">
            <input type="radio" name="dev-user" checked={current === 'fail'} onChange={() => pick('fail')} />
            <span className="font-semibold text-error">로그인 실패</span>
            <span className="text-muted">열람만 가능</span>
          </label>
          <div className="mt-1 flex items-center gap-2 border-t border-line px-2 pt-2.5 pb-1">
            <span className="font-mono text-muted">히어로</span>
            {(['frames', '3d'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setHeroMode(m)
                  const url = new URL(window.location.href)
                  url.searchParams.delete('hero')
                  window.location.href = url.toString()
                }}
                className={`rounded-badge px-2 py-1 ${getHeroMode() === m ? 'bg-ink text-white' : 'bg-sky'}`}
              >
                {m === 'frames' ? '그림 프레임' : '3D'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
