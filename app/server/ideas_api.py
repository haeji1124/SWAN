"""아이디어 보드 (Phase 5).

규칙 (CLAUDE.md '꼭 지킬 동작 규칙', claude-code-prompt.md Phase 5):
- 사내 직원 누구나 남긴다. 승인 없이 바로 공개되고, 관리자가 숨길 수 있다
- 칸은 제목, 설명(두세 줄), 이름 표시 방식(이름과 부서 / 부서만)뿐이다. 올린 사람은 고른 방식대로 보이고, 관리자 화면에서는 늘 이름이 보인다
- 공감은 한 사람이 한 번, 다시 누르면 취소
- 상태: 접수됨 → 검토 중 → 만드는 중 → 완료 / 보류. 상태와 파트 답변(한 줄)은 관리자가 정한다
- 내가 올린 아이디어는 고치고 지울 수 있다
"""
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import auth
from db import get_db
from models import Idea, IdeaVote, User

router = APIRouter()
admin = APIRouter(prefix="/api/admin/ideas", dependencies=[Depends(auth.require_admin)])

TITLE_MAX = 60
DESC_MAX = 300  # 두세 줄
REPLY_MAX = 100  # 한 줄
STATUS_LABEL = {"open": "접수됨", "reviewing": "검토 중", "building": "만드는 중", "done": "완료", "held": "보류"}


# ---------- 보여 줄 모양 ----------

def vote_counts(db: Session, ids: List[int]) -> dict:
    if not ids:
        return {}
    return dict(db.execute(select(IdeaVote.idea_id, func.count()).where(IdeaVote.idea_id.in_(ids)).group_by(IdeaVote.idea_id)).all())


def voted_set(db: Session, user: Optional[User], ids: List[int]) -> set:
    if not user or not ids:
        return set()
    return set(db.scalars(select(IdeaVote.idea_id).where(IdeaVote.user_id == user.id, IdeaVote.idea_id.in_(ids))).all())


def author_label(i: Idea, u: User) -> str:
    """고른 방식대로: 이름과 부서 / 부서만"""
    return f"{u.name} · {u.dept}" if i.name_display == "full" else u.dept


def card(i: Idea, u: User, votes: int, voted: bool, user: Optional[User]) -> dict:
    mine = bool(user and user.id == i.author_id)
    return {
        "id": i.id, "title": i.title, "description": i.description,
        "author": author_label(i, u), "votes": votes, "voted": voted,
        "status": i.status, "status_label": STATUS_LABEL.get(i.status, i.status), "reply": i.reply,
        "mine": mine, "name_display": i.name_display if mine else None,  # 고친다고 열 때만 필요하다
        "created_at": i.created_at.isoformat(timespec="minutes"),
    }


def visible_cards(db: Session, user: Optional[User]) -> list:
    rows = db.execute(select(Idea, User).join(User, User.id == Idea.author_id).where(Idea.hidden.is_(False))).all()
    ids = [i.id for i, _ in rows]
    counts, voted = vote_counts(db, ids), voted_set(db, user, ids)
    return [card(i, u, counts.get(i.id, 0), i.id in voted, user) for i, u in rows]


def sort_cards(items: list, sort: str) -> list:
    if sort == "latest":
        return sorted(items, key=lambda c: (c["created_at"], c["id"]), reverse=True)
    return sorted(items, key=lambda c: (c["votes"], c["created_at"], c["id"]), reverse=True)


def top_ideas(db: Session, user: Optional[User] = None, n: int = 3) -> list:
    """홈 아이디어 보드 미리보기: 공감 많은 순 (같으면 최신)"""
    return sort_cards(visible_cards(db, user), "votes")[:n]


# ---------- 목록 · 공감 ----------

@router.get("/api/ideas")
def list_ideas(sort: Literal["votes", "latest"] = "votes", user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    return {"items": sort_cards(visible_cards(db, user), sort), "can_post": user is not None}


def get_idea(db: Session, iid: int) -> Idea:
    i = db.get(Idea, iid)
    if i is None or i.hidden:
        raise HTTPException(status_code=404, detail="없는 아이디어예요")
    return i


@router.post("/api/ideas/{iid}/vote")
def toggle_vote(iid: int, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    i = get_idea(db, iid)
    mine = db.scalars(select(IdeaVote).where(IdeaVote.user_id == user.id, IdeaVote.idea_id == i.id)).first()
    if mine:
        db.delete(mine)
    else:
        db.add(IdeaVote(user_id=user.id, idea_id=i.id))
    db.commit()
    return {"voted": mine is None, "votes": vote_counts(db, [i.id]).get(i.id, 0)}


# ---------- 남기기 · 고치기 · 지우기 ----------

class IdeaIn(BaseModel):
    title: str = Field(max_length=200)
    description: str = Field(max_length=2000)
    name_display: Literal["full", "dept"] = "full"


def clean(body: IdeaIn) -> dict:
    title, desc = body.title.strip(), body.description.strip()
    if not title or len(title) > TITLE_MAX:
        raise HTTPException(status_code=400, detail=f"제목을 {TITLE_MAX}자 안으로 적어 주세요")
    if not desc or len(desc) > DESC_MAX:
        raise HTTPException(status_code=400, detail=f"설명을 {DESC_MAX}자 안으로 적어 주세요")
    return {"title": title, "description": desc, "name_display": body.name_display}


def one_card(db: Session, i: Idea, user: User) -> dict:
    return card(i, db.get(User, i.author_id), vote_counts(db, [i.id]).get(i.id, 0), i.id in voted_set(db, user, [i.id]), user)


@router.post("/api/ideas")
def create_idea(body: IdeaIn, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    i = Idea(author_id=user.id, status="open", **clean(body))  # 승인 없이 바로 공개
    db.add(i)
    db.commit()
    return one_card(db, i, user)


def own_idea(db: Session, iid: int, user: User) -> Idea:
    i = get_idea(db, iid)
    if i.author_id != user.id:
        raise HTTPException(status_code=403, detail="내가 올린 아이디어만 고칠 수 있어요")
    return i


@router.put("/api/ideas/{iid}")
def edit_idea(iid: int, body: IdeaIn, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    i = own_idea(db, iid, user)
    for k, v in clean(body).items():
        setattr(i, k, v)
    db.commit()
    return one_card(db, i, user)


@router.delete("/api/ideas/{iid}")
def delete_idea(iid: int, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    i = own_idea(db, iid, user)
    for v in db.scalars(select(IdeaVote).where(IdeaVote.idea_id == i.id)).all():
        db.delete(v)
    db.delete(i)
    db.commit()
    return {"ok": True}


# ---------- 관리자: 아이디어 ----------

@admin.get("")
def admin_list(db: Session = Depends(get_db)):
    """숨긴 것까지 모두. 이름 표시 방식과 상관없이 이름과 부서를 보여 준다"""
    rows = db.execute(select(Idea, User).join(User, User.id == Idea.author_id)).all()
    counts = vote_counts(db, [i.id for i, _ in rows])
    items = [
        {
            "id": i.id, "title": i.title, "description": i.description,
            "author_name": u.name, "author_dept": u.dept, "name_display": i.name_display,
            "votes": counts.get(i.id, 0), "status": i.status, "status_label": STATUS_LABEL.get(i.status, i.status),
            "reply": i.reply, "hidden": i.hidden, "created_at": i.created_at.isoformat(timespec="minutes"),
        }
        for i, u in rows
    ]
    items.sort(key=lambda c: (c["votes"], c["created_at"]), reverse=True)
    return {"items": items, "statuses": [{"value": k, "label": v} for k, v in STATUS_LABEL.items()]}


def admin_idea(db: Session, iid: int) -> Idea:
    i = db.get(Idea, iid)
    if i is None:
        raise HTTPException(status_code=404, detail="없는 아이디어예요")
    return i


class StatusIn(BaseModel):
    status: Literal["open", "reviewing", "building", "done", "held"]


@admin.post("/{iid}/status")
def set_status(iid: int, body: StatusIn, db: Session = Depends(get_db)):
    i = admin_idea(db, iid)
    i.status = body.status
    db.commit()
    return {"ok": True, "status": i.status, "status_label": STATUS_LABEL[i.status]}


class ReplyIn(BaseModel):
    reply: str = Field(max_length=500)  # 빈 글이면 답변을 지운다


@admin.post("/{iid}/reply")
def set_reply(iid: int, body: ReplyIn, db: Session = Depends(get_db)):
    i = admin_idea(db, iid)
    reply = " ".join(body.reply.split())  # 한 줄로
    if len(reply) > REPLY_MAX:
        raise HTTPException(status_code=400, detail=f"답변은 한 줄({REPLY_MAX}자) 안으로 적어 주세요")
    i.reply = reply or None
    db.commit()
    return {"ok": True, "reply": i.reply}


class HideIn(BaseModel):
    hidden: bool


@admin.post("/{iid}/hide")
def set_hidden(iid: int, body: HideIn, db: Session = Depends(get_db)):
    i = admin_idea(db, iid)
    i.hidden = body.hidden
    db.commit()
    return {"ok": True, "hidden": i.hidden}
