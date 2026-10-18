import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 개발 중에는 /api 요청을 FastAPI(8000)로 넘긴다. 배포할 때는 FastAPI가 dist를 함께 서비스한다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // /uploads: 완성작 이미지·발표자료 (서버 폴더)
    proxy: { '/api': 'http://127.0.0.1:8000', '/uploads': 'http://127.0.0.1:8000' },
  },
})
