"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Share2,
  BarChart2,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Settings2,
  Palette,
  Check,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  ChevronDown,
  Globe,
  Split,
  ChevronUp,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { api } from "@/lib/api";
import type { FormDetail, Question, QuestionKind, QuestionUpdatePayload } from "@/lib/types";
import { QUESTION_KINDS, kindMeta } from "@/lib/questions";
import { useToast } from "@/components/toast";

// Sortable Question Row Component
function SortableQuestionRow({
  question,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const meta = kindMeta(question.kind);
  const Icon = meta?.Icon || Settings2;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
        isSelected
          ? "bg-white border-[#191919] shadow-sm text-[#191919]"
          : "bg-white/60 border-transparent hover:bg-white hover:border-[#e6e6e4] text-[#555]"
      } ${isDragging ? "opacity-50 shadow-md" : ""}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing text-[#999] hover:text-[#191919] p-0.5 -ml-1"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        <span className="font-semibold text-[#888] w-4 text-center">{index + 1}</span>

        <div className="w-6 h-6 rounded-md bg-[#f6f5f1] flex items-center justify-center text-[#191919] shrink-0">
          <Icon size={13} />
        </div>

        <span className="truncate flex-1 font-medium">
          {question.prompt || <span className="text-[#999] italic">{meta?.defaultPrompt || "Question"}</span>}
        </span>

        {question.required && (
          <span className="text-[#dc2626] font-bold text-sm shrink-0" title="Required">
            *
          </span>
        )}
      </div>

      {/* Action buttons on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
        <button
          onClick={onDuplicate}
          className="p-1 rounded text-[#777] hover:text-[#191919] hover:bg-[#f0f0ee]"
          title="Duplicate question"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-[#777] hover:text-[#dc2626] hover:bg-[#fee2e2]"
          title="Delete question"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// Preset color options for Form Theme
const ACCENT_COLORS = [
  { label: "Classic Blue", hex: "#0445AF" },
  { label: "Obsidian", hex: "#191919" },
  { label: "Emerald", hex: "#10B981" },
  { label: "Coral", hex: "#E05D5D" },
  { label: "Purple", hex: "#7C3AED" },
  { label: "Amber", hex: "#F59E0B" },
];

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const pushToast = useToast();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selected slide: "welcome" | "thankyou" | question.id
  const [selectedId, setSelectedId] = useState<string>("welcome");

  // Right sidebar tab: "settings" | "design"
  const [activeTab, setActiveTab] = useState<"settings" | "design">("settings");

  // Add Question popover state
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // In-builder Live Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string | number | boolean>>({});

  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load Form Data
  const loadForm = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getForm(formId);
      setForm(data);
      // Select first question if available, otherwise welcome
      if (data.questions.length > 0) {
        setSelectedId(data.questions[0].id);
      } else {
        setSelectedId("welcome");
      }
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to load form");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [formId, pushToast, router]);

  useEffect(() => {
    if (formId) loadForm();
  }, [formId, loadForm]);

  // Update Form Properties (title, accent_color, welcome/thank_you texts)
  const handleUpdateForm = async (updates: Partial<FormDetail>) => {
    if (!form) return;
    try {
      setSaving(true);
      const updated = await api.updateForm(form.id, updates);
      setForm(updated);
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Add Question
  const handleAddQuestion = async (kind: QuestionKind) => {
    if (!form) return;
    try {
      setIsAddMenuOpen(false);
      const created = await api.addQuestion(form.id, kind);
      setForm((prev) => (prev ? { ...prev, questions: [...prev.questions, created] } : prev));
      setSelectedId(created.id);
      setActiveTab("settings");
      pushToast(`Added ${kindMeta(kind).label}`);
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to add question");
    }
  };

  // Update Active Question
  const handleUpdateQuestion = async (
    questionId: string,
    updates: QuestionUpdatePayload
  ) => {
    if (!form) return;
    try {
      // Optimistic update
      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => {
            if (q.id !== questionId) return q;
            return {
              ...q,
              ...updates,
              choices: updates.choices
                ? updates.choices.map((c, i) => ({
                    id: q.choices[i]?.id || `temp-${i}`,
                    label: c.label,
                    position: i,
                  }))
                : q.choices,
            } as Question;
          }),
        };
      });

      const updated = await api.updateQuestion(form.id, questionId, updates);
      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => (q.id === questionId ? updated : q)),
        };
      });
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to update question");
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!form) return;
    try {
      await api.deleteQuestion(form.id, questionId);
      const remaining = form.questions.filter((q) => q.id !== questionId);
      setForm({ ...form, questions: remaining });
      pushToast("Question deleted");
      if (selectedId === questionId) {
        setSelectedId(remaining.length > 0 ? remaining[0].id : "welcome");
      }
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to delete question");
    }
  };

  // Duplicate Question
  const handleDuplicateQuestion = async (question: Question, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!form) return;
    try {
      const created = await api.addQuestion(form.id, question.kind);
      // Copy question settings & choices
      const updated = await api.updateQuestion(form.id, created.id, {
        prompt: `${question.prompt} (copy)`,
        help_text: question.help_text,
        required: question.required,
        placeholder: question.placeholder,
        rating_max: question.rating_max,
        number_min: question.number_min,
        number_max: question.number_max,
        choices: question.choices.map((c) => ({ label: c.label })),
      });
      setForm({ ...form, questions: [...form.questions, updated] });
      setSelectedId(updated.id);
      pushToast("Question duplicated");
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  // Drag End Reorder Questions
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!form || !over || active.id === over.id) return;

    const oldIndex = form.questions.findIndex((q) => q.id === active.id);
    const newIndex = form.questions.findIndex((q) => q.id === over.id);

    const reordered = arrayMove(form.questions, oldIndex, newIndex);
    setForm({ ...form, questions: reordered });

    try {
      await api.reorderQuestions(
        form.id,
        reordered.map((q) => q.id)
      );
    } catch {
      pushToast("Failed to save reorder");
      loadForm();
    }
  };

  // Publish / Unpublish Toggle
  const handleTogglePublish = async () => {
    if (!form) return;
    try {
      if (form.status === "published") {
        const updated = await api.unpublishForm(form.id);
        setForm(updated);
        pushToast("Form unpublished (now in Draft)");
      } else {
        if (form.questions.length === 0) {
          pushToast("Add at least one question before publishing");
          return;
        }
        const updated = await api.publishForm(form.id);
        setForm(updated);
        pushToast("Form published! Ready to collect responses.");
        setIsShareModalOpen(true);
      }
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Publish failed");
    }
  };

  // Active Question Object
  const currentQuestion = form?.questions.find((q) => q.id === selectedId);

  if (loading || !form) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3 text-[#737373]">
          <div className="w-8 h-8 border-2 border-[#191919] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading builder...</span>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/to/${form.public_slug}` : "";

  return (
    <div className="h-screen flex flex-col bg-[#faf9f6] text-[#191919] overflow-hidden font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-[#e6e6e4] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back + Form Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#191919] hover:bg-[#f6f5f1] transition-colors"
            title="Back to workspace"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={() => handleUpdateForm({ title: form.title.trim() || "Untitled typeform" })}
              className="text-sm font-bold text-[#191919] bg-transparent border border-transparent hover:border-[#e6e6e4] focus:border-[#191919] rounded px-2 py-1 max-w-[240px] truncate focus:outline-none transition-colors"
              title="Click to rename"
            />

            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                form.status === "published"
                  ? "bg-[#e6f4ea] text-[#137333]"
                  : "bg-[#f1f3f4] text-[#5f6368]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  form.status === "published" ? "bg-[#137333]" : "bg-[#5f6368]"
                }`}
              />
              {form.status === "published" ? "Published" : "Draft"}
            </span>

            {saving && <span className="text-[11px] text-[#999] italic">Saving...</span>}
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-[#f0f0ee] p-1 rounded-xl text-xs font-semibold">
          <button className="px-3.5 py-1.5 rounded-lg bg-white text-[#191919] shadow-xs">
            Create
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-[#737373] hover:text-[#191919] transition-colors"
          >
            Share
          </button>
          <Link
            href={`/forms/${form.id}/results`}
            className="px-3.5 py-1.5 rounded-lg text-[#737373] hover:text-[#191919] transition-colors flex items-center gap-1.5"
          >
            <BarChart2 size={13} />
            <span>Results</span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Design Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "design" ? "settings" : "design")}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "design"
                ? "bg-[#191919] text-white border-[#191919]"
                : "bg-white text-[#555] border-[#e6e6e4] hover:border-[#191919]"
            }`}
            title="Design & Themes"
          >
            <Palette size={15} />
            <span className="hidden sm:inline">Design</span>
          </button>

          {/* Live Preview Button */}
          <button
            onClick={() => {
              setPreviewStep(0);
              setPreviewAnswers({});
              setIsPreviewOpen(true);
            }}
            className="p-2 rounded-lg bg-white border border-[#e6e6e4] hover:border-[#191919] text-xs font-medium text-[#555] hover:text-[#191919] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Interactive Live Preview"
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-lg bg-white border border-[#e6e6e4] hover:border-[#191919] text-xs font-medium text-[#555] hover:text-[#191919] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Publish Button */}
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              form.status === "published"
                ? "bg-[#e6f4ea] text-[#137333] hover:bg-[#d2edd7] border border-[#a8dab5]"
                : "bg-[#191919] text-white hover:bg-[#333]"
            }`}
          >
            {form.status === "published" ? (
              <>
                <CheckCircle2 size={14} />
                <span>Published</span>
              </>
            ) : (
              <>
                <span>Publish</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Builder 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Outline & Question List */}
        <aside className="w-72 bg-[#fbfbfa] border-r border-[#e6e6e4] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#e6e6e4] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Outline ({form.questions.length})
            </span>

            {/* Add Question Popover Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="flex items-center gap-1 bg-[#191919] text-white px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>

              {/* Question Type Popover */}
              {isAddMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-white border border-[#e6e6e4] rounded-2xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase text-[#999]">
                    Choose question type
                  </div>
                  <div className="grid grid-cols-1 gap-0.5 mt-1 max-h-72 overflow-y-auto">
                    {QUESTION_KINDS.map((item) => {
                      const Icon = item.Icon;
                      return (
                        <button
                          key={item.kind}
                          onClick={() => handleAddQuestion(item.kind)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium hover:bg-[#f6f5f1] text-[#191919] transition-colors cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded bg-[#f0f0ee] flex items-center justify-center text-[#191919]">
                            <Icon size={13} />
                          </div>
                          <div className="flex-1">
                            <div>{item.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List of Screens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {/* Welcome Screen Item */}
            <div
              onClick={() => setSelectedId("welcome")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                selectedId === "welcome"
                  ? "bg-white border-[#191919] shadow-sm text-[#191919]"
                  : "bg-white/60 border-transparent hover:bg-white hover:border-[#e6e6e4] text-[#555]"
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-[#f6f5f1] flex items-center justify-center text-[#191919] shrink-0">
                <Sparkles size={13} />
              </div>
              <span className="truncate font-semibold">Welcome Screen</span>
            </div>

            {/* Draggable Questions */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={form.questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {form.questions.map((question, idx) => (
                    <SortableQuestionRow
                      key={question.id}
                      question={question}
                      index={idx}
                      isSelected={selectedId === question.id}
                      onSelect={() => setSelectedId(question.id)}
                      onDelete={(e) => handleDeleteQuestion(question.id, e)}
                      onDuplicate={(e) => handleDuplicateQuestion(question, e)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Thank You Screen Item */}
            <div
              onClick={() => setSelectedId("thankyou")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                selectedId === "thankyou"
                  ? "bg-white border-[#191919] shadow-sm text-[#191919]"
                  : "bg-white/60 border-transparent hover:bg-white hover:border-[#e6e6e4] text-[#555]"
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-[#f6f5f1] flex items-center justify-center text-[#191919] shrink-0">
                <CheckCircle2 size={13} />
              </div>
              <span className="truncate font-semibold">Thank You Screen</span>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: Live Interactive Canvas (WYSIWYG) */}
        <main className="flex-1 bg-[#f4f3ef] flex flex-col items-center justify-center p-8 overflow-y-auto relative">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-[#e6e6e4] p-10 min-h-[440px] flex flex-col justify-between transition-all">
            {/* Case 1: Welcome Screen */}
            {selectedId === "welcome" && (
              <div className="space-y-6 my-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-[#999]">
                  Welcome Screen
                </span>

                <div>
                  <input
                    type="text"
                    value={form.welcome_title}
                    onChange={(e) => setForm({ ...form, welcome_title: e.target.value })}
                    onBlur={() => handleUpdateForm({ welcome_title: form.welcome_title })}
                    placeholder="Add a welcoming title..."
                    className="w-full text-3xl font-bold text-[#191919] border-b-2 border-transparent hover:border-[#e6e6e4] focus:border-[#191919] pb-2 focus:outline-none transition-colors"
                  />
                  <textarea
                    value={form.welcome_message}
                    onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                    onBlur={() => handleUpdateForm({ welcome_message: form.welcome_message })}
                    rows={2}
                    placeholder="Add description or instructions..."
                    className="w-full mt-2 text-sm text-[#737373] resize-none border-b border-transparent hover:border-[#e6e6e4] focus:border-[#191919] pb-1 focus:outline-none transition-colors"
                  />
                </div>

                <div className="pt-4">
                  <div
                    style={{ backgroundColor: form.accent_color || "#0445af" }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-sm"
                  >
                    <span>Start</span>
                    <span className="text-[11px] opacity-75 font-normal">press Enter ↵</span>
                  </div>
                </div>
              </div>
            )}

            {/* Case 2: Thank You Screen */}
            {selectedId === "thankyou" && (
              <div className="space-y-6 my-auto text-center">
                <div
                  style={{ color: form.accent_color || "#0445af" }}
                  className="w-16 h-16 rounded-full bg-[#f6f5f1] flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <input
                    type="text"
                    value={form.thank_you_title}
                    onChange={(e) => setForm({ ...form, thank_you_title: e.target.value })}
                    onBlur={() => handleUpdateForm({ thank_you_title: form.thank_you_title })}
                    placeholder="Thank you title..."
                    className="w-full text-center text-3xl font-bold text-[#191919] border-b-2 border-transparent hover:border-[#e6e6e4] focus:border-[#191919] pb-2 focus:outline-none transition-colors"
                  />
                  <textarea
                    value={form.thank_you_message}
                    onChange={(e) => setForm({ ...form, thank_you_message: e.target.value })}
                    onBlur={() => handleUpdateForm({ thank_you_message: form.thank_you_message })}
                    rows={2}
                    placeholder="Thank you description..."
                    className="w-full text-center mt-2 text-sm text-[#737373] resize-none border-b border-transparent hover:border-[#e6e6e4] focus:border-[#191919] pb-1 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Case 3: Active Question Slide */}
            {currentQuestion && (
              <div className="space-y-6 my-auto">
                {/* Question Number & Required indicator */}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span style={{ color: form.accent_color || "#0445af" }}>
                    {form.questions.findIndex((q) => q.id === currentQuestion.id) + 1} →
                  </span>
                  {currentQuestion.required && (
                    <span className="text-xs text-[#dc2626] font-medium bg-[#fee2e2] px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </div>

                {/* Prompt & Description Editable in Place */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={currentQuestion.prompt}
                    onChange={(e) =>
                      handleUpdateQuestion(currentQuestion.id, { prompt: e.target.value })
                    }
                    placeholder="Type your question here..."
                    className="w-full text-2xl font-bold text-[#191919] border-b border-transparent hover:border-[#e6e6e4] focus:border-[#191919] pb-1 focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    value={currentQuestion.help_text}
                    onChange={(e) =>
                      handleUpdateQuestion(currentQuestion.id, { help_text: e.target.value })
                    }
                    placeholder="Add optional description or hint..."
                    className="w-full text-xs text-[#737373] border-b border-transparent hover:border-[#e6e6e4] focus:border-[#191919] pb-1 focus:outline-none transition-colors"
                  />
                </div>

                {/* Interactive Input Previews based on question kind */}
                <div className="py-3">
                  {/* Short text & Email & Number */}
                  {(currentQuestion.kind === "short_text" ||
                    currentQuestion.kind === "email" ||
                    currentQuestion.kind === "number") && (
                    <div className="border-b-2 border-[#cfcfcf] py-2">
                      <span className="text-xl text-[#999]">
                        {currentQuestion.placeholder ||
                          (currentQuestion.kind === "email"
                            ? "name@example.com"
                            : currentQuestion.kind === "number"
                            ? "Type a number..."
                            : "Type your answer here...")}
                      </span>
                    </div>
                  )}

                  {/* Long text */}
                  {currentQuestion.kind === "long_text" && (
                    <div className="border-b-2 border-[#cfcfcf] py-2">
                      <span className="text-base text-[#999] italic">
                        {currentQuestion.placeholder || "Type your multiline answer here..."}
                      </span>
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {currentQuestion.kind === "multiple_choice" && (
                    <div className="space-y-2.5">
                      {currentQuestion.choices.map((choice, idx) => (
                        <div
                          key={choice.id || idx}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#e6e6e4] bg-[#fbfbfa] hover:border-[#191919] transition-all"
                        >
                          <span className="w-6 h-6 rounded-md bg-white border border-[#dcdcd8] flex items-center justify-center text-xs font-bold text-[#191919]">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <input
                            type="text"
                            value={choice.label}
                            onChange={(e) => {
                              const newChoices = currentQuestion.choices.map((c, i) =>
                                i === idx ? { ...c, label: e.target.value } : c
                              );
                              handleUpdateQuestion(currentQuestion.id, {
                                choices: newChoices.map((c) => ({ label: c.label })),
                              });
                            }}
                            className="flex-1 text-sm bg-transparent focus:outline-none font-medium text-[#191919]"
                          />
                          {currentQuestion.choices.length > 1 && (
                            <button
                              onClick={() => {
                                const newChoices = currentQuestion.choices.filter((_, i) => i !== idx);
                                handleUpdateQuestion(currentQuestion.id, {
                                  choices: newChoices.map((c) => ({ label: c.label })),
                                });
                              }}
                              className="text-[#999] hover:text-[#dc2626] p-1"
                              title="Delete choice"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const nextLetter = String.fromCharCode(65 + currentQuestion.choices.length);
                          const newChoices = [
                            ...currentQuestion.choices,
                            { id: `temp-${Date.now()}`, label: `Choice ${nextLetter}`, position: currentQuestion.choices.length },
                          ];
                          handleUpdateQuestion(currentQuestion.id, {
                            choices: newChoices.map((c) => ({ label: c.label })),
                          });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0445af] hover:underline cursor-pointer pt-1"
                      >
                        <Plus size={14} />
                        <span>Add choice</span>
                      </button>
                    </div>
                  )}

                  {/* Dropdown */}
                  {currentQuestion.kind === "dropdown" && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl border border-[#cfcfcf] bg-white text-sm text-[#737373] flex items-center justify-between">
                        <span>Select an option...</span>
                        <ChevronDown size={16} />
                      </div>
                      <div className="text-xs text-[#737373] flex items-center gap-2">
                        <span>{currentQuestion.choices.length} options defined</span>
                        <span>•</span>
                        <button
                          onClick={() => {
                            const newChoices = [
                              ...currentQuestion.choices,
                              { id: `temp-${Date.now()}`, label: `Option ${currentQuestion.choices.length + 1}`, position: currentQuestion.choices.length },
                            ];
                            handleUpdateQuestion(currentQuestion.id, {
                              choices: newChoices.map((c) => ({ label: c.label })),
                            });
                          }}
                          className="text-[#0445af] hover:underline cursor-pointer"
                        >
                          + Add option
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Yes / No */}
                  {currentQuestion.kind === "yes_no" && (
                    <div className="flex gap-4">
                      {["Yes", "No"].map((choice, i) => (
                        <div
                          key={choice}
                          className="flex-1 p-4 rounded-xl border border-[#e6e6e4] bg-[#fbfbfa] flex items-center justify-center gap-3 font-semibold text-sm hover:border-[#191919] transition-all cursor-pointer"
                        >
                          <span className="w-6 h-6 rounded-md bg-white border border-[#dcdcd8] flex items-center justify-center text-xs font-bold text-[#191919]">
                            {i === 0 ? "Y" : "N"}
                          </span>
                          <span>{choice}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  {currentQuestion.kind === "rating" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {Array.from({ length: currentQuestion.rating_max || 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-xl border border-[#dcdcd8] bg-[#fbfbfa] hover:border-[#191919] hover:bg-white flex items-center justify-center font-bold text-sm text-[#191919] cursor-pointer transition-all"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Signature OK Button */}
                <div className="pt-2">
                  <div
                    style={{ backgroundColor: form.accent_color || "#0445af" }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-xs shadow-xs"
                  >
                    <span>OK</span>
                    <Check size={14} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Settings & Design Inspector */}
        <aside className="w-80 bg-white border-l border-[#e6e6e4] flex flex-col shrink-0 overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-[#e6e6e4] text-xs font-semibold">
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === "settings"
                  ? "border-[#191919] text-[#191919]"
                  : "border-transparent text-[#737373] hover:text-[#191919]"
              }`}
            >
              Question Settings
            </button>
            <button
              onClick={() => setActiveTab("design")}
              className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === "design"
                  ? "border-[#191919] text-[#191919]"
                  : "border-transparent text-[#737373] hover:text-[#191919]"
              }`}
            >
              Design & Theme
            </button>
          </div>

          {/* TAB 1: Question Settings */}
          {activeTab === "settings" && currentQuestion && (
            <div className="p-5 space-y-6">
              {/* Question Type Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] mb-1.5">
                  Question Type
                </label>
                <select
                  value={currentQuestion.kind}
                  onChange={(e) => {
                    const nextKind = e.target.value as QuestionKind;
                    handleUpdateQuestion(currentQuestion.id, { kind: nextKind });
                  }}
                  className="w-full px-3 py-2 bg-[#f6f5f1] border border-[#e6e6e4] rounded-lg text-xs font-medium text-[#191919] focus:outline-none focus:border-[#191919]"
                >
                  {QUESTION_KINDS.map((k) => (
                    <option key={k.kind} value={k.kind}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Required Switch */}
              <div className="flex items-center justify-between py-2 border-y border-[#f0f0ee]">
                <div>
                  <div className="text-xs font-semibold text-[#191919]">Required</div>
                  <div className="text-[11px] text-[#737373]">Respondent must answer</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateQuestion(currentQuestion.id, { required: !currentQuestion.required })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    currentQuestion.required ? "bg-[#191919]" : "bg-[#dcdcd8]"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      currentQuestion.required ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Placeholder Setting */}
              {(currentQuestion.kind === "short_text" ||
                currentQuestion.kind === "long_text" ||
                currentQuestion.kind === "number") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] mb-1.5">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={currentQuestion.placeholder}
                    onChange={(e) =>
                      handleUpdateQuestion(currentQuestion.id, { placeholder: e.target.value })
                    }
                    placeholder="Enter placeholder..."
                    className="w-full px-3 py-2 bg-white border border-[#e6e6e4] rounded-lg text-xs text-[#191919] focus:outline-none focus:border-[#191919]"
                  />
                </div>
              )}

              {/* Number Bounds */}
              {currentQuestion.kind === "number" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] mb-1">
                      Min Value
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.number_min ?? ""}
                      onChange={(e) =>
                        handleUpdateQuestion(currentQuestion.id, {
                          number_min: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="e.g. 0"
                      className="w-full px-3 py-2 bg-white border border-[#e6e6e4] rounded-lg text-xs text-[#191919] focus:outline-none focus:border-[#191919]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] mb-1">
                      Max Value
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.number_max ?? ""}
                      onChange={(e) =>
                        handleUpdateQuestion(currentQuestion.id, {
                          number_max: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2 bg-white border border-[#e6e6e4] rounded-lg text-xs text-[#191919] focus:outline-none focus:border-[#191919]"
                    />
                  </div>
                </div>
              )}

              {/* Rating Scale Max */}
              {currentQuestion.kind === "rating" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] mb-1.5">
                    Rating Scale Max
                  </label>
                  <select
                    value={currentQuestion.rating_max || 5}
                    onChange={(e) =>
                      handleUpdateQuestion(currentQuestion.id, { rating_max: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-[#f6f5f1] border border-[#e6e6e4] rounded-lg text-xs font-medium text-[#191919]"
                  >
                    <option value={3}>3 Stars</option>
                    <option value={5}>5 Stars (Standard)</option>
                    <option value={7}>7 Stars</option>
                    <option value={10}>10 Stars</option>
                  </select>
                </div>
              )}

              {/* Multiple Choice / Dropdown Choices List */}
              {(currentQuestion.kind === "multiple_choice" ||
                currentQuestion.kind === "dropdown") && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                      Choices ({currentQuestion.choices.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newChoices = [
                          ...currentQuestion.choices,
                          { id: `temp-${Date.now()}`, label: `Choice ${currentQuestion.choices.length + 1}`, position: currentQuestion.choices.length },
                        ];
                        handleUpdateQuestion(currentQuestion.id, {
                          choices: newChoices.map((c) => ({ label: c.label })),
                        });
                      }}
                      className="text-xs text-[#0445af] font-semibold hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {currentQuestion.choices.map((choice, i) => (
                      <div key={choice.id || i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={choice.label}
                          onChange={(e) => {
                            const newChoices = currentQuestion.choices.map((c, idx) =>
                              idx === i ? { ...c, label: e.target.value } : c
                            );
                            handleUpdateQuestion(currentQuestion.id, {
                              choices: newChoices.map((c) => ({ label: c.label })),
                            });
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-[#e6e6e4] rounded-md text-xs text-[#191919] focus:outline-none focus:border-[#191919]"
                        />
                        {currentQuestion.choices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newChoices = currentQuestion.choices.filter((_, idx) => idx !== i);
                              handleUpdateQuestion(currentQuestion.id, {
                                choices: newChoices.map((c) => ({ label: c.label })),
                              });
                            }}
                            className="p-1 text-[#999] hover:text-[#dc2626]"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logic Jumps Placeholder */}
              <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e6e6e4] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#191919]">
                  <Split size={14} className="text-[#0445af]" />
                  <span>Logic Jumps & Branching</span>
                </div>
                <p className="text-[11px] text-[#737373] leading-relaxed">
                  Route respondents to specific questions based on their answers. Coming soon to Typeform clone!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Design & Theme */}
          {activeTab === "design" && (
            <div className="p-5 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] mb-3">
                  Accent Color
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleUpdateForm({ accent_color: c.hex })}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        form.accent_color === c.hex
                          ? "border-[#191919] bg-[#f6f5f1] shadow-xs"
                          : "border-[#e6e6e4] hover:border-[#191919]"
                      }`}
                    >
                      <div
                        style={{ backgroundColor: c.hex }}
                        className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center text-white"
                      >
                        {form.accent_color === c.hex && <Check size={14} />}
                      </div>
                      <span className="text-[10px] font-medium text-[#555]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] mb-1.5">
                  Custom Hex Color
                </label>
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: form.accent_color || "#0445af" }}
                    className="w-8 h-8 rounded-lg border border-[#e6e6e4] shrink-0"
                  />
                  <input
                    type="text"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    onBlur={() => handleUpdateForm({ accent_color: form.accent_color })}
                    placeholder="#0445AF"
                    className="w-full px-3 py-1.5 bg-white border border-[#e6e6e4] rounded-lg text-xs font-mono text-[#191919] focus:outline-none focus:border-[#191919]"
                  />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e6e6e4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[#0445af]" />
                <h2 className="text-lg font-bold text-[#191919]">Share your typeform</h2>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-[#737373] hover:text-[#191919] p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  form.status === "published"
                    ? "bg-[#e6f4ea] border-[#a8dab5] text-[#137333]"
                    : "bg-[#fef7e0] border-[#f9df9b] text-[#b06000]"
                }`}
              >
                <div className="text-xs">
                  <span className="font-bold">
                    {form.status === "published" ? "Live on the web" : "Currently in Draft"}
                  </span>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {form.status === "published"
                      ? "Anyone with this shareable link can fill out your form."
                      : "Publish your form to allow respondents to view and fill it out."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePublish}
                  className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-[#191919] border border-current hover:bg-[#faf9f6] transition-colors cursor-pointer shrink-0 ml-3"
                >
                  {form.status === "published" ? "Unpublish" : "Publish now"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5">
                  Public share link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 bg-[#f6f5f1] border border-[#e6e6e4] rounded-lg text-xs text-[#191919] font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      pushToast("Link copied to clipboard!");
                    }}
                    className="px-4 py-2 bg-[#191919] text-white rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {form.status === "published" && (
                <div className="pt-2 flex items-center justify-between">
                  <a
                    href={`/to/${form.public_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#0445af] hover:underline flex items-center gap-1"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#f0f0ee]">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold bg-[#191919] text-white rounded-lg hover:bg-[#333] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen In-Builder Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="bg-[#faf9f6] rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl border border-[#e6e6e4] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            {/* Top Bar of Preview */}
            <div className="h-12 bg-white border-b border-[#e6e6e4] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Interactive Preview
                </span>
                <span className="text-xs text-[#999]">• Responses will not be saved</span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-[#737373] hover:text-[#191919] hover:bg-[#f0f0ee] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
              {/* Step 0: Welcome Screen */}
              {previewStep === 0 && (
                <div className="max-w-md w-full space-y-6 text-center animate-in fade-in duration-200">
                  <h1 className="text-3xl font-bold text-[#191919]">{form.welcome_title}</h1>
                  <p className="text-sm text-[#737373] leading-relaxed">{form.welcome_message}</p>
                  <button
                    onClick={() => setPreviewStep(1)}
                    style={{ backgroundColor: form.accent_color || "#0445af" }}
                    className="px-6 py-3 rounded-xl text-white font-semibold text-sm hover:brightness-110 transition-all cursor-pointer shadow-sm"
                  >
                    Start (press Enter ↵)
                  </button>
                </div>
              )}

              {/* Step 1 to N: Questions */}
              {previewStep > 0 && previewStep <= form.questions.length && (
                (() => {
                  const q = form.questions[previewStep - 1];
                  const qMeta = kindMeta(q.kind);
                  const currentVal = previewAnswers[q.id];

                  return (
                    <div className="max-w-lg w-full space-y-6 animate-in fade-in duration-200">
                      <div className="text-sm font-semibold" style={{ color: form.accent_color || "#0445af" }}>
                        {previewStep} →
                      </div>
                      <h2 className="text-2xl font-bold text-[#191919]">
                        {q.prompt || qMeta.defaultPrompt}
                        {q.required && <span className="text-[#dc2626] ml-1">*</span>}
                      </h2>
                      {q.help_text && <p className="text-xs text-[#737373]">{q.help_text}</p>}

                      {/* Input mock */}
                      <div className="py-2">
                        {q.kind === "short_text" || q.kind === "email" || q.kind === "number" ? (
                          <input
                            type={q.kind === "email" ? "email" : q.kind === "number" ? "number" : "text"}
                            value={typeof currentVal === "string" || typeof currentVal === "number" ? currentVal : ""}
                            onChange={(e) =>
                              setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                            }
                            placeholder={q.placeholder || "Type your answer here..."}
                            className="w-full border-b-2 border-[#191919] py-2 text-xl focus:outline-none bg-transparent"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setPreviewStep(previewStep + 1);
                            }}
                          />
                        ) : q.kind === "long_text" ? (
                          <textarea
                            rows={3}
                            value={typeof currentVal === "string" ? currentVal : ""}
                            onChange={(e) =>
                              setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                            }
                            placeholder={q.placeholder || "Type your answer here..."}
                            className="w-full border-b-2 border-[#191919] py-2 text-lg focus:outline-none bg-transparent resize-none"
                            autoFocus
                          />
                        ) : q.kind === "multiple_choice" ? (
                          <div className="space-y-2">
                            {q.choices.map((c, i) => (
                              <button
                                key={c.id || i}
                                type="button"
                                onClick={() => {
                                  setPreviewAnswers({ ...previewAnswers, [q.id]: c.id });
                                  setTimeout(() => setPreviewStep(previewStep + 1), 200);
                                }}
                                className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                                  currentVal === c.id
                                    ? "border-[#191919] bg-white font-semibold shadow-xs"
                                    : "border-[#e6e6e4] bg-[#fbfbfa] hover:border-[#191919]"
                                }`}
                              >
                                <span className="w-6 h-6 rounded-md bg-white border border-[#dcdcd8] flex items-center justify-center text-xs font-bold">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="text-sm">{c.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : q.kind === "yes_no" ? (
                          <div className="flex gap-4">
                            {["Yes", "No"].map((choice, i) => (
                              <button
                                key={choice}
                                type="button"
                                onClick={() => {
                                  setPreviewAnswers({ ...previewAnswers, [q.id]: choice === "Yes" });
                                  setTimeout(() => setPreviewStep(previewStep + 1), 200);
                                }}
                                className={`flex-1 p-4 rounded-xl border flex items-center justify-center gap-3 font-semibold text-sm transition-all cursor-pointer ${
                                  currentVal === (choice === "Yes")
                                    ? "border-[#191919] bg-white shadow-xs"
                                    : "border-[#e6e6e4] bg-[#fbfbfa] hover:border-[#191919]"
                                }`}
                              >
                                <span className="w-6 h-6 rounded-md bg-white border border-[#dcdcd8] flex items-center justify-center text-xs font-bold">
                                  {i === 0 ? "Y" : "N"}
                                </span>
                                <span>{choice}</span>
                              </button>
                            ))}
                          </div>
                        ) : q.kind === "rating" ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {Array.from({ length: q.rating_max || 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setPreviewAnswers({ ...previewAnswers, [q.id]: i + 1 });
                                  setTimeout(() => setPreviewStep(previewStep + 1), 200);
                                }}
                                className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm cursor-pointer transition-all ${
                                  currentVal === i + 1
                                    ? "bg-[#191919] text-white border-[#191919]"
                                    : "border-[#dcdcd8] bg-[#fbfbfa] hover:border-[#191919]"
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <select
                            value={typeof currentVal === "string" ? currentVal : ""}
                            onChange={(e) => {
                              setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value });
                              setTimeout(() => setPreviewStep(previewStep + 1), 200);
                            }}
                            className="w-full p-3 bg-white border border-[#cfcfcf] rounded-xl text-sm"
                          >
                            <option value="">Select an option...</option>
                            {q.choices.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPreviewStep(previewStep + 1)}
                          style={{ backgroundColor: form.accent_color || "#0445af" }}
                          className="px-5 py-2.5 rounded-lg text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>OK</span>
                          <Check size={14} />
                        </button>
                        <span className="text-[11px] text-[#737373]">press Enter ↵</span>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Final Step: Thank You Screen */}
              {previewStep > form.questions.length && (
                <div className="max-w-md w-full space-y-6 text-center animate-in fade-in duration-200">
                  <div
                    style={{ color: form.accent_color || "#0445af" }}
                    className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm"
                  >
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-3xl font-bold text-[#191919]">{form.thank_you_title}</h2>
                  <p className="text-sm text-[#737373] leading-relaxed">{form.thank_you_message}</p>
                  <button
                    onClick={() => {
                      setPreviewStep(0);
                      setPreviewAnswers({});
                    }}
                    className="px-4 py-2 bg-white border border-[#e6e6e4] rounded-lg text-xs font-semibold text-[#191919] hover:bg-[#f6f5f1] transition-colors cursor-pointer"
                  >
                    Restart preview
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="h-12 bg-white border-t border-[#e6e6e4] px-4 flex items-center justify-between text-xs text-[#737373]">
              <div className="flex items-center gap-1">
                <button
                  disabled={previewStep <= 0}
                  onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}
                  className="p-1 rounded hover:bg-[#f0f0ee] disabled:opacity-30 cursor-pointer"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  disabled={previewStep > form.questions.length}
                  onClick={() => setPreviewStep(previewStep + 1)}
                  className="p-1 rounded hover:bg-[#f0f0ee] disabled:opacity-30 cursor-pointer"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <span>Step {previewStep} of {form.questions.length + 1}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
