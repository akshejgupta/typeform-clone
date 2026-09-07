export type FormStatus = "draft" | "published";

export type QuestionKind =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type Choice = {
  id: string;
  label: string;
  position: number;
};

export type Question = {
  id: string;
  form_id: string;
  kind: QuestionKind;
  prompt: string;
  help_text: string;
  required: boolean;
  position: number;
  placeholder: string;
  rating_max: number;
  number_min: number | null;
  number_max: number | null;
  choices: Choice[];
};

export type QuestionUpdatePayload = Partial<Omit<Question, "choices">> & {
  choices?: { label: string }[];
};

export type FormSummary = {
  id: string;
  title: string;
  status: FormStatus;
  public_slug: string;
  response_count: number;
  question_count: number;
  created_at: string;
  updated_at: string;
};

export type FormDetail = {
  id: string;
  title: string;
  description: string;
  status: FormStatus;
  public_slug: string;
  welcome_title: string;
  welcome_message: string;
  thank_you_title: string;
  thank_you_message: string;
  accent_color: string;
  created_at: string;
  updated_at: string;
  questions: Question[];
};

export type AnswerPayload = {
  question_id: string;
  text_value?: string | null;
  number_value?: number | null;
  bool_value?: boolean | null;
  choice_id?: string | null;
};

export type SubmissionListItem = {
  id: string;
  submitted_at: string;
  preview: string;
};

export type SubmissionDetail = {
  id: string;
  form_id: string;
  submitted_at: string;
  answers: {
    question_id: string;
    prompt: string;
    kind: QuestionKind;
    text_value: string | null;
    number_value: number | null;
    bool_value: boolean | null;
    choice_id: string | null;
    display_value: string;
  }[];
};

export type FormStats = {
  total_submissions: number;
  questions: {
    question_id: string;
    prompt: string;
    kind: QuestionKind;
    response_count: number;
    average: number | null;
    breakdown: { label: string; count: number }[];
  }[];
};
