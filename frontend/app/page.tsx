"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  BarChart2,
  FileText,
  Clock,
  Layers,
  AlertCircle,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { FormSummary } from "@/lib/types";
import { useToast } from "@/components/toast";
import { Wordmark } from "@/components/wordmark";

export default function DashboardPage() {
  const router = useRouter();
  const pushToast = useToast();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<FormSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Active Dropdown Menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listForms();
      setForms(data);
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" ? true : f.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [forms, search, filter]);

  // Create Form Handler
  const handleCreate = async (title?: string) => {
    try {
      setCreating(true);
      const form = await api.createForm(title || newTitle.trim() || "Untitled typeform");
      pushToast("Typeform created");
      setIsCreateOpen(false);
      setNewTitle("");
      router.push(`/forms/${form.id}`);
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  // Duplicate Form
  const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.duplicateForm(id);
      pushToast("Form duplicated");
      setMenuOpenId(null);
      loadForms();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  // Delete Form
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.deleteForm(deleteTarget.id);
      pushToast("Form deleted");
      setDeleteTarget(null);
      setMenuOpenId(null);
      loadForms();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Copy shareable public link
  const handleCopyLink = (slug: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/to/${slug}`;
    navigator.clipboard.writeText(url);
    pushToast("Share link copied to clipboard!");
    setMenuOpenId(null);
  };

  // Format relative date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#191919] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#e6e6e4] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:opacity-85 transition-opacity">
            <Wordmark className="text-xl" />
          </Link>
          <div className="h-4 w-[1px] bg-[#e6e6e4]" />
          <div className="flex items-center gap-2 text-sm font-medium text-[#737373]">
            <span className="text-[#191919] font-semibold">My workspace</span>
            <span className="text-xs bg-[#f0f0ee] text-[#737373] px-2 py-0.5 rounded-full">
              {forms.length} {forms.length === 1 ? "typeform" : "typeforms"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#191919] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Create typeform</span>
          </button>

          <div className="w-8 h-8 rounded-full bg-[#e8e7e3] text-[#191919] font-semibold flex items-center justify-center text-xs ml-2">
            AR
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Workspace Title & Search/Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#191919]">My workspace</h1>
            <p className="text-sm text-[#737373] mt-1">
              Create and manage your conversational forms, track responses and analyze results.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search typeforms..."
                className="w-56 pl-9 pr-3 py-1.5 bg-white border border-[#e6e6e4] rounded-lg text-sm text-[#191919] placeholder:text-[#999] focus:outline-none focus:border-[#191919] transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#191919]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex bg-[#e8e7e3] p-1 rounded-lg text-xs font-medium">
              {(["all", "published", "draft"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-3 py-1 rounded-md capitalize transition-all cursor-pointer ${
                    filter === mode
                      ? "bg-white text-[#191919] shadow-xs font-semibold"
                      : "text-[#737373] hover:text-[#191919]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-xl bg-white border border-[#e6e6e4] animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-[#f0f0ee] rounded w-2/3" />
                  <div className="h-3 bg-[#f0f0ee] rounded w-1/3" />
                </div>
                <div className="h-4 bg-[#f0f0ee] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e6e6e4] p-12 text-center max-w-md mx-auto my-12">
            <div className="w-14 h-14 bg-[#f6f5f1] rounded-full flex items-center justify-center mx-auto mb-4 text-[#737373]">
              <FileText size={26} />
            </div>
            <h3 className="text-lg font-semibold text-[#191919]">
              {search || filter !== "all" ? "No matching forms found" : "No typeforms yet"}
            </h3>
            <p className="text-sm text-[#737373] mt-2 mb-6">
              {search || filter !== "all"
                ? "Try adjusting your search terms or filters."
                : "Create your first conversational form to start gathering responses."}
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-[#191919] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Create typeform</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Card Preset */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="group h-56 rounded-2xl border-2 border-dashed border-[#dcdcd8] hover:border-[#191919] bg-white/60 hover:bg-white transition-all flex flex-col items-center justify-center text-center p-6 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f6f5f1] group-hover:bg-[#191919] group-hover:text-white transition-colors flex items-center justify-center text-[#191919] mb-3">
                <Plus size={22} />
              </div>
              <span className="font-semibold text-sm text-[#191919]">Create new typeform</span>
              <span className="text-xs text-[#737373] mt-1">Start blank or pick a preset</span>
            </button>

            {/* Existing Forms */}
            {filteredForms.map((form) => {
              const isPublished = form.status === "published";
              return (
                <div
                  key={form.id}
                  onClick={() => router.push(`/forms/${form.id}`)}
                  className="group relative h-56 bg-white rounded-2xl border border-[#e6e6e4] hover:border-[#191919] hover:shadow-md transition-all p-6 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top Row: Status badge & Menu button */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isPublished
                            ? "bg-[#e6f4ea] text-[#137333]"
                            : "bg-[#f1f3f4] text-[#5f6368]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPublished ? "bg-[#137333]" : "bg-[#5f6368]"
                          }`}
                        />
                        {isPublished ? "Published" : "Draft"}
                      </span>

                      {/* Dropdown Menu */}
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setMenuOpenId(menuOpenId === form.id ? null : form.id)
                          }
                          className="p-1 rounded-md text-[#737373] hover:text-[#191919] hover:bg-[#f6f5f1] transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuOpenId === form.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#e6e6e4] rounded-xl shadow-lg py-1 z-20 text-xs font-medium">
                            {isPublished && (
                              <button
                                onClick={(e) => handleCopyLink(form.public_slug, e)}
                                className="w-full text-left px-3 py-2 text-[#191919] hover:bg-[#f6f5f1] flex items-center gap-2"
                              >
                                <Copy size={14} />
                                Copy share link
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDuplicate(form.id, e)}
                              className="w-full text-left px-3 py-2 text-[#191919] hover:bg-[#f6f5f1] flex items-center gap-2"
                            >
                              <Layers size={14} />
                              Duplicate form
                            </button>
                            <Link
                              href={`/forms/${form.id}/results`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-left px-3 py-2 text-[#191919] hover:bg-[#f6f5f1] flex items-center gap-2"
                            >
                              <BarChart2 size={14} />
                              View results
                            </Link>
                            <div className="h-[1px] bg-[#f0f0ee] my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(form);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-[#d93025] hover:bg-[#fdf2f2] flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete form
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg text-[#191919] group-hover:text-[#0445af] transition-colors line-clamp-2">
                      {form.title}
                    </h3>
                  </div>

                  {/* Footer Meta & Stats */}
                  <div className="border-t border-[#f0f0ee] pt-4 flex items-center justify-between text-xs text-[#737373]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 font-medium text-[#191919]">
                        <BarChart2 size={14} className="text-[#737373]" />
                        {form.response_count} {form.response_count === 1 ? "response" : "responses"}
                      </span>
                      <span>{form.question_count} questions</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock size={13} />
                      <span>{formatDate(form.updated_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e6e6e4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#191919]">Create a new typeform</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#737373] hover:text-[#191919] p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-[#737373] mb-4">
              Give your typeform a title, or start immediately with one of our quick presets.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5">
                  Typeform Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Customer Feedback Survey"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dcdcd8] rounded-lg text-sm text-[#191919] focus:outline-none focus:border-[#191919] transition-colors"
                />
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] mb-2">
                  Or start with a preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Product Feedback", icon: "✨", desc: "Rating, NPS, and thoughts" },
                    { title: "Lead Generation", icon: "💼", desc: "Name, email, and goals" },
                    { title: "Event RSVP", icon: "🎉", desc: "Attendance & dietary info" },
                    { title: "Job Application", icon: "📝", desc: "Experience & portfolio" },
                  ].map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleCreate(preset.title)}
                      className="text-left p-3 rounded-xl border border-[#e6e6e4] hover:border-[#191919] hover:bg-[#faf9f6] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{preset.icon}</span>
                        <span className="text-xs font-semibold text-[#191919]">
                          {preset.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373]">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0f0ee]">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#737373] hover:text-[#191919] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => handleCreate()}
                className="px-5 py-2 text-sm font-semibold bg-[#191919] text-white rounded-lg hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create typeform"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e6e6e4] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mb-4">
              <AlertCircle size={20} />
            </div>

            <h2 className="text-base font-bold text-[#191919] mb-1">Delete this typeform?</h2>
            <p className="text-sm text-[#737373] mb-6">
              Are you sure you want to delete <strong className="text-[#191919] font-semibold">{deleteTarget.title}</strong>? All questions and submitted responses will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-[#737373] hover:text-[#191919] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
