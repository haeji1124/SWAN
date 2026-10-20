// 관리자 · 관리자 (Phase 6): 목록 · [추가](사번이나 이름으로 찾아서) · [해제]. 자기 자신은 해제할 수 없다
// 찾기는 사이트에 한 번이라도 들어온 사람(User)만 나온다. 추가·해제는 권한이 바뀌는 일이라 한 번 더 묻는다
import { useEffect, useState } from 'react'
import { useFeedback } from '../components/Feedback'
import { addAdmin, listAdmins, removeAdmin, searchUsers, type AdminUser } from '../lib/adminApi'
import { useMe } from '../lib/me'
import { track } from '../lib/track'
import { Badge, LoadState, Title, errText, useLoad } from './Admin'

const TYPE_LABEL = { employee: '직원', student: '수강생', alumni: '졸업생' }

export function AdminsAdmin() {
  const { data, error, load } = useLoad(listAdmins, [])
  const { toast, confirm } = useFeedback()
  const { reload } = useMe()
  const [q, setQ] = useState('')
  const [found, setFound] = useState<AdminUser[] | null>(null)

  // 글자를 멈추고 0.25초 뒤에 찾는다
  useEffect(() => {
    const word = q.trim()
    if (!word) return setFound(null)
    const id = window.setTimeout(() => {
      searchUsers(word)
        .then((d) => setFound(d.items))
        .catch(() => setFound([]))
    }, 250)
    return () => window.clearTimeout(id)
  }, [q])

  const add = async (u: AdminUser) => {
    const ok = await confirm({
      title: `${u.name}님을 관리자로 추가할까요?`,
      body: `${u.dept} · ${u.emp_no}. 관리자는 신청자 명단과 졸업생 사번을 포함한 관리자 화면 전체를 볼 수 있어요.`,
      confirmLabel: '추가하기',
    })
    if (!ok) return
    track('click', `admin:admins:add:${u.id}`)
    try {
      await addAdmin(u.id)
      toast(`${u.name}님을 관리자로 추가했어요`)
      setQ('')
      load()
    } catch (e) {
      toast(errText(e))
    }
  }

  const remove = async (u: AdminUser) => {
    const ok = await confirm({
      title: `${u.name}님을 관리자에서 해제할까요?`,
      body: '해제하면 바로 관리자 화면에 들어올 수 없어요. 다시 추가할 수 있어요.',
      confirmLabel: '해제하기',
      danger: true,
    })
    if (!ok) return
    track('click', `admin:admins:remove:${u.id}`)
    try {
      await removeAdmin(u.id)
      toast(`${u.name}님을 관리자에서 해제했어요`)
      load()
      await reload()
    } catch (e) {
      toast(errText(e))
    }
  }

  return (
    <div>
      <Title text="관리자" sub="관리자는 관리자 화면 전체를 쓸 수 있어요. 자기 자신은 해제할 수 없어요." />
      {!data ? (
        <LoadState error={error} onRetry={load} />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-12">
          <table className="w-full table-fixed border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-y border-ink text-[13px] text-muted">
                <th className="py-3 font-semibold">이름</th>
                <th className="font-semibold">부서</th>
                <th className="w-[110px] font-semibold">사번</th>
                <th className="w-[90px] font-semibold">유형</th>
                <th className="w-[90px] text-right font-semibold">해제</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} className="border-b border-line">
                  <td className="py-3.5 font-semibold">
                    {u.name} {u.me && <Badge tone="sky">나</Badge>}
                  </td>
                  <td className="truncate pr-4">{u.dept}</td>
                  <td className="font-mono text-[14px]">{u.emp_no}</td>
                  <td className="text-[14px] text-muted">{TYPE_LABEL[u.type]}</td>
                  <td className="text-right">
                    {u.me ? (
                      <span className="text-[13px] text-disabled-ink">해제 불가</span>
                    ) : (
                      <button type="button" onClick={() => remove(u)} className="text-[14px] font-semibold text-error underline-offset-4 hover:underline">
                        해제
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6">
            <h2 className="text-[17px] font-bold">관리자 추가</h2>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="사번이나 이름"
              aria-label="사번이나 이름으로 찾기"
              className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-[16px] outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--color-sky)]"
            />
            {found === null ? (
              <p className="text-[13px] text-muted">사이트에 한 번이라도 들어온 사람만 찾을 수 있어요.</p>
            ) : found.length === 0 ? (
              <p className="text-[14px] text-muted">"{q.trim()}"에 맞는 사람이 없어요. 이미 관리자이거나 아직 사이트에 들어온 적이 없을 수 있어요.</p>
            ) : (
              <ul className="flex flex-col">
                {found.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 border-t border-dashed border-dash py-3 first:border-t-0">
                    <span className="flex min-w-0 flex-col">
                      <span className="font-semibold">{u.name}</span>
                      <span className="truncate text-[13px] text-muted">
                        {u.dept} · {u.emp_no} · {TYPE_LABEL[u.type]}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => add(u)}
                      className="shrink-0 rounded-btn bg-sky px-3.5 py-2 text-[14px] font-bold hover:bg-sky-hover"
                    >
                      추가
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
