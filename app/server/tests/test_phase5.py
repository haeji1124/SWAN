"""Phase 5 수용 기준을 서버에서 확인한다.

아이디어 보드: 남기면 바로 목록에 · 이름 표시 방식대로 · 공감 한 번(다시 누르면 취소) · 내 것만 고치고 지우기 ·
관리자 상태/답변이 카드에 · 숨기면 사라짐 · 관리자 화면에는 늘 이름 · 홈 미리보기(공감 많은 순 3개).
토이프로젝트: 직원은 글쓰기·참여 불가 · 졸업생 모집 글 → 수강생 참여 → 글쓴이만 희망자 목록 · 마감/다시 열기 ·
고치기/지우기 · 관리자 숨기기.

임시 DB(conftest.py)에서 돌린다. 실행: .venv/Scripts/python.exe -m pytest tests -q
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import seed  # noqa: E402
from main import app  # noqa: E402

# seed.py의 가상 사용자 (id = 순번 + 1): 1·2 직원, 6·7 5기 수강생, 8·10 졸업생, 11 관리자(직원)
EMPLOYEE, EMPLOYEE2, STUDENT, STUDENT2, ALUMNI, ALUMNI2, ADMIN = 1, 2, 6, 7, 8, 10, 11
# 가상 아이디어 id: 1 점검표 PDF(공감 9, 만드는 중) … 3 회의실(직원 1이 '부서만'으로 올림) … 8 교육 자료(공감 2)
# 가상 모집 글 id: 1 졸업생 8의 글(희망 6·10) · 2 수강생 6의 글 · 3 졸업생 10의 마감된 글(희망 9)


@pytest.fixture(autouse=True)
def fresh_db():
    seed.run()
    yield


def as_user(uid):
    c = TestClient(app)
    c.cookies.set("swan_dev_user", str(uid) if uid else "fail")
    return c


def idea(c, iid, sort="votes"):
    return next((i for i in c.get(f"/api/ideas?sort={sort}").json()["items"] if i["id"] == iid), None)


# ---------- 아이디어 보드 ----------

def test_ideas_list_sorted_with_all_statuses():
    c = as_user(EMPLOYEE)
    d = c.get("/api/ideas").json()
    items = d["items"]
    assert len(items) == 8 and d["can_post"] is True
    assert [i["votes"] for i in items] == sorted([i["votes"] for i in items], reverse=True)
    assert {i["status_label"] for i in items} == {"접수됨", "검토 중", "만드는 중", "완료", "보류"}
    assert sum(1 for i in items if i["reply"]) == 3
    latest = c.get("/api/ideas?sort=latest").json()["items"]
    assert [i["created_at"] for i in latest] == sorted([i["created_at"] for i in latest], reverse=True)
    assert as_user(None).get("/api/ideas").json()["can_post"] is False  # 로그인 실패도 보기는 된다


def test_new_idea_shows_at_once_with_chosen_name_display():
    c = as_user(EMPLOYEE2)
    r = c.post("/api/ideas", json={"title": "  야간 근무표 공유  ", "description": "근무표를 사진으로 돌려 봐요", "name_display": "dept"})
    assert r.status_code == 200
    new = r.json()
    assert new["title"] == "야간 근무표 공유" and new["status_label"] == "접수됨" and new["votes"] == 0
    assert new["author"] == "품질보증팀"  # 부서만
    assert as_user(EMPLOYEE).get("/api/ideas?sort=latest").json()["items"][0]["id"] == new["id"]  # 승인 없이 바로
    # 이름과 부서
    full = c.post("/api/ideas", json={"title": "하나 더", "description": "설명", "name_display": "full"}).json()
    assert full["author"] == "오지유 · 품질보증팀"
    # 남이 보면 고칠 정보는 없다
    seen = idea(as_user(EMPLOYEE), new["id"])
    assert seen["mine"] is False and seen["name_display"] is None


def test_idea_validation_and_login():
    c = as_user(EMPLOYEE)
    assert c.post("/api/ideas", json={"title": " ", "description": "설명"}).status_code == 400
    assert c.post("/api/ideas", json={"title": "제목", "description": "가" * 301}).status_code == 400
    assert c.post("/api/ideas", json={"title": "가" * 61, "description": "설명"}).status_code == 400
    assert c.post("/api/ideas", json={"title": "제목", "description": "설명", "name_display": "anon"}).status_code == 422
    assert as_user(None).post("/api/ideas", json={"title": "제목", "description": "설명"}).status_code == 401


def test_name_display_on_board_but_admin_sees_name():
    assert idea(as_user(EMPLOYEE2), 3)["author"] == "공정기술 1팀"  # 직원 1이 '부서만'으로 올린 회의실 아이디어
    assert idea(as_user(EMPLOYEE2), 1)["author"] == "권태윤 · 설비기술팀"
    row = next(i for i in as_user(ADMIN).get("/api/admin/ideas").json()["items"] if i["id"] == 3)
    assert row["author_name"] == "한서준" and row["author_dept"] == "공정기술 1팀" and row["name_display"] == "dept"


def test_vote_once_and_toggle():
    c = as_user(EMPLOYEE)
    assert idea(c, 1)["voted"] is False and idea(c, 1)["votes"] == 9
    assert c.post("/api/ideas/1/vote").json() == {"voted": True, "votes": 10}
    assert idea(c, 1)["voted"] is True
    assert c.post("/api/ideas/1/vote").json() == {"voted": False, "votes": 9}  # 다시 누르면 취소
    assert as_user(None).post("/api/ideas/1/vote").status_code == 401
    assert c.post("/api/ideas/999/vote").status_code == 404


def test_only_author_edits_and_deletes():
    other = as_user(EMPLOYEE2)
    body = {"title": "회의실 빈자리 한눈에", "description": "층별로 따로 봐야 해요", "name_display": "full"}
    assert other.put("/api/ideas/3", json=body).status_code == 403
    assert other.delete("/api/ideas/3").status_code == 403
    me = as_user(EMPLOYEE)
    assert idea(me, 3)["mine"] is True and idea(me, 3)["name_display"] == "dept"
    edited = me.put("/api/ideas/3", json=body).json()
    assert edited["title"] == "회의실 빈자리 한눈에" and edited["author"] == "한서준 · 공정기술 1팀" and edited["votes"] == 7
    assert me.delete("/api/ideas/3").json() == {"ok": True}
    assert idea(me, 3) is None and len(me.get("/api/ideas").json()["items"]) == 7


def test_admin_status_and_reply_show_on_card():
    a = as_user(ADMIN)
    assert a.post("/api/admin/ideas/4/status", json={"status": "reviewing"}).json()["status_label"] == "검토 중"
    assert a.post("/api/admin/ideas/4/reply", json={"reply": "부서별 용어를\n먼저 모아 볼게요"}).json()["reply"] == "부서별 용어를 먼저 모아 볼게요"
    card = idea(as_user(EMPLOYEE), 4)
    assert card["status_label"] == "검토 중" and card["reply"] == "부서별 용어를 먼저 모아 볼게요"
    assert a.post("/api/admin/ideas/4/status", json={"status": "held"}).json()["status_label"] == "보류"
    assert a.post("/api/admin/ideas/4/status", json={"status": "nope"}).status_code == 422
    assert a.post("/api/admin/ideas/4/reply", json={"reply": "가" * 101}).status_code == 400
    assert a.post("/api/admin/ideas/4/reply", json={"reply": "  "}).json()["reply"] is None  # 비우면 답변을 지운다
    assert as_user(EMPLOYEE).post("/api/admin/ideas/4/status", json={"status": "done"}).status_code == 403
    assert as_user(EMPLOYEE).get("/api/admin/ideas").status_code == 403


def test_hidden_idea_disappears_everywhere():
    a = as_user(ADMIN)
    assert a.post("/api/admin/ideas/1/hide", json={"hidden": True}).json()["hidden"] is True
    c = as_user(EMPLOYEE)
    assert idea(c, 1) is None
    assert 1 not in [i["id"] for i in c.get("/api/home").json()["ideas"]]
    assert c.post("/api/ideas/1/vote").status_code == 404
    assert next(i for i in a.get("/api/admin/ideas").json()["items"] if i["id"] == 1)["hidden"] is True  # 관리자 목록에는 남는다
    a.post("/api/admin/ideas/1/hide", json={"hidden": False})
    assert idea(c, 1) is not None


def test_home_preview_top_three_by_votes():
    home = as_user(EMPLOYEE2).get("/api/home").json()["ideas"]
    assert [i["title"] for i in home] == ["설비 점검표를 엑셀에서 바로 PDF로", "주간 보고 양식 자동 채우기", "회의실 예약 현황을 한 화면에"]
    assert home[0]["voted"] is True  # 직원 2는 1번에 공감해 두었다


# ---------- 토이프로젝트 ----------

TOY = {"title": "설비 알람 알림 봇", "what": "알람이 울리면 메신저로 알려 주는 봇", "roles": "백엔드 1명", "period": "1개월"}


def test_employee_cannot_write_or_join():
    e = as_user(EMPLOYEE)
    d = e.get("/api/toys").json()
    assert len(d["items"]) == 3 and d["can_write"] is False  # 보기는 된다
    assert e.post("/api/toys", json=TOY).status_code == 403
    assert e.post("/api/toys/1/join").status_code == 403
    assert e.get("/api/toys/1").json()["can_join"] is False
    assert as_user(ADMIN).get("/api/toys").json()["can_write"] is False  # 관리자라도 수강생·졸업생이 아니면
    assert as_user(None).get("/api/toys").status_code == 200
    assert as_user(STUDENT).get("/api/toys").json()["can_write"] is True
    assert as_user(ALUMNI).get("/api/toys").json()["can_write"] is True


def test_list_open_first_then_latest():
    items = as_user(EMPLOYEE).get("/api/toys").json()["items"]
    assert [t["status"] for t in items] == ["open", "open", "closed"]
    assert items[0]["created_at"] > items[1]["created_at"]


def test_alumni_post_student_joins_only_author_sees_applicants():
    al = as_user(ALUMNI)
    t = al.post("/api/toys", json=TOY).json()
    assert t["status_label"] == "모집 중" and t["mine"] is True and t["applicants"] == []
    assert t["author"]["name"] and t["author"]["cohort"] == 1
    st = as_user(STUDENT2)
    assert st.post(f"/api/toys/{t['id']}/join").json() == {"joined": True, "joins": 1}
    seen = al.get(f"/api/toys/{t['id']}").json()["applicants"]
    assert seen == [{**seen[0], "name": "황현우", "dept": "자동화기술팀", "type_label": "수강생"}]
    # 글쓴이가 아니면 희망자 목록이 없다 (참여한 사람도, 관리자도)
    assert st.get(f"/api/toys/{t['id']}").json()["applicants"] is None
    assert as_user(ADMIN).get(f"/api/toys/{t['id']}").json()["applicants"] is None
    assert as_user(EMPLOYEE).get(f"/api/toys/{t['id']}").json()["joins"] == 1
    # 다시 누르면 취소
    assert st.post(f"/api/toys/{t['id']}/join").json() == {"joined": False, "joins": 0}
    assert al.get(f"/api/toys/{t['id']}").json()["applicants"] == []


def test_join_rules():
    assert as_user(ALUMNI).post("/api/toys/1/join").status_code == 409  # 내 글
    assert as_user(STUDENT2).post("/api/toys/3/join").status_code == 409  # 마감
    assert as_user(9).post("/api/toys/3/join").json()["joined"] is False  # 마감 뒤에도 취소는 된다
    assert as_user(STUDENT).post("/api/toys/999/join").status_code == 404


def test_close_reopen_edit_delete_by_author_only():
    other = as_user(ALUMNI2)
    assert other.post("/api/toys/1/status", json={"status": "closed"}).status_code == 403
    assert other.put("/api/toys/1", json=TOY).status_code == 403
    assert other.delete("/api/toys/1").status_code == 403
    al = as_user(ALUMNI)
    assert al.post("/api/toys/1/status", json={"status": "closed"}).json()["status_label"] == "마감"
    assert as_user(STUDENT2).post("/api/toys/1/join").status_code == 409
    assert al.post("/api/toys/1/status", json={"status": "open"}).json()["status_label"] == "모집 중"  # 다시 열기
    edited = al.put("/api/toys/1", json={**TOY, "period": "2주"}).json()
    assert edited["title"] == TOY["title"] and edited["period"] == "2주" and len(edited["applicants"]) == 2
    assert al.put("/api/toys/1", json={**TOY, "roles": " "}).status_code == 400
    assert al.delete("/api/toys/1").json() == {"ok": True}
    assert as_user(EMPLOYEE).get("/api/toys/1").status_code == 404


def test_admin_hides_toy():
    a = as_user(ADMIN)
    rows = a.get("/api/admin/toys").json()["items"]
    assert len(rows) == 3 and all(r["author_name"] for r in rows)
    assert a.post("/api/admin/toys/2/hide", json={"hidden": True}).json()["hidden"] is True
    e = as_user(EMPLOYEE)
    assert 2 not in [t["id"] for t in e.get("/api/toys").json()["items"]]
    assert e.get("/api/toys/2").status_code == 404
    assert a.get("/api/toys/2").status_code == 200  # 관리자는 숨긴 글도 열어 본다
    assert as_user(STUDENT).post("/api/admin/toys/2/hide", json={"hidden": False}).status_code == 403
