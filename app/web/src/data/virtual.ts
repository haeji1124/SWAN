// 가상 데이터. 실제 사내 정보가 아니다.
// 완성작은 Phase 4, 아이디어는 Phase 5에서 서버 데이터로 바꾼다.

export const VIRTUAL_SHOWCASE = [
  { title: '불량 이미지 분류 도우미', cohort: 4, dept: '품질보증팀', likes: 31, effect: null },
  { title: '설비 로그 자동 요약기', cohort: 4, dept: '설비기술팀', likes: 27, effect: '매일 30분 걸리던 로그 확인을 2분으로' },
  { title: '주간 보고서 생성기', cohort: 3, dept: '생산관리팀', likes: 19, effect: null },
  { title: '설비 알람 이력 대시보드', cohort: 2, dept: '공정기술 1팀', likes: 15, effect: null },
  { title: '회의록 정리 도우미', cohort: 3, dept: '계측기술팀', likes: 12, effect: null },
]

// 강사 (가상의 이름)
export const VIRTUAL_INSTRUCTOR = {
  name: '한 부장',
  role: 'IPS 파트 · 사내 웹과 툴을 만들고, SWAN을 1기부터 가르쳤습니다',
  quote: '코드는 AI가 짜도, 맞는지는 여러분이 봐야 합니다.',
}

// 파트가 만든 것 (가상, 마지막 하나는 이 사이트)
export const VIRTUAL_PART_WORKS = [
  { title: '설비 문서 검색 포털', desc: '흩어진 설비 매뉴얼을 한곳에서 찾아요', who: '설비기술팀 외 4곳' },
  { title: '사내 코드 리뷰 도우미', desc: '사내 규칙에 맞춰 코드를 먼저 살펴봐요', who: '개발 부서 전체' },
  { title: 'SWAN 교육 사이트', desc: '지금 보고 계신 이 사이트', who: '바이브코딩으로 제작' },
]

export const VIRTUAL_IDEAS = [
  { title: '설비 점검표를 엑셀에서 바로 PDF로', desc: '매주 수작업으로 옮겨 적고 있어요', votes: 42, status: '만드는 중' },
  { title: '회의실 예약 현황을 한 화면에', desc: '층마다 따로 봐야 해서 불편해요', votes: 35, status: '검토 중' },
  { title: '부서 공용 용어 사전', desc: '새로 온 사람이 약어를 몰라 헤매요', votes: 28, status: '접수' },
]
