"""토이프로젝트 (Phase 5).

규칙 (CLAUDE.md, claude-code-prompt.md Phase 5):
- 누구나 볼 수 있지만, 글쓰기와 참여는 수강생과 졸업생만
- 모집 글: 제목, 만들고 싶은 것, 필요한 역할과 인원, 예상 기간. 승인 없이 바로 공개되고, 관리자가 숨길 수 있다
- [참여하고 싶어요]를 누르면 글쓴이에게 내 이름과 부서가 전달된다. 다시 누르면 취소
- 참여 희망자 목록은 글쓴이만 본다. 글쓴이가 [모집 마감]을 한다
- 글쓴이는 글을 고치고 지우고, 마감한 모집을 다시 열 수 있다 (2026-10-19 사용자 결정)
"""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import auth
import projects_api
from db import get_db
from models import ToyJoin, ToyPost, User

router = APIRouter()
admin = APIRouter(prefix="/api/admin/toys", dependencies=[Depends(auth.require_admin)])

STATUS_LABEL = {"open": "모집 중", "closed": "마감"}
LIMITS = {"title": 60, "what": 1000, "roles": 200, "period": 50}
TYPE_LABEL = {"alumni": "졸업생", "student": "수강생"}


def is_member(db: Session, user: Optional[User]) -> bool:
    """글쓰기와 참여를 할 수 있는 사람: 수강생과 졸업생"""
    return bool(user and auth.user_type(db, user) in TYPE_LABEL)


def require_member(user: User = Depends(auth.require_user), db: Session = Depends(get_db)) -> User:
    if not is_member(db, user):
        raise HTTPException(status_code=403, detail="토이프로젝트는 수강생과 졸업생만 글을 쓰고 참여할 수 있어요")
    return user


def person(db: Session, u: User) -> dict:
    a = projects_api.author_info(db, u)
    t = auth.user_type(db, u)
    return {**a, "type": t, "type_label": TYPE_LABEL.get(t, "직원")}


def join_counts(db: Session, ids: list) -> dict:
    if not ids:
        return {}
    return dict(db.execute(select(ToyJoin.toy_id, func.count()).where(ToyJoin.toy_id.in_(ids)).group_by(ToyJoin.toy_id)).all())


def joined_set(db: Session, user: Optional[User], ids: list) -> set:
    if not user or not ids:
        return set()
    return set(db.scalars(select(ToyJoin.toy_id).where(ToyJoin.user_id == user.id, ToyJoin.toy_id.in_(ids))).all())


def card(t: ToyPost, author: dict, joins: int, joined: bool, user: Optional[User]) -> dict:
    return {
        "id": t.id, "title": t.title, "what": t.what, "roles": t.roles, "period": t.period,
        "status": t.status, "status_label": STATUS_LABEL.get(t.status, t.status),
        "author": author, "joins": joins, "joined": joined, "mine": bool(user and user.id == t.author_id),
        "created_at": t.created_at.isoformat(timespec="minutes"),
    }


# ---------- 목록 · 상세 ----------

@router.get("/api/toys")
def list_toys(user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    rows = db.execute(select(ToyPost, User).join(User, User.id == ToyPost.author_id).where(ToyPost.hidden.is_(False))).all()
    ids = [t.id for t, _ in rows]
    counts, joined = join_counts(db, ids), joined_set(db, user, ids)
    items = [card(t, person(db, u), counts.get(t.id, 0), t.id in joined, user) for t, u in rows]
    items.sort(key=lambda c: (c["status"] == "open", c["created_at"], c["id"]), reverse=True)  # 모집 중 먼저, 그 안에서 최신
    return {"items": items, "can_write": is_member(db, user)}


def get_toy(db: Session, tid: int, user: Optional[User] = None) -> ToyPost:
    t = db.get(ToyPost, tid)
    if t is None or (t.hidden and not (user and user.is_admin)):
        raise HTTPException(status_code=404, detail="없는 모집 글이에요")
    return t


def full(db: Session, t: ToyPost, user: Optional[User]) -> dict:
    data = card(t, person(db, db.get(User, t.author_id)), join_counts(db, [t.id]).get(t.id, 0), t.id in joined_set(db, user, [t.id]), user)
    data["can_join"] = is_member(db, user) and not data["mine"]
    data["applicants"] = None
    if data["mine"]:  # 참여 희망자 목록은 글쓴이만
        rows = db.execute(
            select(User, ToyJoin).join(ToyJoin, ToyJoin.user_id == User.id).where(ToyJoin.toy_id == t.id).order_by(ToyJoin.id)
        ).all()
        data["applicants"] = [person(db, u) for u, _ in rows]
    return data


@router.get("/api/toys/{tid}")
def toy_detail(tid: int, user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    return full(db, get_toy(db, tid, user), user)


@router.post("/api/toys/{tid}/join")
def toggle_join(tid: int, user: User = Depends(require_member), db: Session = Depends(get_db)):
    t = get_toy(db, tid)
    if t.author_id == user.id:
        raise HTTPException(status_code=409, detail="내가 쓴 모집 글에는 참여 신청을 하지 않아도 돼요")
    mine = db.scalars(select(ToyJoin).where(ToyJoin.user_id == user.id, ToyJoin.toy_id == t.id)).first()
    if mine:
        db.delete(mine)  # 취소는 마감 뒤에도 된다
    elif t.status != "open":
        raise HTTPException(status_code=409, detail="모집이 마감됐어요")
    else:
        db.add(ToyJoin(user_id=user.id, toy_id=t.id))
    db.commit()
    return {"joined": mine is None, "joins": join_counts(db, [t.id]).get(t.id, 0)}


# ---------- 쓰기 · 고치기 · 지우기 · 마감 (글쓴이) ----------

class ToyIn(BaseModel):
    title: str = Field(max_length=200)
    what: str = Field(max_length=3000)
    roles: str = Field(max_length=500)
    period: str = Field(max_length=100)


WHAT = {"title": "제목", "what": "만들고 싶은 것", "roles": "필요한 역할과 인원", "period": "예상 기간"}


def clean(body: ToyIn) -> dict:
    out = {}
    for k, limit in LIMITS.items():
        v = getattr(body, k).strip()
        if not v or len(v) > limit:
            raise HTTPException(status_code=400, detail=f"{WHAT[k]}을(를) {limit}자 안으로 적어 주세요")
        out[k] = v
    return out


@router.post("/api/toys")
def create_toy(body: ToyIn, user: User = Depends(require_member), db: Session = Depends(get_db)):
    t = ToyPost(author_id=user.id, status="open", **clean(body))  # 승인 없이 바로 공개
    db.add(t)
    db.commit()
    return full(db, t, user)


def own_toy(db: Session, tid: int, user: User) -> ToyPost:
    t = get_toy(db, tid)
    if t.author_id != user.id:
        raise HTTPException(status_code=403, detail="내가 쓴 모집 글만 고칠 수 있어요")
    return t


@router.put("/api/toys/{tid}")
def edit_toy(tid: int, body: ToyIn, user: User = Depends(require_member), db: Session = Depends(get_db)):
    t = own_toy(db, tid, user)
    for k, v in clean(body).items():
        setattr(t, k, v)
    db.commit()
    return full(db, t, user)


class ToyStatusIn(BaseModel):
    status: Literal["open", "closed"]


@router.post("/api/toys/{tid}/status")
def set_status(tid: int, body: ToyStatusIn, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    """[모집 마감] / [다시 열기]"""
    t = own_toy(db, tid, user)
    t.status = body.status
    db.commit()
    return full(db, t, user)


@router.delete("/api/toys/{tid}")
def delete_toy(tid: int, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    t = own_toy(db, tid, user)
    for j in db.scalars(select(ToyJoin).where(ToyJoin.toy_id == t.id)).all():
        db.delete(j)
    db.delete(t)
    db.commit()
    return {"ok": True}


# ---------- 관리자: 토이프로젝트 ----------

@admin.get("")
def admin_list(db: Session = Depends(get_db)):
    rows = db.execute(select(ToyPost, User).join(User, User.id == ToyPost.author_id).order_by(ToyPost.created_at.desc())).all()
    counts = join_counts(db, [t.id for t, _ in rows])
    return {
        "items": [
            {
                "id": t.id, "title": t.title, "roles": t.roles, "period": t.period,
                "author_name": u.name, "author_dept": u.dept, "joins": counts.get(t.id, 0),
                "status": t.status, "status_label": STATUS_LABEL.get(t.status, t.status),
                "hidden": t.hidden, "created_at": t.created_at.isoformat(timespec="minutes"),
            }
            for t, u in rows
        ]
    }


class HideIn(BaseModel):
    hidden: bool


@admin.post("/{tid}/hide")
def set_hidden(tid: int, body: HideIn, db: Session = Depends(get_db)):
    t = db.get(ToyPost, tid)
    if t is None:
        raise HTTPException(status_code=404, detail="없는 모집 글이에요")
    t.hidden = body.hidden
    db.commit()
    return {"ok": True, "hidden": t.hidden}
