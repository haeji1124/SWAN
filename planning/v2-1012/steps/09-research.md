# STEP 09. Research — SWAN 웹사이트

조사일: 2026-10-12. 웹 조사는 Claude가 WebSearch로 진행했다. 검색 결과 상당수가 업체 블로그·템플릿 판매 페이지라 수치는 참고 수준으로만 본다. 사용자 본인의 사전 조사는 없으며, 사내 확인 항목은 모두 "아직 확인하지 못한 것"에 남겼다.

## 영역별 조사

### 기존 서비스 — 교육 홍보 사이트는 신청 망설임을 어떻게 줄이는가
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

### 시장·기술 — 브라우저 3D의 성능 제약
- 무엇을 조사했나: three.js / react-three-fiber 성능 관리와 저사양 대응
- 새로 알게 된 것
  - 드로우콜 권장 한도는 출처마다 다르다 (프레임당 100 미만 ~ 데스크톱 300 미만). 경험칙일 뿐이므로 실제 대상 PC에서 측정해야 한다. ([100 Three.js Tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips), [three.js 포럼](https://discourse.threejs.org/t/how-to-improve-three-js-performance-with-react-three-fiber/69562))
  - 같은 물체가 많으면 인스턴싱으로 드로우콜을 줄이고, 프레임마다 객체를 새로 만들지 않으며, 형상·재질을 공유한다. ([Three.js performance best practices](https://metadesignsolutions.com/blog/threejs-performance-optimization-best-practices))
  - 저사양 대응은 단계형이 일반적이다: 전체 → 축소 → 최소 → 정지 이미지. 프레임 속도를 실행 중에 재서 느리면 단계를 내린다. 픽셀 비율 제한과 그림자·후처리 끄기가 첫 단계다. 단, 대체 화면이 최적화를 대신하지는 않는다. ([저사양 기기 대응 토론](https://redlib.hackliberty.org/r/threejs/comments/1gltlq7/how_to_deal_with_low_end_devices), [100 Three.js Tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips))
- 프로젝트에 어떻게 적용하나
  - 오리·백조와 수면은 로우폴리로, 징검돌·깃털은 인스턴싱으로 만든다
  - 품질 단계를 두고, 느린 PC에서는 정지 이미지로 자동 전환한다
  - 실제 사내 사무용 PC에서 프레임 속도를 재는 것을 Phase 1 완료 조건에 넣는다

### 시장·기술 — 외부 인터넷 없는 사내망 배포
- 무엇을 조사했나: three.js 자원을 외부 서버 없이 직접 서비스하는 방법
- 새로 알게 된 것
  - three.js 기본 예제는 Draco 압축 해제기를 구글 서버에서 받는다. 사내망에서는 `node_modules/three/examples/jsm/libs/draco/` 폴더를 정적 폴더로 복사하고 경로를 자기 서버로 지정해야 한다. 이 파일들은 별도 워커에서 실행되므로 번들에 넣지 않고 그대로 둔다. ([sbcode Draco 가이드](https://sbcode.net/threejs/loaders-draco/), [three.js 포럼: Vite에서 Draco](https://discourse.threejs.org/t/cant-access-draco-loader-files-when-working-with-vite/34099))
  - 오프라인 PC에서 Draco 경로가 외부를 가리켜 오류가 난 실제 사례가 있고, 로컬 경로 지정으로 해결했다. ([Needle 포럼](https://forum.needle.tools/t/build-is-trying-to-fetch-draco-decoder-js-from-the-web/1425))
  - 다른 엔진의 오프라인 배포 사례에서는 `.wasm` 파일의 MIME 형식과 보안 정책(CSP) 설정이 걸림돌이었다. 사내 서버도 같은 문제가 있을 수 있다. ([Babylon.js 포럼](https://forum.babylonjs.com/t/serving-draco-decoder-locally-and-hosted-with-webpack/61222))
- 프로젝트에 어떻게 적용하나
  - 라이브러리, 모델, 글꼴, 이미지 전부를 사이트에 포함한다. 구글 폰트 등 외부 링크를 쓰지 않는다
  - 네트워크를 차단한 상태에서 모든 화면이 뜨는지 확인하는 것을 배포 전 점검 항목으로 둔다
  - 모델이 작으면 Draco 압축 자체를 쓰지 않는 것이 가장 단순하다 (제안)

### 트렌드 — 스크롤 연동 3D 스토리텔링
- 무엇을 조사했나: 스크롤에 따라 3D 장면이 진행되는 사이트의 구현 방식
- 새로 알게 된 것
  - 일반적인 구조는 화면에 고정된 3D 캔버스를 뒤에 두고 그 위로 글이 스크롤되는 방식이다. 카메라·모델 변화를 하나의 타임라인으로 만들고 스크롤 위치에 묶는다(GSAP ScrollTrigger의 scrub). 부드러운 스크롤 라이브러리(Lenis)를 함께 쓰기도 한다. ([Codrops: Cinematic 3D Scroll Experiences with GSAP](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/))
- 프로젝트에 어떻게 적용하나
  - "오리 → 백조" 성장 장면을 하나의 스크롤 타임라인으로 만든다
- 한계: 수상작 목록 같은 구체적 사례는 이번 검색으로 찾지 못했다. STEP 10에서 레퍼런스로 보완한다.

## 기존 서비스 비교
| 서비스 | 대표 기능·규모 | 장점(증명한 것) | 한계 (SWAN 관점) |
|---|---|---|---|
| SSAFY 홍보 | 수료생 인터뷰, 프로젝트 사례, 누적 성과 숫자 | 결과와 사람을 앞세운 홍보가 통한다 | 사외 취업 준비생 대상이라 "현업과 병행", "부서장 결재" 같은 사내 맥락이 없다 |
| 일반 부트캠프 랜딩 | 커리큘럼, 후기, 기수 일정, 신청 폼, FAQ | 질문 순서대로 답하는 구성 | 수강료·취업이 핵심 설득 요소라 사내 무료 교육과 동기가 다르다 |
| 현재 SWAN (메일 공지) | 메일 안내와 메일 신청 | 신청자가 적어 운영은 무리 없음 | 결과물과 수준이 전달되지 않는다 |

## 기술 제약과 대응
- 사내망, 외부 인터넷 없음 → 모든 자원을 사이트에 포함, 네트워크 차단 상태로 점검
- PC 사양 편차 → 품질 단계와 정지 이미지 대체
- 3D 모델 직접 제작 필요 → 로우폴리로 범위를 좁힌다
- SSO 연동 방식 미확인 → STEP 11에서 확인, 불확실하면 개발 중에는 임시 로그인으로 대체

## 정리: 그래서 우리 서비스의 자리는
외부 교육 사이트는 취업과 수강료로 설득한다. SWAN은 사내 교육이라 설득 포인트가 다르다. "나 같은 현업 비개발자가 8주 뒤 실제로 무엇을 만들었고, 그게 업무에 어떤 효과를 냈는지"를 사내 사례로 보여주는 것이 SWAN 사이트만의 자리다.

## 아직 확인하지 못한 것 (사내 확인 필요)
- 1~4기 신청자 수와 졸업생 수
- 자동화에 기여한 졸업 과제의 구체적 내용, 스크린샷·수치 공개 가능 범위
- 예비 수강생이 신청 전에 정보를 어떻게 구하는지
- "교육 후 일을 떠안을까 두렵다"가 실제로 있는 걱정인지 (현재는 기획자 추측)
- 부서장이 사이트 링크를 결재 근거로 쓸지
- 사내 표준 브라우저와 사무용 PC의 실제 3D 성능
- SSO 연동 방법, 사이트를 올릴 서버

<details>
<summary>원문 메모</summary>

웹 조사 진행해줘 나머지는 나중에 확인할게

</details>
