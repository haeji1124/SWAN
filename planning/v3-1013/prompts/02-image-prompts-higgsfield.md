# 이미지 생성 프롬프트 (Higgsfield) — SWAN 웹사이트

기준: 2026-10-14 기획(v3). 디자인 방향은 아직 정하지 않았고, 세 방향(A 개발자의 노트 / B 밝은 물가 / C 달빛 호수 다시)을 비교해 고른다.

## 왜 이미지가 필요한가
| 용도 | 쓰이는 곳 |
|---|---|
| 캐릭터 기준 시트 | 모든 캐릭터 그림의 일관성 기준. 디자인 시안에 첨부 |
| 성장 단계 세 개 (알에서 나온 오리 / 아기 오리 / 어린 백조) | 수준 테스트 결과, 홈의 수준 테스트 안내 |
| 강사 캐릭터 | 홈의 강사 소개 |
| 신청 완료 | 접수 완료 화면의 축하 장면 |
| 빈 상태, 오류 | 목록이 비었을 때, 문제가 생겼을 때 |
| 모집 포스터 | 모집 메일과 사내 게시판 공지 |
| 인트로 영상 | 홈 첫 화면 (방향을 고른 뒤) |

## 지금 가진 이미지
방향 B와 C는 이미 재료가 있다. **새로 만들 것은 방향 A뿐이다.**

| 방향 | 가진 것 | 위치 |
|---|---|---|
| A 개발자의 노트 | 없음 → 아래 1부에서 만든다 | — |
| B 밝은 물가 | 로우폴리 성장 시트, 호수 장면, 알 3단계, 스티커, 상태 그림, 완성작 대체 그림 6장 | `SWAN/public/` |
| C 달빛 호수 다시 | 사실적인 백조 캐릭터, 달빛 호수 배경, 변신 영상, 날개 접기 영상 | `SWAN/` 바로 아래 |

## 사용 순서
1. **1부**: 방향 A의 캐릭터 기준 시트를 만든다. 이것으로 세 방향을 같은 조건에서 비교할 수 있다.
2. `prompts/03-design-prompt.md`로 세 방향의 첫 화면 시안을 받아 하나를 고른다.
3. **2부**: 고른 방향의 공통 스타일로 나머지 이미지를 만든다. 이미 가진 것은 다시 만들지 않는다.
4. 결과는 `SWAN/design/images/`에 아래 파일명으로 저장한다.

모델 선택
- 캐릭터가 중심인 그림: Nano Banana 2
- 장면, 소품, 포스터 배경: GPT Image 2.5
- 영상: Seedance 2.5

주의
- 프롬프트에 회사명, 실명, 부서 이름, 내부 정보를 넣지 않는다.
- 이미지 안에 글자를 넣지 않는다. 글자는 화면에서 따로 올린다.
- 사내 사이트에 AI로 만든 이미지를 써도 되는지, 파일을 사내망으로 반입하는 기준이 무엇인지 확인한다.
- 투명 배경이 필요한 그림은 단색 배경으로 만든 뒤 배경을 지운다.

---

# 1부. 방향 A 비교용 이미지

## 공통 스타일 A — 개발자의 노트
```
Flat 2D editorial illustration, hand-drawn feel with confident uneven ink outlines in dark navy (#1b2233), limited flat color fills with no gradients and no soft shading. Palette: warm off-white paper (#f6f1e7) background, dark navy ink (#1b2233), one accent of warm yellow (#f2b824), small touches of soft blue (#9fc3e8). Slight paper grain texture. Sticker-like shapes with a thin white border where the subject is isolated. Simple geometric forms, expressive but minimal faces (two dot eyes). Looks like a sketch in the margin of a programmer's notebook. No 3D rendering, no glossy lighting, no glow, no gradients, no photorealism, no text, no letters, no watermark.
```

## 1. 캐릭터 기준 시트 (방향 A)
- 파일명: `a-character-sheet.png` · 비율 16:9 · 모델: Nano Banana 2
- 쓰이는 곳: 방향 A의 모든 캐릭터 그림의 기준, 디자인 시안 첨부

```
Character model sheet on a plain warm off-white background, four growth stages of the same waterbird character arranged left to right at increasing size, evenly spaced, each standing on a small flat blue puddle shape:
(1) a just-hatched duckling sitting in half an eggshell, sleepy and curious,
(2) a small round yellow duckling paddling, cheerful,
(3) a young grey-white cygnet with a longer neck, half-grown wings, focused look,
(4) an adult white swan with wings slightly open, wearing round glasses, calm and confident.
Same face design, same line weight and same proportions logic across all four so they read as one character growing up. Full body, side-three-quarter view, generous empty space around each.
[공통 스타일 A를 여기에 붙인다]
```

## 2. 첫 화면 장면 (방향 A)
- 파일명: `a-hero-scene.png` · 비율 16:9 · 모델: GPT Image 2.5 · 참고 이미지: `a-character-sheet.png`
- 쓰이는 곳: 방향 A 첫 화면 시안의 그림. 왼쪽 절반은 글자를 올릴 자리로 비워 둔다

```
Wide editorial illustration. On the right third, the adult swan character from the reference sheet stands at the edge of a simple flat pond, wings beginning to open as if about to take off, looking up. A pair of large mechanical-looking wings drawn as a blueprint sketch (thin dashed construction lines, small measurement ticks) hovers just behind its own wings, as if being fitted on. A few loose notebook marks around it: an arrow, a bracket, a small grid. The left two thirds of the image are empty warm off-white paper with only faint ruled lines, reserved for a headline.
[공통 스타일 A를 여기에 붙인다]
```

---

# 2부. 방향을 고른 뒤 만드는 이미지

고른 방향의 공통 스타일을 각 프롬프트 끝에 붙인다. 방향 A는 위의 공통 스타일 A를 쓴다.

## 공통 스타일 B — 밝은 물가
```
Low-poly 3D render with soft faceted geometry, matte clay-like materials, soft even daylight with gentle ambient shadows, no harsh contrast. Palette: pale sky blue (#d6ecfb) background, clear water blue (#4aa8e8), white (#ffffff), duckling yellow (#f6c33c), small orange accents (#f08a3c) for beak and feet. Clean, friendly, uncluttered, lots of empty space. Consistent with the existing low-poly duck-to-swan character sheet used as reference. No photorealism, no glow, no lens flare, no dark moody lighting, no text, no letters, no watermark.
```

## 공통 스타일 C — 달빛 호수 다시
```
Cinematic stylized 3D character render in the style of a modern animated feature film still, consistent with the existing reference character (white swan with round glasses and a light grey hoodie). Night scene by a calm lake under a full moon, deep navy (#0b1424) and soft moonlight cream (#f3ead2), warm amber mist (#e8b36a) low on the horizon, restrained cyan (#7fe3e6) only as a small accent from a laptop screen. Composition like a film poster: strong single subject, large quiet negative space. No neon, no heavy bloom, no purple gradients, no text, no letters, no watermark.
```

## 3. 성장 단계 세 개
수준 테스트 결과에 쓴다. 세 장을 같은 구도로 만든다.
- 파일명: `stage-1-hatchling.png`, `stage-2-duckling.png`, `stage-3-cygnet.png` · 비율 1:1 · 모델: Nano Banana 2
- 참고 이미지: 고른 방향의 캐릭터 기준 시트 (A는 `a-character-sheet.png`, B는 `public/character-growth-sheet.png`, C는 기존 백조 캐릭터)
- 방향 B는 `public/intro-egg-sheet.png`와 `public/character-growth-sheet.png`에서 잘라 쓸 수 있으면 새로 만들지 않는다

```
Single character centered on a plain background with generous empty space, full body, facing three-quarter right. [STAGE]. Same character design as the reference sheet.
[고른 방향의 공통 스타일]
```
`[STAGE]`에 넣을 문장
- 1: `A just-hatched duckling sitting in a cracked eggshell, blinking, one piece of shell still on its head, curious and a little unsure`
- 2: `A small duckling paddling confidently on a small patch of water, looking ahead, a tiny ripple behind it`
- 3: `A young swan with half-grown white wings spread for the first time, lifting slightly off the water, determined and happy`

## 4. 강사 캐릭터
- 파일명: `instructor.png` · 비율 4:5 · 모델: Nano Banana 2 · 참고 이미지: 캐릭터 기준 시트
- 쓰이는 곳: 홈의 강사 소개. 실제 강사의 얼굴 대신 쓴다

```
The adult swan character from the reference, upper body and wings visible, wearing round glasses, standing beside a simple board, one wing raised as if pointing at something on the board, the other holding a closed laptop. Warm, patient expression of an experienced mentor looking toward the viewer. The board is blank. Plain background, subject slightly right of center, empty space on the left.
[고른 방향의 공통 스타일]
```

## 5. 신청 완료
- 파일명: `apply-success.png` · 비율 1:1 · 모델: Nano Banana 2 · 참고 이미지: 캐릭터 기준 시트
- 방향 B는 `public/state-success.png`가 이미 있다

```
The small duckling character from the reference jumping with both wings up in celebration, a few loose white feathers and small paper confetti pieces floating around it. Joyful, light. Centered, plain background, generous empty space.
[고른 방향의 공통 스타일]
```

## 6. 빈 상태
- 파일명: `state-empty.png` · 비율 1:1 · 모델: Nano Banana 2
- 방향 B는 `public/state-empty.png`가 이미 있다

```
A single unhatched egg resting on a lily pad on still water, a tiny crack just starting, quiet and expectant mood. Nothing else in the scene. Centered, plain background.
[고른 방향의 공통 스타일]
```

## 7. 오류 상태
- 파일명: `state-error.png` · 비율 1:1 · 모델: Nano Banana 2
- 방향 B는 `public/state-error.png`가 이미 있다

```
The small duckling character from the reference looking puzzled at a tangled piece of string or a knotted reed in the water in front of it, head tilted, not distressed, just confused. Centered, plain background.
[고른 방향의 공통 스타일]
```

## 8. 모집 포스터 배경
- 파일명: `poster-bg.png` · 비율 3:4 (세로) · 모델: GPT Image 2.5 · 참고 이미지: 캐릭터 기준 시트
- 쓰이는 곳: 모집 메일 한 장, 사내 게시판 공지. 위쪽 3분의 1은 제목, 아래쪽 5분의 1은 [신청하기] 버튼 자리로 비워 둔다

```
Vertical poster composition. In the middle band, the adult swan character from the reference with wings opening, about to take off from water, seen from a low angle so it feels uplifting. A small duckling in the lower corner looks up at it. The top third of the image is calm empty space for a headline, the bottom fifth is calm empty space for a button. Strong simple composition that reads well when small in an email.
[고른 방향의 공통 스타일]
```

## 9. 인트로 영상
- 파일명: `intro.mp4` · 비율 16:9 · 길이 5~8초 · 모델: Seedance 2.5 · 참고 이미지: 고른 방향의 첫 화면 장면
- 방향 C는 기존 변신 영상(`SWAN/hf_20261007_075626_....mp4`)을 그대로 쓸 수 있다
- 마지막 장면에서 캐릭터가 멈춰 있어야 한다. 그 위에 메인 문구가 뜬다

```
Starting from the reference image. A small duckling floats on calm water. It looks up, shakes itself, and in one smooth continuous motion grows into an adult swan and opens its wings wide, lifting slightly above the water, then holds still in the final pose. Slow, graceful camera push-in. The left side of the frame stays calm and uncluttered for a headline. Ends on a steady held frame. No text, no cuts.
```

---

## 결과가 마음에 들지 않을 때
| 문제 | 덧붙일 문구 |
|---|---|
| 캐릭터가 장마다 달라진다 | `Keep exactly the same character design, proportions, face and line weight as the reference image.` (그리고 기준 시트를 참고 이미지로 꼭 넣는다) |
| 너무 사실적이거나 AI 그림 같다 (방향 A) | `Flatter, simpler, fewer details, visible hand-drawn line wobble, only three colors, no shading at all.` |
| 그라디언트나 빛 번짐이 생긴다 | `Strictly flat fills, no gradients, no glow, no bloom, no rim light.` |
| 색이 어긋난다 | 공통 스타일의 색 값을 한 번 더 적고 `Use only these colors.` |
| 글자가 생긴다 | `Absolutely no text, letters, numbers or logos anywhere in the image.` |
| 글자 올릴 자리가 없다 | `Leave the left two thirds completely empty.` 처럼 비울 위치를 다시 적는다 |
| 너무 어둡다 (방향 C) | `Brighter moonlight on the subject, more visible detail in the shadows, keep the sky dark.` |

원하면 Higgsfield로 직접 생성까지 진행할 수 있다. 생성은 비용이 드는 작업이라 요청할 때만 한다.
