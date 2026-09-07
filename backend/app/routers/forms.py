from collections import defaultdict
from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Answer, Choice, Form, FormStatus, Question, QuestionKind, Submission, utcnow
from app.schemas import (
    AnswerOut,
    FormCreate,
    FormDetail,
    FormStats,
    FormSummary,
    FormUpdate,
    QuestionIn,
    QuestionOut,
    QuestionStat,
    QuestionUpdate,
    ReorderIn,
    SubmissionDetail,
    SubmissionListItem,
)
from app.validation import display_answer

router = APIRouter(prefix="/forms", tags=["forms"])


def _slug() -> str:
    return token_urlsafe(8).replace("_", "").replace("-", "")[:12]


def _form_query(db: Session):
    return select(Form).options(
        selectinload(Form.questions).selectinload(Question.choices),
        selectinload(Form.submissions),
    )


def get_form_or_404(db: Session, form_id: str) -> Form:
    form = db.execute(_form_query(db).where(Form.id == form_id)).scalar_one_or_none()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found.")
    return form


def to_summary(form: Form) -> FormSummary:
    return FormSummary(
        id=form.id,
        title=form.title,
        status=form.status,
        public_slug=form.public_slug,
        response_count=len(form.submissions),
        question_count=len(form.questions),
        created_at=form.created_at,
        updated_at=form.updated_at,
    )


@router.get("", response_model=list[FormSummary])
def list_forms(db: Session = Depends(get_db)):
    forms = db.execute(_form_query(db).order_by(Form.updated_at.desc())).scalars().all()
    return [to_summary(f) for f in forms]


@router.post("", response_model=FormDetail)
def create_form(body: FormCreate, db: Session = Depends(get_db)):
    form = Form(title=body.title.strip() or "Untitled typeform", public_slug=_slug())
    db.add(form)
    db.commit()
    return get_form_or_404(db, form.id)


@router.get("/{form_id}", response_model=FormDetail)
def get_form(form_id: str, db: Session = Depends(get_db)):
    return get_form_or_404(db, form_id)


@router.patch("/{form_id}", response_model=FormDetail)
def update_form(form_id: str, body: FormUpdate, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(form, key, value)
    form.updated_at = utcnow()
    db.commit()
    return get_form_or_404(db, form_id)


@router.delete("/{form_id}", status_code=204)
def delete_form(form_id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    db.delete(form)
    db.commit()


@router.post("/{form_id}/duplicate", response_model=FormDetail)
def duplicate_form(form_id: str, db: Session = Depends(get_db)):
    source = get_form_or_404(db, form_id)
    clone = Form(
        title=f"{source.title} (copy)",
        description=source.description,
        status=FormStatus.draft,
        public_slug=_slug(),
        welcome_title=source.welcome_title,
        welcome_message=source.welcome_message,
        thank_you_title=source.thank_you_title,
        thank_you_message=source.thank_you_message,
        accent_color=source.accent_color,
    )
    db.add(clone)
    db.flush()
    for question in source.questions:
        q = Question(
            form_id=clone.id,
            kind=question.kind,
            prompt=question.prompt,
            help_text=question.help_text,
            required=question.required,
            position=question.position,
            placeholder=question.placeholder,
            rating_max=question.rating_max,
            number_min=question.number_min,
            number_max=question.number_max,
        )
        db.add(q)
        db.flush()
        for choice in question.choices:
            db.add(Choice(question_id=q.id, label=choice.label, position=choice.position))
    db.commit()
    return get_form_or_404(db, clone.id)


@router.post("/{form_id}/publish", response_model=FormDetail)
def publish_form(form_id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    if not form.questions:
        raise HTTPException(status_code=400, detail="Add at least one question before publishing.")
    form.status = FormStatus.published
    form.updated_at = utcnow()
    db.commit()
    return get_form_or_404(db, form_id)


@router.post("/{form_id}/unpublish", response_model=FormDetail)
def unpublish_form(form_id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    form.status = FormStatus.draft
    form.updated_at = utcnow()
    db.commit()
    return get_form_or_404(db, form_id)


@router.post("/{form_id}/questions", response_model=QuestionOut)
def add_question(form_id: str, body: QuestionIn, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    next_pos = max((q.position for q in form.questions), default=-1) + 1
    question = Question(
        form_id=form.id,
        kind=body.kind,
        prompt=body.prompt or _default_prompt(body.kind),
        help_text=body.help_text,
        required=body.required,
        position=body.position if body.position is not None else next_pos,
        placeholder=body.placeholder,
        rating_max=body.rating_max,
        number_min=body.number_min,
        number_max=body.number_max,
    )
    db.add(question)
    db.flush()
    labels = [c.label for c in body.choices] or _default_choices(body.kind)
    for index, label in enumerate(labels):
        db.add(Choice(question_id=question.id, label=label, position=index))
    form.updated_at = utcnow()
    db.commit()
    return db.execute(
        select(Question).options(selectinload(Question.choices)).where(Question.id == question.id)
    ).scalar_one()


@router.patch("/{form_id}/questions/{question_id}", response_model=QuestionOut)
def update_question(form_id: str, question_id: str, body: QuestionUpdate, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    question = next((q for q in form.questions if q.id == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")
    data = body.model_dump(exclude_unset=True)
    choices_in = data.pop("choices", None)
    for key, value in data.items():
        setattr(question, key, value)
    if choices_in is not None:
        question.choices.clear()
        db.flush()
        for index, choice in enumerate(choices_in):
            db.add(Choice(question_id=question.id, label=choice["label"], position=index))
    elif question.kind in {QuestionKind.multiple_choice, QuestionKind.dropdown} and not question.choices:
        for index, label in enumerate(_default_choices(question.kind)):
            db.add(Choice(question_id=question.id, label=label, position=index))
    form.updated_at = utcnow()
    db.commit()
    return db.execute(
        select(Question).options(selectinload(Question.choices)).where(Question.id == question.id)
    ).scalar_one()


@router.delete("/{form_id}/questions/{question_id}", status_code=204)
def delete_question(form_id: str, question_id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    question = next((q for q in form.questions if q.id == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")
    db.delete(question)
    remaining = [q for q in form.questions if q.id != question_id]
    for index, q in enumerate(sorted(remaining, key=lambda item: item.position)):
        q.position = index
    form.updated_at = utcnow()
    db.commit()


@router.put("/{form_id}/questions/reorder", response_model=FormDetail)
def reorder_questions(form_id: str, body: ReorderIn, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    by_id = {q.id: q for q in form.questions}
    if set(body.question_ids) != set(by_id):
        raise HTTPException(status_code=400, detail="Reorder payload must include every question exactly once.")
    for index, qid in enumerate(body.question_ids):
        by_id[qid].position = index
    form.updated_at = utcnow()
    db.commit()
    return get_form_or_404(db, form_id)


@router.get("/{form_id}/submissions", response_model=list[SubmissionListItem])
def list_submissions(form_id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    items: list[SubmissionListItem] = []
    for submission in sorted(form.submissions, key=lambda s: s.submitted_at, reverse=True):
        first_answer = ""
        ordered = sorted(form.questions, key=lambda q: q.position)
        answers = {a.question_id: a for a in submission.answers}
        for question in ordered:
            answer = answers.get(question.id)
            if answer:
                first_answer = display_answer(answer, question)
                if first_answer:
                    break
        items.append(
            SubmissionListItem(id=submission.id, submitted_at=submission.submitted_at, preview=first_answer or "(empty)")
        )
    return items


@router.get("/{form_id}/submissions/{submission_id}", response_model=SubmissionDetail)
def get_submission(form_id: str, submission_id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    submission = next((s for s in form.submissions if s.id == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    answers_by_q = {a.question_id: a for a in submission.answers}
    answers = []
    for question in form.questions:
        answer = answers_by_q.get(question.id)
        answers.append(
            AnswerOut(
                question_id=question.id,
                prompt=question.prompt,
                kind=question.kind,
                text_value=answer.text_value if answer else None,
                number_value=answer.number_value if answer else None,
                bool_value=answer.bool_value if answer else None,
                choice_id=answer.choice_id if answer else None,
                display_value=display_answer(answer, question) if answer else "",
            )
        )
    return SubmissionDetail(id=submission.id, form_id=form.id, submitted_at=submission.submitted_at, answers=answers)


@router.get("/{form_id}/stats", response_model=FormStats)
def form_stats(form_id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    total = len(form.submissions)
    stats: list[QuestionStat] = []
    for question in form.questions:
        answers = [a for s in form.submissions for a in s.answers if a.question_id == question.id]
        breakdown: list[dict] = []
        average = None
        if question.kind in {QuestionKind.multiple_choice, QuestionKind.dropdown}:
            counts: dict[str, int] = defaultdict(int)
            for answer in answers:
                if answer.choice_id:
                    counts[answer.choice_id] += 1
            for choice in question.choices:
                breakdown.append({"label": choice.label, "count": counts.get(choice.id, 0)})
        elif question.kind == QuestionKind.yes_no:
            yes = sum(1 for a in answers if a.bool_value is True)
            no = sum(1 for a in answers if a.bool_value is False)
            breakdown = [{"label": "Yes", "count": yes}, {"label": "No", "count": no}]
        elif question.kind == QuestionKind.rating:
            values = [a.number_value for a in answers if a.number_value is not None]
            if values:
                average = round(sum(values) / len(values), 2)
            for star in range(1, question.rating_max + 1):
                breakdown.append({"label": str(star), "count": sum(1 for v in values if int(v) == star)})
        stats.append(
            QuestionStat(
                question_id=question.id,
                prompt=question.prompt,
                kind=question.kind,
                response_count=len(answers),
                breakdown=breakdown,
                average=average,
            )
        )
    return FormStats(total_submissions=total, questions=stats)


@router.get("/{form_id}/export.csv")
def export_csv(form_id: str, db: Session = Depends(get_db)):
    from fastapi.responses import PlainTextResponse

    form = get_form_or_404(db, form_id)
    headers = ["submitted_at", *[q.prompt or q.kind.value for q in form.questions]]
    rows = [",".join(_csv_cell(h) for h in headers)]
    for submission in sorted(form.submissions, key=lambda s: s.submitted_at):
        answers = {a.question_id: a for a in submission.answers}
        cells = [submission.submitted_at.isoformat()]
        for question in form.questions:
            answer = answers.get(question.id)
            cells.append(display_answer(answer, question) if answer else "")
        rows.append(",".join(_csv_cell(c) for c in cells))
    filename = f"{form.title.lower().replace(' ', '_')}_responses.csv"
    return PlainTextResponse(
        "\n".join(rows) + "\n",
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _csv_cell(value: str) -> str:
    if any(ch in value for ch in [",", '"', "\n"]):
        return '"' + value.replace('"', '""') + '"'
    return value


def _default_prompt(kind: QuestionKind) -> str:
    return {
        QuestionKind.short_text: "Your answer",
        QuestionKind.long_text: "Tell us a bit more",
        QuestionKind.multiple_choice: "Choose one option",
        QuestionKind.dropdown: "Pick from the list",
        QuestionKind.email: "What's your email?",
        QuestionKind.number: "Type a number",
        QuestionKind.yes_no: "Do you agree?",
        QuestionKind.rating: "How would you rate this?",
    }[kind]


def _default_choices(kind: QuestionKind) -> list[str]:
    if kind in {QuestionKind.multiple_choice, QuestionKind.dropdown}:
        return ["Choice A", "Choice B", "Choice C"]
    return []
