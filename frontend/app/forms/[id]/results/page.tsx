"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  BarChart2,
  List,
  ExternalLink,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";

import { api, downloadCsv } from "@/lib/api";
import type {
  FormDetail,
  FormStats,
  SubmissionDetail,
  SubmissionListItem,
} from "@/lib/types";
import { kindMeta } from "@/lib/questions";
import { useToast } from "@/components/toast";

export default function FormResultsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const pushToast = useToast();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab: "summary" | "responses"
  const [activeTab, setActiveTab] = useState<"summary" | "responses">("summary");

  // Selected Submission Detail for Modal
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [formData, statsData, subsData] = await Promise.all([
        api.getForm(formId),
        api.getStats(formId),
        api.listSubmissions(formId),
      ]);
      setForm(formData);
      setStats(statsData);
      setSubmissions(subsData);
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : "Failed to load results");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [formId, pushToast, router]);

  useEffect(() => {
    if (formId) loadData();
  }, [formId, loadData]);

  // Load individual submission detail when selected
  useEffect(() => {
    if (!selectedSubmissionId) {
      setSubmissionDetail(null);
      return;
    }
    async function fetchDetail() {
      try {
        setLoadingDetail(true);
        const detail = await api.getSubmission(formId, selectedSubmissionId!);
        setSubmissionDetail(detail);
      } catch {
        pushToast("Failed to load submission details");
      } finally {
        setLoadingDetail(false);
      }
    }
    fetchDetail();
  }, [selectedSubmissionId, formId, pushToast]);

  // Handle CSV Export
  const handleExportCsv = () => {
    if (!form) return;
    try {
      downloadCsv(form.id, form.title);
      pushToast("CSV download initiated");
    } catch {
      pushToast("Failed to download CSV");
    }
  };

  // Submission Navigation inside Modal
  const currentSubIndex = useMemo(() => {
    if (!selectedSubmissionId) return -1;
    return submissions.findIndex((s) => s.id === selectedSubmissionId);
  }, [selectedSubmissionId, submissions]);

  const handleNextSub = () => {
    if (currentSubIndex >= 0 && currentSubIndex < submissions.length - 1) {
      setSelectedSubmissionId(submissions[currentSubIndex + 1].id);
    }
  };

  const handlePrevSub = () => {
    if (currentSubIndex > 0) {
      setSelectedSubmissionId(submissions[currentSubIndex - 1].id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading || !form) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3 text-[#737373]">
          <div className="w-8 h-8 border-2 border-[#191919] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#191919] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#e6e6e4] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/forms/${form.id}`}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#191919] hover:bg-[#f6f5f1] transition-colors"
            title="Back to builder"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="h-4 w-[1px] bg-[#e6e6e4]" />

          <div>
            <div className="text-xs font-semibold text-[#737373]">Results & Analytics</div>
            <h1 className="text-sm font-bold text-[#191919] line-clamp-1">{form.title}</h1>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-[#f0f0ee] p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "summary"
                ? "bg-white text-[#191919] shadow-xs"
                : "text-[#737373] hover:text-[#191919]"
            }`}
          >
            <BarChart2 size={13} />
            <span>Summary</span>
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "responses"
                ? "bg-white text-[#191919] shadow-xs"
                : "text-[#737373] hover:text-[#191919]"
            }`}
          >
            <List size={13} />
            <span>Responses ({submissions.length})</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-white border border-[#e6e6e4] hover:border-[#191919] text-xs font-semibold text-[#191919] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {form.status === "published" && (
            <a
              href={`/to/${form.public_slug}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-[#191919] text-white rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">View live form</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-[#e6e6e4] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-1">
              Total Responses
            </div>
            <div className="text-3xl font-extrabold text-[#191919]">
              {stats?.total_submissions ?? submissions.length}
            </div>
            <div className="text-[11px] text-[#999] mt-1">All completed submissions</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e6e6e4] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-1">
              Completion Rate
            </div>
            <div className="text-3xl font-extrabold text-[#137333]">100%</div>
            <div className="text-[11px] text-[#999] mt-1">All recorded forms completed</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e6e6e4] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-1">
              Questions
            </div>
            <div className="text-3xl font-extrabold text-[#191919]">
              {form.questions.length}
            </div>
            <div className="text-[11px] text-[#999] mt-1">Active steps in form</div>
          </div>
        </div>

        {/* TAB 1: SUMMARY / INSIGHTS */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#191919]">Question Breakdown</h2>
              <span className="text-xs text-[#737373]">
                Aggregated statistics across {stats?.total_submissions || 0} responses
              </span>
            </div>

            {stats?.questions.map((qStat, idx) => {
              const meta = kindMeta(qStat.kind);
              const Icon = meta?.Icon || BarChart2;
              const totalForQ = qStat.response_count;

              return (
                <div
                  key={qStat.question_id}
                  className="bg-white rounded-2xl border border-[#e6e6e4] p-6 shadow-xs space-y-4"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-[#f0f0ee] pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#f6f5f1] flex items-center justify-center text-[#191919] shrink-0 mt-0.5">
                        <Icon size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0445af]">Question {idx + 1}</div>
                        <h3 className="text-base font-bold text-[#191919] mt-0.5">
                          {qStat.prompt || meta?.defaultPrompt}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold bg-[#f0f0ee] text-[#555] px-2.5 py-1 rounded-full">
                        {qStat.response_count} {qStat.response_count === 1 ? "answer" : "answers"}
                      </span>
                    </div>
                  </div>

                  {/* Question Stats Body */}
                  <div>
                    {/* Multiple Choice & Dropdown Breakdown Bar Chart */}
                    {(qStat.kind === "multiple_choice" || qStat.kind === "dropdown") && (
                      <div className="space-y-3 pt-2">
                        {qStat.breakdown.map((item) => {
                          const pct =
                            totalForQ > 0 ? Math.round((item.count / totalForQ) * 100) : 0;

                          return (
                            <div key={item.label} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-[#191919]">{item.label}</span>
                                <span className="text-[#737373]">
                                  {item.count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2.5 bg-[#f0f0ee] rounded-full overflow-hidden">
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: form.accent_color || "#0445af",
                                  }}
                                  className="h-full rounded-full transition-all duration-300"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Yes / No Breakdown */}
                    {qStat.kind === "yes_no" && (
                      <div className="space-y-3 pt-2">
                        {qStat.breakdown.map((item) => {
                          const pct =
                            totalForQ > 0 ? Math.round((item.count / totalForQ) * 100) : 0;

                          return (
                            <div key={item.label} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-[#191919] font-semibold">{item.label}</span>
                                <span className="text-[#737373]">
                                  {item.count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2.5 bg-[#f0f0ee] rounded-full overflow-hidden">
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor:
                                      item.label === "Yes"
                                        ? "#10b981"
                                        : "#ef4444",
                                  }}
                                  className="h-full rounded-full transition-all duration-300"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Rating Breakdown */}
                    {qStat.kind === "rating" && (
                      <div className="pt-2">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-4xl font-extrabold text-[#191919]">
                            {qStat.average ? qStat.average : "—"}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#737373]">
                              Average Rating Score
                            </div>
                            <div className="text-xs text-[#999]">Based on {totalForQ} ratings</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {qStat.breakdown.map((item) => {
                            const pct =
                              totalForQ > 0 ? Math.round((item.count / totalForQ) * 100) : 0;

                            return (
                              <div key={item.label} className="flex items-center gap-3 text-xs">
                                <span className="w-12 text-right font-semibold text-[#555]">
                                  {item.label} ★
                                </span>
                                <div className="flex-1 h-2 bg-[#f0f0ee] rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className="h-full bg-[#f59e0b] rounded-full transition-all"
                                  />
                                </div>
                                <span className="w-14 text-right text-[#737373]">
                                  {item.count} ({pct}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Text & Email */}
                    {(qStat.kind === "short_text" ||
                      qStat.kind === "long_text" ||
                      qStat.kind === "email" ||
                      qStat.kind === "number") && (
                      <div className="text-xs text-[#737373] pt-1">
                        <span>
                          Responses recorded. Switch to the{" "}
                          <button
                            onClick={() => setActiveTab("responses")}
                            className="font-semibold text-[#0445af] hover:underline"
                          >
                            Responses tab
                          </button>{" "}
                          to inspect individual submissions.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: RESPONSES TABLE */}
        {activeTab === "responses" && (
          <div className="bg-white rounded-2xl border border-[#e6e6e4] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#e6e6e4] flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Submissions ({submissions.length})
              </div>
              <button
                onClick={handleExportCsv}
                className="text-xs text-[#0445af] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                <span>Download as CSV</span>
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-12 text-center text-[#737373]">
                <FileSpreadsheet size={32} className="mx-auto mb-3 text-[#999]" />
                <h3 className="font-semibold text-sm text-[#191919]">No responses yet</h3>
                <p className="text-xs mt-1">
                  Share your public form link with respondents to collect feedback!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf9f6] text-[#737373] uppercase font-bold border-b border-[#e6e6e4]">
                    <tr>
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Submitted At</th>
                      <th className="px-6 py-3">Preview</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0ee]">
                    {submissions.map((sub, idx) => (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedSubmissionId(sub.id)}
                        className="hover:bg-[#faf9f6] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-bold text-[#191919]">
                          #{submissions.length - idx}
                        </td>
                        <td className="px-6 py-4 text-[#555] flex items-center gap-1.5">
                          <Clock size={13} className="text-[#999]" />
                          <span>{formatDate(sub.submitted_at)}</span>
                        </td>
                        <td className="px-6 py-4 text-[#191919] font-medium max-w-md truncate">
                          {sub.preview}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmissionId(sub.id);
                            }}
                            className="text-xs font-semibold text-[#0445af] hover:underline cursor-pointer"
                          >
                            View details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Submission Detail Modal / Drawer */}
      {selectedSubmissionId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-[#e6e6e4] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e6e6e4] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-[#191919]">
                  Submission #{submissions.length - currentSubIndex}
                </h2>
                {submissionDetail && (
                  <span className="text-xs text-[#737373]">
                    {formatDate(submissionDetail.submitted_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Previous / Next buttons */}
                <button
                  onClick={handlePrevSub}
                  disabled={currentSubIndex <= 0}
                  className="p-1 rounded-lg border border-[#e6e6e4] text-[#555] hover:bg-[#f6f5f1] disabled:opacity-30 cursor-pointer"
                  title="Previous response"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextSub}
                  disabled={currentSubIndex >= submissions.length - 1}
                  className="p-1 rounded-lg border border-[#e6e6e4] text-[#555] hover:bg-[#f6f5f1] disabled:opacity-30 cursor-pointer"
                  title="Next response"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setSelectedSubmissionId(null)}
                  className="p-1 text-[#737373] hover:text-[#191919] rounded-lg ml-2 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetail || !submissionDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#737373]">
                  <div className="w-6 h-6 border-2 border-[#191919] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Loading answers...</span>
                </div>
              ) : (
                submissionDetail.answers.map((ans, i) => (
                  <div key={ans.question_id || i} className="space-y-1.5">
                    <div className="text-xs font-semibold text-[#737373] flex items-center gap-2">
                      <span className="font-bold text-[#0445af]">{i + 1}.</span>
                      <span>{ans.prompt || "Question"}</span>
                    </div>

                    <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-[#e6e6e4] text-sm font-medium text-[#191919]">
                      {ans.display_value ? (
                        <span>{ans.display_value}</span>
                      ) : (
                        <span className="text-[#999] italic">No answer provided</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#f0f0ee] bg-[#faf9f6] flex items-center justify-between text-xs text-[#737373]">
              <span>
                Response {currentSubIndex + 1} of {submissions.length}
              </span>
              <button
                onClick={() => setSelectedSubmissionId(null)}
                className="px-4 py-1.5 bg-[#191919] text-white rounded-lg font-semibold hover:bg-[#333] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
