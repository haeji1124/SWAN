"""가상 데이터를 넣는다. 여기 나오는 사람 이름, 사번, 부서는 모두 지어낸 것이다 (실제 사내 정보 아님).

실행: python seed.py  (데이터베이스를 지우고 다시 만든다)
"""
import random
from datetime import date, datetime, timedelta

import curriculum_seed
import quiz_api
import quiz_seed
from db import Base, SessionLocal, engine
from models import Alumni, Application, Cohort, CurriculumUnit, PracticeProject, QuizAttempt, QuizQuestion, User

# 가상의 부서 이름 12개. 실제 부서 이름을 쓰지 않는다
DEPTS = [
    "공정기술 1팀", "공정기술 2팀", "설비기술팀", "품질보증팀", "수율분석팀", "설계지원팀",
    "기술지원팀", "생산관리팀", "계측기술팀", "자동화기술팀", "제품기술팀", "신뢰성평가팀",
]

# 가상의 이름을 만드는 재료
FAMILY = list("김이박최정강조윤장임한오서신권황안송류홍")
GIVEN = ["도윤", "서아", "지호", "하린", "민준", "유나", "시우", "채원", "지안", "예준", "다은", "우진",
         "하은", "도현", "수아", "건우", "서준", "지유", "현우", "나연", "태윤", "소율", "은호", "다인"]


def fake_name(rng: random.Random) -> str:
    return rng.choice(FAMILY) + rng.choice(GIVEN)


# 가상 완성작 (모두 지어낸 것). (작성자 순번, 제목, 짧은 설명, 무슨 문제, 효과, 대표 그림, 상태, 며칠 전, 좋아요 수)
# 작성자 순번은 run()의 users 목록: 7=1기 졸업생, 8=2기, 9=3기, 11=4기(관리자이기도 함)
PROJECTS = [
    (11, "불량 이미지 분류 도우미", "검사 사진을 넣으면 불량 종류별로 나눠 폴더에 정리해 줘요",
     "검사 장비가 하루 수천 장의 사진을 남기는데, 불량 종류를 사람이 하나씩 열어 보고 폴더로 옮기고 있었어요.",
     "하루 2시간 걸리던 분류를 10분 확인으로", 1, "published", 2, 9),
    (11, "설비 로그 자동 요약기", "밤새 쌓인 설비 로그에서 경고만 골라 아침에 한 장으로 보여줘요",
     "아침마다 설비 로그 파일 여러 개를 열어 경고 줄을 찾아 엑셀에 옮겨 적었어요.",
     "매일 30분 걸리던 로그 확인을 2분으로", 2, "published", 5, 8),
    (9, "주간 보고서 생성기", "엑셀 실적표를 넣으면 주간 보고 초안을 만들어 줘요",
     "매주 금요일 실적표 세 개를 합쳐 같은 모양의 보고서를 손으로 만들고 있었어요.",
     None, 3, "published", 12, 6),
    (9, "측정 데이터 이상치 알림", "측정값이 기준을 벗어나면 담당자에게 알려 줘요",
     "측정값 파일을 하루 두 번 열어 기준을 넘은 값을 눈으로 찾고 있었어요.",
     "놓치던 이상치를 바로 알게 됨", 5, "published", 20, 4),
    (8, "설비 알람 이력 대시보드", "설비별 알람 횟수와 시간대를 한 화면에서 봐요",
     "알람 이력이 설비마다 따로 저장돼 있어서, 어느 설비가 자주 서는지 한눈에 볼 수 없었어요.",
     None, 4, "published", 40, 3),
    (7, "회의록 정리 도우미", "회의 메모를 붙여 넣으면 결정 사항과 할 일을 뽑아 줘요",
     "회의가 끝나면 메모에서 할 일을 다시 찾아 담당자별로 정리하는 데 시간이 걸렸어요.",
     None, 6, "published", 60, 2),
    (8, "라인별 생산 현황판", "라인별 생산량과 목표를 한 화면에 보여줘요",
     "라인마다 생산량을 따로 물어봐야 해서 하루 현황을 모으기 어려웠어요.",
     None, 3, "rejected", 3, 0),
    (7, "자재 재고 확인기", "자재 코드를 넣으면 창고별 재고를 바로 보여줘요",
     "자재 재고를 보려면 시스템 화면 세 개를 오가야 했어요.",
     "재고 확인이 클릭 한 번으로", 5, "pending", 1, 0),
]
REJECT_REASON = "화면 캡처에 실제 라인 이름이 보여요. 가리거나 예시 데이터로 바꾼 화면으로 다시 올려 주세요."
DETAIL_SAMPLE = """## 이렇게 동작해요
1. 검사 사진이 쌓이는 폴더를 고른다
2. 분류 기준(불량 종류)을 확인한다
3. [분류 시작]을 누르면 종류별 폴더로 나뉜다

## 배운 것
- 처음에는 AI가 짠 코드가 **에러 없이 돌아갔지만** 폴더 이름이 바뀌면 사진을 조용히 건너뛰었다
- SWAN에서 배운 대로 예외를 숨기지 않게 고치고, 건너뛴 사진은 따로 목록으로 남겼다

> 모두 가상 데이터로 만든 예시 설명입니다."""


def seed_projects(db, users, rng) -> None:
    """가상 완성작과 좋아요. 대표 그림은 seed_assets/의 자리 그림을 uploads로 복사한다 (실제 졸업생 작품 아님)"""
    import os
    import shutil

    import projects_api
    from models import Project, ProjectLike

    # 개발 DB를 새로 만들 때 예전에 올린 파일도 지운다
    for sub in ("projects", "seed"):
        shutil.rmtree(os.path.join(projects_api.UPLOAD_DIR, sub), ignore_errors=True)
    assets = os.path.join(os.path.dirname(__file__), "seed_assets")
    now = datetime(2026, 10, 16, 18, 0)
    for k, (who, title, summary, problem, effect, img, status, days, likes) in enumerate(PROJECTS):
        folder = f"seed/p{k + 1}"  # 완성작마다 따로 복사한다 (하나를 지워도 다른 완성작 그림이 남게)
        cover = projects_api.copy_seed_image(os.path.join(assets, f"project-{img}.webp"), folder)
        shots = [projects_api.copy_seed_image(os.path.join(assets, f"project-{(img % 6) + 1}.webp"), folder)] if k < 2 else []
        p = Project(
            author_id=users[who].id, title=title, summary=summary, problem=problem, effect=effect,
            cover_image=cover, screenshots=shots, detail=DETAIL_SAMPLE if k == 0 else None,
            repo_url="https://example.com/swan/virtual-repo" if k < 3 else None,
            status=status, reject_reason=REJECT_REASON if status == "rejected" else None,
            created_at=now - timedelta(days=days, hours=k),
        )
        db.add(p)
        db.flush()
        for u in rng.sample(users, likes):
            db.add(ProjectLike(user_id=u.id, project_id=p.id))


def run() -> None:
    rng = random.Random(5)  # 매번 같은 가상 데이터가 나오게
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()

    # 기수 5개: 1~4기 종료, 5기 모집 중 (날짜는 임시)
    cohorts = [
        Cohort(number=1, recruit_start=date(2024, 8, 1), recruit_end=date(2024, 8, 14),
               start_date=date(2024, 9, 5), end_date=date(2024, 11, 28), class_day="목", class_time="16:00", status="done"),
        Cohort(number=2, recruit_start=date(2025, 1, 6), recruit_end=date(2025, 1, 17),
               start_date=date(2025, 2, 6), end_date=date(2025, 4, 24), class_day="목", class_time="16:00", status="done"),
        Cohort(number=3, recruit_start=date(2025, 6, 2), recruit_end=date(2025, 6, 13),
               start_date=date(2025, 7, 3), end_date=date(2025, 9, 25), class_day="금", class_time="15:00", status="done"),
        Cohort(number=4, recruit_start=date(2026, 2, 2), recruit_end=date(2026, 2, 13),
               start_date=date(2026, 3, 5), end_date=date(2026, 5, 28), class_day="목", class_time="16:00", status="done"),
        Cohort(number=5, recruit_start=date(2026, 10, 12), recruit_end=date(2026, 10, 23),
               start_date=date(2026, 11, 5), end_date=date(2027, 1, 28), class_day="목", class_time="16:00", status="open"),
    ]
    db.add_all(cohorts)
    db.flush()
    c5 = cohorts[-1]

    # 졸업생 명단 120명 (1~4기). 4기는 65명, 나머지는 1~3기에 나눈다
    per_cohort = {1: 15, 2: 18, 3: 22, 4: 65}
    alumni = []
    serial = 1
    for number, count in per_cohort.items():
        for _ in range(count):
            alumni.append(Alumni(name=fake_name(rng), dept=DEPTS[serial % len(DEPTS)],
                                 cohort_number=number, emp_no=f"A{serial:05d}"))
            serial += 1

    # 사용자 12명 (가상): 직원 5, 5기 신청자 2, 졸업생 4, 관리자 2 (관리자 1명은 졸업생이기도 함)
    users = [
        # 직원
        User(emp_no="E00001", name="한서준", dept="공정기술 1팀"),
        User(emp_no="E00002", name="오지유", dept="품질보증팀"),
        User(emp_no="E00003", name="권태윤", dept="설비기술팀"),
        User(emp_no="E00004", name="안소율", dept="수율분석팀"),
        User(emp_no="E00005", name="류은호", dept="생산관리팀"),
        # 5기 신청자
        User(emp_no="E00006", name="송다인", dept="계측기술팀"),
        User(emp_no="E00007", name="황현우", dept="자동화기술팀"),
        # 졸업생 (명단의 앞쪽 사번과 이어진다)
        User(emp_no=alumni[3].emp_no, name=alumni[3].name, dept=alumni[3].dept),
        User(emp_no=alumni[20].emp_no, name=alumni[20].name, dept=alumni[20].dept),
        User(emp_no=alumni[45].emp_no, name=alumni[45].name, dept=alumni[45].dept),
        # 관리자 (1명은 졸업생이기도 함)
        User(emp_no="E00008", name="정나연", dept="기술지원팀", is_admin=True),
        User(emp_no=alumni[80].emp_no, name=alumni[80].name, dept=alumni[80].dept, is_admin=True),
    ]
    # 졸업생 사용자는 위 3명 + 졸업생인 관리자 1명 = 4명
    db.add_all(alumni)
    db.add_all(users)
    db.flush()

    for u in users[5:7]:
        db.add(Application(user_id=u.id, cohort_id=c5.id, python_exp="script",
                           want_to_make="설비 로그를 자동으로 정리하는 툴 (가상)"))

    # 커리큘럼 (실제 4기 자료 + 5기 바이브코딩 단원 잠정안)
    for i, (stage, title, content) in enumerate(curriculum_seed.UNITS, start=1):
        db.add(CurriculumUnit(order=i, stage=stage, title=title, content=content))
    for i, (title, one_liner, detail, topic, skill) in enumerate(curriculum_seed.PROJECTS, start=1):
        db.add(PracticeProject(order=i, title=title, one_liner=one_liner, detail=detail, topic=topic, skill=skill))

    # 수준 테스트 6문제 (level-test.md 그대로)
    questions = [QuizQuestion(**q) for q in quiz_seed.QUESTIONS]
    db.add_all(questions)
    db.flush()

    # 가상 응시 기록: 관리자 응시 결과 표와 신청자 표의 '수준 테스트' 칸을 확인하려고 넣는다 (모두 가상)
    # 사람마다 응시 순서대로 [1~6번 답]. 첫 번째가 기준 기록(첫 응시)
    tries = {
        users[5]: [[2, 2, 2, 2, "1234", 10], [2, 2, 2, 2, "1234", 12]],  # 송다인: 5(6번 절반) → 다시 풀어 6
        users[6]: [[2, 1, 2, 1, "4321", 12]],  # 황현우: 3
        users[1]: [[1, 1, 2, 1, "4321", 9]],  # 오지유: 1
        users[8]: [[2, 2, 2, 2, "'1234'", 12]],  # 졸업생: 6
    }
    t0 = datetime(2026, 10, 13, 9, 30)
    for k, (u, answer_sets) in enumerate(tries.items()):
        for n, picked in enumerate(answer_sets):
            score, graded = quiz_api.grade(questions, {str(q.id): a for q, a in zip(questions, picked)})
            db.add(QuizAttempt(user_id=u.id, correct_count=score, answers=graded, is_first=n == 0,
                               created_at=t0 + timedelta(days=k % 3, hours=k, minutes=n * 20)))

    seed_projects(db, users, rng)

    db.commit()
    print(f"사용자 {db.query(User).count()}명, 기수 {len(cohorts)}개, 졸업생 명단 {len(alumni)}명을 넣었어요 (모두 가상).")
    db.close()


if __name__ == "__main__":
    run()
