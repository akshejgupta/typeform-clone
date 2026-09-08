import type { AnswerPayload, FormDetail, FormStats, FormSummary, Question, QuestionUpdatePayload, SubmissionDetail, SubmissionListItem } from "./types";
import type { StoredUser } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Something went wrong.";
    throw new Error(detail);
  }
  return data as T;
}

export const api = {
  register: (full_name: string, email: string, password: string) =>
    request<StoredUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<StoredUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  listForms: () => request<FormSummary[]>("/api/forms"),
  createForm: (title?: string) => request<FormDetail>("/api/forms", { method: "POST", body: JSON.stringify({ title: title ?? "Untitled typeform" }) }),
  getForm: (id: string) => request<FormDetail>(`/api/forms/${id}`),
  updateForm: (id: string, body: Partial<FormDetail>) => request<FormDetail>(`/api/forms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteForm: (id: string) => request<void>(`/api/forms/${id}`, { method: "DELETE" }),
  duplicateForm: (id: string) => request<FormDetail>(`/api/forms/${id}/duplicate`, { method: "POST" }),
  publishForm: (id: string) => request<FormDetail>(`/api/forms/${id}/publish`, { method: "POST" }),
  unpublishForm: (id: string) => request<FormDetail>(`/api/forms/${id}/unpublish`, { method: "POST" }),
  addQuestion: (formId: string, kind: Question["kind"]) =>
    request<Question>(`/api/forms/${formId}/questions`, { method: "POST", body: JSON.stringify({ kind }) }),
  updateQuestion: (formId: string, questionId: string, body: QuestionUpdatePayload) =>
    request<Question>(`/api/forms/${formId}/questions/${questionId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteQuestion: (formId: string, questionId: string) =>
    request<void>(`/api/forms/${formId}/questions/${questionId}`, { method: "DELETE" }),
  reorderQuestions: (formId: string, question_ids: string[]) =>
    request<FormDetail>(`/api/forms/${formId}/questions/reorder`, { method: "PUT", body: JSON.stringify({ question_ids }) }),
  listSubmissions: (formId: string) => request<SubmissionListItem[]>(`/api/forms/${formId}/submissions`),
  getSubmission: (formId: string, submissionId: string) =>
    request<SubmissionDetail>(`/api/forms/${formId}/submissions/${submissionId}`),
  getStats: (formId: string) => request<FormStats>(`/api/forms/${formId}/stats`),
  exportUrl: (formId: string) => `${API}/api/forms/${formId}/export.csv`,
  getPublic: (slug: string) => request<FormDetail>(`/api/public/${slug}`),
  submitPublic: (slug: string, answers: AnswerPayload[]) =>
    request<{ id: string; thank_you_title: string; thank_you_message: string }>(`/api/public/${slug}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};

export function downloadCsv(formId: string, formTitle?: string) {
  const url = api.exportUrl(formId);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(formTitle || "responses").toLowerCase().replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
