"""수준 테스트 (Phase 3).

규칙 (CLAUDE.md '꼭 지킬 동작 규칙'):
- 6문제: 보기 고르기 4, 주관식 1, 줄 고르기 1. 문제 내용은 planning/v3-1013/level-test.md (seed.py가 넣는다)
- 선택 사항이고, 어떤 결과가 나와도 신청을 막지 않는다. 결과는 성장 단계로 보여준다
- 다시 풀 수 있다. 응시할 때마다 기록하되 첫 응시에 표시를 남겨 기준 기록으로 쓴다
- 로그인 실패 상태에서는 채점만 하고 기록하지 않는다

정답은 문제를 내려줄 때 보내지 않는다. 제출하면 서버가 채점하고 해설과 함께 돌려준다.
"""
from typing import Dict, List, Literal, Optional, Union

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import auth
from db import get_db
from models import QuizAttempt, QuizQuestion, User

router = APIRouter()

QUOTES = "\"'`“”‘’"

# 맞힌 개수 → 성장 단계 (level-test.md: 5~6 어린 백조 / 3~4 아기 오리 / 0~2 알에서 나온 오리)
STAGES = [
    (5, "cygnet", "어린 백조"),
    (3, "duckling", "아기 오리"),
    (0, "hatchling", "알에서 나온 오리"),
]


def stage_of(score: int) -> dict:
    for floor, key, label in STAGES:
        if score >= floor:
            return {"key": key, "label": label}
    return {"key": "hatchling", "label": "알에서 나온 오리"}


def normalize_short(text: str) -> str:
    """주관식: 앞뒤 공백과 따옴표는 무시한다. "1234", '1234', ` 1234 ` 모두 1234"""
    s = str(text).strip()
    while s and (s[0] in QUOTES or s[-1] in QUOTES or s != s.strip()):
        s = s.strip().strip(QUOTES)
    return s


def grade_one(q: QuizQuestion, answer) -> str:
    """correct / partial / wrong. 부분 정답(줄 고르기)은 점수는 0점이지만 따로 알린다."""
    if answer is None or answer == "":
        return "wrong"
    if q.type == "short":
        return "correct" if normalize_short(answer) == normalize_short(q.answer) else "wrong"
    try:
        picked = int(answer)
    except (TypeError, ValueError):
        return "wrong"
    if picked == int(q.answer):
        return "correct"
    if q.type == "line" and picked in (q.partial_answer or []):
        return "partial"
    return "wrong"


def questions(db: Session) -> List[QuizQuestion]:
    return db.scalars(select(QuizQuestion).order_by(QuizQuestion.order, QuizQuestion.id)).all()


def grade(qs: List[QuizQuestion], answers: dict) -> tuple:
    """(맞힌 개수, 문제 id → {answer, result})"""
    graded = {}
    for q in qs:
        a = answers.get(str(q.id), answers.get(q.id))
        graded[str(q.id)] = {"answer": a, "result": grade_one(q, a)}
    score = sum(1 for g in graded.values() if g["result"] == "correct")
    return score, graded


def public_question(q: QuizQuestion) -> dict:
    """문제를 풀 때 보여 줄 것 (정답·해설 빼고)."""
    return {
        "id": q.id, "order": q.order, "type": q.type, "title": q.title,
        "scenario": q.scenario, "code": q.code, "question": q.question, "choices": q.choices or [],
    }


def first_attempt(db: Session, user_id: int) -> Optional[QuizAttempt]:
    return db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user_id, QuizAttempt.is_first.is_(True))).first()


def attempt_count(db: Session, user_id: int) -> int:
    return db.scalar(select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user_id)) or 0


def first_scores(db: Session) -> Dict[int, int]:
    """사용자 id → 첫 응시 점수 (관리자 신청자 표의 '수준 테스트' 칸)"""
    return dict(db.execute(select(QuizAttempt.user_id, QuizAttempt.correct_count).where(QuizAttempt.is_first.is_(True))).all())


@router.get("/api/quiz")
def quiz(user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    qs = questions(db)
    mine = None
    if user:
        first = first_attempt(db, user.id)
        if first:
            mine = {"first_score": first.correct_count, "first_at": first.created_at.isoformat(timespec="minutes"),
                    "attempts": attempt_count(db, user.id)}
    return {"questions": [public_question(q) for q in qs], "total": len(qs), "mine": mine, "will_record": user is not None}


class SubmitIn(BaseModel):
    # 문제 id → 답 (보기 번호 1~4 / 주관식 글 / 줄 번호)
    answers: Dict[str, Union[int, str, None]] = Field(default_factory=dict)


@router.post("/api/quiz/submit")
def submit(body: SubmitIn, user: Optional[User] = Depends(auth.current_user), db: Session = Depends(get_db)):
    qs = questions(db)
    if not qs:
        raise HTTPException(status_code=409, detail="아직 문제가 없어요")
    for v in body.answers.values():
        if isinstance(v, str) and len(v) > 200:
            raise HTTPException(status_code=400, detail="답이 너무 길어요 (200자까지)")
    score, graded = grade(qs, body.answers)

    saved = is_first = False
    first_score = None
    if user:
        first = first_attempt(db, user.id)
        is_first = first is None
        db.add(QuizAttempt(user_id=user.id, correct_count=score, answers=graded, is_first=is_first))
        db.commit()
        saved = True
        first_score = score if is_first else first.correct_count

    cohort = auth.open_cohort(db)
    return {
        "score": score,
        "total": len(qs),
        "stage": stage_of(score),
        "saved": saved,  # 로그인 실패면 False (기록하지 않음)
        "is_first": is_first,
        "first_score": first_score,
        "recruiting": cohort is not None,
        "applied": bool(user and cohort and auth.active_application(db, user, cohort)),
        "results": [
            {
                **public_question(q),
                "my_answer": graded[str(q.id)]["answer"],
                "result": graded[str(q.id)]["result"],
                "answer": q.answer,
                "partial_answer": q.partial_answer or [],
                "explanation": q.explanation,
                "better_code": q.better_code,
                "line_notes": q.line_notes or {},
            }
            for q in qs
        ],
    }


# ---------- 관리자 ----------

admin = APIRouter(prefix="/api/admin/quiz", dependencies=[Depends(auth.require_admin)])


def full_question(q: QuizQuestion) -> dict:
    return {
        **public_question(q), "answer": q.answer, "partial_answer": q.partial_answer or [],
        "explanation": q.explanation, "better_code": q.better_code, "line_notes": q.line_notes or {},
    }


@admin.get("/questions")
def admin_questions(db: Session = Depends(get_db)):
    return [full_question(q) for q in questions(db)]


class QuestionIn(BaseModel):
    order: int = Field(ge=1, le=99)
    type: Literal["choice", "short", "line"]
    title: str = Field(min_length=1, max_length=100)
    scenario: Optional[str] = Field(default=None, max_length=4000)
    code: str = Field(min_length=1, max_length=4000)
    question: str = Field(min_length=1, max_length=500)
    choices: List[str] = Field(default_factory=list)
    answer: str = Field(min_length=1, max_length=100)
    partial_answer: List[int] = Field(default_factory=list)
    explanation: str = Field(min_length=1, max_length=8000)
    better_code: Optional[str] = Field(default=None, max_length=4000)
    line_notes: Dict[str, str] = Field(default_factory=dict)


def check_question(body: QuestionIn) -> dict:
    """유형마다 정답 꼴이 맞는지 본다. 화면에 그대로 보여 줄 한 문장으로 알린다."""
    data = body.model_dump()
    data["scenario"] = (body.scenario or "").strip() or None
    data["better_code"] = (body.better_code or "").rstrip() or None
    if body.type == "choice":
        choices = [c.strip() for c in body.choices if c.strip()]
        if len(choices) < 2:
            raise HTTPException(status_code=400, detail="보기를 두 개 이상 적어 주세요")
        if not body.answer.isdigit() or not 1 <= int(body.answer) <= len(choices):
            raise HTTPException(status_code=400, detail=f"정답은 보기 번호(1~{len(choices)})로 골라 주세요")
        data["choices"] = choices
        data["partial_answer"] = []
    else:
        data["choices"] = []
    if body.type == "line":
        n = len(body.code.split("\n"))
        lines = [body.answer] + [str(p) for p in body.partial_answer]
        if not all(x.isdigit() and 1 <= int(x) <= n for x in lines):
            raise HTTPException(status_code=400, detail=f"정답 줄과 부분 정답 줄은 코드의 줄 번호(1~{n})여야 해요")
        if int(body.answer) in body.partial_answer:
            raise HTTPException(status_code=400, detail="정답 줄을 부분 정답 줄에 함께 넣을 수 없어요")
        data["line_notes"] = {k: v.strip() for k, v in body.line_notes.items() if k.isdigit() and v.strip()}
    else:
        data["partial_answer"] = []
        data["line_notes"] = {}
    if body.type == "short" and not normalize_short(body.answer):
        raise HTTPException(status_code=400, detail="주관식 정답을 적어 주세요")
    return data


@admin.post("/questions")
def add_question(body: QuestionIn, db: Session = Depends(get_db)):
    q = QuizQuestion(**check_question(body))
    db.add(q)
    db.commit()
    return full_question(q)


@admin.put("/questions/{qid}")
def edit_question(qid: int, body: QuestionIn, db: Session = Depends(get_db)):
    q = db.get(QuizQuestion, qid)
    if q is None:
        raise HTTPException(status_code=404, detail="없는 문제예요")
    for k, v in check_question(body).items():
        setattr(q, k, v)
    db.commit()
    return full_question(q)


@admin.get("/attempts")
def attempts(db: Session = Depends(get_db)):
    """응시 결과 표: 사람마다 한 줄 (이름, 부서, 첫 응시 점수, 응시 횟수, 첫 응시의 문제별 정답 여부)."""
    qs = questions(db)
    counts = dict(db.execute(select(QuizAttempt.user_id, func.count()).group_by(QuizAttempt.user_id)).all())
    rows = db.execute(
        select(QuizAttempt, User).join(User, User.id == QuizAttempt.user_id)
        .where(QuizAttempt.is_first.is_(True)).order_by(QuizAttempt.created_at.desc())
    ).all()
    return {
        "questions": [{"id": q.id, "order": q.order, "title": q.title} for q in qs],
        "total": len(qs),
        "rows": [
            {
                "user_id": u.id, "name": u.name, "dept": u.dept,
                "first_score": a.correct_count, "first_at": a.created_at.isoformat(timespec="minutes"),
                "attempts": counts.get(u.id, 1),
                "stage": stage_of(a.correct_count)["label"],
                # 문제 id → correct/partial/wrong (그 문제가 생기기 전 응시라면 없음)
                "results": {qid: g.get("result") for qid, g in (a.answers or {}).items()},
            }
            for a, u in rows
        ],
    }
