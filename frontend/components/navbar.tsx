"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  User,
  Layers,
  Sparkles,
  Plug,
  LogOut,
  LogIn,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useTheme } from "@/components/theme";
import { Wordmark } from "@/components/wordmark";
import { useToast } from "@/components/toast";

export function Navbar({
  onCreateClick,
  formCount,
}: {
  onCreateClick?: () => void;
  formCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pushToast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Workspace", href: "/", icon: Layers },
    { label: "Templates", href: "/templates", icon: Sparkles },
    { label: "Integrations", href: "/integrations", icon: Plug },
  ];

  const handleLogout = () => {
    localStorage.removeItem("tf-user");
    pushToast("Signed out successfully");
    setMenuOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-[#e6e6e4] dark:border-[#262626] px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="hover:opacity-85 transition-opacity">
            <Wordmark className="text-xl text-[#191919] dark:text-white" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-[#f6f5f1] dark:bg-[#202020] text-[#191919] dark:text-white font-semibold"
                      : "text-[#737373] dark:text-[#a3a3a3] hover:text-[#191919] dark:hover:text-white hover:bg-[#faf9f6] dark:hover:bg-[#1a1a1a]"
                  }`}
                >
                  <Icon size={15} />
                  <span>{link.label}</span>
                  {link.href === "/" && formCount !== undefined && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#e6e6e4] dark:bg-[#333] text-[#555] dark:text-[#aaa] font-bold ml-0.5">
                      {formCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Create Button (if callback provided) */}
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="hidden sm:flex items-center gap-2 bg-[#191919] dark:bg-white text-white dark:text-[#191919] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Create typeform</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[#e6e6e4] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-[#555] dark:text-[#ccc] hover:text-[#191919] dark:hover:text-white hover:border-[#191919] dark:hover:border-[#555] transition-all cursor-pointer shadow-xs"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun size={17} className="text-amber-400 rotate-0 transition-transform duration-300" />
            ) : (
              <Moon size={17} className="text-[#191919] -rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-[#e6e6e4] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] hover:border-[#191919] dark:hover:border-[#555] transition-all cursor-pointer shadow-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0445af] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                AR
              </div>
              <ChevronDown size={14} className="text-[#737373] dark:text-[#a3a3a3]" />
            </button>

            {/* Menu Popover */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1c1c1c] border border-[#e6e6e4] dark:border-[#2e2e2e] rounded-2xl shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* Header Profile Info */}
                <div className="p-3 border-b border-[#f0f0ee] dark:border-[#2a2a2a]">
                  <div className="font-bold text-sm text-[#191919] dark:text-white">
                    Alex Rivera
                  </div>
                  <div className="text-[#737373] dark:text-[#a3a3a3] truncate">
                    alex.rivera@studio.co
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f0f0ee] dark:bg-[#282828] text-[#191919] dark:text-[#eee] text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Pro Plan • Workspace Owner
                  </div>
                </div>

                {/* Menu Links */}
                <div className="py-1 space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] font-medium transition-colors"
                  >
                    <User size={15} className="text-[#737373] dark:text-[#999]" />
                    <span>Profile & Account</span>
                  </Link>

                  <Link
                    href="/templates"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] font-medium transition-colors"
                  >
                    <Sparkles size={15} className="text-[#737373] dark:text-[#999]" />
                    <span>Templates Gallery</span>
                  </Link>

                  <Link
                    href="/integrations"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] font-medium transition-colors"
                  >
                    <Plug size={15} className="text-[#737373] dark:text-[#999]" />
                    <span>Connect & Integrations</span>
                  </Link>

                  <div className="h-[1px] bg-[#f0f0ee] dark:bg-[#2a2a2a] my-1" />

                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#262626] font-medium transition-colors"
                  >
                    <LogIn size={15} className="text-[#737373] dark:text-[#999]" />
                    <span>Switch Account / Sign in</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#dc2626] hover:bg-[#fee2e2] dark:hover:bg-[#3d1a1a] font-medium transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
