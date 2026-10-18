# 이미지 생성 프롬프트 (Higgsfield) — SWAN 웹사이트

기준: 2026-10-12 기획(`기획서.md`). 밝고 친근한 톤, 로우폴리, 아기 오리 → 백조.

상태 (2026-10-12): 생성 완료. 결과 18장을 `SWAN/public/`에 아래 파일명으로 저장했다. 실제와 다른 점 — 인트로 알은 3장이 아니라 한 장(`intro-egg-sheet.png`)이고, 갤러리 썸네일은 6장(`project-placeholder-1~6.png`)이며, 저장 위치는 `SWAN/design/assets/`가 아니라 `SWAN/public/`이다.

## 왜 이미지가 필요한가
| 용도 | 쓰이는 곳 |
|---|---|
| 캐릭터 기준 시트 | 디자인 시안에 첨부, 3D 모델(Blender) 제작 참고, 나머지 이미지의 일관성 기준 |
| 정지 장면 | 3D를 쓸 수 없는 PC에서 랜딩 3D를 대신하는 이미지, 디자인 시안의 히어로 |
| 스티커 | 랜딩 히어로의 드래그 소품 |
| 상태 일러스트 | 빈 상태, 신청 완료, 오류 화면 |
| 대체 썸네일 | 개발 중 갤러리에 넣는 가상 완성작 이미지 |

## 사용 순서
1. **1번(캐릭터 기준 시트)을 먼저 만들고 마음에 들 때까지 고른다.** 이후 모든 이미지에 이 결과를 참고 이미지로 넣어 캐릭터를 일치시킨다.
2. 2~9번을 만든다. 프롬프트 맨 뒤에 아래 **공통 스타일**을 붙인다.
3. 고른 결과를 `SWAN/design/assets/`에 표의 파일명으로 저장하고, `03-design-prompt.md`의 첨부 파일로 쓴다.

모델 선택
- 캐릭터가 중심인 이미지(1, 2, 6, 7): 캐릭터용 모델(Nano Banana 2)
- 장면·배경·소품(3, 4, 5, 8, 9): 일반 이미지 모델(GPT Image 2.5)
- 한 모델로 통일해도 된다. 결과의 일관성이 더 좋은 쪽을 쓴다.

주의
- 프롬프트에 회사명, 실제 사람 이름, 실제 과제 내용을 넣지 않는다.
- 이미지 속에 글자를 넣지 않는다. 글자는 화면에서 따로 올린다.
- 사내 반입 전에 AI 생성 이미지 사용과 파일 반입에 대한 사내 기준을 확인한다.
- 투명 배경이 필요한 이미지는 단색 배경으로 만든 뒤 배경을 지운다.

## 공통 스타일 (모든 프롬프트 뒤에 붙인다)
```
Style: friendly low-poly 3D render, soft faceted geometry with visible flat polygons, smooth matte materials, bright daylight, soft ambient occlusion, gentle soft shadows, clean and minimal. Color palette: water blue (#4DB6F0), pale sky (#EAF6FF), white, warm duck yellow (#FFD23F) as the accent, small orange (#FF9F43) details for beak and feet. Cute, approachable, playful mood for beginners. No text, no letters, no logos, no watermark, no dark or neon cyber look, no photorealism.
```

---

## 1. 캐릭터 기준 시트: 성장 4단계 (가장 먼저)
- 파일명: `character-growth-sheet.png` · 비율 16:9
```
Character design sheet showing the same waterfowl character at four growth stages, arranged left to right on a plain pale sky-blue background, evenly spaced, all facing three-quarter right, each floating on a small disc of water.
Stage 1: a tiny round fluffy yellow baby duckling with big friendly eyes and a small orange beak.
Stage 2: a slightly larger duckling, yellow fading to cream, a longer neck beginning to show.
Stage 3: a young cygnet, mostly white with a few pale yellow feathers left, neck elongated, small wings.
Stage 4: an elegant white adult swan with a long curved neck, wings half open, orange beak, the same friendly eyes.
The four stages must clearly read as one character growing up: same eye shape, same beak shape, same proportions logic.
```

## 2. 캐릭터 턴어라운드: 모델링 참고
- 파일명: `duckling-turnaround.png`, `swan-turnaround.png` · 비율 16:9 · 참고 이미지: 1번
```
Character turnaround sheet of the baby duckling from the reference image: front view, side view, back view, and three-quarter view in a single row, neutral standing pose, identical proportions in every view, plain pale sky-blue background, orthographic feel, even lighting, no perspective distortion.
```
```
Character turnaround sheet of the adult white swan from the reference image: front view, side view, back view, and three-quarter view in a single row, wings folded, identical proportions in every view, plain pale sky-blue background, orthographic feel, even lighting. Add one extra view on the far right with both wings fully spread.
```

## 3. 히어로 정지 장면 (랜딩 첫 화면)
- 파일명: `hero-still.png` · 비율 16:9 · 참고 이미지: 1번
```
Wide scene: the tiny yellow baby duckling from the reference image floating on a calm, bright low-poly lake, placed in the right third of the frame, looking toward the viewer with curiosity. Gentle concentric ripples around it. Soft low-poly clouds in a pale sky, a few lily pads, distant simple low-poly hills. The left half of the frame is calm open water and sky with nothing important in it, leaving room for a headline. Morning light, fresh and hopeful.
```

## 4. 성장 중간 장면 2장 (랜딩 스크롤 구간 대체용)
- 파일명: `scene-mid-1.png`, `scene-mid-2.png` · 비율 16:9 · 참고 이미지: 1번, 3번
```
Same low-poly lake as the reference scene, camera moved further along the water. The stage 2 duckling from the reference sheet paddles forward leaving a small wake, passing a row of flat stepping stones on the water. Character in the left third, open space on the right for text. Bright midday light.
```
```
Same low-poly lake, further along. The stage 3 young cygnet from the reference sheet stretches its small wings as if trying them for the first time, water droplets around it. Character in the right third, open space on the left for text. Warm afternoon light.
```

## 5. 마지막 장면 (신청 버튼 앞)
- 파일명: `final-still.png` · 비율 16:9 · 참고 이미지: 1번, 3번
```
Same low-poly lake at golden late-afternoon light. The adult white swan from the reference sheet rises from the water with both wings fully spread, a few white feathers drifting in the air, sparkling ripples below. Swan centered slightly above the middle, clear calm space in the lower third for a large button. Triumphant but gentle mood.
```

## 6. 상태 일러스트 3종
- 파일명: `state-empty.png`, `state-success.png`, `state-error.png` · 비율 1:1 · 단색 배경(나중에 제거) · 참고 이미지: 1번
```
The baby duckling from the reference image peeking over the edge of an empty woven nest, tilting its head, curious. Centered, plain flat pale sky-blue background, generous margin around the subject.
```
```
The baby duckling from the reference image jumping with joy, tiny wings up, a few white feathers and small yellow confetti pieces floating around it. Centered, plain flat pale sky-blue background, generous margin around the subject.
```
```
The baby duckling from the reference image sitting down with a puzzled look, a tangled piece of water weed on its head, a small question-mark-shaped ripple beside it (a shape, not a text character). Centered, plain flat pale sky-blue background, generous margin around the subject.
```

## 7. 인트로 로딩: 알에서 깨어나기 (선택)
- 파일명: `intro-egg-1.png` ~ `intro-egg-3.png` · 비율 1:1 · 참고 이미지: 1번
```
Three-panel sequence in one image, left to right, same camera and lighting: (1) a white low-poly egg resting on a lily pad on calm water, (2) the same egg with a zigzag crack and a tiny orange beak poking out, (3) the baby duckling from the reference image sitting in the open shell halves, looking up happily. Plain pale sky-blue background, panels evenly spaced.
```

## 8. 드래그 스티커 세트
- 파일명: `stickers-sheet.png` (잘라서 `sticker-*.png`로 저장) · 비율 1:1 · 단색 배경(나중에 제거)
```
Sticker sheet of six separate low-poly objects arranged in a 3 by 2 grid with wide gaps between them, each with a thick white die-cut sticker outline and a soft drop shadow: a green lily pad with a small pink flower, a closed laptop with a tiny duck-foot print on the lid, a single white feather, a steaming yellow mug, a keyboard keycap with a blank top, and a small paper boat. Plain flat light gray background so each sticker can be cut out cleanly.
```

## 9. 갤러리 대체 썸네일 6장 (개발용 가상 완성작)
- 파일명: `project-placeholder-1.png` ~ `-6.png` · 비율 4:3
- 아래 문장의 `{주제}`만 바꿔 6장을 만든다.
```
Low-poly isometric illustration representing {주제}, built from simple abstract blocks, charts and gears floating above a pale blue platform, no readable text, no real user interface, no brand marks. Centered composition with clean margins, suitable as a card thumbnail.
```
주제 예시
1. `automated spreadsheet merging: several small table blocks flowing into one large table`
2. `a scheduled report: a document block with a clock and a paper plane`
3. `equipment log monitoring: a simple machine block with a line chart and a bell`
4. `file organizing: scattered folder blocks being sorted onto shelves`
5. `data dashboard: bar chart, donut chart and a magnifying glass`
6. `web form automation: a browser window block with a robot arm pressing a button`

---

## 결과가 마음에 들지 않을 때
- 캐릭터가 장면마다 달라 보이면: 1번 결과를 참고 이미지로 다시 넣고 프롬프트 앞에 `Keep the character identical to the reference image: same eyes, same beak, same proportions.`를 붙인다.
- 너무 사실적이면: `more stylized, larger flat polygons, fewer details`를 붙인다.
- 어둡거나 차가우면: `brighter, warmer daylight, lighter water`를 붙인다.
- 글자가 생기면: `absolutely no text or symbols`를 붙이고 다시 만든다.
