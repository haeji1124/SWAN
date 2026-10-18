// 히어로의 3D 방식. 오리·강사·어린 백조 GLB(뼈대와 움직임 포함)를 react-three-fiber로 띄운다.
// 스크롤 진행값에 따라 오리가 빙글 돌며 반짝이고, 어린 백조로 바뀐다. 마우스 쪽으로 몸을 살짝 돌린다.
import { ContactShadows, OrthographicCamera, Sparkles, useAnimations, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CHARACTER_FILTER, STAGE_H, STAGE_W, transformAmount, type Progress } from './Hero'

const DUCK = '/models/duck.glb'
// 다 자란 "3개월 뒤의 나": 강사 백조와 같은 날개·꼬리, 조끼만 흰 깃털로 바꾼 모델
const SWAN = '/models/cygnet.glb'
const GROWN_SCALE = 0.95
const TEACHER = '/models/instructor.glb'

// 블렌더 렌더와 같은 방향에서 본다 (블렌더 (0.3,-1,0.08) → three (0.3,0.08,1))
const VIEW = new THREE.Vector3(0.3, 0.08, 1).normalize()
// 무대(860×760)와 같은 좌표를 쓴다: 키 1.9인 캐릭터가 558px, 발은 무대 아래 110px.
const PX_PER_UNIT = 294
const VIEW_HEIGHT = STAGE_H / PX_PER_UNIT
const TARGET_Y = -0.95 + (STAGE_H / 2 - 110) / PX_PER_UNIT
const YAW = Math.cos(Math.atan2(0.3, 1)) // 비스듬히 보는 만큼 가로가 줄어든다
const stageX = (px: number) => (px - STAGE_W / 2) / PX_PER_UNIT / YAW

/** 말랑한 비닐 장난감 재질: 금속성 없이 살짝 매트하게. 텍스처는 얼룩 없는 단색이라 음영은 조명이 만든다 */
function useToyMaterial(scene: THREE.Object3D) {
  useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat.isMeshStandardMaterial) return
      mat.metalness = 0
      mat.roughness = 0.62
      if (mat.map) mat.map.anisotropy = 8
      mat.needsUpdate = true
    })
  }, [scene])
}

const smooth = (x: number) => x * x * (3 - 2 * x)
const range = (x: number, a: number, b: number) => Math.max(0, Math.min(1, (x - a) / (b - a)))

function Rig({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  return (
    <>
      <Camera />
      {/* 텍스처에 그림자가 이미 구워져 있어서, 블렌더 렌더처럼 밝고 부드럽게 비춘다 */}
      <hemisphereLight args={['#ffffff', '#dfe6ef', 1.4]} />
      <directionalLight position={[-3, 5, 5]} intensity={2.2} />
      <directionalLight position={[4, 2, 3]} intensity={0.6} />
      <directionalLight position={[2, 3, -4]} intensity={1.2} />
      <Teacher reduced={reduced} />
      <Morph progress={progress} reduced={reduced} />
      <ContactShadows position={[0, -0.95, 0]} opacity={0.35} scale={8} blur={2.6} far={2} color="#1f2a44" />
    </>
  )
}

function Camera() {
  const { size } = useThree()
  const zoom = size.height / VIEW_HEIGHT
  const pos = useMemo(() => new THREE.Vector3(0, TARGET_Y, 0).addScaledVector(VIEW, 12), [])
  return <OrthographicCamera makeDefault position={pos} zoom={zoom} near={0.1} far={50} onUpdate={(c) => c.lookAt(0, TARGET_Y, 0)} />
}

/** 마우스 쪽으로 몸을 살짝 돌린다 (좌우 ±0.35 rad) */
function useLookAtPointer(group: React.RefObject<THREE.Group | null>, base = 0, reduced = false) {
  useFrame(({ pointer }, dt) => {
    if (!group.current || reduced) return
    const target = base + pointer.x * 0.35
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target, 4, dt)
  })
}

function Teacher({ reduced }: { reduced: boolean }) {
  const { scene, animations } = useGLTF(TEACHER)
  useToyMaterial(scene)
  const group = useRef<THREE.Group>(null)
  const { actions } = useAnimations(animations, group)
  useEffect(() => {
    if (!reduced) actions.idle?.reset().play()
  }, [actions, reduced])
  useLookAtPointer(group, -0.15, reduced)
  return (
    <group ref={group} position={[stageX(625), 0, 0]}>
      <primitive object={scene} />
    </group>
  )
}

function Morph({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  const duck = useGLTF(DUCK)
  const swan = useGLTF(SWAN)
  useToyMaterial(duck.scene)
  useToyMaterial(swan.scene)
  const duckGroup = useRef<THREE.Group>(null)
  const swanGroup = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const sparkles = useRef<THREE.Group>(null)
  const duckAnim = useAnimations(duck.animations, duckGroup)
  const swanAnim = useAnimations(swan.animations, swanGroup)

  // 들어오면 손을 한 번 흔들고 숨쉬기로
  useEffect(() => {
    if (reduced) return
    const { wave, idle } = duckAnim.actions
    if (!wave || !idle) return
    wave.reset().setLoop(THREE.LoopOnce, 1).play()
    wave.clampWhenFinished = true
    const mixer = duckAnim.mixer
    const onDone = () => {
      wave.fadeOut(0.3)
      idle.reset().fadeIn(0.3).play()
    }
    mixer.addEventListener('finished', onDone)
    swanAnim.actions.idle?.play()
    return () => mixer.removeEventListener('finished', onDone)
  }, [duckAnim.actions, duckAnim.mixer, swanAnim.actions, reduced])

  useLookAtPointer(spin, 0.1, reduced)

  // 스크롤에 맞춰: 0~0.45 오리가 돌며 반짝임 / 0.45~0.6 크기가 바뀌며 백조로 / 0.6~1 백조가 자리를 잡음
  useFrame(() => {
    const a = transformAmount(progress.get())
    const d = duckGroup.current
    const s = swanGroup.current
    if (!d || !s) return
    // 오리는 두 바퀴 돌며 빨라지고, 백조는 한 바퀴 돌다 정면에서 멈춘다
    d.rotation.y = smooth(range(a, 0, 0.55)) * Math.PI * 4
    s.rotation.y = (1 - smooth(range(a, 0.5, 0.9))) * Math.PI * 2
    const out = smooth(range(a, 0.42, 0.55))
    const inn = smooth(range(a, 0.5, 0.68))
    // 그룹의 원점이 발밑이라, 크기를 바꿔도 발은 바닥에 붙어 있다
    const duckScale = 0.68 * (1 + 0.12 * range(a, 0, 0.42)) * (1 - out)
    d.scale.setScalar(Math.max(0.0001, duckScale))
    d.visible = duckScale > 0.001
    const overshoot = inn < 1 ? inn * (1 + 0.12 * Math.sin(inn * Math.PI)) : 1
    s.scale.setScalar(Math.max(0.0001, overshoot * GROWN_SCALE))
    s.visible = inn > 0.001
    if (sparkles.current) sparkles.current.visible = a > 0.05 && a < 0.8
  })

  return (
    <group ref={spin} position={[stageX(330), 0, 0]}>
      {/* 바닥(y=-0.95)에 원점을 둔 그룹. 모델은 +0.95 올려서 발이 원점에 오게 한다 */}
      <group position={[0, -0.95, 0]}>
        <group ref={duckGroup}>
          <group position={[0, 0.95, 0]}>
            <primitive object={duck.scene} />
          </group>
        </group>
        <group ref={swanGroup}>
          <group position={[0, 0.95, 0]}>
            <primitive object={swan.scene} />
          </group>
        </group>
      </group>
      <group ref={sparkles}>
        <Sparkles count={60} scale={[1.6, 2, 1.6]} position={[0, 0.1, 0]} size={5} speed={0.6} color="#ffffff" opacity={0.95} />
      </group>
    </group>
  )
}

export default function Hero3D({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  return (
    <div className="absolute inset-0" style={{ filter: CHARACTER_FILTER }}>
      {/* 무대가 CSS로 통째로 줄어들기 때문에, 줄어들기 전 크기(offsetSize)로 재야 두 번 줄지 않는다 */}
      {/* 블렌더 렌더와 같은 색 처리(Khronos PBR Neutral)로 흰 몸이 하얗게 날아가지 않게 한다 */}
      <Canvas
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
        dpr={[1, 2]}
        resize={{ offsetSize: true }}
      >
        <Rig progress={progress} reduced={reduced} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(DUCK)
useGLTF.preload(SWAN)
useGLTF.preload(TEACHER)
