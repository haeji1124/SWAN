"""SWAN 서버. 개발 중에는 Vite가 /api를 이리로 넘기고, 배포할 때는 빌드된 화면(web/dist)도 함께 서비스한다."""
import os
from datetime import date
from typing import Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import admin_api
import apply_api
import auth
import ideas_api
import projects_api
import quiz_api
import toys_api
from db import Base, engine, get_db
from models import Alumni, Cohort, CurriculumUnit, EventLog, PracticeProject, User

Base.metadata.create_all(engine)

app = FastAPI(title="SWAN")
app.include_router(apply_api.router)  # 신청 · 취소 · 다음 기수 알림 (Phase 2)
app.include_router(admin_api.router)  # 관리자: 기수 · 신청자 · 졸업생 (Phase 2)
app.include_router(quiz_api.router)  # 수준 테스트 (Phase 3)
app.include_router(quiz_api.admin)  # 관리자: 수준 테스트 문제 · 응시 결과 (Phase 3)
app.include_router(projects_api.router)  # 완성작 갤러리 (Phase 4)
app.include_router(projects_api.admin)  # 관리자: 완성작 검수 (Phase 4)
app.include_router(ideas_api.router)  # 아이디어 보드 (Phase 5)
app.include_router(ideas_api.admin)  # 관리자: 아이디어 (Phase 5)
app.include_router(toys_api.router)  # 토이프로젝트 (Phase 5)
app.include_router(toys_api.admin)  # 관리자: 토이프로젝트 (Phase 5)
# 올린 파일(완성작 이미지·발표자료). 이름은 서버가 지은 추측하기 어려운 이름이다
app.mount(projects_api.URL_PREFIX, StaticFiles(directory=projects_api.UPLOAD_DIR), name="uploads")


# ---------- 나 ----------

@app.get("/api/me")
def me(user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    if user is None:
        return {"logged_in": False}
    cohort = auth.current_cohort(db)
    return {
        "logged_in": True,
        "id": user.id,
        "name": user.name,
        "dept": user.dept,
        "type": auth.user_type(db, user),
        "is_admin": user.is_admin,
        "applied_current": auth.active_application(db, user, cohort) is not None,
        "recruiting": auth.open_cohort(db) is not None,  # 모집 기간인지 (상단 버튼 상태를 정한다)
        "interested": apply_api.has_interest(db, user),  # 다음 기수 알림을 신청했는지
    }


# ---------- 홈 ----------

WEEKDAYS = "월화수목금토일"


@app.get("/api/home")
def home(user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    """홈에 필요한 것을 한 번에: 모집 상태, 숫자와 띠, 커리큘럼."""
    cohort = auth.open_cohort(db)
    recruit = None
    if cohort:
        days_left = (cohort.recruit_end - date.today()).days
        recruit = {
            "number": cohort.number,
            "recruit_end": cohort.recruit_end.isoformat(),
            "recruit_end_label": f"{cohort.recruit_end.month}월 {cohort.recruit_end.day}일({WEEKDAYS[cohort.recruit_end.weekday()]})",
            "days_left": days_left,
            # 개강일과 강의 시간 (UI 체크리스트 02-7: 홈에 개강일이 없었다)
            "start_label": apply_api.day_label(cohort.start_date),
            "days_to_start": (cohort.start_date - date.today()).days,
            "class_day": cohort.class_day,
            "class_time": cohort.class_time,
        }
    next_number = (db.scalar(select(func.max(Cohort.number))) or 0) + (0 if cohort else 1)

    alumni = db.scalars(select(Alumni).order_by(Alumni.cohort_number.desc(), Alumni.id)).all()
    depts = sorted({a.dept for a in alumni})
    cohort_numbers = sorted({a.cohort_number for a in alumni})

    units = db.scalars(select(CurriculumUnit).order_by(CurriculumUnit.order)).all()
    projects = db.scalars(select(PracticeProject).order_by(PracticeProject.order)).all()
    return {
        "recruit": recruit,
        "next_number": next_number,
        "stats": {
            "cohorts": len(cohort_numbers),
            "first_cohort": cohort_numbers[0] if cohort_numbers else None,
            "last_cohort": cohort_numbers[-1] if cohort_numbers else None,
            "alumni": len(alumni),
            "depts": len(depts),
        },
        "alumni_names": [a.name for a in alumni[:40]],
        "showcase": projects_api.top_projects(db, user),  # 완성작 미리보기: 좋아요 많은 순 5개
        "ideas": ideas_api.top_ideas(db, user),  # 아이디어 보드 미리보기: 공감 많은 순 3개
        "dept_names": depts,
        "units": [{"id": u.id, "stage": u.stage, "title": u.title, "content": u.content} for u in units],
        "projects": [
            {
                "id": p.id, "title": p.title, "one_liner": p.one_liner, "detail": p.detail,
                "topic": p.topic, "skill": p.skill,
                "preview_image": p.preview_image, "preview_video": p.preview_video,
            }
            for p in projects
        ],
    }


# ---------- 기록 ----------

class EventIn(BaseModel):
    kind: Literal["visit", "section", "click"]
    target: str = Field(max_length=200)


@app.post("/api/events", status_code=204)
def log_event(body: EventIn, user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    db.add(EventLog(user_id=user.id if user else None, kind=body.kind, target=body.target))
    db.commit()
    return Response(status_code=204)


# ---------- 개발용 임시 로그인 ----------

class DevLoginIn(BaseModel):
    user_id: Optional[int] = None  # None이면 "로그인 실패" 상태


@app.get("/api/dev/users")
def dev_users(db: Session = Depends(get_db)):
    if not auth.DEV_LOGIN_ENABLED:
        raise HTTPException(status_code=404)
    users = db.scalars(select(User).order_by(User.id)).all()
    return [
        {"id": u.id, "name": u.name, "dept": u.dept, "type": auth.user_type(db, u), "is_admin": u.is_admin}
        for u in users
    ]


@app.post("/api/dev/login")
def dev_login(body: DevLoginIn, response: Response):
    if not auth.DEV_LOGIN_ENABLED:
        raise HTTPException(status_code=404)
    value = str(body.user_id) if body.user_id is not None else auth.DEV_FAIL
    response.set_cookie(auth.DEV_COOKIE, value, httponly=True, samesite="lax")
    return {"ok": True}


# ---------- 빌드된 화면 ----------

DIST = os.path.join(os.path.dirname(__file__), "..", "web", "dist")
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{path:path}")
    def spa(path: str, request: Request):
        if path.startswith("api/"):
            raise HTTPException(status_code=404)
        file = os.path.join(DIST, path)
        if path and os.path.isfile(file):
            return FileResponse(file)
        return FileResponse(os.path.join(DIST, "index.html"))
