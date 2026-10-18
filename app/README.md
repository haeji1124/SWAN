# SWAN 웹사이트 — 구현

기획과 규칙은 `CLAUDE.md`(= `planning/v3-1013/CLAUDE.md`의 복사본), 작업 순서는 `planning/v3-1013/claude-code-prompt.md`.

## 구조
```
app/
  server/   FastAPI + SQLAlchemy + SQLite
    main.py     API와 빌드된 화면 서비스
    auth.py     인증 (지금은 개발용 임시 로그인, SSO로 바꿀 때 이 파일만 고친다)
    models.py   데이터 모델 15개
    db.py       DB 연결 (server/data/swan.db)
    seed.py     가상 데이터 (모두 지어낸 이름·사번·부서)
  web/      React + Vite + TypeScript + Tailwind CSS
    src/index.css         디자인 값(색·글꼴·모서리)을 모은 곳
    src/lib/              서버 호출, 로그인 상태(me), 기록(track)
    src/components/       상단 메뉴, 주 행동 버튼, 확인 창·토스트, 개발용 사용자 고르기
    src/pages/            화면
```

## 처음 한 번
```bash
cd app/server
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python seed.py
cd ../web
npm install
```

## 개발할 때
두 개를 함께 띄운다. 화면은 http://localhost:5173 (Vite가 `/api`를 8000으로 넘긴다).
```bash
cd app/server && .venv/Scripts/python -m uvicorn main:app --reload --port 8000
cd app/web && npm run dev
```
화면 오른쪽 아래 "개발용 · 테스트 사용자" 상자에서 사용자를 바꾼다. "로그인 실패"도 고를 수 있다.

## 배포 모양으로 보기
화면을 빌드하면 FastAPI 하나가 화면과 API를 함께 서비스한다 (http://localhost:8000).
```bash
cd app/web && npm run build
cd ../server && .venv/Scripts/python -m uvicorn main:app --port 8000
```
개발용 임시 로그인을 끄려면 서버를 띄울 때 환경 변수 `SWAN_DEV_LOGIN=0`.
