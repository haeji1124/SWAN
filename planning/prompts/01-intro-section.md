# 인트로 섹션 구현 프롬프트 (사용자 작성 원본)

상태: 보관 (원본) — 프레임 시퀀스 방식으로 고쳐서 `claude-code-prompt.md`의 **Phase 1**에 통합 완료
참고 데모: `C:\Users\sungj\OneDrive\바탕 화면\SWAN\swan-intro-demo.zip` (`swan-intro.html` + `assets/`)

> ⚠️ 데모와 프롬프트의 차이 (구현 전에 정리할 것)
> - 프롬프트는 날개 접기를 **3장 분할 PNG(wing-left / wing-right / body) 회전**으로 설명한다.
> - 실제 데모 zip에는 분할 PNG가 없고, **날개 접기 프레임 49장(`assets/fold/00~48.webp`, 911×490 투명)**을 스크롤에 맞춰 넘기는 방식이 들어 있다. 캔버스 위치는 영상 좌표 (194, 75).
> - 파일명도 다르다: 프롬프트 `intro-first.webp` ↔ 데모 `first.webp` / `poster.webp`, 프롬프트 `mascot-folded.png` ↔ 데모 `fold/48.webp`(마지막 프레임).
> - 어느 방식으로 갈지 확정한 뒤 프롬프트를 고친다. (제안: 동작이 검증된 프레임 시퀀스 방식)

---

React + Vite + TypeScript로 SWAN(SW Academy for Newbie) 교육 과정 홍보 사이트의
인트로 섹션을 만들어줘. 스크롤 애니메이션은 GSAP ScrollTrigger를 사용해.
첨부한 swan-intro.html은 동작을 확인한 프로토타입이니 연출 타이밍과
좌표 계산 방식은 이 파일을 참고해.

## 에셋 (public/assets)
- intro.mp4: 1280x720 인트로 영상. 마지막 프레임에 캐릭터가 날개를 펴고 떠 있음
- intro-first.webp: 영상 첫 프레임 (poster)
- plate.webp: 캐릭터가 없는 마지막 프레임 배경
- wing-left.png, wing-right.png, body.png: 날개를 편 캐릭터를 3장으로 나눈 투명 PNG.
  세 장 모두 영상과 같은 1280x720 캔버스이고 영상 속 캐릭터와 위치가 정확히 일치함
- mascot-folded.png: 날개를 접은 캐릭터 투명 PNG (1:1)

## 구조
1. 인트로 섹션 높이 340vh, 안쪽에 100svh sticky 무대
2. 무대에 전체화면 영상(object-fit: cover, muted, playsInline, autoplay, loop 없음)
3. 영상이 끝나면 마지막 프레임에서 멈추고 제목과 "SCROLL" 힌트를 페이드인
4. 무대 하단에 카드 패널. 패널 안 소개 카드에 캐릭터가 앉을 빈 슬롯(div) 배치

## 스크롤 타임라인 (인트로 섹션 진행률 0~1)
- 0.00~0.12: 영상 위에 캐릭터 레이어 3장을 영상과 정확히 같은 위치로 겹쳐 표시.
  영상을 plate.webp로 크로스페이드. 배경은 0.45까지 점점 어둡고 흐리게
  (brightness 0.45, blur 8px)
- 0.06~0.40: 날개 접기. 왼쪽 날개는 왼쪽 어깨를 축으로 -78도 회전,
  오른쪽 날개는 오른쪽 어깨를 축으로 +82도 회전, 둘 다 scale 0.45까지 축소.
  0.30~0.42 구간에서 날개 opacity 0
- 0.36~0.50: 몸통이 6% 커졌다 돌아오고 drop-shadow가 생기며 떼어지는 느낌
- 0.30~0.68: 카드 패널이 아래에서 위로 슬라이드 업
- 0.44~0.92: 캐릭터가 포물선을 그리며(위로 최대 90px) 슬롯 중앙으로 이동하고
  슬롯 크기에 맞게 축소. 이동 중 최대 -8도 기울어짐
- 0.85~0.95: body.png를 mascot-folded.png로 크로스페이드

## 좌표 계산 (중요)
- object-fit: cover 배율 s = max(화면폭/1280, 화면높이/720)과 offset을 계산해서
  캐릭터 레이어를 영상과 픽셀 단위로 일치시킬 것
- 목표 위치는 매 프레임 슬롯의 getBoundingClientRect()로 계산해서
  리사이즈와 모바일에서도 정확히 슬롯에 안착하게 할 것
- 리사이즈 시 ScrollTrigger.refresh()

## 예외 처리
- 영상이 끝나기 전에 스크롤하면 바로 마지막 프레임으로 이동
- 자동재생이 막히거나 영상 로딩에 실패하면 마지막 프레임 이미지로 대체
- prefers-reduced-motion이면 영상과 애니메이션 없이 캐릭터가 카드에 앉은 최종 상태만 표시
- 모바일(세로 화면)에서 캐릭터가 화면 밖으로 잘리지 않는지 확인

## 완료 기준
데스크톱(1440x900)과 모바일(390x844)에서 스크롤했을 때
캐릭터가 영상에서 레이어로 바뀌는 순간이 티 나지 않고, 슬롯에 정확히 안착할 것.
