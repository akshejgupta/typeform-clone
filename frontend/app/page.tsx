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
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import type { FormSummary } from "@/lib/types";
import { useToast } from "@/components/toast";
import { Navbar } from "@/components/navbar";

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

  // Stats calculation
  const totalSubmissions = useMemo(() => {
    return forms.reduce((acc, curr) => acc + (curr.response_count || 0), 0);
  }, [forms]);

  const publishedCount = useMemo(() => {
    return forms.filter((f) => f.status === "published").length;
  }, [forms]);

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
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0a09] text-[#191919] dark:text-[#f5f5f4] flex flex-col font-sans transition-colors">
      {/* Universal Navbar */}
      <Navbar onCreateClick={() => setIsCreateOpen(true)} formCount={forms.length} />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Dynamic Hero Banner */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-white to-[#f6f5f1] dark:from-[#1c1917] dark:to-[#141211] border border-[#e6e6e4] dark:border-[#292524] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8e7e3] dark:bg-[#282828] text-xs font-semibold text-[#191919] dark:text-[#eee]">
              <Sparkles size={13} className="text-amber-500" />
              <span>Studio Workspace • Pro Plan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191919] dark:text-white tracking-tight">
              Create forms that feel like real conversations
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a8a29e] leading-relaxed">
              Build with multiple question types, share with custom links, and review response insights in real-time.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-3 sm:gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 md:border-l border-[#e6e6e4] dark:border-[#292524] pt-4 md:pt-0 md:pl-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e]">
                Forms
              </div>
              <div className="text-2xl font-black text-[#191919] dark:text-white mt-0.5">
                {forms.length}
              </div>
              <div className="text-[11px] text-[#137333] dark:text-[#4ade80] font-semibold">
                {publishedCount} published
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e]">
                Responses
              </div>
              <div className="text-2xl font-black text-[#191919] dark:text-white mt-0.5">
                {totalSubmissions}
              </div>
              <div className="text-[11px] text-[#737373] dark:text-[#a8a29e]">
                100% completed
              </div>
            </div>

            <div className="hidden sm:block">
              <Link
                href="/templates"
                className="px-4 py-2 bg-white dark:bg-[#262626] border border-[#e6e6e4] dark:border-[#333] hover:border-[#191919] dark:hover:border-white rounded-xl text-xs font-semibold text-[#191919] dark:text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Templates</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex bg-[#e8e7e3] dark:bg-[#202020] p-1 rounded-xl text-xs font-medium self-start">
            {(["all", "published", "draft"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  filter === mode
                    ? "bg-white dark:bg-[#1c1917] text-[#191919] dark:text-white shadow-xs font-bold"
                    : "text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#666]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your forms..."
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-white dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] rounded-xl text-xs text-[#191919] dark:text-white placeholder:text-[#999] focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#191919] dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Forms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-3xl bg-white dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-[#f0f0ee] dark:bg-[#282828] rounded w-2/3" />
                  <div className="h-3 bg-[#f0f0ee] dark:bg-[#282828] rounded w-1/3" />
                </div>
                <div className="h-4 bg-[#f0f0ee] dark:bg-[#282828] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-14 h-14 bg-[#f6f5f1] dark:bg-[#24201e] rounded-full flex items-center justify-center mx-auto mb-4 text-[#737373] dark:text-[#a8a29e]">
              <FileText size={26} />
            </div>
            <h3 className="text-lg font-bold text-[#191919] dark:text-white">
              {search || filter !== "all" ? "No matching forms found" : "No typeforms yet"}
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#a8a29e] mt-2 mb-6">
              {search || filter !== "all"
                ? "Try adjusting your search query or filter tags."
                : "Create your first conversational form or explore our templates."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 bg-[#191919] dark:bg-white text-white dark:text-[#191919] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Create form</span>
              </button>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 bg-white dark:bg-[#24201e] border border-[#e6e6e4] dark:border-[#333] text-[#191919] dark:text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:border-[#191919] dark:hover:border-white transition-colors cursor-pointer"
              >
                <span>Browse templates</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Form Card Preset */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="group h-56 rounded-3xl border-2 border-dashed border-[#dcdcd8] dark:border-[#333] hover:border-[#191919] dark:hover:border-white bg-white/60 dark:bg-[#1c1917]/60 hover:bg-white dark:hover:bg-[#1c1917] transition-all flex flex-col items-center justify-center text-center p-6 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#f6f5f1] dark:bg-[#292524] group-hover:bg-[#191919] dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-[#191919] transition-colors flex items-center justify-center text-[#191919] dark:text-white mb-3 shadow-xs">
                <Plus size={22} />
              </div>
              <span className="font-bold text-sm text-[#191919] dark:text-white">
                Create new typeform
              </span>
              <span className="text-xs text-[#737373] dark:text-[#a8a29e] mt-1">
                Start from scratch or use presets
              </span>
            </button>

            {/* Existing Forms */}
            {filteredForms.map((form) => {
              const isPublished = form.status === "published";
              return (
                <div
                  key={form.id}
                  onClick={() => router.push(`/forms/${form.id}`)}
                  className="group relative h-56 bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] hover:border-[#191919] dark:hover:border-white hover:shadow-md transition-all p-6 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top Row: Status badge & Menu */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isPublished
                            ? "bg-[#e6f4ea] dark:bg-[#13381e] text-[#137333] dark:text-[#4ade80]"
                            : "bg-[#f1f3f4] dark:bg-[#292524] text-[#5f6368] dark:text-[#a8a29e]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPublished ? "bg-[#137333] dark:bg-[#4ade80]" : "bg-[#5f6368] dark:bg-[#a8a29e]"
                          }`}
                        />
                        {isPublished ? "Published" : "Draft"}
                      </span>

                      {/* Dropdown Menu */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === form.id ? null : form.id)}
                          className="p-1.5 rounded-lg text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] transition-colors cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuOpenId === form.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] rounded-2xl shadow-xl py-1 z-30 text-xs font-semibold">
                            {isPublished && (
                              <button
                                onClick={(e) => handleCopyLink(form.public_slug, e)}
                                className="w-full text-left px-3.5 py-2 text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                              >
                                <Copy size={14} />
                                Copy share link
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDuplicate(form.id, e)}
                              className="w-full text-left px-3.5 py-2 text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                            >
                              <Layers size={14} />
                              Duplicate form
                            </button>
                            <Link
                              href={`/forms/${form.id}/results`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-left px-3.5 py-2 text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] flex items-center gap-2"
                            >
                              <BarChart2 size={14} />
                              View results
                            </Link>
                            <div className="h-[1px] bg-[#f0f0ee] dark:bg-[#292524] my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(form);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-[#d93025] hover:bg-[#fdf2f2] dark:hover:bg-[#3d1a1a] flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              Delete form
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg text-[#191919] dark:text-white group-hover:text-[#0445af] dark:group-hover:text-[#60a5fa] transition-colors line-clamp-2">
                      {form.title}
                    </h3>
                  </div>

                  {/* Footer Meta & Stats */}
                  <div className="border-t border-[#f0f0ee] dark:border-[#292524] pt-4 flex items-center justify-between text-xs text-[#737373] dark:text-[#a8a29e]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 font-semibold text-[#191919] dark:text-white">
                        <BarChart2 size={14} className="text-[#737373] dark:text-[#a8a29e]" />
                        {form.response_count} {form.response_count === 1 ? "response" : "responses"}
                      </span>
                      <span>{form.question_count} questions</span>
                    </div>

                    <div className="flex items-center gap-1 font-medium">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e6e6e4] dark:border-[#292524] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#191919] dark:text-white">
                Create a new typeform
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#737373] dark:text-[#a8a29e] mb-4">
              Give your typeform a title, or start with one of our quick presets.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
                />
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-2">
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
                      className="text-left p-3 rounded-2xl border border-[#e6e6e4] dark:border-[#292524] hover:border-[#191919] dark:hover:border-white bg-[#faf9f6] dark:bg-[#141211] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{preset.icon}</span>
                        <span className="text-xs font-bold text-[#191919] dark:text-white">
                          {preset.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] dark:text-[#a8a29e]">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0f0ee] dark:border-[#292524]">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => handleCreate()}
                className="px-5 py-2 text-xs font-bold bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create typeform"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#e6e6e4] dark:border-[#292524] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-[#fee2e2] dark:bg-[#3d1a1a] text-[#dc2626] dark:text-[#f87171] flex items-center justify-center mb-4">
              <AlertCircle size={20} />
            </div>

            <h2 className="text-base font-bold text-[#191919] dark:text-white mb-1">
              Delete this typeform?
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#a8a29e] mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#191919] dark:text-white font-semibold">{deleteTarget.title}</strong>? All questions and submitted responses will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold bg-[#dc2626] text-white rounded-xl hover:bg-[#b91c1c] transition-colors cursor-pointer disabled:opacity-50"
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
