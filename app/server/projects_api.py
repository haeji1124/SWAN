"""완성작 갤러리 (Phase 4).

규칙 (CLAUDE.md '꼭 지킬 동작 규칙'):
- 졸업생만 올리고 고친다. 올리면 승인 대기, 관리자가 승인해야 공개된다. 공개된 것을 고치면 다시 승인 대기
- 만든 사람의 이름·부서·기수를 모두 표시한다
- 좋아요는 한 사람이 한 번. 다시 누르면 취소

파일은 서버 폴더(data/uploads, 시험할 때는 SWAN_UPLOADS)에 저장하고 /uploads 로 내보낸다.
파일 이름은 서버가 새로 짓고(추측하기 어려운 이름), 종류는 확장자와 파일 앞부분(매직 바이트)으로, 크기는 서버에서 확인한다.
"""
import json
import os
import re
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import auth
from db import DATA_DIR, get_db
from models import Alumni, Project, ProjectLike, User

router = APIRouter()
admin = APIRouter(prefix="/api/admin/projects", dependencies=[Depends(auth.require_admin)])

UPLOAD_DIR = os.environ.get("SWAN_UPLOADS", os.path.join(DATA_DIR, "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
URL_PREFIX = "/uploads"

MAX_IMAGE = 5 * 1024 * 1024  # 이미지 한 장 5MB
MAX_SLIDES = 30 * 1024 * 1024  # 발표자료 30MB
MAX_SHOTS = 8  # 화면 캡처는 8장까지
SUMMARY_MAX = 80
STATUS_LABEL = {"pending": "승인 대기", "published": "공개됨", "rejected": "반려됨"}

# 확장자 → 파일 앞부분. 이름만 바꾼 파일을 막는다
IMAGE_SIG = {
    ".png": [b"\x89PNG"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".gif": [b"GIF8"],
    ".webp": [b"RIFF"],
}
SLIDES_SIG = {".pdf": [b"%PDF"], ".pptx": [b"PK\x03\x04"], ".ppt": [b"\xd0\xcf\x11\xe0"]}
# 실습 프로젝트 미리보기 영상 (Phase 6). mp4는 앞 4바이트 뒤에 'ftyp'가 와서 save_file에서 따로 본다
VIDEO_SIG = {".mp4": [], ".webm": [b"\x1a\x45\xdf\xa3"]}


# ---------- 파일 ----------

def file_url(path: Optional[str]) -> Optional[str]:
    return f"{URL_PREFIX}/{path}" if path else None


async def save_file(f: UploadFile, kinds: dict, limit: int, what: str, folder: str) -> str:
    """검사하고 저장한 뒤 uploads 안의 상대 경로를 돌려준다."""
    ext = os.path.splitext(f.filename or "")[1].lower()
    if ext not in kinds:
        raise HTTPException(status_code=400, detail=f"{what}은(는) {', '.join(k.lstrip('.') for k in kinds)} 파일만 올릴 수 있어요")
    data = await f.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"{what} 파일이 비어 있어요")
    if len(data) > limit:
        raise HTTPException(status_code=413, detail=f"{what}이(가) 너무 커요 ({limit // (1024 * 1024)}MB까지)")
    known = any(data.startswith(sig) for sig in kinds[ext]) or (ext == ".mp4" and data[4:8] == b"ftyp")
    if not known or (ext == ".webp" and data[8:12] != b"WEBP"):
        raise HTTPException(status_code=400, detail=f"{what} 파일을 읽을 수 없어요. 파일이 손상됐거나 확장자가 실제 종류와 달라요")
    os.makedirs(os.path.join(UPLOAD_DIR, folder), exist_ok=True)
    rel = f"{folder}/{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, rel), "wb") as out:
        out.write(data)
    return rel


def remove_file(rel: Optional[str]) -> None:
    if not rel:
        return
    path = os.path.normpath(os.path.join(UPLOAD_DIR, rel))
    if path.startswith(os.path.normpath(UPLOAD_DIR)) and os.path.isfile(path):
        os.remove(path)


# ---------- 보여 줄 모양 ----------

def author_info(db: Session, u: User) -> dict:
    # 기수는 졸업생 명단에서 (여러 기수면 처음 수료한 기수)
    cohort = db.scalar(select(func.min(Alumni.cohort_number)).where(Alumni.emp_no == u.emp_no))
    return {"id": u.id, "name": u.name, "dept": u.dept, "cohort": cohort}


def like_counts(db: Session, ids: List[int]) -> dict:
    if not ids:
        return {}
    return dict(db.execute(select(ProjectLike.project_id, func.count()).where(ProjectLike.project_id.in_(ids)).group_by(ProjectLike.project_id)).all())


def liked_set(db: Session, user: Optional[User], ids: List[int]) -> set:
    if not user or not ids:
        return set()
    return set(db.scalars(select(ProjectLike.project_id).where(ProjectLike.user_id == user.id, ProjectLike.project_id.in_(ids))).all())


def card(p: Project, author: dict, likes: int, liked: bool) -> dict:
    return {
        "id": p.id, "title": p.title, "summary": p.summary, "cover": file_url(p.cover_image),
        "effect": p.effect, "likes": likes, "liked": liked, "author": author,
        "status": p.status, "status_label": STATUS_LABEL.get(p.status, p.status),
        "created_at": p.created_at.isoformat(timespec="minutes"),
    }


def full(db: Session, p: Project, user: Optional[User]) -> dict:
    u = db.get(User, p.author_id)
    likes = like_counts(db, [p.id]).get(p.id, 0)
    return {
        **card(p, author_info(db, u), likes, p.id in liked_set(db, user, [p.id])),
        "problem": p.problem, "screenshots": [file_url(s) for s in p.screenshots or []],
        "slides": file_url(p.slides), "slides_name": os.path.basename(p.slides) if p.slides else None,
        "repo_url": p.repo_url, "detail": p.detail, "reject_reason": p.reject_reason,
        "mine": bool(user and user.id == p.author_id),
    }


def cards(db: Session, rows: list, user: Optional[User]) -> list:
    ids = [p.id for p, _ in rows]
    counts, liked = like_counts(db, ids), liked_set(db, user, ids)
    authors = {}
    out = []
    for p, u in rows:
        if u.id not in authors:
            authors[u.id] = author_info(db, u)
        out.append(card(p, authors[u.id], counts.get(p.id, 0), p.id in liked))
    return out


def published_rows(db: Session) -> list:
    return db.execute(
        select(Project, User).join(User, User.id == Project.author_id).where(Project.status == "published")
    ).all()


def top_projects(db: Session, user: Optional[User] = None, n: int = 5) -> list:
    """홈 완성작 미리보기: 좋아요 많은 순 (같으면 최신). 내가 누른 하트도 함께 표시한다"""
    items = cards(db, published_rows(db), user)
    items.sort(key=lambda c: (c["likes"], c["created_at"]), reverse=True)
    return items[:n]


# ---------- 목록 · 상세 · 좋아요 ----------

@router.get("/api/projects")
def list_projects(
    cohort: Optional[int] = None, dept: Optional[str] = None, sort: str = "latest",
    user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db),
):
    all_items = cards(db, published_rows(db), user)
    items = [c for c in all_items if (cohort is None or c["author"]["cohort"] == cohort) and (not dept or c["author"]["dept"] == dept)]
    if sort == "likes":
        items.sort(key=lambda c: (c["likes"], c["created_at"]), reverse=True)
    else:
        items.sort(key=lambda c: c["created_at"], reverse=True)
    return {
        "items": items,
        "total": len(all_items),
        # 필터에 쓸 값: 공개된 완성작에 실제로 있는 기수·부서만
        "cohorts": sorted({c["author"]["cohort"] for c in all_items if c["author"]["cohort"]}),
        "depts": sorted({c["author"]["dept"] for c in all_items}),
        "can_upload": bool(user and auth.is_alumni(db, user)),
    }


@router.get("/api/projects/mine")
def my_projects(user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Project, User).join(User, User.id == Project.author_id).where(Project.author_id == user.id).order_by(Project.created_at.desc())
    ).all()
    return [{**c, "reject_reason": p.reject_reason} for c, (p, _) in zip(cards(db, rows, user), rows)]


def get_project(db: Session, pid: int) -> Project:
    p = db.get(Project, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="없는 완성작이에요")
    return p


@router.get("/api/projects/{pid}")
def project_detail(pid: int, user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    p = get_project(db, pid)
    # 공개 전에는 올린 사람과 관리자만 볼 수 있다
    if p.status != "published" and not (user and (user.id == p.author_id or user.is_admin)):
        raise HTTPException(status_code=404, detail="없는 완성작이에요")
    data = full(db, p, user)
    # 같은 부서·같은 기수의 다른 완성작 (최대 3개)
    others = [c for c in cards(db, published_rows(db), user) if c["id"] != p.id]
    a = data["author"]
    data["related"] = [c for c in others if c["author"]["dept"] == a["dept"] or (a["cohort"] and c["author"]["cohort"] == a["cohort"])][:3]
    return data


@router.post("/api/projects/{pid}/like")
def toggle_like(pid: int, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    p = get_project(db, pid)
    if p.status != "published":
        raise HTTPException(status_code=409, detail="공개된 완성작에만 좋아요를 누를 수 있어요")
    mine = db.scalars(select(ProjectLike).where(ProjectLike.user_id == user.id, ProjectLike.project_id == p.id)).first()
    if mine:
        db.delete(mine)
    else:
        db.add(ProjectLike(user_id=user.id, project_id=p.id))
    db.commit()
    return {"liked": mine is None, "likes": like_counts(db, [p.id]).get(p.id, 0)}


# ---------- 올리기 · 고치기 · 지우기 (졸업생) ----------

def require_alumni(user: User = Depends(auth.require_user), db: Session = Depends(get_db)) -> User:
    if not auth.is_alumni(db, user):
        raise HTTPException(status_code=403, detail="완성작은 졸업생만 올릴 수 있어요")
    return user


URL_RE = re.compile(r"^https?://\S+$")


def clean_fields(title: str, summary: str, problem: str, effect: str, repo_url: str, detail: str, confirmed: bool) -> dict:
    if not confirmed:
        raise HTTPException(status_code=400, detail="민감한 내용이 없는지 확인했다고 체크해 주세요")
    title, summary, problem = title.strip(), summary.strip(), problem.strip()
    if not title or len(title) > 100:
        raise HTTPException(status_code=400, detail="제목을 100자 안으로 적어 주세요")
    if not summary or len(summary) > SUMMARY_MAX:
        raise HTTPException(status_code=400, detail=f"짧은 설명을 {SUMMARY_MAX}자 안으로 적어 주세요")
    if not problem:
        raise HTTPException(status_code=400, detail="무슨 문제를 풀었는지 적어 주세요")
    repo_url = repo_url.strip()
    if repo_url and not URL_RE.match(repo_url):
        raise HTTPException(status_code=400, detail="저장소 주소는 http:// 또는 https:// 로 시작해야 해요")
    return {
        "title": title, "summary": summary, "problem": problem,
        "effect": effect.strip()[:200] or None, "repo_url": repo_url or None, "detail": detail.strip() or None,
    }


@router.post("/api/projects")
async def create_project(
    title: str = Form(...), summary: str = Form(...), problem: str = Form(...),
    effect: str = Form(""), repo_url: str = Form(""), detail: str = Form(""), confirmed: bool = Form(False),
    cover: UploadFile = File(...), screenshots: List[UploadFile] = File(default=[]), slides: Optional[UploadFile] = File(None),
    user: User = Depends(require_alumni), db: Session = Depends(get_db),
):
    fields = clean_fields(title, summary, problem, effect, repo_url, detail, confirmed)
    if len(screenshots) > MAX_SHOTS:
        raise HTTPException(status_code=400, detail=f"화면 캡처는 {MAX_SHOTS}장까지 올릴 수 있어요")
    folder = f"projects/{uuid.uuid4().hex[:12]}"
    saved: List[str] = []
    try:
        cover_rel = await save_file(cover, IMAGE_SIG, MAX_IMAGE, "대표 이미지", folder)
        saved.append(cover_rel)
        shots = []
        for s in screenshots:
            shots.append(await save_file(s, IMAGE_SIG, MAX_IMAGE, "화면 캡처", folder))
            saved.append(shots[-1])
        slides_rel = await save_file(slides, SLIDES_SIG, MAX_SLIDES, "발표자료", folder) if slides and slides.filename else None
    except HTTPException:
        for rel in saved:
            remove_file(rel)
        raise
    p = Project(author_id=user.id, cover_image=cover_rel, screenshots=shots, slides=slides_rel, status="pending", **fields)
    db.add(p)
    db.commit()
    return full(db, p, user)


def own_project(db: Session, pid: int, user: User) -> Project:
    p = get_project(db, pid)
    if p.author_id != user.id:
        raise HTTPException(status_code=403, detail="내가 올린 완성작만 고칠 수 있어요")
    return p


@router.put("/api/projects/{pid}")
async def edit_project(
    pid: int,
    title: str = Form(...), summary: str = Form(...), problem: str = Form(...),
    effect: str = Form(""), repo_url: str = Form(""), detail: str = Form(""), confirmed: bool = Form(False),
    keep_screenshots: str = Form("[]"),  # 남겨 둘 기존 화면 캡처 주소들 (JSON 목록)
    remove_slides: bool = Form(False),
    cover: Optional[UploadFile] = File(None), screenshots: List[UploadFile] = File(default=[]), slides: Optional[UploadFile] = File(None),
    user: User = Depends(require_alumni), db: Session = Depends(get_db),
):
    p = own_project(db, pid, user)
    fields = clean_fields(title, summary, problem, effect, repo_url, detail, confirmed)
    try:
        keep_urls = set(json.loads(keep_screenshots))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="화면 캡처 목록을 읽지 못했어요")
    keep = [s for s in p.screenshots or [] if file_url(s) in keep_urls]
    if len(keep) + len(screenshots) > MAX_SHOTS:
        raise HTTPException(status_code=400, detail=f"화면 캡처는 {MAX_SHOTS}장까지 올릴 수 있어요")
    folder = os.path.dirname(p.cover_image or "") or f"projects/{uuid.uuid4().hex[:12]}"
    new_cover = await save_file(cover, IMAGE_SIG, MAX_IMAGE, "대표 이미지", folder) if cover and cover.filename else None
    added = [await save_file(s, IMAGE_SIG, MAX_IMAGE, "화면 캡처", folder) for s in screenshots if s.filename]
    new_slides = await save_file(slides, SLIDES_SIG, MAX_SLIDES, "발표자료", folder) if slides and slides.filename else None

    # 바뀐 파일만 지운다
    for s in p.screenshots or []:
        if s not in keep:
            remove_file(s)
    if new_cover:
        remove_file(p.cover_image)
        p.cover_image = new_cover
    if new_slides or remove_slides:
        remove_file(p.slides)
        p.slides = new_slides
    p.screenshots = keep + added
    for k, v in fields.items():
        setattr(p, k, v)
    # 고치면 다시 승인 대기 (공개된 것도, 반려된 것도)
    p.status = "pending"
    p.reject_reason = None
    db.commit()
    return full(db, p, user)


@router.delete("/api/projects/{pid}")
def delete_project(pid: int, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    p = own_project(db, pid, user)
    for rel in [p.cover_image, p.slides, *(p.screenshots or [])]:
        remove_file(rel)
    for like in db.scalars(select(ProjectLike).where(ProjectLike.project_id == p.id)).all():
        db.delete(like)
    db.delete(p)
    db.commit()
    return {"ok": True}


# ---------- 관리자: 완성작 검수 ----------

@admin.get("")
def admin_list(status: str = "pending", db: Session = Depends(get_db)):
    rows = db.execute(
        select(Project, User).join(User, User.id == Project.author_id).where(Project.status == status).order_by(Project.created_at.desc())
    ).all()
    counts = dict(db.execute(select(Project.status, func.count()).group_by(Project.status)).all())
    return {
        "items": [{**c, "reject_reason": p.reject_reason} for c, (p, _) in zip(cards(db, rows, None), rows)],
        "counts": {k: counts.get(k, 0) for k in STATUS_LABEL},
    }


@admin.post("/{pid}/approve")
def approve(pid: int, db: Session = Depends(get_db)):
    p = get_project(db, pid)
    if p.status != "pending":
        raise HTTPException(status_code=409, detail="승인 대기 중인 완성작만 승인할 수 있어요")
    p.status = "published"
    p.reject_reason = None
    db.commit()
    return {"ok": True}


class ReasonIn(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


@admin.post("/{pid}/reject")
def reject(pid: int, body: ReasonIn, db: Session = Depends(get_db)):
    """반려(승인 대기) 또는 내리기(공개됨). 둘 다 이유를 꼭 적고, 올린 사람에게 보인다."""
    p = get_project(db, pid)
    reason = body.reason.strip()
    if not reason:
        raise HTTPException(status_code=400, detail="반려하는 이유를 적어 주세요")
    if p.status == "rejected":
        raise HTTPException(status_code=409, detail="이미 반려된 완성작이에요")
    p.status = "rejected"
    p.reject_reason = reason
    db.commit()
    return {"ok": True}


def copy_seed_image(src: str, folder: str) -> str:
    """seed.py: 사이트에 포함한 자리 그림을 uploads로 복사한다 (가상 완성작의 대표 이미지)"""
    os.makedirs(os.path.join(UPLOAD_DIR, folder), exist_ok=True)
    rel = f"{folder}/{os.path.basename(src)}"
    shutil.copyfile(src, os.path.join(UPLOAD_DIR, rel))
    return rel
