# 사내망 반입 안내서 (윈도우 서버)

SWAN은 **서버 하나**로 돌아간다. 파이썬 FastAPI 서버가 API와 화면(빌드한 `web/dist`)을 함께 내보낸다. 서버에는 **파이썬만** 있으면 되고, Node.js는 필요 없다(화면은 반입 전에 빌드해서 가져간다). 글꼴·그림·편집기·라이브러리는 모두 묶음 안에 있어 인터넷에 연결하지 않는다 (Phase 8에서 외부 요청을 모두 막고 24개 화면을 확인함).

```
SWAN\
├─ server\            파이썬 서버 (app\server를 그대로)
│   ├─ main.py …      서버 코드
│   ├─ data\          ← 운영 데이터: swan.db(데이터베이스), uploads\(올린 파일). 백업 대상
│   └─ .venv\         서버에서 만드는 파이썬 가상환경
├─ web\dist\          빌드한 화면 (server와 나란히 있어야 한다: main.py가 ..\web\dist를 찾는다)
└─ wheels\            인터넷 없이 설치할 파이썬 패키지
```

환경 변수 (모두 선택)

| 이름 | 기본 | 뜻 |
|---|---|---|
| `SWAN_DEV_LOGIN` | `1` | 개발용 임시 로그인. **운영은 `0`** (SSO를 붙인 뒤. docs/sso.md) |
| `SWAN_DB` | `server\data\swan.db` | 데이터베이스 파일 위치 |
| `SWAN_UPLOADS` | `server\data\uploads` | 올린 파일(완성작 그림·발표자료, 아이디어 그림, 실습 미리보기) 위치 |

---

## 1. 반입 전 (인터넷이 되는 개발 PC에서)

개발 PC는 윈도우, 파이썬 3.9 64비트(`app\server\.venv`), Node.js 20 기준이다.

0. **화면 코드 안의 가상 문구를 실제 내용으로 바꾼다** — 아래 두 파일은 관리자 화면에서 고칠 수 없고 빌드할 때 화면에 들어간다.
   - `app\web\src\data\virtual.ts`: 홈 '가르치는 사람'의 강사 이름·소개·한마디, 홈 '파트 소개'의 만든 것 세 개 (지금은 가상)
   - `app\web\src\content\making.md`: 제작 과정 화면의 글 ('AI와 나눈 대화' 숫자가 비어 있다)

1. **화면 빌드**
   ```
   cd SWAN\app\web
   npm ci
   npm run build
   ```
   `app\web\dist`가 생긴다 (약 36MB, 대부분 캐릭터 프레임과 글꼴).

2. **파이썬 패키지 받기** — 서버의 파이썬 버전에 맞춰 받는다. 서버가 파이썬 3.9 64비트라면:
   ```
   cd SWAN\app\server
   .venv\Scripts\python.exe -m pip download -r requirements.txt -d ..\..\release\wheels --only-binary=:all: --platform win_amd64 --python-version 3.9
   ```
   - `requirements.txt`는 실행에 필요한 19개만 담았다. 시험용(pytest 등)은 `requirements-dev.txt`로 따로 있어 반입하지 않는다.
   - 서버 파이썬이 다른 버전이면 `--python-version`을 바꾼다 (예: 3.11 → `3.11`). 서버에 파이썬이 없으면 같은 버전의 윈도우 설치 파일(python.org의 `python-3.9.x-amd64.exe`)도 함께 가져간다.

3. **묶기** — `release\` 폴더에 아래처럼 모은다.
   ```
   release\server\     ← app\server에서 data\, .venv\, tests\, __pycache__\, seed.py, seed_assets\ 를 뺀 나머지
   release\web\dist\   ← app\web\dist
   release\wheels\     ← 2에서 받은 것
   release\docs\       ← docs\deploy.md, docs\sso.md
   ```
   - `seed.py`·`seed_assets\`는 **가상 데이터**를 만드는 것이라 운영 서버에 가져가지 않는다 (운영 DB는 `init_db.py`로 만든다).
   - 반입 규정에 맞게 압축·검사한다.

## 2. 서버에 설치

반입한 `release\`를 서버의 `D:\SWAN\`(예시)에 푼다. 아래 명령은 명령 프롬프트(cmd) 기준.

```
cd D:\SWAN\server
python -m venv .venv
.venv\Scripts\python.exe -m pip install --no-index --find-links ..\wheels -r requirements.txt
```

`Successfully installed …`가 나오면 된다. `No matching distribution` 오류가 나면 받은 패키지의 파이썬 버전이 서버와 다른 것이다 (1-2를 서버 버전으로 다시).

## 3. 데이터베이스 만들기 (가상 데이터 없이, 처음 한 번)

```
cd D:\SWAN\server
.venv\Scripts\python.exe init_db.py --emp-no 첫관리자사번 --name 이름 --dept 부서
```

- 표를 만들고 **커리큘럼**(실제 4기 자료와 5기 단원)과 **수준 테스트 6문제**, **첫 관리자 한 명**만 넣는다.
- 이미 데이터가 있으면 아무것도 바꾸지 않고 멈춘다. 다시 만들려면 `data\swan.db`를 다른 곳으로 옮긴 뒤 실행한다.

## 4. 실행

```
cd D:\SWAN\server
set SWAN_DEV_LOGIN=0
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

- 브라우저에서 `http://서버주소:8000`을 연다. 화면과 API가 모두 이 주소 하나로 나온다.
- SSO를 붙이기 전에 화면을 시험하려면 `SWAN_DEV_LOGIN=1`로 띄워 정해진 PC에서만 연다 (켜 두면 누구나 관리자를 고를 수 있다. docs/sso.md '주의').
- 서버를 켤 때 자동으로 띄우려면 사내 정책에 맞는 방법(윈도우 서비스 등록 도구, 작업 스케줄러의 "시스템 시작 시")으로 위 명령을 등록한다. 작업 폴더는 `D:\SWAN\server`.
- 포트·방화벽·SSO 게이트웨이 연결은 사내 인프라 담당과 정한다. 헤더 방식 SSO라면 서버 포트를 직접 열지 않고 게이트웨이 뒤에만 둔다.

## 5. 업데이트할 때

1. 개발 PC에서 1-1(빌드)을 하고, 바뀐 `server\` 파일과 `web\dist\`를 가져온다 (`data\`는 가져오지 않는다).
2. 서버를 멈추고 → **`server\data\`를 백업**하고 → `server\`의 코드 파일과 `web\dist\`를 바꾸고 → 다시 띄운다.
3. 패키지가 바뀌었으면(`requirements.txt`가 달라졌으면) 2의 pip 명령을 다시 실행한다.
4. 데이터 모델(표)에 칸이 더해진 업데이트라면 사전에 개발 쪽에서 옮기는 방법을 함께 준비한다 (지금은 표를 새로 만드는 방식만 있다. 아래 '남은 일').

## 6. 백업

- `server\data\swan.db`(데이터베이스)와 `server\data\uploads\`(올린 파일) 두 가지만 있으면 모두 되살릴 수 있다.
- 서버를 잠깐 멈추고 두 개를 함께 복사하는 것이 가장 안전하다.

## 7. 실제 데이터 넣는 순서

`init_db.py`로 만든 첫 관리자로 들어가 관리자 화면(상단 메뉴 '관리자')에서 넣는다.

1. **관리자 지정** — '관리자' 메뉴. 다른 운영자를 사번이나 이름으로 찾아 추가한다. 찾기는 **사이트에 한 번이라도 들어온 사람만** 나오므로, 먼저 그 사람이 한 번 접속하게 한다.
2. **기수** — '기수' 메뉴에서 지난 기수(1~4기, 종료)와 이번 기수(5기)를 날짜·요일·시간과 함께 만들고, 모집 기간이 되면 5기의 [모집 열기]. 모집 중인 기수는 하나만 열린다. 모집이 열리면 모든 사람의 상단 버튼이 [신청하기]가 된다.
3. **졸업생 명단** — '졸업생' 메뉴에서 엑셀(이름·부서·기수·사번)을 올린다. 미리보기에서 잘못된 줄·중복을 확인한 뒤 올리기. 사번으로 사용자와 이어져, 그 사람이 졸업생이 된다(완성작 올리기·토이프로젝트).
4. **커리큘럼** — '커리큘럼' 메뉴에서 단원 내용을 확인하고, 실습 프로젝트마다 미리보기 그림·영상을 올린다 (지금은 모두 자리 그림).
5. **수준 테스트 문제** — '수준 테스트' 메뉴에서 강사와 검토한 내용으로 고친다.
6. **기수별 완성작** — 졸업생에게 기수마다 1개씩 올려 달라고 부탁하고, '완성작 검수'에서 승인한다 (홈의 '졸업생이 만든 것들'이 채워진다).
7. 확인: 직원 한 명으로 홈 → 수준 테스트 → 신청 → 접수 완료까지, 관리자로 '신청자'에서 그 신청이 보이는지.

## 8. 문제가 생기면

| 증상 | 확인할 것 |
|---|---|
| 화면이 안 나오고 `{"detail":"Not Found"}`만 나온다 | `web\dist`가 `server`와 나란히 있는지 (`D:\SWAN\web\dist\index.html`) |
| 화면은 나오는데 "불러오지 못했어요"가 뜬다 | 서버 창의 오류 메시지. `data\` 폴더에 쓰기 권한이 있는지 |
| 모두 "로그인이 필요해요" | `SWAN_DEV_LOGIN=0`인데 SSO가 아직 안 붙은 상태. docs/sso.md |
| 그림·파일 올리기가 실패한다 | `data\uploads\` 쓰기 권한, 파일 크기(그림 5MB, 발표자료 30MB, 영상 30MB) |
| 한글이 깨져 보이는 명령 출력 | 명령 프롬프트에서 `chcp 65001` 후 다시 (화면에는 영향 없음) |

## 남은 일 (반입 전에 정할 것)
- SSO 연동 방식 확인과 `auth.current_user()` 수정 (docs/sso.md)
- 서버 자동 실행 방법과 포트·게이트웨이 (사내 인프라 담당)
- 데이터 모델이 바뀌는 업데이트를 위한 옮기기 방법 (지금은 없음)
