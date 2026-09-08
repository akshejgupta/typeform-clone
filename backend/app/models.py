from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid4())


class FormStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class QuestionKind(str, enum.Enum):
    short_text = "short_text"
    long_text = "long_text"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    email = "email"
    number = "number"
    yes_no = "yes_no"
    rating = "rating"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(200), default="Untitled typeform")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[FormStatus] = mapped_column(Enum(FormStatus, native_enum=False), default=FormStatus.draft)
    public_slug: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    welcome_title: Mapped[str] = mapped_column(String(300), default="Hello there")
    welcome_message: Mapped[str] = mapped_column(Text, default="Thanks for taking the time to fill this out. It only takes a minute.")
    thank_you_title: Mapped[str] = mapped_column(String(300), default="Thanks for completing this typeform")
    thank_you_message: Mapped[str] = mapped_column(Text, default="Your answers have been submitted.")
    accent_color: Mapped[str] = mapped_column(String(16), default="#0445AF")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    questions: Mapped[list[Question]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )
    submissions: Mapped[list[Submission]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    form_id: Mapped[str] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"), index=True)
    kind: Mapped[QuestionKind] = mapped_column(Enum(QuestionKind, native_enum=False))
    prompt: Mapped[str] = mapped_column(Text, default="")
    help_text: Mapped[str] = mapped_column(Text, default="")
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    placeholder: Mapped[str] = mapped_column(String(200), default="")
    rating_max: Mapped[int] = mapped_column(Integer, default=5)
    number_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    number_max: Mapped[float | None] = mapped_column(Float, nullable=True)

    form: Mapped[Form] = relationship(back_populates="questions")
    choices: Mapped[list[Choice]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="Choice.position",
    )
    answers: Mapped[list[Answer]] = relationship(back_populates="question")


class Choice(Base):
    __tablename__ = "choices"
    __table_args__ = (UniqueConstraint("question_id", "position", name="uq_choice_position"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(300), default="Choice")
    position: Mapped[int] = mapped_column(Integer, default=0)

    question: Mapped[Question] = relationship(back_populates="choices")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    form_id: Mapped[str] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"), index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    form: Mapped[Form] = relationship(back_populates="submissions")
    answers: Mapped[list[Answer]] = relationship(
        back_populates="submission",
        cascade="all, delete-orphan",
    )


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (UniqueConstraint("submission_id", "question_id", name="uq_answer_per_question"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    submission_id: Mapped[str] = mapped_column(ForeignKey("submissions.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True)
    text_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    number_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    bool_value: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    choice_id: Mapped[str | None] = mapped_column(ForeignKey("choices.id", ondelete="SET NULL"), nullable=True)

    submission: Mapped[Submission] = relationship(back_populates="answers")
    question: Mapped[Question] = relationship(back_populates="answers")
