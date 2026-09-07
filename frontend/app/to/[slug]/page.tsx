"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { api } from "@/lib/api";
import type { AnswerPayload, FormDetail, Question } from "@/lib/types";
import { kindMeta } from "@/lib/questions";
import { validateAnswer, toSubmitPayload } from "@/lib/validation";
import { Wordmark } from "@/components/wordmark";

export default function PublicFillPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flow State: 0 = Welcome screen (if exists), 1..N = Questions, N+1 = Thank You screen
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    thank_you_title: string;
    thank_you_message: string;
  } | null>(null);

  // Answers Map: questionId -> AnswerPayload
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  // Validation error on current question
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch published form definition
  useEffect(() => {
    async function loadPublicForm() {
      try {
        setLoading(true);
        const data = await api.getPublic(slug);
        setForm(data);
        // If no welcome screen defined, start directly at first question
        if (!data.welcome_title && !data.welcome_message) {
          setStep(1);
        } else {
          setStep(0);
        }
      } catch (err: unknown) {
        setNotFound(true);
        setErrorMsg(err instanceof Error ? err.message : "This form is not available.");
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadPublicForm();
  }, [slug]);

  // Current Question (1-indexed)
  const currentQuestion = form?.questions && step >= 1 && step <= form.questions.length
    ? form.questions[step - 1]
    : null;

  // Auto-focus input on step change
  useEffect(() => {
    setValidationError(null);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      textareaRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [step]);

  // Advance to next step or submit
  const handleAdvance = useCallback(
    async (overrideAnswer?: AnswerPayload) => {
      if (!form) return;

      // If on Welcome screen
      if (step === 0) {
        setDirection(1);
        setStep(1);
        return;
      }

      // If on a Question
      if (currentQuestion) {
        const answerToCheck = overrideAnswer || answers[currentQuestion.id];
        const error = validateAnswer(currentQuestion, answerToCheck);
        if (error) {
          setValidationError(error);
          return;
        }
        setValidationError(null);

        // Check if last question
        if (step === form.questions.length) {
          // Submit to backend
          try {
            setSubmitting(true);
            const activeAnswers = overrideAnswer
              ? { ...answers, [currentQuestion.id]: overrideAnswer }
              : answers;
            const payload = toSubmitPayload(form.questions, activeAnswers);
            const result = await api.submitPublic(form.public_slug, payload);
            setSubmissionResult(result);
            setDirection(1);
            setSubmitted(true);
            setStep(form.questions.length + 1);
          } catch (err: unknown) {
            setValidationError(err instanceof Error ? err.message : "Failed to submit response.");
          } finally {
            setSubmitting(false);
          }
        } else {
          setDirection(1);
          setStep((prev) => prev + 1);
        }
      }
    },
    [form, step, currentQuestion, answers]
  );

  // Move back
  const handleBack = useCallback(() => {
    if (step > 1 || (step === 1 && (form?.welcome_title || form?.welcome_message))) {
      setDirection(-1);
      setValidationError(null);
      setStep((prev) => prev - 1);
    }
  }, [step, form]);

  // Handle Choice Selection
  const handleSelectChoice = useCallback(
    (question: Question, choiceId: string) => {
      const updatedAnswer: AnswerPayload = {
        question_id: question.id,
        choice_id: choiceId,
      };
      setAnswers((prev) => ({ ...prev, [question.id]: updatedAnswer }));
      setTimeout(() => {
        handleAdvance(updatedAnswer);
      }, 200);
    },
    [handleAdvance]
  );

  // Handle Yes/No Selection
  const handleSelectYesNo = useCallback(
    (question: Question, value: boolean) => {
      const updatedAnswer: AnswerPayload = {
        question_id: question.id,
        bool_value: value,
      };
      setAnswers((prev) => ({ ...prev, [question.id]: updatedAnswer }));
      setTimeout(() => {
        handleAdvance(updatedAnswer);
      }, 200);
    },
    [handleAdvance]
  );

  // Handle Rating Selection
  const handleSelectRating = useCallback(
    (question: Question, value: number) => {
      const updatedAnswer: AnswerPayload = {
        question_id: question.id,
        number_value: value,
      };
      setAnswers((prev) => ({ ...prev, [question.id]: updatedAnswer }));
      setTimeout(() => {
        handleAdvance(updatedAnswer);
      }, 200);
    },
    [handleAdvance]
  );

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in textarea and presses Enter without modifier (unless single line)
      if (e.target instanceof HTMLTextAreaElement && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAdvance();
        return;
      }

      // Enter key advances
      if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleAdvance();
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleAdvance();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleBack();
        return;
      }

      // Hotkeys for Multiple Choice & Dropdown (A, B, C, D...)
      if (
        currentQuestion &&
        (currentQuestion.kind === "multiple_choice" || currentQuestion.kind === "dropdown") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        const charCode = e.key.toUpperCase().charCodeAt(0);
        if (charCode >= 65 && charCode < 65 + currentQuestion.choices.length) {
          e.preventDefault();
          const selectedChoice = currentQuestion.choices[charCode - 65];
          if (selectedChoice) {
            handleSelectChoice(currentQuestion, selectedChoice.id);
          }
        }
      }

      // Hotkeys for Yes / No (Y / N)
      if (
        currentQuestion &&
        currentQuestion.kind === "yes_no" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          handleSelectYesNo(currentQuestion, true);
        } else if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          handleSelectYesNo(currentQuestion, false);
        }
      }

      // Hotkeys for Rating (1 to 9)
      if (
        currentQuestion &&
        currentQuestion.kind === "rating" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= (currentQuestion.rating_max || 5)) {
          e.preventDefault();
          handleSelectRating(currentQuestion, num);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleAdvance,
    handleBack,
    currentQuestion,
    handleSelectChoice,
    handleSelectYesNo,
    handleSelectRating,
  ]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3 text-[#737373]">
          <div className="w-8 h-8 border-2 border-[#191919] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading form...</span>
        </div>
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[#191919] mb-2">Form Not Available</h1>
        <p className="text-sm text-[#737373] max-w-sm mb-6">
          {errorMsg || "This typeform has not been published or does not exist."}
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[#191919] text-white rounded-xl text-sm font-semibold hover:bg-[#333] transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  const accent = form.accent_color || "#0445af";
  const totalQuestions = form.questions.length;
  const progressPercent =
    totalQuestions > 0 && step >= 1
      ? Math.min(100, Math.round(((step - 1) / totalQuestions) * 100))
      : 0;

  return (
    <div className="min-h-screen w-screen bg-[#faf9f6] text-[#191919] flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#e6e6e4] z-50">
        <div
          style={{ width: `${progressPercent}%`, backgroundColor: accent }}
          className="h-full transition-all duration-300 ease-out"
        />
      </div>

      {/* Brand Header */}
      <header className="fixed top-3 left-6 z-40 flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
        <Wordmark className="text-sm" />
      </header>

      {/* Main Slide Carousel Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative">
        <div className="w-full max-w-xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Welcome Screen */}
            {step === 0 && !submitted && (
              <motion.div
                key="welcome"
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
                  center: { y: 0, opacity: 1 },
                  exit: (dir: number) => ({ y: dir > 0 ? -40 : 40, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#191919] tracking-tight leading-tight">
                  {form.welcome_title || "Welcome"}
                </h1>
                {form.welcome_message && (
                  <p className="text-base sm:text-lg text-[#666] leading-relaxed font-normal">
                    {form.welcome_message}
                  </p>
                )}

                <div className="pt-4 flex items-center gap-4">
                  <button
                    onClick={() => handleAdvance()}
                    style={{ backgroundColor: accent }}
                    className="px-7 py-3.5 rounded-xl text-white font-bold text-base shadow-sm hover:brightness-110 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Start</span>
                    <ArrowRight size={16} />
                  </button>
                  <span className="text-xs text-[#737373] hidden sm:inline">
                    press <strong className="font-semibold text-[#191919]">Enter ↵</strong>
                  </span>
                </div>
              </motion.div>
            )}

            {/* Step 1 to N: Question Slides */}
            {step >= 1 && step <= totalQuestions && currentQuestion && !submitted && (
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
                  center: { y: 0, opacity: 1 },
                  exit: (dir: number) => ({ y: dir > 0 ? -40 : 40, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* Step Number Tag */}
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: accent }}>
                  <span>{step}</span>
                  <span>→</span>
                </div>

                {/* Question Prompt */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#191919] leading-tight">
                    {currentQuestion.prompt || kindMeta(currentQuestion.kind).defaultPrompt}
                    {currentQuestion.required && (
                      <span className="text-[#dc2626] ml-1.5" title="Required">
                        *
                      </span>
                    )}
                  </h2>
                  {currentQuestion.help_text && (
                    <p className="text-sm text-[#737373] mt-1.5 leading-relaxed">
                      {currentQuestion.help_text}
                    </p>
                  )}
                </div>

                {/* Input Elements */}
                <div className="pt-2">
                  {/* Short Text */}
                  {currentQuestion.kind === "short_text" && (
                    <input
                      ref={inputRef}
                      type="text"
                      value={answers[currentQuestion.id]?.text_value || ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [currentQuestion.id]: {
                            question_id: currentQuestion.id,
                            text_value: e.target.value,
                          },
                        })
                      }
                      placeholder={currentQuestion.placeholder || "Type your answer here..."}
                      className="w-full bg-transparent border-b-2 border-[#cfcfcf] focus:border-[#191919] py-2 text-xl sm:text-2xl text-[#191919] placeholder:text-[#999] focus:outline-none transition-colors"
                    />
                  )}

                  {/* Email */}
                  {currentQuestion.kind === "email" && (
                    <input
                      ref={inputRef}
                      type="email"
                      value={answers[currentQuestion.id]?.text_value || ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [currentQuestion.id]: {
                            question_id: currentQuestion.id,
                            text_value: e.target.value,
                          },
                        })
                      }
                      placeholder={currentQuestion.placeholder || "name@example.com"}
                      className="w-full bg-transparent border-b-2 border-[#cfcfcf] focus:border-[#191919] py-2 text-xl sm:text-2xl text-[#191919] placeholder:text-[#999] focus:outline-none transition-colors"
                    />
                  )}

                  {/* Number */}
                  {currentQuestion.kind === "number" && (
                    <input
                      ref={inputRef}
                      type="number"
                      value={answers[currentQuestion.id]?.number_value ?? ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [currentQuestion.id]: {
                            question_id: currentQuestion.id,
                            number_value: e.target.value ? Number(e.target.value) : null,
                          },
                        })
                      }
                      placeholder={currentQuestion.placeholder || "Type a number..."}
                      className="w-full bg-transparent border-b-2 border-[#cfcfcf] focus:border-[#191919] py-2 text-xl sm:text-2xl text-[#191919] placeholder:text-[#999] focus:outline-none transition-colors"
                    />
                  )}

                  {/* Long Text */}
                  {currentQuestion.kind === "long_text" && (
                    <textarea
                      ref={textareaRef}
                      rows={3}
                      value={answers[currentQuestion.id]?.text_value || ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [currentQuestion.id]: {
                            question_id: currentQuestion.id,
                            text_value: e.target.value,
                          },
                        })
                      }
                      placeholder={currentQuestion.placeholder || "Type your answer here..."}
                      className="w-full bg-transparent border-b-2 border-[#cfcfcf] focus:border-[#191919] py-2 text-lg sm:text-xl text-[#191919] placeholder:text-[#999] focus:outline-none resize-none transition-colors"
                    />
                  )}

                  {/* Multiple Choice */}
                  {currentQuestion.kind === "multiple_choice" && (
                    <div className="space-y-2.5">
                      {currentQuestion.choices.map((choice, idx) => {
                        const isSelected =
                          answers[currentQuestion.id]?.choice_id === choice.id;
                        const letter = String.fromCharCode(65 + idx);

                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => handleSelectChoice(currentQuestion, choice.id)}
                            className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#191919] bg-white shadow-sm ring-1 ring-[#191919]"
                                : "border-[#e6e6e4] bg-white/70 hover:bg-white hover:border-[#191919]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold transition-colors ${
                                  isSelected
                                    ? "bg-[#191919] text-white border-[#191919]"
                                    : "bg-white border-[#dcdcd8] text-[#191919]"
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="text-base font-medium text-[#191919]">
                                {choice.label}
                              </span>
                            </div>

                            {isSelected && (
                              <Check size={18} style={{ color: accent }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown */}
                  {currentQuestion.kind === "dropdown" && (
                    <div className="relative">
                      <select
                        value={answers[currentQuestion.id]?.choice_id || ""}
                        onChange={(e) => handleSelectChoice(currentQuestion, e.target.value)}
                        className="w-full p-3.5 bg-white border border-[#cfcfcf] focus:border-[#191919] rounded-xl text-base text-[#191919] focus:outline-none cursor-pointer appearance-none pr-10"
                      >
                        <option value="">Select an option...</option>
                        {currentQuestion.choices.map((choice) => (
                          <option key={choice.id} value={choice.id}>
                            {choice.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none"
                      />
                    </div>
                  )}

                  {/* Yes / No */}
                  {currentQuestion.kind === "yes_no" && (
                    <div className="flex gap-4">
                      {[
                        { label: "Yes", value: true, key: "Y" },
                        { label: "No", value: false, key: "N" },
                      ].map((item) => {
                        const isSelected =
                          answers[currentQuestion.id]?.bool_value === item.value;

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleSelectYesNo(currentQuestion, item.value)}
                            className={`flex-1 p-5 rounded-2xl border flex items-center justify-center gap-3 font-bold text-base transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#191919] bg-white shadow-sm ring-1 ring-[#191919]"
                                : "border-[#e6e6e4] bg-white/70 hover:bg-white hover:border-[#191919]"
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${
                                isSelected
                                  ? "bg-[#191919] text-white border-[#191919]"
                                  : "bg-white border-[#dcdcd8] text-[#191919]"
                              }`}
                            >
                              {item.key}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Rating */}
                  {currentQuestion.kind === "rating" && (
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      {Array.from({ length: currentQuestion.rating_max || 5 }).map((_, i) => {
                        const score = i + 1;
                        const isSelected =
                          answers[currentQuestion.id]?.number_value === score;

                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleSelectRating(currentQuestion, score)}
                            className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl border flex items-center justify-center font-bold text-base sm:text-lg cursor-pointer transition-all ${
                              isSelected
                                ? "bg-[#191919] text-white border-[#191919] shadow-md scale-105"
                                : "border-[#dcdcd8] bg-white/70 hover:border-[#191919] hover:bg-white"
                            }`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Validation Error Notice */}
                {validationError && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#dc2626] bg-[#fee2e2] px-3 py-2 rounded-lg max-w-fit animate-shake">
                    <AlertCircle size={14} />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* OK Action Button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    disabled={submitting}
                    onClick={() => handleAdvance()}
                    style={{ backgroundColor: accent }}
                    className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:brightness-110 active:scale-98 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{step === totalQuestions ? "Submit" : "OK"}</span>
                    <Check size={16} />
                  </button>
                  <span className="text-xs text-[#737373] hidden sm:inline">
                    press <strong className="font-semibold text-[#191919]">Enter ↵</strong>
                  </span>
                </div>
              </motion.div>
            )}

            {/* Thank You Screen */}
            {submitted && (
              <motion.div
                key="thankyou"
                variants={{
                  enter: { scale: 0.9, opacity: 0 },
                  center: { scale: 1, opacity: 1 },
                }}
                initial="enter"
                animate="center"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-center max-w-md mx-auto"
              >
                <div
                  style={{ color: accent }}
                  className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 size={44} />
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#191919] tracking-tight">
                  {submissionResult?.thank_you_title || form.thank_you_title || "Thank you!"}
                </h1>

                <p className="text-base text-[#666] leading-relaxed">
                  {submissionResult?.thank_you_message ||
                    form.thank_you_message ||
                    "Your response has been submitted."}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setSubmissionResult(null);
                      setAnswers({});
                      setStep(form.welcome_title || form.welcome_message ? 0 : 1);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-[#dcdcd8] bg-white hover:bg-[#f6f5f1] text-xs font-semibold text-[#191919] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Submit another response</span>
                  </button>
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl bg-[#191919] text-white text-xs font-semibold hover:bg-[#333] transition-colors"
                  >
                    Create your own typeform
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation & Brand Footer */}
      <footer className="fixed bottom-4 right-6 z-40 flex items-center gap-3">
        {/* Navigation Arrows */}
        {!submitted && (
          <div className="flex items-center bg-white border border-[#e6e6e4] rounded-xl shadow-xs overflow-hidden">
            <button
              onClick={handleBack}
              disabled={step <= 0 || (step === 1 && !form.welcome_title && !form.welcome_message)}
              className="p-2.5 text-[#555] hover:text-[#191919] hover:bg-[#f6f5f1] disabled:opacity-25 transition-colors cursor-pointer"
              title="Previous question (↑)"
            >
              <ChevronUp size={16} />
            </button>
            <div className="w-[1px] h-5 bg-[#e6e6e4]" />
            <button
              onClick={() => handleAdvance()}
              disabled={step > totalQuestions}
              className="p-2.5 text-[#555] hover:text-[#191919] hover:bg-[#f6f5f1] disabled:opacity-25 transition-colors cursor-pointer"
              title="Next question (↓ or Enter)"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        )}

        {/* Powered by Typeform badge */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="bg-[#191919] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-[#333] transition-colors"
        >
          <span>Powered by</span>
          <span className="font-bold">Typeform</span>
        </a>
      </footer>
    </div>
  );
}
