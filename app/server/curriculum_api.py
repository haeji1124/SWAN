"""관리자 · 커리큘럼 (Phase 6). 모든 요청은 관리자만.

- 단원: 단계 · 제목 · 배우는 것을 고친다 (단원 수는 curriculum.md를 따르므로 더하거나 지우지 않는다)
- 실습 프로젝트: 추가 · 수정 · 삭제 · 순서 바꾸기, 미리보기 그림(5MB)과 영상(mp4·webm 30MB) 올리기
- 고치면 홈의 커리큘럼 섹션(/api/home)에 바로 반영된다

파일 검사·저장은 완성작과 같은 함수(projects_api.save_file)를 쓴다. 폴더는 uploads/curriculum/
"""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import auth
from db import get_db
from models import CurriculumUnit, PracticeProject
from projects_api import IMAGE_SIG, MAX_IMAGE, VIDEO_SIG, file_url, remove_file, save_file

router = APIRouter(prefix="/api/admin/curriculum", dependencies=[Depends(auth.require_admin)])

MAX_VIDEO = 30 * 1024 * 1024
STAGES = {1: "다지기", 2: "깊어지기", 3: "만들기", 4: "AI와 함께 만들기"}
FOLDER = "curriculum"


def unit_out(u: CurriculumUnit) -> dict:
    return {"id": u.id, "order": u.order, "stage": u.stage, "stage_label": STAGES.get(u.stage, ""), "title": u.title, "content": u.content}


def project_out(p: PracticeProject) -> dict:
    """홈과 같은 모양 (미리보기는 주소로 바꿔 준다)"""
    return {
        "id": p.id, "order": p.order, "title": p.title, "one_liner": p.one_liner, "detail": p.detail,
        "topic": p.topic, "skill": p.skill,
        "preview_image": file_url(p.preview_image), "preview_video": file_url(p.preview_video),
    }


@router.get("")
def overview(db: Session = Depends(get_db)):
    units = db.scalars(select(CurriculumUnit).order_by(CurriculumUnit.order)).all()
    projects = db.scalars(select(PracticeProject).order_by(PracticeProject.order)).all()
    return {
        "units": [unit_out(u) for u in units],
        "projects": [project_out(p) for p in projects],
        "stages": [{"value": k, "label": v} for k, v in STAGES.items()],
        "topics": sorted({p.topic for p in projects}),  # 주제 묶음은 고르기 우선 (새 묶음도 적을 수 있다)
    }


# ---------- 단원 ----------

class UnitIn(BaseModel):
    stage: int = Field(ge=1, le=4)
    title: str = Field(max_length=300)
    content: str = Field(max_length=3000)


@router.put("/units/{uid}")
def edit_unit(uid: int, body: UnitIn, db: Session = Depends(get_db)):
    u = db.get(CurriculumUnit, uid)
    if u is None:
        raise HTTPException(status_code=404, detail="없는 단원이에요")
    title, content = body.title.strip(), body.content.strip()
    if not title or len(title) > 100:
        raise HTTPException(status_code=400, detail="단원 제목을 100자 안으로 적어 주세요")
    if not content:
        raise HTTPException(status_code=400, detail="배우는 것을 적어 주세요")
    u.stage, u.title, u.content = body.stage, title, content
    db.commit()
    return unit_out(u)


# ---------- 실습 프로젝트 ----------

def clean_project(title: str, one_liner: str, detail: str, topic: str, skill: str) -> dict:
    out = {"title": title.strip(), "one_liner": one_liner.strip(), "detail": detail.strip(), "topic": topic.strip(), "skill": skill.strip()}
    limits = {"title": ("제목", 100), "one_liner": ("한 줄 설명", 200), "topic": ("주제 묶음", 50), "skill": ("기르는 힘", 200)}
    for k, (what, n) in limits.items():
        if not out[k] or len(out[k]) > n:
            raise HTTPException(status_code=400, detail=f"{what}을(를) {n}자 안으로 적어 주세요")
    if not out["detail"]:
        raise HTTPException(status_code=400, detail="세부 내용을 적어 주세요")
    return out


async def save_previews(image: Optional[UploadFile], video: Optional[UploadFile]) -> tuple:
    img = await save_file(image, IMAGE_SIG, MAX_IMAGE, "미리보기 그림", FOLDER) if image and image.filename else None
    try:
        vid = await save_file(video, VIDEO_SIG, MAX_VIDEO, "미리보기 영상", FOLDER) if video and video.filename else None
    except HTTPException:
        remove_file(img)
        raise
    return img, vid


def get_project(db: Session, pid: int) -> PracticeProject:
    p = db.get(PracticeProject, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="없는 실습 프로젝트예요")
    return p


@router.post("/projects")
async def add_project(
    title: str = Form(...), one_liner: str = Form(...), detail: str = Form(...), topic: str = Form(...), skill: str = Form(...),
    image: Optional[UploadFile] = File(None), video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    fields = clean_project(title, one_liner, detail, topic, skill)
    img, vid = await save_previews(image, video)
    last = db.scalar(select(func.max(PracticeProject.order))) or 0
    p = PracticeProject(order=last + 1, preview_image=img, preview_video=vid, **fields)  # 새 프로젝트는 맨 뒤
    db.add(p)
    db.commit()
    return project_out(p)


@router.put("/projects/{pid}")
async def edit_project(
    pid: int,
    title: str = Form(...), one_liner: str = Form(...), detail: str = Form(...), topic: str = Form(...), skill: str = Form(...),
    remove_image: bool = Form(False), remove_video: bool = Form(False),
    image: Optional[UploadFile] = File(None), video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    p = get_project(db, pid)
    fields = clean_project(title, one_liner, detail, topic, skill)
    img, vid = await save_previews(image, video)
    # 새로 올렸거나 빼기로 했으면 예전 파일을 지운다
    if img or remove_image:
        remove_file(p.preview_image)
        p.preview_image = img
    if vid or remove_video:
        remove_file(p.preview_video)
        p.preview_video = vid
    for k, v in fields.items():
        setattr(p, k, v)
    db.commit()
    return project_out(p)


@router.delete("/projects/{pid}")
def delete_project(pid: int, db: Session = Depends(get_db)):
    p = get_project(db, pid)
    remove_file(p.preview_image)
    remove_file(p.preview_video)
    db.delete(p)
    db.flush()
    # 순서를 1부터 다시 매긴다 (빈 번호 없이)
    for i, q in enumerate(db.scalars(select(PracticeProject).order_by(PracticeProject.order)).all(), start=1):
        q.order = i
    db.commit()
    return {"ok": True}


class MoveIn(BaseModel):
    direction: Literal["up", "down"]


@router.post("/projects/{pid}/move")
def move_project(pid: int, body: MoveIn, db: Session = Depends(get_db)):
    """한 칸 위 / 아래로. 맨 위에서 위로, 맨 아래에서 아래로는 그대로 둔다"""
    rows = list(db.scalars(select(PracticeProject).order_by(PracticeProject.order)).all())
    i = next((k for k, q in enumerate(rows) if q.id == pid), None)
    if i is None:
        raise HTTPException(status_code=404, detail="없는 실습 프로젝트예요")
    j = i - 1 if body.direction == "up" else i + 1
    if 0 <= j < len(rows):
        rows[i], rows[j] = rows[j], rows[i]
        for k, q in enumerate(rows, start=1):
            q.order = k
        db.commit()
    return {"order": [q.id for q in rows]}
