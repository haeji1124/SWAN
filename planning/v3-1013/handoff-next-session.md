# 다음 세션 시작 프롬프트 (2026-10-19 갱신 · Phase 5 완료 뒤)

아래 "붙여넣을 프롬프트"를 새 세션 첫 메시지로 그대로 붙여 넣는다. 작업 폴더는 `C:\Users\sungj\OneDrive\바탕 화면\SWAN`.

---

## 붙여넣을 프롬프트

SWAN 사내 교육 사이트 작업을 이어서 하자. 지금은 Phase 5(아이디어 보드·토이프로젝트)까지 끝났고, 다음은 **Phase 6 제작 과정 화면, 커리큘럼 관리, 관리자 추가**야. 이걸로 모든 기능이 완성돼. 먼저 아래 파일들을 읽고 지금 상태를 파악해 줘.

1. `app/CLAUDE.md` — 사이트 규칙과 디자인 원칙
2. `planning/v3-1013/handoff-next-session.md` — 이 파일. 한 일, 남은 일, 주의할 점(특히 '렌더 주의', 서버 관련 항목, 'Phase 5 완료')
3. `planning/v3-1013/claude-code-prompt.md`의 **Phase 6** — 제작 과정 7개 구획, 커리큘럼·관리자 메뉴, 수용 기준
4. `design/direction-a/구현-전달.md` — 방향 A 디자인 값
5. `docs/devlog/README.md`(18단계까지)와 `planning/v3-1013/build-log.md` — 제작 과정 화면의 재료 (특히 '막혔던 순간과 해결'은 build-log에서)
6. 지금 자리만 있는 곳: `/making`(`app/web/src/App.tsx`의 Placeholder), 관리자 '커리큘럼'·'관리자' 메뉴(`pages/Admin.tsx`의 MENU에서 phase 6). 커리큘럼 데이터는 `server/curriculum_seed.py`와 `/api/home`의 units·projects, 홈 화면은 `pages/home/`의 커리큘럼 섹션. 관리자 화면 모양은 Phase 5의 `pages/AdminBoards.tsx`, 파일 올리기는 Phase 4의 `projects_api.py`(save_file) 참고

읽은 뒤 먼저 개발 서버 두 개(`.claude/launch.json`의 `swan-server`, `swan-web`)를 띄우고 홈, `/ideas`, `/toys`가 뜨는지 확인해. 8000·5173·5174 포트를 지난 세션 서버가 잡고 있으면 명령줄을 확인해 SWAN 것만 끄고 다시 띄워 (다른 프로젝트가 5173을 쓸 때가 있음). 그다음 Phase 6 계획을 짧게 보여 주고, 내가 정해야 할 것이 있으면 그것만 물어본 뒤 시작해 줘.

Phase 6에서 할 것 (claude-code-prompt.md 기준):
- `/making`: 머리말 → 숫자로 보는 제작 → 타임라인(기획 → 화면 구조 → 디자인 → 구현 → 다듬기) → 실제로 쓴 프롬프트([펼쳐 보기]·[복사하기]·[전체 프롬프트 보기]) → 막혔던 순간과 해결 → SWAN 단원과의 연결 → [신청하기]. 내용은 `web/src/content/making.md` 같은 파일 하나에서 읽어 와 글만 바꿔도 화면이 바뀌게. 사내 정보는 넣지 않고, 확정되지 않은 숫자는 비워 두고 표시
- 관리자 커리큘럼: 단원 수정, 실습 프로젝트 추가·수정·삭제·순서 바꾸기(미리보기 그림·영상 올리기 포함) → 홈에 바로 반영
- 관리자 메뉴: 목록, [추가](사번이나 이름으로 찾기), [해제](자기 자신은 안 됨)
- 서버 자동 시험을 `app/server/tests/`에 더하고 (임시 DB·임시 업로드 폴더, `tests/conftest.py`), 화면은 puppeteer 캡처(`tools/shot/`)로 확인
- 끝나면 GitHub 비공개 저장소 `haeji1124/SWAN`에 커밋하고 올린다 (design/ 원본·node_modules·.venv·DB는 .gitignore로 빠짐)

지킬 것:
- 크레딧이 드는 생성(Higgsfield)은 내가 말할 때만 한다. 외부 도구 프롬프트에 회사·부서 이름이나 실명을 넣지 않는다. 화면 문구와 설명은 한국어로
- 캐릭터(블렌더)를 고치거나 새 동작을 만들면 **정지 그림 한 장으로 먼저 확인받고** 나서 프레임을 뽑는다
- 화면이 바뀌는 작업은 비포·애프터를 찍어 `docs/devlog/README.md`에 단계로 남긴다. AI가 틀렸다가 바로잡은 일은 `planning/v3-1013/build-log.md`에 세 줄로
- 손으로 시험하느라 개발 DB를 바꿨으면 끝에 `app/server`에서 `.venv/Scripts/python.exe seed.py`로 가상 데이터를 되돌린다
- 코드 스타일은 작은따옴표, 세미콜론 없음 (prettier를 기본 설정으로 돌리지 말 것)
- 주 버튼(ink)은 한 화면에 하나. 메뉴의 [신청하기]가 늘 보이니 화면 안의 행동은 보조 버튼(sky)으로 (Phase 5에서 정함. 폼 제출과 창 안의 버튼은 예외)
- 작업 중간에 띄우는 진행 글도 모두 한국어로
- Phase가 끝나면 무엇을 만들었는지와 확인하는 방법을 요약하고, 이 파일의 '붙여넣을 프롬프트'를 다음 단계(Phase 7 디자인 다듬기·3D)에 맞게 고쳐 둔다

---

## 지금까지 한 일

### 기획·디자인 (완료)
- 기획 v3 완료. 디자인 방향 **A 개발자의 노트**로 확정 (미색 종이 #fbfaf7, ink #1f2a44, sky #d6ecfb, 줄 번호, `//` 주석, 하늘색 형광펜)
- 글꼴: NanumSquareRound(제목) · Pretendard(본문) · JetBrains Mono(줄 번호·주석, 한글은 Pretendard로 이어짐). 모두 사이트에 포함
- 수준 테스트 빠진 화면(5번 주관식, 6번 문제 다시, 6번 해설)은 Claude Design 대신 **구현하면서 직접 그리기로 함** (Phase 3). 참고용 명세: `planning/v3-1013/prompts/06-design-missing-screens.md`

### 구현
- **Phase 0 완료**: `app/server`(FastAPI + SQLite, Python 3.9 venv `.venv`), `app/web`(React 18 + Vite 6 + Tailwind 4). 데이터 모델 15개, 가상 데이터(`server/seed.py`, 사용자 12·기수 5·졸업생 120), 임시 로그인(`server/auth.py`, 쿠키 + 화면 오른쪽 아래 개발용 상자), 방문·섹션·클릭 기록(`web/src/lib/track.ts`), 상단 메뉴와 상태별 주 버튼
- **Phase 1 완료**: 홈 10개 섹션 (`web/src/pages/home/`). `/api/home`이 모집 상태·숫자·커리큘럼(`server/curriculum_seed.py`)을 준다. 완성작·아이디어는 아직 가상 데이터(`web/src/data/virtual.ts`)
- **히어로 리뉴얼 (Phase 7 일부를 앞당김)**: `web/src/pages/home/Hero.tsx`
  - 스크롤하면 화면이 멈추고 오리가 어린 백조로 변신(260vh 고정 구간). 변신 중 머리 위에 `>_ SWAN` 로고, 문구·이름표 변화, "나는 법" 형광펜
  - 두 방식: **그림 프레임(기본)** = `public/frames/`(duck-idle·duck-wave·instructor-idle·cygnet-idle·transform 61장) / **3D** = `Hero3D.tsx` + `public/models/{duck,instructor,cygnet}.glb` (react-three-fiber, NeutralToneMapping). 전환: 주소 `?hero=3d` 또는 개발용 상자
  - 캐릭터 무대 860×760을 오른쪽 단 크기에 맞춰 통째로 줄인다(`Stage`). 3D Canvas는 `resize={{offsetSize:true}}` 필수(안 하면 두 번 줄어듦)
  - 사용자 의견: 그림 프레임이 더 자연스럽다고 함. 아직 확정은 아님

### 캐릭터 (블렌더 `design/3d/swan/swan.blend`에 전부 있음)
- 오리(`duck_clean` + `duckling_v2_rig`), 강사 백조(`instructor_clean` + `instructor_rig`, 남색 니트 조끼+흰 셔츠 깃), 어린 백조 "3개월 뒤의 나"(`cygnet_clean` + `cygnet_rig`, 강사와 같은 모양에서 조끼·깃을 지운 맨몸), 알에서 나온 오리(`hatchling`, 뼈대 없음)
- 움직임 4개(idle·wave·tilt·hop)가 NLA 트랙으로 들어 있다. 웹용 GLB는 `design/3d/clean/*-clean-rigged.glb` → `npx @gltf-transform/cli@4.1.1 optimize <in> <out> --texture-compress false --simplify false --compress false` → `python tools/glb_tex.py <out> <out> 1024` (텍스처 1024)
- 블렌더 안에 도우미 코드가 텍스트로 저장돼 있다: `clean_tools`(단색 다시 칠하기·틈 메우기), `rebuild_tools`(리메시·굽기·가중치 옮기기), `smooth_tools`(Taubin 다듬기), `despeckle_tools`. `exec(bpy.data.texts['이름'].as_string())`로 불러 쓴다
- 2026-10-16에 "깨져 보임"을 고침: 텍스처를 단색 팔레트로 다시 칠함 → 리메시(voxel 0.006) → Taubin 다듬기 → 색 굽기 → 가중치 옮김. 날개는 흰색 통일, 노트북만 연회색
- 렌더 설정: EEVEE, 색 처리 **Khronos PBR Neutral**, 직교 카메라 ortho_scale 2.6, 방향 (0.3,-1,0.08). 오리 크기 0.68, 어린 백조 0.95, 강사 1.0
- 정지 그림: `web/public/images/`(instructor-stand, stage-1~3 webp). 원본 `design/stages-3d/`, `design/hero-3d/`

### 쓴 크레딧
- 변신 영상(Kling 3.0 Omni Frames, pro, 1:1, 5초) 6.25 + 배경 제거(video_background_remover) 1, 네 번 = 29. 캐릭터 3D 생성 등은 그 전에 사용

## 2026-10-16 오전 세션에서 한 일
- 결정: 히어로는 **그림 프레임(기본)과 3D(`?hero=3d`) 둘 다 유지**. 2번 영상은 **나중에**. 3번 모험길은 진행
- **모험길 섹션 완성**: `web/src/pages/home/Journey.tsx` (홈의 커리큘럼과 수준 테스트 사이, 섹션 기록 이름 `home:06b-journey`). 홈 섹션이 10개 → 11개가 됨 (CLAUDE.md·기획 문서에는 아직 반영 안 함)
  - 이정표: Higgsfield GPT Image 2.5, 투명 바탕, **1.5크레딧**. 원본·프롬프트 `design/milestones/`, 사이트용 `public/images/journey/signpost-1~4.webp`
  - 걷기: `swan.blend`에 다리 뼈 `leg.L`/`leg.R`(오리·어린 백조), 동작 `duckling_v2_walk`·`cygnet_walk`·`hatchling_walk`(알째로 뒤뚱, `hatchling_root` 빈 객체 아래로 옮김), 강사 날개에 깃발(`prop_flag_pole`, `prop_flag_cloth`). 렌더용 직교 카메라 `walk_cam`. 수정 전 백업 `design/3d/swan/swan-backup-before-walk.blend`
  - 렌더 원본 `design/walk/{hatchling,duck,cygnet,instructor}/` → 정사각형으로 잘라 `public/frames/walk-*/000~023.webp` (360px, 네 캐릭터 같은 바닥선)
  - 스크롤 캡처: `tools/shot/journey.cjs`(진행 0·30·60·100%), `tools/shot/region.cjs`(특정 섹션 근처 한 화면)
  - 홈은 데이터가 들어온 뒤 `ScrollTrigger.refresh()`를 부른다 (안 하면 아래쪽 고정 구간 위치가 틀어짐)
- devlog 시작: `docs/devlog/README.md` 1단계
- **히어로 변신 정리** (devlog 2단계): 그림 프레임 히어로의 기본 변신을 "펑"(오리가 움츠렸다 컨페티와 함께 어린 백조로, 변신 정도 50%)으로 바꿈. 예전 영상 변신은 `?morph=video`로 비교 가능 — **영상을 다시 뽑을지(약 7.25크레딧) 사용자가 비교 후 결정 예정**
  - 백조·강사 날개 얼룩 지운 텍스처 `design/3d/clean/{cygnet,instructor}-baked-v2.png` (블렌더에 연결됨). 히어로 숨쉬기·모험길·stage-3를 다시 렌더. 예전 그림은 `design/hero-frames/_old-before-wingfix/`
  - 히어로 숨쉬기 렌더 기준(다시 찾은 값): 720², 직교 2.6, 방향 (0.3,-1,0.08), 숨쉬기 동작 1~71을 2칸씩, 백조 크기 0.939, 발이 바닥(z=-0.95)에 닿게, 카메라 shift_y 13/720, shift_x 백조 2/720 · 강사 -4/720
  - **백조 재질 교체** (devlog 3단계): `cygnet_clean`·`instructor_clean`은 이제 텍스처 대신 재질 `flat_cls` 하나 + 색 속성 `cls`(정점마다 R=남색 G=주황 B=검정 A=노트북 비율, 0.5 넘으면 그 색)를 쓴다. 예전 재질은 fake user로 남아 있음. 백업 `design/3d/swan/swan-backup-before-flatmat.blend`. **오리(duck_clean)·알에서 나온 오리·웹 3D용 GLB는 아직 예전 텍스처** — GLB로 내보내려면 색 속성을 텍스처로 굽거나 정점 색으로 내보내야 함
  - 캐릭터를 고친 뒤에는 정지 그림 한 장으로 사용자 확인을 받고 나서 묶음 렌더한다 (사용자 요청)
  - **귓속말 변신** (devlog 4단계): 오리도 `flat_cls_duck`로 교체. 새 동작 `instructor_whisper`(쿼터니언, 24장). 새 프레임 `public/frames/duck-tilt`(27장, 6번째가 가장 기움)·`instructor-whisper`(24장). 손 흔들기 두 번. 순서와 구간 값은 `Hero.tsx` 위쪽 주석(`leanAt`·`tiltAt`·`WHISPER_FROM`·`POP_AT`), 코드 꼬리표 길은 `KNOWLEDGE_PATH`(무대 좌표), 움직임은 `index.css`의 `knowledge`
  - **렌더 주의**: 원래 동작(idle·wave·tilt·hop)은 오일러 회전, 내가 만든 walk·whisper는 쿼터니언. 렌더 전에 뼈 회전 방식을 동작에 맞춰야 한다 (블렌더 세션의 `set_mode`). 안 맞추면 회전이 무시돼 프레임이 멈춰 있다
  - 캡처 `tools/shot/story.cjs` (손 흔들기 1·2번째, 변신 정도 0.1·0.3·0.5·0.58·0.67·0.9)
- **연출 다듬기** (devlog 5·6단계):
  - 히어로: 고정 구간 340vh, 귓속말 0.16~0.64, 커리큘럼 용어 꼬리표 12개, 알록달록 별빛(노랑 없이), 변신 뒤 0.78에서 어린 백조(`cygnet-wave`)와 강사(`instructor-wave-high`, 노트북 든 채 왼쪽 날개를 높이)가 함께 손 흔들기
  - 강사 소개: `instructor-teach` 36장 반복 + 3초마다 바뀌는 말풍선 (`TopSections.tsx`)
  - 수준 테스트: CSS 들썩임·뒤뚱·콩 뛰기 (`index.css`의 breathe·wobble·hop)
  - 모험길: 배경 4장(Higgsfield GPT Image 2.5, 3D 게임풍, 원본 `design/journey-bg/scene-1~4.png`, 사이트 `public/images/journey/bg-1~4.webp`)이 이정표마다 바뀜. 이름표 머리 위, 알 단계 통통. 도착하면 가운데로 나와 학사모 씌우기(`cap-scene` 84장) → 44장째 꽃비(`components/PetalRain.tsx`) → 제자리
  - 블렌더: `cap_root`(학사모 6조각 묶음), 동작 `instructor_teach`·`instructor_wave_high`·`instructor_whisper`. 학사모 장면은 파이썬으로 한 장씩 자세를 정해 렌더(세션 안 함수, 파일에는 저장 안 됨). 백업 `swan-backup-before-flatmat.blend`
  - 쓴 크레딧: 배경 시안 2장 3 + 장면 4장 6 = 9 (이정표 1.5 포함 오늘 10.5)
- **강사 눈웃음·스크롤 고정** (devlog 7단계): 히어로 변신 뒤 강사는 `instructor-smile`(눈웃음 숨쉬기 36장). 눈웃음은 재질 `flat_cls`의 `smile_mix`(객체 속성 `smile` 0~1로 `cls`와 `cls_smile`의 검정 값을 섞음) + 곡선 `smile_arc0/1`(평소 hide_render). 모험길 축하 중 `lockScroll()`로 휠·터치·키를 막고 54번째 장면에서 푼다
  - **렌더 주의 2**: 렌더 전에 `clear_pose(rig)`로 뼈 자세를 모두 초기화할 것 (안 하면 앞 동작의 값이 남는다). 걷기 그림을 다시 자르면 `Journey.tsx`의 `WALK_CROP`도 crop_walk.py 출력값으로 바꿀 것
  - 캡처 `tools/shot/pop.cjs` (움츠림 · 펑 직후 · 끝). `hero.cjs`는 히어로가 메뉴 아래 88px에서 시작하는 걸 빼고 계산하니 진행값이 조금 작게 찍힌다

## Phase 2 완료 (2026-10-16 저녁)
- 서버: `apply_api.py`(신청·취소·알림), `admin_api.py`(관리자: 기수·신청자·졸업생·엑셀). 엑셀 올리기는 요청 본문 그대로(multipart 없음). `/api/me`에 `interested`, `/api/home` 모집 정보에 `start_label`·`class_day`·`class_time`
- 화면: `pages/Apply.tsx`(/apply, 상단 메뉴 대신 로고+나가기), `pages/Admin.tsx`(/admin/*), `lib/adminApi.ts`. 상단 버튼 취소·알림 동작(`TopNav.tsx`)
- 시험: `app/server/tests/test_phase2.py` 13개 (`.venv/Scripts/python.exe -m pytest tests -q`, 임시 DB 사용). 화면 흐름 `tools/shot/phase2.cjs` — 개발 DB를 바꾸므로 끝나면 `python seed.py`
- UI 체크리스트(홈): 남은 수정 필요 2묶음 — 긴 이름 시험, ④⑩ 0·1개 상태 (`docs/ui-review/home.md`)

## Phase 3 완료 (2026-10-16 밤)
- 서버: `quiz_api.py`(문제는 정답 없이 내려주고 제출하면 서버가 채점 · 첫 응시 `is_first` · 로그인 실패면 기록 안 함 · 관리자 문제 목록/추가/수정 · 응시 결과 표), `quiz_seed.py`(level-test.md 6문제 그대로). `QuizQuestion`에 `title`·`line_notes` 칸을 더했다(개발 DB는 `seed.py`로 다시 만든다). 응시 기록 `answers`에는 문제마다 답과 그때의 판정(correct/partial/wrong)을 함께 남긴다. 신청자 표에 `quiz_first_score`와 `quiz_total`
- 가상 응시 기록 5건 (송다인 5→6, 황현우 3, 오지유 1, 졸업생 1명 6)
- 화면: `pages/Quiz.tsx`(/quiz, 상단 메뉴 대신 로고+진행+나가기), `pages/AdminQuiz.tsx`(/admin/quiz, /admin/quiz/attempts), `components/Code.tsx`(prism-react-renderer 2.4.1, 줄 번호·줄 색·줄 고르기), `components/RichText.tsx`(상황 설명·해설용 짧은 마크다운: ```error/```log 상자, ### 소제목, 표, ==형광펜==, > 강사 한마디, {{better_code}} 자리), `lib/quizApi.ts`. 결과 카드 뒤집기는 `index.css`의 `.flip`
- [← 이전] [다음]은 보기·입력 칸·코드 바로 아래에 있다 (2026-10-18 사용자 요청으로 아래 고정 줄을 없앰)
- 2026-10-18: ③ 숫자 섹션만 가운데 정렬. 모험길 축하 중에는 스크롤 위치 자체를 붙잡는다(`Journey.tsx`의 `lockScroll(holdY)`). 확인 `tools/shot/walkstop.cjs` (devlog 15단계)
- 시험: `tests/test_phase3.py` 25개 (모두 38개 통과). 화면 흐름 `tools/shot/phase3.cjs <url> <out> [quiz|admin|all]` — 응시 기록이 쌓이므로 끝나면 `seed.py`. 주소별 첫 화면 `tools/shot/pages.cjs <url> <out> <userId|fail> /path=name ...` (Git Bash에서는 앞에 `MSYS_NO_PATHCONV=1`을 붙여야 `/quiz`가 윈도우 경로로 바뀌지 않는다)
- Git Bash의 python heredoc은 한글이 많으면 cp949로 읽혀 실패할 때가 있다 → 파일 편집은 Edit 도구로
- 남은 것: 추천 기초 자료 3개는 가상, 문제 내용은 강사 검토 전, 결과 화면 캐릭터 움직임 없음(정지 그림 + CSS 숨쉬기)

## Phase 4 완료 (2026-10-18 밤)
- 서버: `projects_api.py`(목록·필터·정렬, 상세, 좋아요 토글, 졸업생 올리기/고치기/지우기, 관리자 승인·반려·내리기, 홈 `showcase` 5개). 파일은 `python-multipart`로 받아 `data/uploads`(`SWAN_UPLOADS`로 바꿀 수 있음)에 저장하고 `/uploads`로 내보낸다. Vite 프록시에 `/uploads` 추가. 가상 완성작 대표 그림은 `app/server/seed_assets/project-1~6.webp` → seed가 `uploads/seed/p1~p8/`로 복사
- 화면: `pages/Projects.tsx`(목록·상세·`ProjectView`), `pages/ProjectForm.tsx`(올리기·고치기), `pages/AdminProjects.tsx`(검수), `components/ProjectParts.tsx`(카드·하트·상태 배지), `components/Markdown.tsx`(Toast UI Editor 3.2.2, 필요할 때만 불러옴, 타입은 `src/toast-ui.d.ts`)
- 마지막 신청 섹션의 날아오르는 어린 백조: `public/frames/cygnet-fly` 61장, `BottomSections.tsx`의 `FlyingCygnet`(2026-10-19부터 날아올라 로고를 띄운 뒤 내려앉음, 아래 참고). 원본·합성 `design/fly/`(compose.py). 쓴 크레딧 7.25
- 모험길: 설명 문구를 제목 아래로. 축하 중 스크롤 붙잡기는 위에서 걸어 내려와 닿았을 때만(`lastP`). `tools/shot/region.cjs`는 훑어 내려간 뒤 4초 기다린다
- 시험: `tests/test_phase4.py` 15개 (모두 53개). 화면 흐름 `tools/shot/phase4.cjs` — DB와 업로드 폴더를 바꾸므로 끝나면 `seed.py`
- GitHub: 비공개 저장소 https://github.com/haeji1124/SWAN (main). `.gitignore`로 design/·public/·node_modules·.venv·data/ 제외, `core.autocrlf false`
- 캡처할 때 화면 아래 오른쪽 개발용 사용자 상자가 버튼을 가릴 수 있다 → 누르기 전에 화면 가운데로 옮긴다

## 날아오른 백조 · 로고 (2026-10-19)
- 사용자 의견: 꼭대기 날갯짓만 반복해서 "날다가 실패하는 것 같다" → 날아오름 → 머리 위 `>_ SWAN` 로고 → 날갯짓 두 번 → 같은 프레임을 거꾸로 돌려 내려앉음(로고는 남음). 크레딧 없음. `BottomSections.tsx`의 `FLY_SEQ`, 로고는 공용 `components/SwanLogo.tsx`(히어로도 씀). 확인 `tools/shot/fly.cjs <url> <출력 앞부분> [초,초,…]` (devlog 17단계)
- 내려앉기는 이륙을 거꾸로 돌린 것이라 날개 접는 모양이 이륙과 같다. 더 자연스러운 착지가 필요하면 착지 영상을 따로 만들어야 함(크레딧)
- 같은 날 "너무 길다"는 의견으로 약 15초 → 8초 (초당 16장, 날갯짓 한 번, 내려앉기는 한 장씩 건너뜀. devlog 19단계)

## Phase 5 완료 (2026-10-19)
- 서버: `ideas_api.py`(공감순·최신순, 남기기/고치기/지우기, 공감 토글, 관리자 상태·한 줄 답변·숨기기, 홈 `ideas` 3개), `toys_api.py`(글쓰기·참여는 수강생·졸업생만, 참여 토글, 희망자는 글쓴이만, 고치기·지우기·마감·다시 열기, 관리자 숨기기). Idea 상태에 `held`(보류)를 더함
- 화면: `pages/Ideas.tsx`(/ideas, 남기기 창), `pages/Toys.tsx`(/toys, /toys/:id, /toys/new, /toys/:id/edit), `pages/AdminBoards.tsx`(관리자 아이디어·토이), `components/BoardParts.tsx`(상태 배지·[나도 필요해요]), `lib/boardApi.ts`. 홈 ⑩은 실제 데이터 + 0개·1개 상태. `data/virtual.ts`의 가상 아이디어는 지움
- 가상 데이터: 아이디어 8개(공감한 사람을 정해 둬서 시험에서 누가 눌렀는지 앎), 모집 글 3개 (`seed.py`의 IDEAS·TOYS)
- 시험: `tests/test_phase5.py` 15개 (모두 69개, 그림 첨부 포함). 화면 흐름 `tools/shot/phase5.cjs <url> <out>` — 개발 DB를 바꾸므로 끝나면 `seed.py`
- 사용자 결정: 토이 글쓴이는 고치기·지우기·다시 열기까지 된다. 게시판 행동 버튼은 보조 버튼(주 버튼은 메뉴 [신청하기] 하나)
- 아이디어 그림 첨부 (사용자 요청, devlog 19단계): 3장·5MB·그림만, 창에서 Ctrl+V 붙여넣기도 됨. 남기기·고치기는 multipart(`keep_images`로 남길 그림 주소), 파일 검사·저장은 `projects_api`의 `save_file` 재사용, 폴더 `uploads/ideas/`. `Idea.images` 칸을 더해서 예전 개발 DB면 `seed.py`로 다시 만들어야 한다 (시험 69개)
- UI 체크리스트(홈) 남은 수정 필요: 06-1 긴 이름·부서 시험 하나
- 남은 작은 것: 완성작 목록의 [완성작 올리기]가 아직 주 버튼(메뉴와 두 개)
- Git Bash에서 python heredoc 문자열에 `C:\Users` 같은 경로를 넣으면 `\U`가 이스케이프로 읽혀 실패한다 → 한글·경로가 든 문서 편집은 Edit 도구로

## 남은 일 (순서대로 제안)
1. 모험길 다듬기(선택): 머리말과 길 사이 여백, 강사 깃대가 날개에서 조금 떨어져 보임, 이정표 번호가 작음
2. ~~2번 영상~~: 2026-10-18 완료 (마지막 신청 섹션의 날아오르는 어린 백조)
3. 그 밖의 생동감: 강사 섹션 갸웃, 숫자 섹션 오리 고개 내밀기, 접수 완료 오리 뛰기
4. ~~Phase 5~~: 2026-10-19 완료 → Phase 6(제작 과정·커리큘럼 관리·관리자 추가) → Phase 7 → Phase 8

## 주의할 점 (겪은 문제)
- 지난 세션의 개발 서버가 8000·5174를 잡은 채 남아 있을 수 있다. 그러면 새 서버가 8001로 뜨는데, Vite는 8000으로 넘기므로 옛 서버가 응답한다. 포트를 쓰는 프로세스의 명령줄을 확인하고 SWAN 것만 끈 뒤 다시 띄운다 (5173은 다른 프로젝트가 쓰고 있을 수 있음)
- 데스크톱 앱이 개발 서버를 시간이 지나면 끈다. "연결이 안 된다"고 하면 `preview_start`로 `swan-server`, `swan-web`을 다시 띄운다. 5173이 막혀 있어 화면은 보통 5174
- uvicorn `--reload`가 한글 경로에서 바뀐 코드를 못 읽을 때가 있다. 서버 코드를 고치면 `preview_stop` 후 다시 띄운다
- Higgsfield: 큰 파일을 올리면 접수 전에 멈춘다 → 영상은 720px로 줄여서 올리고, `--wait` 없이 접수한 뒤 `generate get`으로 확인. `multi_image_to_3d`는 `--enable_pbr false --enable_animation false --enable_rigging false`를 꼭 붙인다
- 배경 제거 결과는 검은 바탕 mp4로 오고 노트북까지 지운다 → "바깥 바탕 지우기(flood fill)"와 합쳐서 투명 프레임을 만든다 (`design/transform4/` 작업 참고)
- 블렌더에서 텍스처를 고친 뒤에는 **새 이미지로 불러와 연결**해야 내보낸 GLB에 반영된다 (묶여 있던 원본이 그대로 나가는 문제)
- 헤드리스 캡처는 `tools/shot/`의 puppeteer-core 스크립트(hero.cjs: 히어로 스크롤 단계별, sizes.cjs: 창 크기별, shot.cjs: 홈 전체, reduced.cjs: 움직임 줄이기, interact.cjs: 커리큘럼 동작). 처음 한 번 `tools/shot`에서 `npm install`. 출력 파일은 실행한 폴더에 생긴다
- 섹션 도달 기록은 비율이 아니라 rootMargin으로 잰다 (화면보다 긴 섹션 때문)
- ffmpeg는 `scratchpad/tools`의 imageio-ffmpeg 바이너리를 썼다. 새 세션에서는 scratchpad가 비어 있을 수 있으니 다시 설치(`pip install --target <폴더> imageio-ffmpeg==0.5.1`)
