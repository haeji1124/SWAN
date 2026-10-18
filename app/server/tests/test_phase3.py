"""Phase 3 수용 기준을 서버에서 확인한다: 채점 · 주관식 공백/따옴표 · 줄 고르기 부분 정답 · 성장 단계 · 첫 응시 기록 ·
로그인 실패면 기록 안 함 · 정답을 미리 보내지 않음 · 관리자 문제 수정이 바로 반영 · 응시 결과 표 · 신청자 표의 점수 칸.

임시 데이터베이스(SWAN_DB)에 가상 데이터를 새로 넣고 돌린다. 개발용 swan.db는 건드리지 않는다.
실행: .venv/Scripts/python.exe -m pytest tests -q
"""
import os
import sys
import tempfile

if "SWAN_DB" not in os.environ:  # test_phase2와 함께 돌 때는 같은 임시 DB를 쓴다
    os.environ["SWAN_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["SWAN_DEV_LOGIN"] = "1"
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import seed  # noqa: E402
from main import app  # noqa: E402
from quiz_api import normalize_short  # noqa: E402

# seed.py의 가상 사용자: 1 직원(응시 기록 없음), 6 5기 신청자(첫 응시 5 → 다시 6), 11 관리자
EMPLOYEE, APPLICANT, ADMIN = 1, 6, 11


@pytest.fixture(autouse=True)
def fresh_db():
    seed.run()
    yield


def as_user(uid):
    c = TestClient(app)
    c.cookies.set("swan_dev_user", str(uid) if uid else "fail")
    return c


def qs(c):
    return c.get("/api/quiz").json()["questions"]


def answers(c, picks):
    """picks: 1~6번 답 목록 → {문제 id: 답}"""
    return {str(q["id"]): a for q, a in zip(qs(c), picks)}


ALL_RIGHT = [2, 2, 2, 2, "1234", 12]


def test_questions_do_not_leak_answers():
    data = as_user(EMPLOYEE).get("/api/quiz").json()
    assert data["total"] == 6 and [q["type"] for q in data["questions"]] == ["choice"] * 4 + ["short", "line"]
    for q in data["questions"]:
        assert "answer" not in q and "explanation" not in q and "partial_answer" not in q
    assert data["mine"] is None and data["will_record"] is True


@pytest.mark.parametrize("picks, score, stage", [
    (ALL_RIGHT, 6, "cygnet"),
    ([2, 2, 2, 2, "1234", 1], 5, "cygnet"),
    ([2, 2, 2, 1, "4321", 12], 4, "duckling"),
    ([2, 2, 1, 1, "4321", 12], 3, "duckling"),
    ([2, 1, 1, 1, "4321", 12], 2, "hatchling"),
    ([1, 1, 1, 1, "", 1], 0, "hatchling"),
])
def test_score_matches_stage(picks, score, stage):
    c = as_user(EMPLOYEE)
    r = c.post("/api/quiz/submit", json={"answers": answers(c, picks)}).json()
    assert r["score"] == score and r["total"] == 6 and r["stage"]["key"] == stage


@pytest.mark.parametrize("text", ["1234", '"1234"', "'1234'", " 1234 ", '  "1234"\n', "`1234`"])
def test_short_answer_ignores_spaces_and_quotes(text):
    c = as_user(EMPLOYEE)
    r = c.post("/api/quiz/submit", json={"answers": answers(c, [1, 1, 1, 1, text, 1])}).json()
    assert r["results"][4]["result"] == "correct"


def test_short_answer_wrong_stays_wrong():
    assert normalize_short("4321") != normalize_short("1234")
    assert normalize_short("12 34") == "12 34"  # 가운데 공백은 그대로 (출력과 다르다)


@pytest.mark.parametrize("line, result", [(12, "correct"), (10, "partial"), (11, "partial"), (9, "wrong")])
def test_line_question(line, result):
    c = as_user(EMPLOYEE)
    r = c.post("/api/quiz/submit", json={"answers": answers(c, [1, 1, 1, 1, "", line])}).json()
    six = r["results"][5]
    assert six["result"] == result and six["my_answer"] == line
    assert r["score"] == (1 if result == "correct" else 0)  # 부분 정답은 0점
    assert six["answer"] == "12" and six["partial_answer"] == [10, 11] and six["line_notes"]["12"]


def test_first_attempt_is_kept_on_retake():
    c = as_user(EMPLOYEE)
    first = c.post("/api/quiz/submit", json={"answers": answers(c, [1, 1, 1, 1, "", 1])}).json()
    assert first["saved"] and first["is_first"] and first["first_score"] == 0
    again = c.post("/api/quiz/submit", json={"answers": answers(c, ALL_RIGHT)}).json()
    assert again["score"] == 6 and not again["is_first"] and again["first_score"] == 0
    mine = c.get("/api/quiz").json()["mine"]
    assert mine["first_score"] == 0 and mine["attempts"] == 2


def test_logged_out_can_solve_but_not_recorded():
    c = as_user(None)
    r = c.post("/api/quiz/submit", json={"answers": answers(c, ALL_RIGHT)}).json()
    assert r["score"] == 6 and r["saved"] is False and r["applied"] is False
    rows = as_user(ADMIN).get("/api/admin/quiz/attempts").json()["rows"]
    assert len(rows) == 4  # seed의 가상 응시자 4명 그대로


def test_low_score_does_not_block_apply_and_applied_flag():
    c = as_user(EMPLOYEE)
    r = c.post("/api/quiz/submit", json={"answers": answers(c, [1, 1, 1, 1, "", 1])}).json()
    assert r["stage"]["key"] == "hatchling" and r["applied"] is False and r["recruiting"] is True
    assert c.post("/api/apply", json={"python_exp": "none"}).status_code == 200
    r = c.post("/api/quiz/submit", json={"answers": answers(c, [1, 1, 1, 1, "", 1])}).json()
    assert r["applied"] is True  # 결과 화면에서 "이미 신청하셨어요"


def test_admin_edit_is_reflected_immediately():
    admin = as_user(ADMIN)
    q5 = next(q for q in admin.get("/api/admin/quiz/questions").json() if q["order"] == 5)
    body = {k: q5[k] for k in ("order", "type", "title", "scenario", "code", "question", "choices",
                               "answer", "partial_answer", "explanation", "better_code", "line_notes")}
    body["question"] = "출력을 적어 주세요 (고친 문구)"
    body["answer"] = "4321"
    assert admin.put(f"/api/admin/quiz/questions/{q5['id']}", json=body).status_code == 200
    c = as_user(EMPLOYEE)
    assert qs(c)[4]["question"] == "출력을 적어 주세요 (고친 문구)"
    r = c.post("/api/quiz/submit", json={"answers": answers(c, [1, 1, 1, 1, "4321", 1])}).json()
    assert r["results"][4]["result"] == "correct"


def test_admin_add_question_and_validation():
    admin = as_user(ADMIN)
    base = {"order": 7, "type": "choice", "title": "새 문제", "code": "print(1)", "question": "무엇이 나올까요?",
            "choices": ["1", "2"], "answer": "3", "explanation": "1이 나와요."}
    r = admin.post("/api/admin/quiz/questions", json=base)
    assert r.status_code == 400 and "보기 번호" in r.json()["detail"]
    line = {**base, "type": "line", "choices": [], "answer": "5"}
    r = admin.post("/api/admin/quiz/questions", json=line)
    assert r.status_code == 400 and "줄 번호" in r.json()["detail"]
    assert admin.post("/api/admin/quiz/questions", json={**base, "answer": "1"}).status_code == 200
    assert as_user(EMPLOYEE).get("/api/quiz").json()["total"] == 7


def test_admin_only():
    assert as_user(EMPLOYEE).get("/api/admin/quiz/questions").status_code == 403
    assert as_user(EMPLOYEE).get("/api/admin/quiz/attempts").status_code == 403
    assert as_user(None).get("/api/admin/quiz/attempts").status_code == 401


def test_attempts_table_and_applicant_column():
    admin = as_user(ADMIN)
    data = admin.get("/api/admin/quiz/attempts").json()
    dain = next(r for r in data["rows"] if r["name"] == "송다인")
    assert dain["first_score"] == 5 and dain["attempts"] == 2  # 다시 풀어 6이 나와도 기준은 첫 응시
    assert list(dain["results"].values()) == ["correct"] * 5 + ["partial"]
    five = next(x for x in admin.get("/api/admin/cohorts").json() if x["number"] == 5)
    data = admin.get(f"/api/admin/applicants?cohort_id={five['id']}").json()
    active = data["active"]
    assert data["quiz_total"] == 6  # 칸에 "5 / 6"으로 보여 준다
    assert {r["name"]: r["quiz_first_score"] for r in active} == {"송다인": 5, "황현우": 3}
