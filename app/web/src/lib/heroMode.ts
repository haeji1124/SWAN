// 히어로 캐릭터를 그림 프레임으로 띄울지, 3D로 띄울지. 비교해 보고 하나로 정하기 전까지 둘 다 둔다.
// 주소 뒤 ?hero=3d 또는 ?hero=frames, 아니면 개발용 상자에서 바꾼다 (이 브라우저에만 기억).
export type HeroMode = 'frames' | '3d'

const KEY = 'swan-hero-mode'

export function getHeroMode(): HeroMode {
  const q = new URLSearchParams(window.location.search).get('hero')
  if (q === '3d' || q === 'frames') return q
  try {
    const v = localStorage.getItem(KEY)
    if (v === '3d' || v === 'frames') return v
  } catch {
    /* 저장소를 못 쓰면 기본값 */
  }
  return 'frames'
}

export function setHeroMode(mode: HeroMode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* 무시 */
  }
}

/** 그림 프레임 방식의 변신 연출. pop(기본) = 컨페티가 터지며 바뀜, video = 변신 영상 프레임 + 컨페티.
 *  비교해 보고 정하기 전까지 둘 다 둔다. 주소 뒤 ?morph=video */
export type MorphMode = 'pop' | 'video'
export function getMorphMode(): MorphMode {
  return new URLSearchParams(window.location.search).get('morph') === 'video' ? 'video' : 'pop'
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
