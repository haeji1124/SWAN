"""Phase 8: 운영용 데이터베이스 만들기(init_db.py)를 확인한다.

가상 데이터 없이 커리큘럼·수준 테스트·첫 관리자만 들어가고, 이미 데이터가 있으면 아무것도 바꾸지 않는다.
임시 DB(conftest.py)에서 돌린다. 다른 시험 파일은 시작할 때마다 seed.run()으로 다시 만든다.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient  # noqa: E402

import curriculum_seed  # noqa: E402
import init_db  # noqa: E402
import quiz_seed  # noqa: E402
from db import Base, SessionLocal, engine  # noqa: E402
from main import app  # noqa: E402
from models import Alumni, Cohort, CurriculumUnit, Idea, Project, QuizQuestion, ToyPost, User  # noqa: E402


def test_init_db_real_content_only_and_refuses_twice():
    Base.metadata.drop_all(engine)
    assert init_db.run("X00001", "운영자", "운영파트") == 0
    db = SessionLocal()
    try:
        assert db.query(CurriculumUnit).count() == len(curriculum_seed.UNITS)
        assert db.query(QuizQuestion).count() == len(quiz_seed.QUESTIONS)
        users = db.query(User).all()
        assert [(u.emp_no, u.is_admin) for u in users] == [("X00001", True)]
        for model in (Cohort, Alumni, Project, Idea, ToyPost):  # 가상 데이터는 없다
            assert db.query(model).count() == 0
    finally:
        db.close()
    # 다시 실행하면 아무것도 바꾸지 않는다
    assert init_db.run("X00002", "둘째", "운영파트") == 1
    db = SessionLocal()
    try:
        assert db.query(User).count() == 1
    finally:
        db.close()
    # 빈 운영 데이터로도 화면 데이터가 나온다 (모집 없음, 완성작 0)
    c = TestClient(app)
    c.cookies.set("swan_dev_user", "1")
    home = c.get("/api/home").json()
    assert home["recruit"] is None and home["next_number"] == 1 and home["showcase"] == [] and home["ideas"] == []
    assert len(home["units"]) == len(curriculum_seed.UNITS)
    assert c.get("/api/me").json()["is_admin"] is True
