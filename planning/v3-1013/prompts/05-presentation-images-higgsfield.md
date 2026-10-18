# 발표자료용 이미지 생성 프롬프트 (Higgsfield)

기준: `04-presentation-prompt.md`의 발표 슬라이드에 쓸 그림 다섯 장. 디자인 방향은 "개발자의 노트"(납작한 손그림, 미색 종이).

## 왜 이미지가 필요한가
| 파일 | 쓰이는 슬라이드 | 무엇을 전하나 |
|---|---|---|
| `deck-character-sheet.png` | (기준용, 슬라이드에는 쓰지 않음) | 나머지 네 장의 캐릭터를 똑같이 맞추는 기준 |
| `deck-cover.png` | 1. 표지 | AI가 날개를 달아 주고, 나는 법은 스스로 배운다 |
| `deck-dialogue.png` | 3. 어떻게 시작했나 | 사람과 AI가 주고받으며 만든다 |
| `deck-mistake.png` | 6. 틀린 순간 ① | 잘 정리된 그럴듯한 답과 실제가 달랐다 |
| `deck-lessons.png` | 14. 배운 것 | 네 가지를 익혀 가는 성장 |
| `deck-closing.png` | 15. 마무리 | 날아오른다 |

## 사용 순서
1. **기준 시트를 가장 먼저** 만든다. 사이트용으로 `a-character-sheet.png`를 이미 만들었다면 그것을 그대로 쓰고 1번은 건너뛴다.
2. 나머지 다섯 장을 만들 때마다 기준 시트를 참고 이미지로 넣는다.
3. 결과는 `SWAN/design/deck/`에 위 파일명으로 저장한다.

모델 선택
- 다섯 장 모두 캐릭터가 중심이므로 Nano Banana 2를 쓴다.

주의
- 프롬프트에 회사명, 부서 이름, 실명을 넣지 않는다.
- 그림 안에 글자를 넣지 않는다. 글자는 슬라이드에서 따로 올린다.
- 발표자료에 AI로 만든 그림을 써도 되는지 사내 기준을 확인한다.

---

## 공통 스타일
아래 블록을 모든 프롬프트 끝에 붙인다.

```
Flat 2D editorial illustration, hand-drawn feel with confident uneven ink outlines in dark navy (#1b2233), limited flat color fills with no gradients and no soft shading. Palette: warm off-white paper (#f6f1e7) background, dark navy ink (#1b2233), one accent of warm yellow (#f2b824), small touches of soft blue (#9fc3e8). Slight paper grain texture. Simple geometric forms, expressive but minimal faces (two dot eyes). Looks like a sketch in the margin of a programmer's notebook. No 3D rendering, no glossy lighting, no glow, no gradients, no photorealism, no text, no letters, no numbers, no watermark.
```

## 1. 캐릭터 기준 시트
- 파일명: `deck-character-sheet.png` · 비율 16:9
- 사이트용 `a-character-sheet.png`가 있으면 만들지 않는다

```
Character model sheet on a plain warm off-white background. Two characters side by side with generous space between them.
Left: a small round yellow duckling, curious and eager, shown in three poses (standing, looking up, flapping tiny wings).
Right: a friendly helper robot shaped like a rounded lantern or small desk lamp with two simple arms and a single round eye, clearly a machine and clearly not a bird, shown in three poses (holding a wrench, offering something forward, tilting its head).
Same line weight and same simple face style for both. Full body, consistent proportions across poses.
[공통 스타일]
```

## 2. 표지
- 파일명: `deck-cover.png` · 비율 16:9 · 참고 이미지: 기준 시트
- 왼쪽 절반은 제목을 올릴 자리로 비워 둔다

```
Wide illustration. On the right third, the small yellow duckling from the reference stands on a low rock at the edge of a simple flat pond, looking up at the sky. The helper robot from the reference stands just behind it, carefully fitting a pair of large wings onto the duckling's back. The wings are drawn as a blueprint: thin dashed construction lines, small measurement ticks, a few hinge marks. The duckling's own small wings are slightly raised, as if about to try. A faint dotted arc in the sky suggests a flight path not yet taken. The left half of the image is empty warm off-white paper with only faint ruled notebook lines, reserved for a headline.
[공통 스타일]
```

## 3. 주고받기
- 파일명: `deck-dialogue.png` · 비율 4:3 · 참고 이미지: 기준 시트
- 슬라이드 오른쪽에 놓는다. 위쪽은 비워 둔다

```
The small yellow duckling and the helper robot from the reference sit facing each other across a low table made of a tree stump. Between them on the table lies a large sheet of paper with a rough sketch of boxes and arrows on it. The duckling holds a pencil and is crossing something out on the sheet. The robot holds another small sheet forward, offering it. Three or four crumpled paper balls lie on the ground around them. Above their heads, two empty speech-bubble outlines overlap slightly, one with a rough hand-drawn edge and one with a clean straight edge. Both are empty. The upper third of the image is empty paper.
[공통 스타일]
```

## 4. 틀린 순간
- 파일명: `deck-mistake.png` · 비율 4:3 · 참고 이미지: 기준 시트
- "잘 정리된 그럴듯한 그림"과 "실제"가 다르다는 것을 한눈에 보여준다

```
The small yellow duckling from the reference stands in the middle, holding up a neat, beautifully drawn framed picture in one wing: the picture shows a tidy small pond with exactly three ducks in a row. With its head turned the other way, the duckling looks with surprise at the real scene behind it: a much wider lake drawn loosely, crowded with many small ducks scattered everywhere. The framed picture is drawn with clean precise lines, the real lake with looser sketchy lines, so the contrast is obvious. The helper robot from the reference stands off to the side, scratching its head. A single yellow question mark shape made of a curved reed, not a text character, floats near the duckling.
[공통 스타일]
```

## 5. 배운 것
- 파일명: `deck-lessons.png` · 비율 3:4 (세로) · 참고 이미지: 기준 시트
- 슬라이드 오른쪽에 세로로 놓는다. 네 문장과 나란히 보이게 네 단계로 그린다

```
Vertical illustration of four stepping stones rising diagonally from bottom left to top right across still water, each stone a little higher than the last. The same duckling character from the reference appears four times, once on each stone, growing slightly bigger and more confident each time: on the first stone it studies a sheet of paper, on the second it points firmly with one wing as if giving a clear instruction, on the third it inspects something closely through a magnifying glass, on the fourth it has turned around to look back at the stones behind it, wings half open and ready to take off. The helper robot from the reference floats alongside in the water on a small raft, watching. Plenty of empty paper on the left side.
[공통 스타일]
```

## 6. 마무리
- 파일명: `deck-closing.png` · 비율 16:9 · 참고 이미지: 기준 시트
- 표지와 짝이 되는 그림. 표지에서 날개를 달던 장면이 여기서 나는 장면이 된다. 아래쪽 3분의 1은 글자를 올릴 자리로 비워 둔다

```
Wide illustration, a companion to the cover. The duckling from the reference, now grown into a young white swan with the same face, is in the air in the upper right, flying on its own wide wings. The blueprint wings from before are gone, only a few faint dashed lines trailing behind it like a memory. Far below on the left, the helper robot from the reference stands on the rock by the pond, small, waving one arm upward. A dotted arc traces the path the swan has flown from the rock into the sky. The lower third of the image is calm empty paper with faint ruled lines.
[공통 스타일]
```

---

## 결과가 마음에 들지 않을 때
| 문제 | 덧붙일 문구 |
|---|---|
| 캐릭터가 장마다 달라진다 | `Keep exactly the same character designs, proportions, faces and line weight as the reference image.` (기준 시트를 참고 이미지로 꼭 넣는다) |
| 로봇이 사람이나 새처럼 보인다 | `The helper is a simple lamp-shaped machine with one round eye, no beak, no feathers, no human face.` |
| 너무 매끈하고 AI 그림 같다 | `Flatter, simpler, fewer details, visible hand-drawn line wobble, only three colors, no shading at all.` |
| 그라디언트나 빛 번짐이 생긴다 | `Strictly flat fills, no gradients, no glow, no bloom.` |
| 글자나 숫자가 생긴다 | `Absolutely no text, letters, numbers or symbols from any alphabet anywhere in the image.` |
| 글자 올릴 자리가 없다 | `Leave the left half completely empty.` 처럼 비울 위치를 다시 적는다 |
| 그림이 너무 복잡하다 | `Remove background details, keep only the two characters and one key object.` |

원하면 Higgsfield로 직접 생성까지 진행할 수 있다. 생성은 비용이 드는 작업이라 요청할 때만 한다.
