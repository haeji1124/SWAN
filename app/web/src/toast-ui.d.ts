// @toast-ui/editor 3.2.2는 package.json의 exports 때문에 타입 파일을 찾지 못한다. 이 사이트가 쓰는 부분만 적어 둔다
declare module '@toast-ui/editor' {
  type Options = Record<string, unknown> & { el: HTMLElement }
  type Instance = { getMarkdown: () => string; destroy: () => void }
  export default class Editor {
    constructor(options: Options)
    getMarkdown(): string
    destroy(): void
    static factory(options: Options & { viewer?: boolean }): Instance
  }
}
declare module '@toast-ui/editor/dist/i18n/ko-kr'
