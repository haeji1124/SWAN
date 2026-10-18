// 공통 부품: 화면 구석의 짧은 확인 메시지(토스트)와 "정말 하시겠어요?" 확인 창
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'

type ConfirmOptions = {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type FeedbackState = {
  toast: (message: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackState>({
  toast: () => {},
  confirm: async () => false,
})

export const useFeedback = () => useContext(FeedbackContext)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null)

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })),
    [],
  )

  const close = (ok: boolean) => {
    dialog?.resolve(ok)
    setDialog(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed top-24 right-6 z-50 flex flex-col items-end gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-btn bg-ink px-5 py-3 text-[15px] text-white shadow-dialog animate-[toast-in_.2s_ease-out]"
          >
            <span className="font-mono text-sky">✓</span>
            {t.message}
          </div>
        ))}
      </div>
      {dialog && <ConfirmDialog {...dialog} onClose={close} />}
    </FeedbackContext.Provider>
  )
}

function ConfirmDialog({
  title,
  body,
  confirmLabel = '확인',
  cancelLabel = '그만두기',
  danger,
  onClose,
}: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30" onClick={() => onClose(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-[400px] rounded-dialog bg-surface p-7 shadow-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-[21px] font-bold">
          {title}
        </h2>
        {body && <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={() => onClose(false)}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => onClose(true)}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
