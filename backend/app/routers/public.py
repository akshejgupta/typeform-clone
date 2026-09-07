from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Form, FormStatus, Question, Submission
from app.schemas import FormDetail, SubmitIn, SubmitOut
from app.validation import validate_answers

router = APIRouter(prefix="/public", tags=["public"])


def _published(db: Session, slug: str) -> Form:
    form = db.execute(
        select(Form)
        .options(selectinload(Form.questions).selectinload(Question.choices))
        .where(Form.public_slug == slug)
    ).scalar_one_or_none()
    if not form or form.status != FormStatus.published:
        raise HTTPException(status_code=404, detail="This form is not available.")
    return form


@router.get("/{slug}", response_model=FormDetail)
def get_published_form(slug: str, db: Session = Depends(get_db)):
    return _published(db, slug)


@router.post("/{slug}/submit", response_model=SubmitOut)
def submit_form(slug: str, body: SubmitIn, db: Session = Depends(get_db)):
    form = _published(db, slug)
    answers = validate_answers(db, form.questions, body.answers)
    submission = Submission(form_id=form.id, answers=answers)
    db.add(submission)
    db.commit()
    return SubmitOut(id=submission.id, thank_you_title=form.thank_you_title, thank_you_message=form.thank_you_message)
