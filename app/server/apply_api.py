"""신청과 취소, 다음 기수 알림 (Phase 2).

규칙 (CLAUDE.md '꼭 지킬 동작 규칙'):
- 선발이 없다. 신청하면 수강 확정이다
- 신청서는 두 칸뿐: 파이썬 경험(고르기), 만들고 싶은 것(선택). 이름·부서·사번은 로그인 정보로 뒤에서 저장한다
- 한 사람은 한 기수에 유효한 신청이 한 건뿐이다 (서버에서도 막는다). 취소하면 다시 신청할 수 있다
"""
from datetime import date, datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import auth
from db import get_db
from models import Application, Cohort, Interest, User

router = APIRouter()

WEEKDAYS = "월화수목금토일"
PYTHON_EXP = {"none": "거의 없음", "script": "간단한 스크립트", "regular": "업무에 꾸준히 사용 중"}


def day_label(d: date) -> str:
    """10월 23일(금)"""
    return f"{d.month}월 {d.day}일({WEEKDAYS[d.weekday()]})"


def cohort_info(c: Cohort) -> dict:
    """화면에 보여 줄 기수 정보. 날짜는 '10월 23일(금)' 꼴로도 함께 준다."""
    today = date.today()
    return {
        "id": c.id,
        "number": c.number,
        "status": c.status,
        "recruit_start": c.recruit_start.isoformat(),
        "recruit_end": c.recruit_end.isoformat(),
        "start_date": c.start_date.isoformat(),
        "end_date": c.end_date.isoformat(),
        "recruit_start_label": day_label(c.recruit_start),
        "recruit_end_label": day_label(c.recruit_end),
        "start_label": day_label(c.start_date),
        "end_label": day_label(c.end_date),
        "class_day": c.class_day,
        "class_time": c.class_time,
        "days_left": (c.recruit_end - today).days,  # 마감까지
        "days_to_start": (c.start_date - today).days,  # 개강까지
    }


def application_info(a: Application, user: User, c: Cohort) -> dict:
    return {
        "cohort_number": c.number,
        "name": user.name,
        "dept": user.dept,
        "python_exp": a.python_exp,
        "python_exp_label": PYTHON_EXP.get(a.python_exp, a.python_exp),
        "want_to_make": a.want_to_make,
        "applied_at": a.applied_at.isoformat(timespec="minutes"),
        "applied_label": f"{a.applied_at.month}월 {a.applied_at.day}일 {a.applied_at:%H:%M}",
        "start_label": day_label(c.start_date),
        "days_to_start": (c.start_date - date.today()).days,
    }


def has_interest(db: Session, user: User) -> bool:
    return db.scalars(select(Interest.id).where(Interest.user_id == user.id)).first() is not None


@router.get("/api/apply")
def apply_info(user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    """신청 화면: 모집 중인 기수, 내 신청(있으면), 다음 기수 알림 여부."""
    cohort = auth.open_cohort(db)
    mine = None
    if user and cohort:
        a = auth.active_application(db, user, cohort)
        if a:
            mine = application_info(a, user, cohort)
    next_number = (db.scalar(select(func.max(Cohort.number))) or 0) + (0 if cohort else 1)
    return {
        "cohort": cohort_info(cohort) if cohort else None,
        "next_number": next_number,
        "mine": mine,
        "interested": bool(user and has_interest(db, user)),
    }


class ApplyIn(BaseModel):
    python_exp: Literal["none", "script", "regular"]
    want_to_make: Optional[str] = Field(default=None, max_length=300)


@router.post("/api/apply")
def apply(body: ApplyIn, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    cohort = auth.open_cohort(db)
    if cohort is None:
        raise HTTPException(status_code=409, detail="지금은 모집 기간이 아니에요")
    if auth.active_application(db, user, cohort):
        raise HTTPException(status_code=409, detail="이미 신청하셨어요")
    want = (body.want_to_make or "").strip() or None
    a = Application(user_id=user.id, cohort_id=cohort.id, python_exp=body.python_exp, want_to_make=want)
    db.add(a)
    db.commit()
    return application_info(a, user, cohort)


@router.post("/api/apply/cancel")
def cancel(user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    cohort = auth.open_cohort(db)
    a = auth.active_application(db, user, cohort) if cohort else None
    if a is None:
        raise HTTPException(status_code=409, detail="취소할 신청이 없어요")
    a.canceled_at = datetime.now()
    db.commit()
    return {"ok": True}


@router.post("/api/interest")
def interest(user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    """다음 기수 알림 받기. 이미 등록했으면 그대로 둔다."""
    if has_interest(db, user):
        return {"ok": True, "already": True}
    db.add(Interest(user_id=user.id))
    db.commit()
    return {"ok": True, "already": False}
