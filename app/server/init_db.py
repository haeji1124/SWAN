"""실제 운영용 데이터베이스를 만든다 (가상 데이터 없이). 사내망 반입 뒤 처음 한 번만 실행한다.

넣는 것: 표 전체, 커리큘럼(curriculum_seed — 실제 4기 자료와 5기 단원), 수준 테스트 6문제(quiz_seed), 첫 관리자 한 명.
넣지 않는 것: 가상 사용자·기수·졸업생·완성작·아이디어·모집 글 (seed.py와 다른 점).
이미 사용자가 있는 데이터베이스면 아무것도 바꾸지 않고 멈춘다 (실수로 운영 데이터를 지우지 않게).

실행 (app/server에서):
  .venv\\Scripts\\python.exe init_db.py --emp-no 사번 --name 이름 --dept 부서
  (데이터베이스 위치를 바꾸려면 먼저 환경 변수 SWAN_DB=경로)
"""
import argparse
import sys

import curriculum_seed
import quiz_seed
from db import DB_PATH, Base, SessionLocal, engine
from models import CurriculumUnit, PracticeProject, QuizQuestion, User


def run(emp_no: str, name: str, dept: str) -> int:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.query(User).count() or db.query(CurriculumUnit).count():
            print(f"이미 데이터가 있는 데이터베이스예요 ({DB_PATH}). 아무것도 바꾸지 않았어요.")
            print("처음부터 다시 만들려면 이 파일을 다른 곳에 옮겨 둔 뒤 다시 실행해 주세요.")
            return 1
        for i, (stage, title, content) in enumerate(curriculum_seed.UNITS, start=1):
            db.add(CurriculumUnit(order=i, stage=stage, title=title, content=content))
        for i, (title, one_liner, detail, topic, skill) in enumerate(curriculum_seed.PROJECTS, start=1):
            db.add(PracticeProject(order=i, title=title, one_liner=one_liner, detail=detail, topic=topic, skill=skill))
        for q in quiz_seed.QUESTIONS:
            db.add(QuizQuestion(**q))
        # 첫 관리자. SSO를 붙이면 같은 사번으로 들어올 때 이 사용자로 로그인된다 (docs/sso.md)
        db.add(User(emp_no=emp_no.strip(), name=name.strip(), dept=dept.strip(), is_admin=True))
        db.commit()
        print(f"만들었어요: {DB_PATH}")
        print(f"- 커리큘럼 단원 {len(curriculum_seed.UNITS)}개, 실습 프로젝트 {len(curriculum_seed.PROJECTS)}개, 수준 테스트 {len(quiz_seed.QUESTIONS)}문제")
        print(f"- 첫 관리자: {name} ({emp_no}, {dept})")
        print("다음 순서: docs/deploy.md의 '실제 데이터 넣는 순서'")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="SWAN 운영용 데이터베이스 만들기 (가상 데이터 없음)")
    p.add_argument("--emp-no", required=True, help="첫 관리자의 사번")
    p.add_argument("--name", required=True, help="첫 관리자의 이름")
    p.add_argument("--dept", required=True, help="첫 관리자의 부서")
    a = p.parse_args()
    sys.exit(run(a.emp_no, a.name, a.dept))
