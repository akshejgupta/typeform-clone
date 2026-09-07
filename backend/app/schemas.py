from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models import FormStatus, QuestionKind


class ChoiceIn(BaseModel):
    id: str | None = None
    label: str = "Choice"
    position: int = 0


class ChoiceOut(BaseModel):
    id: str
    label: str
    position: int

    model_config = {"from_attributes": True}


class QuestionIn(BaseModel):
    kind: QuestionKind
    prompt: str = ""
    help_text: str = ""
    required: bool = True
    position: int | None = None
    placeholder: str = ""
    rating_max: int = 5
    number_min: float | None = None
    number_max: float | None = None
    choices: list[ChoiceIn] = Field(default_factory=list)


class QuestionUpdate(BaseModel):
    kind: QuestionKind | None = None
    prompt: str | None = None
    help_text: str | None = None
    required: bool | None = None
    placeholder: str | None = None
    rating_max: int | None = None
    number_min: float | None = None
    number_max: float | None = None
    choices: list[ChoiceIn] | None = None


class QuestionOut(BaseModel):
    id: str
    form_id: str
    kind: QuestionKind
    prompt: str
    help_text: str
    required: bool
    position: int
    placeholder: str
    rating_max: int
    number_min: float | None
    number_max: float | None
    choices: list[ChoiceOut]

    model_config = {"from_attributes": True}


class FormCreate(BaseModel):
    title: str = "Untitled typeform"


class FormUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    welcome_title: str | None = None
    welcome_message: str | None = None
    thank_you_title: str | None = None
    thank_you_message: str | None = None
    accent_color: str | None = None


class FormSummary(BaseModel):
    id: str
    title: str
    status: FormStatus
    public_slug: str
    response_count: int
    question_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FormDetail(BaseModel):
    id: str
    title: str
    description: str
    status: FormStatus
    public_slug: str
    welcome_title: str
    welcome_message: str
    thank_you_title: str
    thank_you_message: str
    accent_color: str
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionOut]

    model_config = {"from_attributes": True}


class ReorderIn(BaseModel):
    question_ids: list[str]


class AnswerPayload(BaseModel):
    question_id: str
    text_value: str | None = None
    number_value: float | None = None
    bool_value: bool | None = None
    choice_id: str | None = None


class SubmitIn(BaseModel):
    answers: list[AnswerPayload]


class SubmitOut(BaseModel):
    id: str
    thank_you_title: str
    thank_you_message: str


class AnswerOut(BaseModel):
    question_id: str
    prompt: str
    kind: QuestionKind
    text_value: str | None
    number_value: float | None
    bool_value: bool | None
    choice_id: str | None
    display_value: str


class SubmissionListItem(BaseModel):
    id: str
    submitted_at: datetime
    preview: str


class SubmissionDetail(BaseModel):
    id: str
    form_id: str
    submitted_at: datetime
    answers: list[AnswerOut]


class QuestionStat(BaseModel):
    question_id: str
    prompt: str
    kind: QuestionKind
    response_count: int
    breakdown: list[dict[str, Any]] = Field(default_factory=list)
    average: float | None = None


class FormStats(BaseModel):
    total_submissions: int
    questions: list[QuestionStat]
