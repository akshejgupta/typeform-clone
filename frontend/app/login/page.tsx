"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { useToast } from "@/components/toast";
import { useTheme } from "@/components/theme";

export default function LoginPage() {
  const router = useRouter();
  const pushToast = useToast();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("alex.rivera@studio.co");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("Alex Rivera");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      // Simulate authenticating
      await new Promise((resolve) => setTimeout(resolve, 600));

      const userData = {
        name: mode === "signup" ? fullName : "Alex Rivera",
        email: email.trim(),
        role: "Workspace Owner",
        token: `tf_token_${Date.now()}`,
      };

      localStorage.setItem("tf-user", JSON.stringify(userData));
      pushToast(mode === "signup" ? "Account created successfully! Welcome to Typeform." : "Welcome back, Alex!");
      router.push("/");
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("alex.rivera@studio.co");
    setPassword("password123");
    setFullName("Alex Rivera");
    setError(null);
    pushToast("Filled with demo credentials");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0a09] text-[#191919] dark:text-[#f5f5f4] flex flex-col justify-between font-sans transition-colors select-none">
      {/* Top Header */}
      <header className="p-6 flex items-center justify-between">
        <Link href="/" className="hover:opacity-85 transition-opacity">
          <Wordmark className="text-xl" />
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[#e6e6e4] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-[#555] dark:text-[#ccc] hover:text-[#191919] dark:hover:text-white transition-all cursor-pointer shadow-xs"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <Link
            href="/"
            className="text-xs font-semibold text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] shadow-xl p-8 sm:p-10 transition-all">
          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191919] dark:text-white tracking-tight">
              {mode === "signin" ? "Sign in to Typeform" : "Create your account"}
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a8a29e] mt-1.5 leading-relaxed">
              {mode === "signin"
                ? "Access your workspace, build forms, and view responses."
                : "Start creating conversational forms that people love to fill."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#f0f0ee] dark:bg-[#292524] p-1 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white dark:bg-[#1c1917] text-[#191919] dark:text-white shadow-xs font-bold"
                  : "text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-white dark:bg-[#1c1917] text-[#191919] dark:text-white shadow-xs font-bold"
                  : "text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white"
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#666]"
                  />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#666]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e]">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => pushToast("Password reset link sent to your email")}
                    className="text-xs text-[#0445af] dark:text-[#60a5fa] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#666]"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#191919] dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-[#737373] dark:text-[#a8a29e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#dcdcd8] text-[#191919] focus:ring-0 cursor-pointer"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[#fee2e2] dark:bg-[#3d1a1a] text-[#dc2626] dark:text-[#f87171] rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl font-bold text-sm hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Authenticating..." : mode === "signin" ? "Sign in" : "Create account"}</span>
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Fill Button */}
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full py-2 bg-[#f0f0ee] dark:bg-[#292524] text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Use default demo credentials (Alex Rivera)</span>
            </button>
          </form>

          {/* Footer Terms */}
          <div className="mt-8 pt-6 border-t border-[#f0f0ee] dark:border-[#292524] text-center text-[11px] text-[#737373] dark:text-[#a8a29e] flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted & secure session • Typeform platform</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="p-6 text-center text-xs text-[#737373] dark:text-[#a8a29e]">
        <span>© 2026 Typeform Clone • SDE Fullstack Assignment</span>
      </footer>
    </div>
  );
}
