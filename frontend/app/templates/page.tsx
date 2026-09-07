"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Star,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  X,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import type { QuestionKind } from "@/lib/types";

type TemplateDef = {
  id: string;
  title: string;
  category: "Feedback" | "Lead Gen" | "Research" | "HR" | "Events" | "Quizzes";
  badge: string;
  rating: number;
  timeMinutes: number;
  description: string;
  questions: {
    kind: QuestionKind;
    prompt: string;
    help_text?: string;
    required?: boolean;
    choices?: string[];
    rating_max?: number;
    number_min?: number;
    number_max?: number;
  }[];
};

const TEMPLATES: TemplateDef[] = [
  {
    id: "csat",
    title: "Customer Satisfaction (CSAT) Survey",
    category: "Feedback",
    badge: "Most Popular",
    rating: 4.9,
    timeMinutes: 2,
    description: "Measure customer happiness with service, speed, and overall experience.",
    questions: [
      { kind: "rating", prompt: "How satisfied are you with our service overall?", rating_max: 5, required: true },
      { kind: "multiple_choice", prompt: "What impressed you most today?", choices: ["Speed of response", "Quality of work", "Friendly support", "Easy pricing"], required: true },
      { kind: "yes_no", prompt: "Did we resolve your inquiry completely?", required: true },
      { kind: "long_text", prompt: "Any extra suggestions or comments for our team?", required: false },
    ],
  },
  {
    id: "internship",
    title: "Summer Internship Application",
    category: "HR",
    badge: "HR Favorite",
    rating: 4.8,
    timeMinutes: 3,
    description: "Collect candidate portfolios, experience levels, and contact details seamlessly.",
    questions: [
      { kind: "short_text", prompt: "What is your full name?", required: true },
      { kind: "email", prompt: "What is your email address?", required: true },
      { kind: "dropdown", prompt: "Which team role are you applying for?", choices: ["Product Design", "Frontend Engineering", "Backend & AI", "User Research"], required: true },
      { kind: "number", prompt: "How many years of relevant project experience do you have?", number_min: 0, number_max: 15, required: true },
      { kind: "long_text", prompt: "Tell us about a project you recently shipped and learned from:", required: true },
    ],
  },
  {
    id: "pmf",
    title: "Product Market Fit (PMF) Pulse",
    category: "Research",
    badge: "High Conversion",
    rating: 4.9,
    timeMinutes: 2,
    description: "The classic Superhuman PMF test to gauge how disappointed users would be without your product.",
    questions: [
      { kind: "multiple_choice", prompt: "How would you feel if you could no longer use this product?", choices: ["Very disappointed", "Somewhat disappointed", "Not disappointed (it isn't that useful)"], required: true },
      { kind: "dropdown", prompt: "What is the primary benefit you receive from using it?", choices: ["Time saved", "Better organization", "Higher team output", "Peace of mind"], required: true },
      { kind: "short_text", prompt: "What type of person do you think would benefit most from it?", required: true },
      { kind: "long_text", prompt: "How can we improve the product for you?", required: false },
    ],
  },
  {
    id: "event-rsvp",
    title: "Tech Salon & Event RSVP",
    category: "Events",
    badge: "Event Ready",
    rating: 4.7,
    timeMinutes: 1,
    description: "Streamline guest attendance, plus-ones, and dietary preferences.",
    questions: [
      { kind: "short_text", prompt: "Your full name:", required: true },
      { kind: "email", prompt: "Best email to send your ticket confirmation:", required: true },
      { kind: "yes_no", prompt: "Will you be attending in person on Friday?", required: true },
      { kind: "multiple_choice", prompt: "Do you have any dietary restrictions?", choices: ["None / No restrictions", "Vegetarian", "Vegan", "Gluten-Free"], required: true },
      { kind: "number", prompt: "Number of additional guests (plus-ones):", number_min: 0, number_max: 3, required: false },
    ],
  },
  {
    id: "lead-gen",
    title: "B2B Lead Qualification Form",
    category: "Lead Gen",
    badge: "Sales Pro",
    rating: 4.9,
    timeMinutes: 2,
    description: "Capture qualified enterprise leads with custom budget and timeline queries.",
    questions: [
      { kind: "short_text", prompt: "What is your company or organization name?", required: true },
      { kind: "email", prompt: "What is your work email address?", required: true },
      { kind: "dropdown", prompt: "What is your approximate monthly budget?", choices: ["<$1,000 / month", "$1,000 - $5,000", "$5,000 - $20,000", "$20,000+"], required: true },
      { kind: "multiple_choice", prompt: "How soon are you looking to launch?", choices: ["Immediately (within 2 weeks)", "Within 1 month", "In 1-3 months", "Just researching"], required: true },
      { kind: "long_text", prompt: "Briefly describe your main project goals:", required: true },
    ],
  },
  {
    id: "team-feedback",
    title: "360-Degree Team Culture Survey",
    category: "Feedback",
    badge: "Culture",
    rating: 4.8,
    timeMinutes: 2,
    description: "Gather confidential feedback on team morale, psychological safety, and growth.",
    questions: [
      { kind: "rating", prompt: "How would you rate overall team collaboration this sprint?", rating_max: 5, required: true },
      { kind: "yes_no", prompt: "Do you feel empowered to voice divergent opinions openly?", required: true },
      { kind: "multiple_choice", prompt: "Which area needs the most improvement?", choices: ["Meeting overload", "Unclear priorities", "Technical debt", "Documentation"], required: true },
      { kind: "long_text", prompt: "One thing that would make your week 10x better:", required: false },
    ],
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const pushToast = useToast();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cloningId, setCloningId] = useState<string | null>(null);

  // Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDef | null>(null);

  const categories = ["All", "Feedback", "Lead Gen", "Research", "HR", "Events"];

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((tpl) => {
      const matchSearch =
        tpl.title.toLowerCase().includes(search.toLowerCase()) ||
        tpl.description.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "All" ? true : tpl.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory]);

  // Clone template into real form in SQLite DB
  const handleUseTemplate = async (template: TemplateDef) => {
    try {
      setCloningId(template.id);
      pushToast(`Creating form from "${template.title}"...`);

      // 1. Create the form
      const newForm = await api.createForm(template.title);

      // 2. Add and populate each question
      for (const q of template.questions) {
        const created = await api.addQuestion(newForm.id, q.kind);
        await api.updateQuestion(newForm.id, created.id, {
          prompt: q.prompt,
          help_text: q.help_text || "",
          required: q.required ?? true,
          rating_max: q.rating_max ?? 5,
          number_min: q.number_min ?? null,
          number_max: q.number_max ?? null,
          choices: q.choices ? q.choices.map((label) => ({ label })) : undefined,
        });
      }

      pushToast("Template cloned successfully!");
      router.push(`/forms/${newForm.id}`);
    } catch {
      pushToast("Failed to clone template");
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0a09] text-[#191919] dark:text-[#f5f5f4] flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Hero Section */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f0ee] dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] text-xs font-semibold text-[#191919] dark:text-[#f5f5f4] mb-3">
            <Sparkles size={14} className="text-amber-500" />
            <span>Curated Form Presets</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#191919] dark:text-white tracking-tight leading-tight">
            Templates designed to get 3.5x more responses
          </h1>
          <p className="text-sm text-[#737373] dark:text-[#a8a29e] mt-3 leading-relaxed">
            Pick a pre-configured conversational template, customize your questions, and publish in minutes.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#666]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates by keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] rounded-2xl text-xs sm:text-sm text-[#191919] dark:text-white placeholder:text-[#999] focus:outline-none focus:border-[#191919] dark:focus:border-white shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#191919] dark:bg-white text-white dark:text-[#191919] shadow-xs"
                  : "bg-white dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] text-[#737373] dark:text-[#a8a29e] hover:border-[#191919] dark:hover:border-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const isCloning = cloningId === template.id;

            return (
              <div
                key={template.id}
                className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] hover:border-[#191919] dark:hover:border-white transition-all p-6 flex flex-col justify-between shadow-xs hover:shadow-md group"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f0f0ee] dark:bg-[#292524] text-[#191919] dark:text-[#f5f5f4] text-[10px] font-bold uppercase tracking-wider">
                      {template.badge}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <Star size={13} className="fill-amber-500" />
                      <span>{template.rating}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-[#191919] dark:text-white group-hover:text-[#0445af] dark:group-hover:text-[#60a5fa] transition-colors line-clamp-1">
                    {template.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#737373] dark:text-[#a8a29e] mt-2 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Pill specs */}
                  <div className="flex items-center gap-3 mt-4 text-[11px] text-[#737373] dark:text-[#a8a29e] font-medium">
                    <span className="flex items-center gap-1">
                      <Layers size={13} />
                      <span>{template.questions.length} questions</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      <span>{template.timeMinutes} min</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-[#f0f0ee] dark:border-[#292524] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template)}
                    className="px-3 py-1.5 rounded-xl border border-[#e6e6e4] dark:border-[#292524] hover:bg-[#faf9f6] dark:hover:bg-[#24201e] text-xs font-semibold text-[#191919] dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    disabled={isCloning}
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 py-1.5 bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl text-xs font-bold hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>{isCloning ? "Cloning..." : "Use template"}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl max-w-xl w-full max-h-[85vh] shadow-2xl border border-[#e6e6e4] dark:border-[#292524] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#e6e6e4] dark:border-[#292524] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e]">
                  Template Preview
                </span>
                <h3 className="text-base font-bold text-[#191919] dark:text-white">
                  {previewTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-md text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-[#737373] dark:text-[#a8a29e] pb-2">
                This template includes {previewTemplate.questions.length} pre-formatted steps:
              </p>

              {previewTemplate.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#faf9f6] dark:bg-[#141211] border border-[#e6e6e4] dark:border-[#292524] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0445af] dark:text-[#60a5fa]">
                      Step {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-[#202020] border border-[#e6e6e4] dark:border-[#333] text-[#737373] dark:text-[#a8a29e]">
                      {q.kind}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#191919] dark:text-white">
                    {q.prompt}
                  </div>
                  {q.choices && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {q.choices.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white dark:bg-[#1c1917] border border-[#dcdcd8] dark:border-[#333] rounded-md text-[11px] text-[#555] dark:text-[#ccc]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#e6e6e4] dark:border-[#292524] flex items-center justify-end gap-3 bg-[#faf9f6] dark:bg-[#141211]">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const tpl = previewTemplate;
                  setPreviewTemplate(null);
                  handleUseTemplate(tpl);
                }}
                className="px-5 py-2 bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl text-xs font-bold hover:bg-[#333] transition-colors cursor-pointer"
              >
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
