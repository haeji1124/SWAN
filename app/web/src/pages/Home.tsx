// 홈: 스크롤만으로 SWAN을 이해하고 신청까지 가게 하는 10개 섹션 (순서를 지킨다)
import { useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { api } from '../lib/api'
import { FinalCta, IdeasPreview, PartIntro, QuizTeaser } from './home/BottomSections'
import { Curriculum } from './home/Curriculum'
import { Hero } from './home/Hero'
import { Journey } from './home/Journey'
import { Instructor, Numbers, Showcase, Summary } from './home/TopSections'
import type { HomeData, HomeLoad } from './home/types'

export function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [status, setStatus] = useState<HomeLoad['status']>('loading')
  // 실패하면 섹션마다 "불러오지 못했어요 · 다시 시도"를 보여 주고, 다시 시도하면 여기서 다시 부른다
  const fetchHome = useCallback(() => {
    setStatus('loading')
    api<HomeData>('/api/home')
      .then((d) => {
        setData(d)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])
  useEffect(fetchHome, [fetchHome])
  const load: HomeLoad = { status: data ? 'ready' : status, retry: fetchHome }
  // 커리큘럼이 들어오면 홈이 길어진다. 아래쪽 고정 스크롤 구간(모험길)의 위치를 다시 잰다
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [data])

  return (
    <>
      <Hero data={data} load={load} />
      <Summary data={data} load={load} />
      <Numbers data={data} load={load} />
      <Showcase data={data} load={load} />
      <Instructor />
      <Curriculum data={data} load={load} />
      <Journey />
      <QuizTeaser />
      <PartIntro />
      <IdeasPreview />
      <FinalCta data={data} load={load} />
    </>
  )
}
