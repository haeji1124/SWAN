"""인증은 이 파일 한곳에만 둔다.

지금은 개발용 임시 로그인이다: 쿠키(swan_dev_user)에 담긴 테스트 사용자 id를 읽는다.
SSO로 바꿀 때는 `current_user()`가 SSO에서 받은 아이디로 User를 찾아 돌려주게만 고치면 된다.
인증에 실패하면 None을 돌려주고, 화면은 열람만 가능한 상태로 동작한다.
"""
import os
from typing import Optional

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models import Alumni, Application, Cohort, User

DEV_COOKIE = "swan_dev_user"
DEV_FAIL = "fail"  # "로그인 실패" 상태를 흉내 낼 때 쿠키에 넣는 값
# 개발용 임시 로그인을 켤지. 반입 후 SSO로 바꾸면 0으로 둔다
DEV_LOGIN_ENABLED = os.environ.get("SWAN_DEV_LOGIN", "1") == "1"


def current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    if not DEV_LOGIN_ENABLED:
        return None  # TODO(SSO): SSO 연동 후 여기서 사용자를 찾는다
    raw = request.cookies.get(DEV_COOKIE)
    if raw == DEV_FAIL:
        return None
    if raw and raw.isdigit():
        user = db.get(User, int(raw))
        if user:
            return user
    # 쿠키가 없으면 첫 번째 사용자로 자동 로그인 (실제 SSO의 "들어오면 자동 로그인"을 흉내 낸다)
    return db.scalars(select(User).order_by(User.id)).first()


def require_user(user: Optional[User] = Depends(current_user)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요해요")
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="관리자만 볼 수 있어요")
    return user


def open_cohort(db: Session) -> Optional[Cohort]:
    return db.scalars(select(Cohort).where(Cohort.status == "open")).first()


def current_cohort(db: Session) -> Optional[Cohort]:
    """지금 진행 중인 기수: 모집 중이거나 모집이 끝나고 아직 종료되지 않은 기수."""
    return db.scalars(
        select(Cohort).where(Cohort.status.in_(["open", "closed"])).order_by(Cohort.number.desc())
    ).first()


def active_application(db: Session, user: User, cohort: Optional[Cohort]) -> Optional[Application]:
    if cohort is None:
        return None
    return db.scalars(
        select(Application).where(
            Application.user_id == user.id,
            Application.cohort_id == cohort.id,
            Application.canceled_at.is_(None),
        )
    ).first()


def is_alumni(db: Session, user: User) -> bool:
    return db.scalars(select(Alumni.id).where(Alumni.emp_no == user.emp_no)).first() is not None


def user_type(db: Session, user: User) -> str:
    """유형: alumni(졸업생) / student(수강생) / employee(직원). 관리자 여부는 따로 본다."""
    if is_alumni(db, user):
        return "alumni"
    if active_application(db, user, current_cohort(db)):
        return "student"
    return "employee"
