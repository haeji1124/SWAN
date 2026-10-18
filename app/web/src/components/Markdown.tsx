// 완성작 '자세한 설명'의 편집기와 보기 (Toast UI Editor 3.2.2, 사이트에 포함한 라이브러리).
// 무거워서(약 500KB) 이 부품이 화면에 나올 때만 불러온다. 보기는 라이브러리가 HTML을 걸러 낸다(sanitize).
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

type ToastEditor = {
  getMarkdown: () => string
  destroy: () => void
}

async function loadToast() {
  const [{ default: Editor }] = await Promise.all([
    import('@toast-ui/editor'),
    import('@toast-ui/editor/dist/toastui-editor.css'),
  ])
  await import('@toast-ui/editor/dist/i18n/ko-kr')
  return Editor
}

export type MarkdownEditorHandle = { getMarkdown: () => string }

/** 편집기. 처음 값만 받고, 쓴 내용은 ref.getMarkdown()으로 꺼낸다 */
export const MarkdownEditor = forwardRef<MarkdownEditorHandle, { initialValue?: string; height?: string }>(
  function MarkdownEditor({ initialValue = '', height = '360px' }, ref) {
    const el = useRef<HTMLDivElement>(null)
    const editor = useRef<ToastEditor | null>(null)
    const [ready, setReady] = useState(false)

    useImperativeHandle(ref, () => ({ getMarkdown: () => editor.current?.getMarkdown() ?? initialValue }), [initialValue])

    useEffect(() => {
      let alive = true
      loadToast().then((Editor) => {
        if (!alive || !el.current) return
        editor.current = new Editor({
          el: el.current,
          height,
          initialValue,
          initialEditType: 'wysiwyg',
          previewStyle: 'vertical',
          language: 'ko-KR',
          usageStatistics: false, // 사내망: 바깥으로 사용 통계를 보내지 않는다
          hideModeSwitch: false,
          toolbarItems: [['heading', 'bold', 'italic'], ['ul', 'ol', 'quote'], ['code', 'codeblock'], ['link', 'table']],
        }) as unknown as ToastEditor
        setReady(true)
      })
      return () => {
        alive = false
        editor.current?.destroy()
        editor.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <div className="swan-md">
        {!ready && <p className="font-mono text-[14px] text-muted motion-safe:animate-pulse">// 편집기를 불러오는 중…</p>}
        <div ref={el} />
      </div>
    )
  },
)

/** 보기 전용 */
export function MarkdownView({ value }: { value: string }) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let alive = true
    let viewer: ToastEditor | null = null
    loadToast().then((Editor) => {
      if (!alive || !el.current) return
      viewer = Editor.factory({ el: el.current, viewer: true, initialValue: value, usageStatistics: false }) as unknown as ToastEditor
    })
    return () => {
      alive = false
      viewer?.destroy()
    }
  }, [value])
  return <div ref={el} className="swan-md swan-md-view" />
}
