# STEP 11. 구현 준비

상태: 작성 완료 (2026-10-07)
(STEP 09 Research: 미작성 — 프로토타입 우선으로 건너뜀 / STEP 10 Reference: 사용자 제작 인트로 데모 + 캐릭터 에셋)

## 기술 스택
- **React + Vite + TypeScript + Tailwind CSS** (사용자가 React에 익숙, 사내 제약 없음)
- 스크롤 애니메이션: **GSAP + ScrollTrigger** (사용자 프롬프트 지정). Framer Motion은 쓰지 않음 (GSAP으로 충분)
- 인트로 구현 프롬프트: `planning/swan/prompts/01-intro-section.md`에 보관
- 폰트: 사내망(폐쇄망)이라 Google Fonts CDN 대신 **@fontsource로 번들에 포함**
- 2단계: SSO 연동 + 백엔드(게시판·공감·신청 저장) — 스택 미정

## 디자인 방향
- 테마: **달빛 호수의 밤** (다크 프리미엄). 캐릭터 에셋과 인트로 영상 톤에서 도출
- 토큰: night `#0b1424` / deep `#13213a` / mist `#c9d6ea` / moon `#f3ead2` / glow `#7fe3e6` / amber `#e8b36a`
- 폰트: Gowun Batang(제목) · IBM Plex Sans KR(본문) · JetBrains Mono(라벨·코드)
- 카피 톤: "처음이어도, 우아하게." / "물 위에선 우아하게, 물 밑에선 열심히 코딩하기"

## 에셋
- 인트로 영상(달빛 호수, 날개 편 캐릭터), 빈 배경 plate, 날개 접기 프레임 49장(투명 webp), 캐릭터 단독 이미지
- 사용자 데모 `swan-intro.html`의 좌표 계산·타이밍을 기준으로 이식

## 데이터
- 프로토타입: 정적 예시 데이터(`src/data`) — 졸업생 수, 커리큘럼, 쇼케이스, 아이디어, 토이프로젝트
- 실물 교체 필요: 정확한 졸업생 수, 쇼케이스 실물, 부서 대표 사례

## 배포
- 사내망 전용. `npm run build` 결과물(dist)을 사내 웹서버에 정적 배포 (외부 CDN 의존 없음)
