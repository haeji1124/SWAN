"""데이터 모델. CLAUDE.md의 '데이터 모델'을 그대로 옮긴다."""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


def now() -> datetime:
    return datetime.now()


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    emp_no: Mapped[str] = mapped_column(String(20), unique=True)  # 사번
    name: Mapped[str] = mapped_column(String(50))
    dept: Mapped[str] = mapped_column(String(50))
    sso_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)


class Cohort(Base):
    __tablename__ = "cohorts"
    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[int] = mapped_column(Integer, unique=True)  # 기수 번호
    recruit_start: Mapped[date] = mapped_column(Date)
    recruit_end: Mapped[date] = mapped_column(Date)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    class_day: Mapped[str] = mapped_column(String(20))  # 강의 요일
    class_time: Mapped[str] = mapped_column(String(20))  # 강의 시간
    # 모집 상태: before(모집 전) / open(모집 중) / closed(모집 마감) / done(종료). 모집 중은 최대 1개
    status: Mapped[str] = mapped_column(String(10), default="before")


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cohort_id: Mapped[int] = mapped_column(ForeignKey("cohorts.id"))
    python_exp: Mapped[str] = mapped_column(String(20))  # none / script / regular
    want_to_make: Mapped[Optional[str]] = mapped_column(Text)
    applied_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)  # 값이 있으면 취소된 신청
    completed: Mapped[bool] = mapped_column(Boolean, default=False)  # 수료 여부


class Alumni(Base):
    """엑셀로 올린 역대 수료생 명단. 사번으로 User와 이어진다."""
    __tablename__ = "alumni"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    dept: Mapped[str] = mapped_column(String(50))
    cohort_number: Mapped[int] = mapped_column(Integer)
    emp_no: Mapped[str] = mapped_column(String(20), index=True)


class Interest(Base):
    """다음 기수 알림 받기."""
    __tablename__ = "interests"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Project(Base):
    """졸업생 완성작. 관리자 승인 후 공개된다."""
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(100))
    summary: Mapped[str] = mapped_column(String(200))  # 짧은 설명
    cover_image: Mapped[Optional[str]] = mapped_column(String(300))  # 대표 이미지 경로
    problem: Mapped[Optional[str]] = mapped_column(Text)
    effect: Mapped[Optional[str]] = mapped_column(Text)
    screenshots: Mapped[list] = mapped_column(JSON, default=list)
    slides: Mapped[Optional[str]] = mapped_column(String(300))  # 발표자료 파일 경로
    repo_url: Mapped[Optional[str]] = mapped_column(String(300))
    detail: Mapped[Optional[str]] = mapped_column(Text)  # 자세한 설명 (마크다운)
    # 상태: pending(승인 대기) / published(공개됨) / rejected(반려됨)
    status: Mapped[str] = mapped_column(String(10), default="pending")
    reject_reason: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ProjectLike(Base):
    __tablename__ = "project_likes"
    __table_args__ = (UniqueConstraint("user_id", "project_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    order: Mapped[int] = mapped_column(Integer)
    # 유형: choice(보기 고르기) / short(주관식) / line(줄 고르기)
    type: Mapped[str] = mapped_column(String(10))
    title: Mapped[str] = mapped_column(String(100), default="")  # 짧은 이름 (해설 목록·관리자 표에 쓴다)
    # 상황 설명. 문단 사이에 ```error 원래 에러 / ```log 로그 파일 처럼 이름 붙은 상자를 넣을 수 있다
    scenario: Mapped[Optional[str]] = mapped_column(Text)
    code: Mapped[str] = mapped_column(Text)
    question: Mapped[str] = mapped_column(Text)
    choices: Mapped[list] = mapped_column(JSON, default=list)
    answer: Mapped[str] = mapped_column(String(100))  # 보기 번호 / 정답 문자열 / 줄 번호
    partial_answer: Mapped[list] = mapped_column(JSON, default=list)  # 부분 정답 줄 번호들
    # 해설. 짧은 마크다운(문단, ### 소제목, 목록, 표, **굵게**, `코드`, ==형광펜==, > 강사 한마디, {{better_code}} 자리)
    explanation: Mapped[str] = mapped_column(Text)
    better_code: Mapped[Optional[str]] = mapped_column(Text)
    line_notes: Mapped[dict] = mapped_column(JSON, default=dict)  # 줄 고르기 해설에서 줄 옆에 다는 // 설명 {"12": "..."}


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    correct_count: Mapped[int] = mapped_column(Integer)
    # 문제 id → {"answer": 고른 답, "result": correct/partial/wrong}. 채점 결과를 함께 남겨, 나중에 문제를 고쳐도 그때의 판정이 유지된다
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    is_first: Mapped[bool] = mapped_column(Boolean, default=False)  # 첫 응시 = 기준 기록


class Idea(Base):
    __tablename__ = "ideas"
    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    name_display: Mapped[str] = mapped_column(String(10), default="full")  # full(이름과 부서) / dept(부서만)
    # 상태: open(접수) / reviewing(검토 중) / building(만드는 중) / done(완료)
    status: Mapped[str] = mapped_column(String(10), default="open")
    reply: Mapped[Optional[str]] = mapped_column(Text)  # 파트 답변
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class IdeaVote(Base):
    __tablename__ = "idea_votes"
    __table_args__ = (UniqueConstraint("user_id", "idea_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"))


class ToyPost(Base):
    __tablename__ = "toy_posts"
    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(100))
    what: Mapped[str] = mapped_column(Text)  # 만들 것
    roles: Mapped[str] = mapped_column(String(200))  # 필요한 역할·인원
    period: Mapped[str] = mapped_column(String(50))  # 예상 기간
    status: Mapped[str] = mapped_column(String(10), default="open")  # open(모집 중) / closed(마감)
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ToyJoin(Base):
    __tablename__ = "toy_joins"
    __table_args__ = (UniqueConstraint("user_id", "toy_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    toy_id: Mapped[int] = mapped_column(ForeignKey("toy_posts.id"))


class CurriculumUnit(Base):
    __tablename__ = "curriculum_units"
    id: Mapped[int] = mapped_column(primary_key=True)
    order: Mapped[int] = mapped_column(Integer)
    stage: Mapped[int] = mapped_column(Integer)  # 1 다지기 / 2 깊어지기 / 3 만들기 / 4 AI와 함께 만들기
    title: Mapped[str] = mapped_column(String(100))
    content: Mapped[str] = mapped_column(Text)  # 배우는 것


class PracticeProject(Base):
    __tablename__ = "practice_projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    order: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(100))
    one_liner: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(Text)
    topic: Mapped[str] = mapped_column(String(50))  # 주제 묶음
    skill: Mapped[str] = mapped_column(String(200))  # 기르는 힘
    preview_image: Mapped[Optional[str]] = mapped_column(String(300))
    preview_video: Mapped[Optional[str]] = mapped_column(String(300))


class EventLog(Base):
    __tablename__ = "event_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))  # 로그인 실패면 비어 있음
    kind: Mapped[str] = mapped_column(String(10))  # visit(방문) / section(섹션 도달) / click(클릭)
    target: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
