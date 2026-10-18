"""Phase 4 수용 기준을 서버에서 확인한다: 공개된 것만 목록에 · 기수/부서 필터와 정렬 · 졸업생만 올리기 · 확인 체크 ·
파일 종류/크기 검사 · 승인 대기 → 반려(이유) → 고쳐 다시 올림 → 승인 · 좋아요 한 번 · 지우기 · 홈 미리보기.

임시 DB와 임시 업로드 폴더(conftest.py)에서 돌린다.
실행: .venv/Scripts/python.exe -m pytest tests -q
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import projects_api  # noqa: E402
import seed  # noqa: E402
from main import app  # noqa: E402

# seed.py의 가상 사용자: 1 직원, 8·9·10 졸업생(1·2·3기), 11 관리자, 12 관리자이면서 4기 졸업생
EMPLOYEE, ALUMNI, ADMIN = 1, 9, 11

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.4\n%\xe2\xe3\n" + b"0" * 64


@pytest.fixture(autouse=True)
def fresh_db():
    seed.run()
    yield


def as_user(uid):
    c = TestClient(app)
    c.cookies.set("swan_dev_user", str(uid) if uid else "fail")
    return c


def form(**over):
    data = {"title": "검사 결과 모아보기", "summary": "검사 결과를 한 화면에서 봐요", "problem": "파일을 하나씩 열었어요",
            "effect": "10분 → 1분", "repo_url": "", "detail": "## 설명", "confirmed": "true"}
    data.update(over)
    return data


def files(cover=("cover.png", PNG), shots=(), slides=None):
    out = [("cover", (cover[0], io.BytesIO(cover[1]), "image/png"))]
    out += [("screenshots", (n, io.BytesIO(b), "image/png")) for n, b in shots]
    if slides:
        out.append(("slides", (slides[0], io.BytesIO(slides[1]), "application/pdf")))
    return out


def test_list_shows_only_published_with_filters_and_sort():
    c = as_user(EMPLOYEE)
    d = c.get("/api/projects").json()
    assert d["total"] == 6 and len(d["items"]) == 6
    assert all(i["status"] == "published" for i in d["items"])
    assert d["cohorts"] == [1, 2, 3, 4] and d["can_upload"] is False
    a = d["items"][0]["author"]
    assert {"name", "dept", "cohort"} <= set(a)  # 이름·부서·기수를 모두 보여 준다
    assert [i["author"]["cohort"] for i in c.get("/api/projects?cohort=3").json()["items"]] == [3, 3]
    dept = d["items"][0]["author"]["dept"]
    assert all(i["author"]["dept"] == dept for i in c.get(f"/api/projects?dept={dept}").json()["items"])
    likes = [i["likes"] for i in c.get("/api/projects?sort=likes").json()["items"]]
    assert likes == sorted(likes, reverse=True)
    dates = [i["created_at"] for i in d["items"]]
    assert dates == sorted(dates, reverse=True)  # 기본은 최신순
    assert as_user(ALUMNI).get("/api/projects").json()["can_upload"] is True


def test_pending_hidden_from_others_but_visible_to_owner_and_admin():
    pending = next(p for p in as_user(ADMIN).get("/api/admin/projects?status=pending").json()["items"])
    pid = pending["id"]
    assert as_user(EMPLOYEE).get(f"/api/projects/{pid}").status_code == 404
    owner = pending["author"]["id"]
    assert as_user(owner).get(f"/api/projects/{pid}").status_code == 200
    assert as_user(ADMIN).get(f"/api/projects/{pid}").status_code == 200


def test_like_once_per_person_and_toggle():
    pid = as_user(EMPLOYEE).get("/api/projects").json()["items"][0]["id"]
    c = as_user(EMPLOYEE)
    before = c.get(f"/api/projects/{pid}").json()["likes"]
    was_liked = c.get(f"/api/projects/{pid}").json()["liked"]
    r = c.post(f"/api/projects/{pid}/like").json()
    after = c.get(f"/api/projects/{pid}").json()
    assert r["liked"] is (not was_liked) and after["liked"] is r["liked"]
    assert after["likes"] == before + (1 if r["liked"] else -1)
    again = c.post(f"/api/projects/{pid}/like").json()  # 다시 누르면 취소
    assert again["likes"] == before and again["liked"] is not r["liked"]
    assert as_user(None).post(f"/api/projects/{pid}/like").status_code == 401  # 로그인 실패면 안내


def test_only_alumni_can_upload():
    r = as_user(EMPLOYEE).post("/api/projects", data=form(), files=files())
    assert r.status_code == 403 and "졸업생" in r.json()["detail"]
    assert as_user(None).post("/api/projects", data=form(), files=files()).status_code == 401


@pytest.mark.parametrize("over, file_kw, msg", [
    ({"confirmed": "false"}, {}, "확인"),
    ({"summary": "가" * 81}, {}, "80자"),
    ({"repo_url": "ftp://x"}, {}, "http"),
    ({}, {"cover": ("cover.png", b"not an image")}, "읽을 수 없"),
    ({}, {"cover": ("cover.exe", PNG)}, "파일만"),
    ({}, {"shots": [(f"s{i}.png", PNG) for i in range(9)]}, "8장"),
])
def test_upload_validation(over, file_kw, msg):
    r = as_user(ALUMNI).post("/api/projects", data=form(**over), files=files(**file_kw))
    assert r.status_code in (400, 413) and msg in r.json()["detail"]


def test_upload_size_limit(monkeypatch):
    monkeypatch.setattr(projects_api, "MAX_IMAGE", 32)
    r = as_user(ALUMNI).post("/api/projects", data=form(), files=files())
    assert r.status_code == 413 and "너무 커요" in r.json()["detail"]


def test_review_flow_reject_edit_approve_like():
    alum, admin = as_user(ALUMNI), as_user(ADMIN)
    r = alum.post("/api/projects", data=form(), files=files(shots=[("a.png", PNG)], slides=("deck.pdf", PDF)))
    assert r.status_code == 200
    p = r.json()
    assert p["status"] == "pending" and p["slides"].endswith(".pdf") and len(p["screenshots"]) == 1
    assert os.path.isfile(os.path.join(projects_api.UPLOAD_DIR, p["cover"].replace("/uploads/", "")))
    assert p["id"] not in [i["id"] for i in as_user(EMPLOYEE).get("/api/projects").json()["items"]]

    # 반려: 이유를 꼭 적는다 → 올린 사람에게 보인다
    assert admin.post(f"/api/admin/projects/{p['id']}/reject", json={"reason": ""}).status_code == 422
    assert admin.post(f"/api/admin/projects/{p['id']}/reject", json={"reason": "캡처에 실제 장비 이름이 보여요"}).status_code == 200
    mine = next(m for m in alum.get("/api/projects/mine").json() if m["id"] == p["id"])
    assert mine["status"] == "rejected" and mine["reject_reason"] == "캡처에 실제 장비 이름이 보여요"

    # 고쳐서 다시 올리면 승인 대기로. 화면 캡처는 지우고 새 대표 이미지
    r = alum.put(f"/api/projects/{p['id']}", data=form(title="고친 제목", keep_screenshots="[]"),
                 files=[("cover", ("new.png", io.BytesIO(PNG), "image/png"))])
    edited = r.json()
    assert r.status_code == 200 and edited["status"] == "pending" and edited["reject_reason"] is None
    assert edited["screenshots"] == [] and edited["cover"] != p["cover"] and edited["slides"] == p["slides"]
    assert not os.path.exists(os.path.join(projects_api.UPLOAD_DIR, p["screenshots"][0].replace("/uploads/", "")))

    # 승인하면 목록에 나오고 좋아요를 누를 수 있다
    assert admin.post(f"/api/admin/projects/{p['id']}/approve").status_code == 200
    assert p["id"] in [i["id"] for i in as_user(EMPLOYEE).get("/api/projects").json()["items"]]
    assert as_user(EMPLOYEE).post(f"/api/projects/{p['id']}/like").json() == {"liked": True, "likes": 1}

    # 공개된 것을 고치면 다시 승인 대기
    alum.put(f"/api/projects/{p['id']}", data=form(keep_screenshots="[]"))
    assert p["id"] not in [i["id"] for i in as_user(EMPLOYEE).get("/api/projects").json()["items"]]


def test_only_owner_edits_and_deletes():
    alum = as_user(ALUMNI)
    p = alum.post("/api/projects", data=form(), files=files()).json()
    other = as_user(8)  # 다른 졸업생
    assert other.put(f"/api/projects/{p['id']}", data=form()).status_code == 403
    assert other.delete(f"/api/projects/{p['id']}").status_code == 403
    assert alum.delete(f"/api/projects/{p['id']}").status_code == 200
    assert not os.path.exists(os.path.join(projects_api.UPLOAD_DIR, p["cover"].replace("/uploads/", "")))
    assert alum.get(f"/api/projects/{p['id']}").status_code == 404


def test_admin_only_and_unpublish_with_reason():
    assert as_user(EMPLOYEE).get("/api/admin/projects").status_code == 403
    admin = as_user(ADMIN)
    d = admin.get("/api/admin/projects?status=published").json()
    assert d["counts"] == {"pending": 1, "published": 6, "rejected": 1}
    pid = d["items"][0]["id"]
    assert admin.post(f"/api/admin/projects/{pid}/reject", json={"reason": "내용 확인이 더 필요해요"}).status_code == 200
    assert pid not in [i["id"] for i in as_user(EMPLOYEE).get("/api/projects").json()["items"]]


def test_home_showcase_by_likes():
    show = as_user(EMPLOYEE).get("/api/home").json()["showcase"]
    assert len(show) == 5 and [s["likes"] for s in show] == sorted([s["likes"] for s in show], reverse=True)
    assert all(s["cover"].startswith("/uploads/") for s in show)
    # 내가 누른 하트가 홈에서도 보인다 (안 그러면 다시 눌러 취소하게 된다)
    liked = as_user(EMPLOYEE).get("/api/projects").json()["items"]
    mine = {i["id"]: i["liked"] for i in liked}
    assert all(s["liked"] == mine[s["id"]] for s in show)
