from __future__ import annotations

import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Answer, Choice, Question, QuestionKind

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def display_answer(answer: Answer, question: Question) -> str:
    if question.kind in {QuestionKind.multiple_choice, QuestionKind.dropdown} and answer.choice_id:
        choice = next((c for c in question.choices if c.id == answer.choice_id), None)
        return choice.label if choice else ""
    if question.kind == QuestionKind.yes_no:
        if answer.bool_value is None:
            return ""
        return "Yes" if answer.bool_value else "No"
    if question.kind in {QuestionKind.number, QuestionKind.rating} and answer.number_value is not None:
        value = answer.number_value
        return str(int(value)) if value.is_integer() else str(value)
    return answer.text_value or ""


def validate_answers(db: Session, questions: list[Question], payloads: list) -> list[Answer]:
    by_id = {q.id: q for q in questions}
    seen: set[str] = set()
    answers: list[Answer] = []

    payload_map = {p.question_id: p for p in payloads}

    for question in questions:
        payload = payload_map.get(question.id)
        if payload is None:
            if question.required:
                raise HTTPException(status_code=422, detail=f"Question '{question.prompt or question.kind.value}' is required.")
            continue
        seen.add(question.id)
        answers.append(_validate_one(db, question, payload))

    extra = set(payload_map) - set(by_id)
    if extra:
        raise HTTPException(status_code=422, detail="One or more answers do not belong to this form.")

    return answers


def _validate_one(db: Session, question: Question, payload) -> Answer:
    kind = question.kind
    text = (payload.text_value or "").strip() if payload.text_value is not None else ""
    empty_choice = not payload.choice_id
    empty_bool = payload.bool_value is None
    empty_number = payload.number_value is None
    empty_text = text == ""

    if kind in {QuestionKind.short_text, QuestionKind.long_text, QuestionKind.email}:
        if question.required and empty_text:
            raise HTTPException(status_code=422, detail=f"'{question.prompt}' is required.")
        if kind == QuestionKind.email and text and not EMAIL_RE.match(text):
            raise HTTPException(status_code=422, detail="Please enter a valid email address.")
        return Answer(question_id=question.id, text_value=text or None)

    if kind == QuestionKind.number:
        if question.required and empty_number:
            raise HTTPException(status_code=422, detail=f"'{question.prompt}' is required.")
        if not empty_number:
            value = float(payload.number_value)
            if question.number_min is not None and value < question.number_min:
                raise HTTPException(status_code=422, detail=f"Value must be at least {question.number_min}.")
            if question.number_max is not None and value > question.number_max:
                raise HTTPException(status_code=422, detail=f"Value must be at most {question.number_max}.")
            return Answer(question_id=question.id, number_value=value)
        return Answer(question_id=question.id)

    if kind == QuestionKind.rating:
        if question.required and empty_number:
            raise HTTPException(status_code=422, detail=f"'{question.prompt}' is required.")
        if not empty_number:
            value = int(payload.number_value)
            if value < 1 or value > question.rating_max:
                raise HTTPException(status_code=422, detail=f"Rating must be between 1 and {question.rating_max}.")
            return Answer(question_id=question.id, number_value=value)
        return Answer(question_id=question.id)

    if kind == QuestionKind.yes_no:
        if question.required and empty_bool:
            raise HTTPException(status_code=422, detail=f"'{question.prompt}' is required.")
        return Answer(question_id=question.id, bool_value=payload.bool_value)

    if kind in {QuestionKind.multiple_choice, QuestionKind.dropdown}:
        if question.required and empty_choice:
            raise HTTPException(status_code=422, detail=f"'{question.prompt}' is required.")
        if payload.choice_id:
            choice = db.get(Choice, payload.choice_id)
            if not choice or choice.question_id != question.id:
                raise HTTPException(status_code=422, detail="Invalid choice selected.")
        return Answer(question_id=question.id, choice_id=payload.choice_id)

    raise HTTPException(status_code=422, detail="Unsupported question type.")
