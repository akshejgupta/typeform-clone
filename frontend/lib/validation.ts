import type { AnswerPayload, Question } from "./types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmptyAnswer(question: Question, answer?: AnswerPayload | null) {
  if (!answer) return true;
  switch (question.kind) {
    case "short_text":
    case "long_text":
    case "email":
      return !answer.text_value?.trim();
    case "number":
    case "rating":
      return answer.number_value === null || answer.number_value === undefined;
    case "yes_no":
      return answer.bool_value === null || answer.bool_value === undefined;
    case "multiple_choice":
    case "dropdown":
      return !answer.choice_id;
    default:
      return true;
  }
}

export function validateAnswer(question: Question, answer?: AnswerPayload | null): string | null {
  const empty = isEmptyAnswer(question, answer);
  if (question.required && empty) return "Please fill this in";
  if (empty) return null;
  if (question.kind === "email" && answer?.text_value && !EMAIL.test(answer.text_value.trim())) {
    return "Hmm, that email doesn’t look right";
  }
  if (question.kind === "number" && answer?.number_value != null) {
    if (question.number_min != null && answer.number_value < question.number_min) {
      return `Must be at least ${question.number_min}`;
    }
    if (question.number_max != null && answer.number_value > question.number_max) {
      return `Must be at most ${question.number_max}`;
    }
  }
  if (question.kind === "rating" && answer?.number_value != null) {
    if (answer.number_value < 1 || answer.number_value > question.rating_max) {
      return `Pick a rating from 1 to ${question.rating_max}`;
    }
  }
  return null;
}

export function toSubmitPayload(questions: Question[], answers: Record<string, AnswerPayload>): AnswerPayload[] {
  return questions
    .map((question) => answers[question.id])
    .filter((answer): answer is AnswerPayload => Boolean(answer) && !isEmptyAnswer(questions.find((q) => q.id === answer.question_id)!, answer));
}
