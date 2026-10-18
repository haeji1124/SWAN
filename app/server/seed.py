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

    db.commit()
    print(f"사용자 {db.query(User).count()}명, 기수 {len(cohorts)}개, 졸업생 명단 {len(alumni)}명을 넣었어요 (모두 가상).")
    db.close()


if __name__ == "__main__":
    run()
