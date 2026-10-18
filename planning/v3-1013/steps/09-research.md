# STEP 09. Research — SWAN 웹사이트

진행: 완료 (적용 방향 4가지를 사용자가 채택)

조사일: 2026-10-14. 웹 조사는 Claude가 WebSearch로 진행했다. 사용자 본인의 사전 조사는 없다. 2차 기획(2026-10-12) 때 조사한 내용은 아래 "2차 기획 조사에서 가져온 것"에 그대로 옮겼다. 원문 조사 보고서를 직접 확인한 것은 Stack Overflow 설문뿐이고, 나머지 수치는 2차 자료(요약 기사, 업체 글)에서 왔으므로 사이트에 인용하기 전에 원문을 확인해야 한다.

## 주제별 다각도 조사서 (3차에서 새로 조사)

### 01 문제(Problem) 조사 — AI가 짠 코드를 사람이 검토하지 않으면 어떤 문제가 생기는가
- 🕵️ 무엇을 조사했는가: "AI generated code security vulnerabilities study", "Stack Overflow developer survey trust accuracy of AI tools almost right" 로 검색. Stack Overflow 2025 개발자 설문 AI 편은 원문을 직접 확인했다.
- 🔍 무엇을 새로 알게 되었는가
  - 개발자의 84%가 AI 도구를 쓰거나 쓸 계획이다. 그런데 AI 결과의 정확성을 불신하는 사람(다소 불신 26.1% + 매우 불신 19.6%)이 신뢰하는 사람(다소 신뢰 29.6% + 매우 신뢰 3.1%)보다 많다. ([Stack Overflow 2025 Developer Survey — AI](https://survey.stackoverflow.co/2025/ai))
  - 가장 흔한 불만은 **"거의 맞지만 딱 맞지는 않는 AI 답"(66%)**이고, 45.2%는 **"AI가 만든 코드를 디버깅하는 데 시간이 더 든다"**고 답했다. (같은 출처)
  - 전문 개발자조차 이렇다. 코드를 읽는 훈련이 덜 된 사람은 "거의 맞는" 코드의 틀린 곳을 찾기가 더 어렵다고 볼 수 있다. (추론, 직접 근거 없음)
  - 보안 관점: GitHub Copilot에게 보안 관련 상황 89개를 주고 프로그램 1,689개를 만들게 한 초기 연구에서 약 40%에 취약점이 있었고, 2026년의 다른 연구는 6개 모델 522개 표본 중 25.7%에서 취약점을 확인했다고 한다. 두 수치는 모델·과제·표본이 달라 직접 비교할 수 없고, 둘 다 2차 자료로만 확인했다. ([Developers Have Been Shipping AI-Generated Vulnerabilities Since 2021](https://levelup.gitconnected.com/developers-have-been-shipping-ai-generated-vulnerabilities-since-2021-d1c93c3787b9), [AI Code Security](https://appsecsanta.com/ai-code-security))
- 💡 어떻게 프로젝트에 적용할 것인가 (제안)
  - "판단할 눈"이라는 핵심 주장의 근거로 Stack Overflow 수치를 쓴다. 홈의 한 줄 소개 근처나 수준 테스트 마지막 문제 해설에 "개발자 3명 중 2명이 '거의 맞지만 틀린 AI 답'을 겪는다"를 넣는다
  - 수준 테스트 마지막 문제를 **"거의 맞지만 한 군데가 틀린 코드"**로 낸다. 설문에서 가장 흔한 불만과 같은 상황이다
  - 제작 과정 화면의 "막혔던 순간과 해결"도 같은 주제로 묶는다

### 02 시장·트렌드(Market) 조사 — 비개발 직군의 AI 코딩(바이브코딩)은 어떤 흐름인가
- 🕵️ 무엇을 조사했는가: "vibe coding non-developers citizen developers enterprise trend survey 2026" 로 검색
- 🔍 무엇을 새로 알게 되었는가
  - 바이브코딩 플랫폼(Lovable, Taskade 등)이 스스로 밝힌 수치로는 사용자의 60% 남짓이 비개발자다. 업체 자체 보고라 참고 수준이다. ([Vibe Coding Demographics 2026](https://13labs.au/blog/vibe-coding-demographics-2026))
  - 한 업체 설문(임원 50명, 표본이 작음)에서 기업의 50%가 "운영·기획·분석 같은 비개발 조직이 AI로 사내 앱을 만들고 있다"고 답했다. ([Superblocks 보고서 보도](https://www.galvnews.com/70-of-engineering-leaders-say-ai-won-t-replace-engineers-reveals-new-superblocks-report/article_a6b750ac-9748-535a-8f81-51d0fc3f514d.html))
  - 반면 전문 개발자 쪽은 신중하다. Stack Overflow 설문에서 72%가 "바이브코딩을 하지 않는다"고 답했다. ([Stack Overflow 2025 Developer Survey — AI](https://survey.stackoverflow.co/2025/ai))
  - 정리: 비개발 직군이 AI로 직접 만드는 흐름은 커지고 있지만, 믿을 만한 독립 조사는 적고 업체 자료가 대부분이다. 사내의 실제 상황(AI 코딩 도구 도입 여부, 사용 방침)이 가장 중요한 근거인데 아직 확인하지 못했다.
- 💡 어떻게 프로젝트에 적용할 것인가 (제안)
  - "왜 지금인가"는 외부 통계보다 **사내 사정**으로 말한다. 사내 AI 도구 도입 현황이나 방침을 확인해 넣는다 (TODO)
  - 사이트 문구에 업체발 수치는 쓰지 않는다. 쓰더라도 Stack Overflow 원문 수치만 쓴다
  - "전문 개발자도 바이브코딩에 신중하다"는 점은 SWAN의 접근(Python 중고급을 먼저 다지고 바이브코딩을 배운다)을 뒷받침한다

### 03 기존 서비스(Competitor) 분석 — 수준 진단 테스트를 둔 교육 사이트는 어떻게 구성하고, 효과가 있는가
- 🕵️ 무엇을 조사했는가: "placement quiz skill assessment course landing page conversion", "placement test before enrollment level test quiz funnel case study" 로 검색
- 🔍 무엇을 새로 알게 되었는가
  - **수준 테스트가 신청을 늘린다는 독립적인 측정 결과는 찾지 못했다.** "퀴즈가 일반 자료보다 2~3배 잘 전환된다"는 주장은 있으나 출처를 밝히지 않은 업체 글이다. ([Learnybox](https://learnybox.com/blog/how-to-sell-an-online-course-with-a-quiz-funnel/), [Ruzuku](https://www.ruzuku.com/learn/tools/ai/chatgpt-quiz-funnel))
  - 교육 기관은 수준 테스트를 홍보가 아니라 **알맞은 과정으로 안내하는 용도**로 쓴다. 괴테 인스티투트는 온라인 배치 테스트로 사전 지식을 확인하고 알맞은 과정을 고르게 하고, 멜버른 대학은 7개 언어의 온라인 배치 테스트 결과를 수강 신청 시스템과 연결한다. ([Goethe-Institut](https://goethe.de/ins/nz/en/spr/kur/tst.html), [University of Melbourne](https://arts.unimelb.edu.au/language-testing-research-centre/research/projects/language-placement-test-review))
- 💡 어떻게 프로젝트에 적용할 것인가 (제안)
  - 수준 테스트의 효과를 미리 장담하지 않는다. 대신 **직접 잰다**: 테스트 시작 수, 완료 수, 결과 단계별 신청 비율을 기록한다 (STEP 04 지표와 방문 기록으로 가능)
  - 결과는 "합격/불합격"이 아니라 "알맞은 다음 걸음 안내"로 준다. 교육 기관의 쓰임새와 같고, 이미 정한 성장 단계 방식과 맞는다
  - 테스트는 짧게(6문제), 결과는 바로 보여준다

### 04 사용자(User) 조사
- 🕵️ 무엇을 조사했는가: 따로 웹 조사를 하지 않았다. 사용자가 제공한 4기 자료(인원, 모집 대상, 참여 부서)가 가장 직접적인 근거다 (STEP 01, 03에 기록)
- 🔍 새로 알게 된 것: 4기 65명, 주 1회 온라인 3개월, 반도체 공정·개발·품질 부서의 엔지니어가 본업과 병행
- 💡 적용: 페르소나와 섹션 구성에 이미 반영. 연차 분포와 1~3기 인원은 미확인 (TODO)

## 기술 제약과 대응
- 사내망이라 외부 인터넷이 없다 → 라이브러리, 글꼴, 이미지, 영상을 모두 사이트에 포함한다. 외부 링크를 쓰지 않는다
- 3D는 느린 사내 PC에서 버벅일 수 있다 → 3D는 한두 곳에만 쓰고, 느리면 정지 이미지로 바꾼다

## 정리: 그래서 우리 서비스의 자리는
전문 개발자도 3명 중 2명이 "거의 맞지만 틀린 AI 답"을 겪는다. AI로 코드를 만드는 일은 쉬워졌지만 그 결과를 판단하는 일은 여전히 사람 몫이다. SWAN 사이트는 이 사실을 수준 테스트의 마지막 문제와 제작 과정 화면으로 직접 체험하게 하고, 사내 강사가 사내 환경에 맞춰 그 눈을 길러 준다는 것을 졸업생의 완성작으로 보여준다.

## 아직 확인하지 못한 것
- 사내 AI 코딩 도구 도입 현황과 회사 방침 ("왜 지금인가"의 근거)
- 사내 SSO 연동 방식
- 방문 기록을 개인 단위로 남겨도 되는지
- 사내 서버 환경과 반입 절차
- 사내 PC의 사양 (3D가 돌아가는지)
- 수준 테스트가 신청을 늘리는지 → 오픈 후 직접 측정
- 보안 취약점 비율 등 2차 자료로만 확인한 수치의 원문

## 2차 기획 조사에서 가져온 것 (2026-10-12, 그대로 유효)
2차 때는 8주 파견 과정과 3D 중심 랜딩을 전제로 조사했다. "8주", "파견" 같은 표현은 지금 기획과 다르지만 조사 결과 자체는 그대로 쓸 수 있다.

### 영역별 조사

#### 기존 서비스 — 교육 홍보 사이트는 신청 망설임을 어떻게 줄이는가
- 무엇을 조사했나: 부트캠프·강의 랜딩페이지 구성 사례와 조언, SSAFY의 홍보 방식
- 새로 알게 된 것
  - 실제 사용자가 왜 쓰고 좋아하는지 같은 증거를 먼저 보여주고, 글로만 설명하지 말고 스크린샷·표·예제로 보여주라는 조언. 행동 유도 버튼은 충분한 정보를 준 뒤에 두어야 하며, 너무 이르거나 큰 버튼은 이탈 원인으로 꼽힌다. ([200개의 랜딩페이지를 Roasting 하고 배운 것](https://news.hada.io/topic?id=4275))
  - 교육 상품은 방문자의 질문이 많다. 무엇을 배우는지, 누가 가르치는지, 현실적인 결과가 무엇인지, 신청이 어떻게 진행되는지 순서대로 답하는 구성이 권장된다. 일반적인 칭찬보다 구체적인 결과가 담긴 후기가 강하고, 주 행동 버튼은 하나로 두라고 한다. ([Online Course Landing Page Examples](https://superprofile.bio/blog/course-landing-page-design-inspiration), [Cohort Launch System 템플릿](https://northstar.cosmicthemes.com/landing-2/), [Education landing page optimization](https://www.gitnexa.com/blogs/education-landing-page-optimization))
  - 부트캠프 전용 가이드는 기수 중심 구성으로 졸업생 실제 사례 3~5건, 기수 일정, 신청 폼, 긴 FAQ를 든다. ([Tech bootcamp landing guide](https://kolonell.com/en/blog/tech-bootcamp-africa-landing-student-recruitment-2026))
  - SSAFY는 수료생 인터뷰와 프로젝트 사례(예: 특화 프로젝트에서 만든 유아 한글 교육 앱), 누적 수료생·취업률 같은 숫자로 교육 성과를 알린다. ([삼성 CSR SSAFY 스토리](https://csr.samsung.com/ko/story/inspiring-journeys/꿈을-현실로-만드는-기회), [한경 매거진 기사](https://magazine.hankyung.com/money/article/202510135992c))
- 프로젝트에 어떻게 적용하나
  - 랜딩에서 완성작 미리보기를 커리큘럼보다 앞에 둔 현재 순서를 유지한다
  - 완성작 상세는 "무슨 문제 → 스크린샷 → 절감 수치" 구조로 구체적 결과를 보여준다
  - 오픈 시 실제 졸업생 사례를 최소 3~5건 확보한다 (STEP 04의 "오픈 시 5건" 목표와 일치)
  - 주 행동은 "신청하기" 하나로 두고, 히어로의 신청 버튼은 작게, 정보를 다 본 페이지 끝의 버튼을 크게 한다
  - FAQ에 예비 수강생의 걱정(수준, 파견 부담, 교육 후 기대)을 직접 다룬다
  - 성과 요약(2단계)에 기수 수·졸업생 수·완성작 수를 숫자로 보여준다

#### 시장·기술 — 브라우저 3D의 성능 제약
- 무엇을 조사했나: three.js / react-three-fiber 성능 관리와 저사양 대응
- 새로 알게 된 것
  - 드로우콜 권장 한도는 출처마다 다르다 (프레임당 100 미만 ~ 데스크톱 300 미만). 경험칙일 뿐이므로 실제 대상 PC에서 측정해야 한다. ([100 Three.js Tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips), [three.js 포럼](https://discourse.threejs.org/t/how-to-improve-three-js-performance-with-react-three-fiber/69562))
  - 같은 물체가 많으면 인스턴싱으로 드로우콜을 줄이고, 프레임마다 객체를 새로 만들지 않으며, 형상·재질을 공유한다. ([Three.js performance best practices](https://metadesignsolutions.com/blog/threejs-performance-optimization-best-practices))
  - 저사양 대응은 단계형이 일반적이다: 전체 → 축소 → 최소 → 정지 이미지. 프레임 속도를 실행 중에 재서 느리면 단계를 내린다. 픽셀 비율 제한과 그림자·후처리 끄기가 첫 단계다. 단, 대체 화면이 최적화를 대신하지는 않는다. ([저사양 기기 대응 토론](https://redlib.hackliberty.org/r/threejs/comments/1gltlq7/how_to_deal_with_low_end_devices), [100 Three.js Tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips))
- 프로젝트에 어떻게 적용하나
  - 오리·백조와 수면은 로우폴리로, 징검돌·깃털은 인스턴싱으로 만든다
  - 품질 단계를 두고, 느린 PC에서는 정지 이미지로 자동 전환한다
  - 실제 사내 사무용 PC에서 프레임 속도를 재는 것을 Phase 1 완료 조건에 넣는다

#### 시장·기술 — 외부 인터넷 없는 사내망 배포
- 무엇을 조사했나: three.js 자원을 외부 서버 없이 직접 서비스하는 방법
- 새로 알게 된 것
  - three.js 기본 예제는 Draco 압축 해제기를 구글 서버에서 받는다. 사내망에서는 `node_modules/three/examples/jsm/libs/draco/` 폴더를 정적 폴더로 복사하고 경로를 자기 서버로 지정해야 한다. 이 파일들은 별도 워커에서 실행되므로 번들에 넣지 않고 그대로 둔다. ([sbcode Draco 가이드](https://sbcode.net/threejs/loaders-draco/), [three.js 포럼: Vite에서 Draco](https://discourse.threejs.org/t/cant-access-draco-loader-files-when-working-with-vite/34099))
  - 오프라인 PC에서 Draco 경로가 외부를 가리켜 오류가 난 실제 사례가 있고, 로컬 경로 지정으로 해결했다. ([Needle 포럼](https://forum.needle.tools/t/build-is-trying-to-fetch-draco-decoder-js-from-the-web/1425))
  - 다른 엔진의 오프라인 배포 사례에서는 `.wasm` 파일의 MIME 형식과 보안 정책(CSP) 설정이 걸림돌이었다. 사내 서버도 같은 문제가 있을 수 있다. ([Babylon.js 포럼](https://forum.babylonjs.com/t/serving-draco-decoder-locally-and-hosted-with-webpack/61222))
- 프로젝트에 어떻게 적용하나
  - 라이브러리, 모델, 글꼴, 이미지 전부를 사이트에 포함한다. 구글 폰트 등 외부 링크를 쓰지 않는다
  - 네트워크를 차단한 상태에서 모든 화면이 뜨는지 확인하는 것을 배포 전 점검 항목으로 둔다
  - 모델이 작으면 Draco 압축 자체를 쓰지 않는 것이 가장 단순하다 (제안)

#### 트렌드 — 스크롤 연동 3D 스토리텔링
- 무엇을 조사했나: 스크롤에 따라 3D 장면이 진행되는 사이트의 구현 방식
- 새로 알게 된 것
  - 일반적인 구조는 화면에 고정된 3D 캔버스를 뒤에 두고 그 위로 글이 스크롤되는 방식이다. 카메라·모델 변화를 하나의 타임라인으로 만들고 스크롤 위치에 묶는다(GSAP ScrollTrigger의 scrub). 부드러운 스크롤 라이브러리(Lenis)를 함께 쓰기도 한다. ([Codrops: Cinematic 3D Scroll Experiences with GSAP](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/))
- 프로젝트에 어떻게 적용하나
  - "오리 → 백조" 성장 장면을 하나의 스크롤 타임라인으로 만든다
- 한계: 수상작 목록 같은 구체적 사례는 이번 검색으로 찾지 못했다. STEP 10에서 레퍼런스로 보완한다.

### 기존 서비스 비교
| 서비스 | 대표 기능·규모 | 장점(증명한 것) | 한계 (SWAN 관점) |
|---|---|---|---|
| SSAFY 홍보 | 수료생 인터뷰, 프로젝트 사례, 누적 성과 숫자 | 결과와 사람을 앞세운 홍보가 통한다 | 사외 취업 준비생 대상이라 "현업과 병행", "부서장 결재" 같은 사내 맥락이 없다 |
| 일반 부트캠프 랜딩 | 커리큘럼, 후기, 기수 일정, 신청 폼, FAQ | 질문 순서대로 답하는 구성 | 수강료·취업이 핵심 설득 요소라 사내 무료 교육과 동기가 다르다 |
| 현재 SWAN (메일 공지) | 메일 안내와 메일 신청 | 신청자가 적어 운영은 무리 없음 | 결과물과 수준이 전달되지 않는다 |

### 기술 제약과 대응
- 사내망, 외부 인터넷 없음 → 모든 자원을 사이트에 포함, 네트워크 차단 상태로 점검
- PC 사양 편차 → 품질 단계와 정지 이미지 대체
- 3D 모델 직접 제작 필요 → 로우폴리로 범위를 좁힌다
- SSO 연동 방식 미확인 → STEP 11에서 확인, 불확실하면 개발 중에는 임시 로그인으로 대체

### 정리: 그래서 우리 서비스의 자리는
외부 교육 사이트는 취업과 수강료로 설득한다. SWAN은 사내 교육이라 설득 포인트가 다르다. "나 같은 현업 비개발자가 8주 뒤 실제로 무엇을 만들었고, 그게 업무에 어떤 효과를 냈는지"를 사내 사례로 보여주는 것이 SWAN 사이트만의 자리다.

### 아직 확인하지 못한 것 (사내 확인 필요)
- 1~4기 신청자 수와 졸업생 수
- 자동화에 기여한 졸업 과제의 구체적 내용, 스크린샷·수치 공개 가능 범위
- 예비 수강생이 신청 전에 정보를 어떻게 구하는지
- "교육 후 일을 떠안을까 두렵다"가 실제로 있는 걱정인지 (현재는 기획자 추측)
- 부서장이 사이트 링크를 결재 근거로 쓸지
- 사내 표준 브라우저와 사무용 PC의 실제 3D 성능
- SSO 연동 방법, 사이트를 올릴 서버

<details>
<summary>원문 메모</summary>

- Q9-1~4: "찾아줘" → Claude가 WebSearch로 조사
- Q9-5와 적용 방향: "제안대로 가자 더할 건 없어"
</details>
