"""Phase 6 수용 기준을 서버에서 확인한다.

커리큘럼: 관리자만 · 단원 고치기 → 홈에 반영 · 실습 프로젝트 추가(그림·영상) · 고치기(빼기·바꾸기) · 순서 바꾸기 · 지우기(순서 다시 매김) ·
파일 종류 검사. 관리자: 목록 · 사번/이름으로 찾기 · 추가 · 해제 · 자기 자신은 해제 못 함.

임시 DB와 임시 업로드 폴더(conftest.py)에서 돌린다. 실행: .venv/Scripts/python.exe -m pytest tests -q
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import seed  # noqa: E402
from main import app  # noqa: E402

# seed.py의 가상 사용자: 1 직원(한서준), 2 직원(오지유), 11 관리자(정나연), 12 관리자이면서 졸업생
EMPLOYEE, EMPLOYEE2, ADMIN, ADMIN2 = 1, 2, 11, 12

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
MP4 = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 64
WEBM = b"\x1a\x45\xdf\xa3" + b"\x00" * 64


@pytest.fixture(autouse=True)
def fresh_db():
    seed.run()
    yield


def as_user(uid):
    c = TestClient(app)
    c.cookies.set("swan_dev_user", str(uid) if uid else "fail")
    return c


PROJECT = {"title": "엑셀 보고서 자동화", "one_liner": "엑셀 실적표를 읽어 보고서를 만든다", "detail": "openpyxl로 읽기\n표 만들기",
           "topic": "업무 자동화", "skill": "반복 업무를 코드로"}


def test_only_admin():
    for uid in (EMPLOYEE, None):
        c = as_user(uid)
        assert c.get("/api/admin/curriculum").status_code in (401, 403)
        assert c.post("/api/admin/curriculum/projects", data=PROJECT).status_code in (401, 403)
        assert c.get("/api/admin/admins").status_code in (401, 403)
        assert c.post(f"/api/admin/admins/{EMPLOYEE2}").status_code in (401, 403)


def test_edit_unit_shows_on_home():
    a = as_user(ADMIN)
    d = a.get("/api/admin/curriculum").json()
    assert len(d["units"]) >= 5 and len(d["projects"]) == 11 and [s["value"] for s in d["stages"]] == [1, 2, 3, 4]
    u = d["units"][0]
    r = a.put(f"/api/admin/curriculum/units/{u['id']}", json={"stage": 1, "title": "  파이썬 환경 구성  ", "content": "VS Code 설치\n가상환경 만들기"})
    assert r.status_code == 200 and r.json()["title"] == "파이썬 환경 구성"
    home = as_user(EMPLOYEE).get("/api/home").json()
    assert next(x for x in home["units"] if x["id"] == u["id"])["content"] == "VS Code 설치\n가상환경 만들기"
    assert a.put(f"/api/admin/curriculum/units/{u['id']}", json={"stage": 5, "title": "x", "content": "y"}).status_code == 422
    assert a.put(f"/api/admin/curriculum/units/{u['id']}", json={"stage": 1, "title": " ", "content": "y"}).status_code == 400
    assert a.put("/api/admin/curriculum/units/999", json={"stage": 1, "title": "x", "content": "y"}).status_code == 404


def test_add_project_with_previews_goes_last_and_on_home():
    a = as_user(ADMIN)
    files = [("image", ("p.png", io.BytesIO(PNG), "image/png")), ("video", ("p.mp4", io.BytesIO(MP4), "video/mp4"))]
    p = a.post("/api/admin/curriculum/projects", data=PROJECT, files=files).json()
    assert p["order"] == 12 and p["preview_image"].startswith("/uploads/curriculum/") and p["preview_video"].endswith(".mp4")
    assert a.get(p["preview_video"]).status_code == 200
    home = as_user(EMPLOYEE).get("/api/home").json()["projects"]
    assert home[-1]["title"] == "엑셀 보고서 자동화" and home[-1]["preview_image"] == p["preview_image"]
    # webm도 된다, 이름만 바꾼 영상과 그림 아닌 파일은 막는다
    assert a.post("/api/admin/curriculum/projects", data=PROJECT, files=[("video", ("v.webm", io.BytesIO(WEBM), "video/webm"))]).status_code == 200
    assert a.post("/api/admin/curriculum/projects", data=PROJECT, files=[("video", ("v.mp4", io.BytesIO(b"nope" * 20), "video/mp4"))]).status_code == 400
    assert a.post("/api/admin/curriculum/projects", data=PROJECT, files=[("image", ("x.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf"))]).status_code == 400
    assert a.post("/api/admin/curriculum/projects", data={**PROJECT, "topic": " "}).status_code == 400


def test_edit_project_replace_and_remove_previews():
    a = as_user(ADMIN)
    p = a.post("/api/admin/curriculum/projects", data=PROJECT, files=[("image", ("p.png", io.BytesIO(PNG), "image/png"))]).json()
    old = p["preview_image"]
    # 그림 바꾸기 → 예전 그림은 지워진다
    e = a.put(f"/api/admin/curriculum/projects/{p['id']}", data={**PROJECT, "title": "보고서 자동화"},
              files=[("image", ("q.png", io.BytesIO(PNG), "image/png"))]).json()
    assert e["title"] == "보고서 자동화" and e["preview_image"] != old and a.get(old).status_code == 404
    # 아무것도 안 올리고 고치면 그림은 그대로
    assert a.put(f"/api/admin/curriculum/projects/{p['id']}", data=PROJECT).json()["preview_image"] == e["preview_image"]
    # 빼기
    r = a.put(f"/api/admin/curriculum/projects/{p['id']}", data={**PROJECT, "remove_image": "true"}).json()
    assert r["preview_image"] is None and a.get(e["preview_image"]).status_code == 404


def test_move_and_delete_projects():
    a = as_user(ADMIN)
    ids = [p["id"] for p in a.get("/api/admin/curriculum").json()["projects"]]
    assert a.post(f"/api/admin/curriculum/projects/{ids[1]}/move", json={"direction": "up"}).json()["order"][:2] == [ids[1], ids[0]]
    assert a.post(f"/api/admin/curriculum/projects/{ids[1]}/move", json={"direction": "up"}).json()["order"][:2] == [ids[1], ids[0]]  # 맨 위에서 위로는 그대로
    assert a.post(f"/api/admin/curriculum/projects/{ids[-1]}/move", json={"direction": "down"}).json()["order"][-1] == ids[-1]
    home = [p["id"] for p in as_user(EMPLOYEE).get("/api/home").json()["projects"]]
    assert home[:2] == [ids[1], ids[0]]
    assert a.delete(f"/api/admin/curriculum/projects/{ids[0]}").json() == {"ok": True}
    after = a.get("/api/admin/curriculum").json()["projects"]
    assert len(after) == 10 and [p["order"] for p in after] == list(range(1, 11))
    assert a.delete(f"/api/admin/curriculum/projects/{ids[0]}").status_code == 404


def test_admins_list_search_add_remove():
    a = as_user(ADMIN)
    items = a.get("/api/admin/admins").json()["items"]
    assert {i["id"] for i in items} == {ADMIN, ADMIN2} and next(i for i in items if i["id"] == ADMIN)["me"] is True
    # 이름으로, 사번으로 찾기 (관리자는 찾기에 나오지 않는다)
    found = a.get("/api/admin/users/search", params={"q": "오지"}).json()["items"]
    assert [u["id"] for u in found] == [EMPLOYEE2]
    assert [u["id"] for u in a.get("/api/admin/users/search", params={"q": "E00001"}).json()["items"]] == [EMPLOYEE]
    assert a.get("/api/admin/users/search", params={"q": "정나연"}).json()["items"] == []
    assert a.get("/api/admin/users/search", params={"q": " "}).json()["items"] == []
    # 추가하면 관리자 화면에 들어갈 수 있다
    assert a.post(f"/api/admin/admins/{EMPLOYEE2}").json()["name"] == "오지유"
    assert a.post(f"/api/admin/admins/{EMPLOYEE2}").status_code == 409
    assert as_user(EMPLOYEE2).get("/api/admin/admins").status_code == 200
    assert as_user(EMPLOYEE2).get("/api/me").json()["is_admin"] is True
    # 해제
    assert a.delete(f"/api/admin/admins/{EMPLOYEE2}").json() == {"ok": True}
    assert as_user(EMPLOYEE2).get("/api/admin/admins").status_code == 403
    assert a.delete(f"/api/admin/admins/{EMPLOYEE2}").status_code == 409
    # 자기 자신은 해제할 수 없다
    assert a.delete(f"/api/admin/admins/{ADMIN}").status_code == 409
    assert as_user(ADMIN2).delete(f"/api/admin/admins/{ADMIN}").json() == {"ok": True}  # 다른 관리자는 해제할 수 있다
    assert a.get("/api/admin/admins").status_code == 403
