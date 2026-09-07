import type { LucideIcon } from "lucide-react";
import {
  Check,
  ChevronDown,
  Hash,
  ListChecks,
  Mail,
  Star,
  TextCursorInput,
  AlignLeft,
} from "lucide-react";
import type { QuestionKind } from "./types";

export type KindMeta = {
  kind: QuestionKind;
  label: string;
  group: "Contact" | "Choice" | "Text" | "Rating";
  Icon: LucideIcon;
  defaultPrompt: string;
};

export const QUESTION_KINDS: KindMeta[] = [
  { kind: "short_text", label: "Short text", group: "Text", Icon: TextCursorInput, defaultPrompt: "Your answer" },
  { kind: "long_text", label: "Long text", group: "Text", Icon: AlignLeft, defaultPrompt: "Tell us a bit more" },
  { kind: "email", label: "Email", group: "Contact", Icon: Mail, defaultPrompt: "What's your email?" },
  { kind: "number", label: "Number", group: "Text", Icon: Hash, defaultPrompt: "Type a number" },
  { kind: "multiple_choice", label: "Multiple choice", group: "Choice", Icon: ListChecks, defaultPrompt: "Choose one option" },
  { kind: "dropdown", label: "Dropdown", group: "Choice", Icon: ChevronDown, defaultPrompt: "Pick from the list" },
  { kind: "yes_no", label: "Yes / No", group: "Choice", Icon: Check, defaultPrompt: "Do you agree?" },
  { kind: "rating", label: "Rating", group: "Rating", Icon: Star, defaultPrompt: "How would you rate this?" },
];

export function kindMeta(kind: QuestionKind) {
  return QUESTION_KINDS.find((item) => item.kind === kind)!;
}
