import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMe, type Me } from './api'

type MeState = { me: Me | null; reload: () => Promise<void> }

const MeContext = createContext<MeState>({ me: null, reload: async () => {} })

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const reload = useCallback(async () => {
    try {
      setMe(await getMe())
    } catch {
      setMe({ logged_in: false }) // 서버에 닿지 못해도 화면은 열람 상태로 보여준다
    }
  }, [])
  useEffect(() => {
    reload()
  }, [reload])
  return <MeContext.Provider value={{ me, reload }}>{children}</MeContext.Provider>
}

export const useMe = () => useContext(MeContext)
