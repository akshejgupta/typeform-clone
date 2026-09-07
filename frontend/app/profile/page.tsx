"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Palette,
  Users,
  Key,
  CreditCard,
  Check,
  ArrowLeft,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { useTheme } from "@/components/theme";
import { useToast } from "@/components/toast";

type TabId = "profile" | "appearance" | "team" | "api" | "billing";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const pushToast = useToast();

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile Form State
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex.rivera@studio.co");
  const [title, setTitle] = useState("Senior Product Designer");
  const [bio, setBio] = useState(
    "Building conversational experiences and research surveys for digital products."
  );

  // Team Members State
  const [members, setMembers] = useState([
    { name: "Alex Rivera", email: "alex.rivera@studio.co", role: "Owner" },
    { name: "Priya Patel", email: "priya@studio.co", role: "Admin" },
    { name: "Marcus Vance", email: "marcus@north.io", role: "Editor" },
    { name: "Elena Rostova", email: "elena@harbor.app", role: "Viewer" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");

  // API Token State
  const [apiKey, setApiKey] = useState(
    "tf_live_98a72b14c8f04e679a9e34c95a024982b1"
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    pushToast("Profile details updated successfully!");
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      pushToast("Please enter a valid email address");
      return;
    }
    setMembers([
      ...members,
      {
        name: inviteEmail.split("@")[0],
        email: inviteEmail.trim(),
        role: inviteRole,
      },
    ]);
    setInviteEmail("");
    pushToast(`Invitation sent to ${inviteEmail}`);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    pushToast("API Key copied to clipboard!");
  };

  const handleRegenerateKey = () => {
    const newKey = `tf_live_${Math.random().toString(36).substring(2)}${Date.now()}`;
    setApiKey(newKey);
    pushToast("API Key regenerated!");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0a09] text-[#191919] dark:text-[#f5f5f4] flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Header Breadcrumb & Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#737373] dark:text-[#a8a29e] mb-1">
              <Link href="/" className="hover:underline">
                Workspace
              </Link>
              <span>/</span>
              <span>Settings</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#191919] dark:text-white tracking-tight">
              Profile & Account Settings
            </h1>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e6e6e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-xs font-semibold hover:border-[#191919] dark:hover:border-white transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Back to forms</span>
          </Link>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-[#e6e6e4] dark:border-[#292524] mb-8 overflow-x-auto">
          {(
            [
              { id: "profile", label: "Profile", icon: User },
              { id: "appearance", label: "Appearance", icon: Palette },
              { id: "team", label: "Workspace & Team", icon: Users },
              { id: "api", label: "API & Webhooks", icon: Key },
              { id: "billing", label: "Plan & Billing", icon: CreditCard },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "border-[#191919] dark:border-white text-[#191919] dark:text-white"
                    : "border-transparent text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Profile Information */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] p-8 shadow-xs max-w-2xl">
            <h2 className="text-lg font-bold text-[#191919] dark:text-white mb-1">
              Personal Information
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#a8a29e] mb-6">
              Manage your personal credentials, contact info, and public display name.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-5 pb-6 border-b border-[#f0f0ee] dark:border-[#292524]">
                <div className="w-16 h-16 rounded-2xl bg-[#0445af] text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
                  AR
                </div>
                <div>
                  <div className="text-sm font-bold text-[#191919] dark:text-white">
                    Profile Picture
                  </div>
                  <div className="text-xs text-[#737373] dark:text-[#a8a29e] mt-0.5">
                    Avatar is displayed on your forms and workspaces.
                  </div>
                  <button
                    type="button"
                    onClick={() => pushToast("Avatar photo updated")}
                    className="mt-2 text-xs font-semibold text-[#0445af] dark:text-[#60a5fa] hover:underline cursor-pointer"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                  Job Title / Role
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-sm text-[#191919] dark:text-white focus:outline-none focus:border-[#191919] dark:focus:border-white resize-none transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-[#f0f0ee] dark:border-[#292524] flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl text-xs font-bold hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors cursor-pointer"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Appearance & Theme */}
        {activeTab === "appearance" && (
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] p-8 shadow-xs max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#191919] dark:text-white mb-1">
                Interface Theme
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a8a29e]">
                Choose how Typeform looks to you. Select a single theme or sync with your system.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Light Theme Card */}
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  pushToast("Switched to Light theme");
                }}
                className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between h-40 transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-[#191919] dark:border-white bg-[#fbf9f4] shadow-sm"
                    : "border-[#e6e6e4] dark:border-[#292524] hover:border-[#999]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#e6e6e4] flex items-center justify-center text-[#191919] shadow-xs">
                    <Sun size={20} className="text-amber-500" />
                  </div>
                  {theme === "light" && (
                    <span className="w-5 h-5 rounded-full bg-[#191919] text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#191919]">Light theme</div>
                  <div className="text-xs text-[#737373] mt-0.5">Classic crisp warm background</div>
                </div>
              </button>

              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  pushToast("Switched to Dark theme");
                }}
                className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between h-40 transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-[#191919] dark:border-white bg-[#121212] shadow-sm"
                    : "border-[#e6e6e4] dark:border-[#292524] hover:border-[#999]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#1c1917] border border-[#333] flex items-center justify-center text-white shadow-xs">
                    <Moon size={20} className="text-indigo-400" />
                  </div>
                  {theme === "dark" && (
                    <span className="w-5 h-5 rounded-full bg-white text-[#191919] flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Dark theme</div>
                  <div className="text-xs text-[#a8a29e] mt-0.5">Sleek obsidian night mode</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Workspace & Team */}
        {activeTab === "team" && (
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] p-8 shadow-xs max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#191919] dark:text-white mb-1">
                Workspace Collaboration & Members
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a8a29e]">
                Invite teammates to collaborate, edit forms, and review incoming responses.
              </p>
            </div>

            {/* Invite Form */}
            <form
              onSubmit={handleInvite}
              className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#141211] border border-[#e6e6e4] dark:border-[#292524] flex items-center gap-3"
            >
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-white dark:bg-[#1c1917] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-xs text-[#191919] dark:text-white focus:outline-none"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-[#1c1917] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-xs font-semibold text-[#191919] dark:text-white"
              >
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl text-xs font-bold hover:bg-[#333] transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Invite</span>
              </button>
            </form>

            {/* Members List */}
            <div className="divide-y divide-[#f0f0ee] dark:divide-[#292524]">
              {members.map((m, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e8e7e3] dark:bg-[#282828] font-bold text-xs flex items-center justify-center text-[#191919] dark:text-white">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#191919] dark:text-white">
                        {m.name}
                      </div>
                      <div className="text-[11px] text-[#737373] dark:text-[#a8a29e]">
                        {m.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#f0f0ee] dark:bg-[#292524] text-[#555] dark:text-[#ccc]">
                      {m.role}
                    </span>
                    {m.role !== "Owner" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMembers(members.filter((_, i) => i !== idx));
                          pushToast("Member removed");
                        }}
                        className="p-1 text-[#999] hover:text-[#dc2626] rounded-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: API & Webhooks */}
        {activeTab === "api" && (
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] p-8 shadow-xs max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#191919] dark:text-white mb-1">
                Developer API Tokens
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a8a29e]">
                Use this bearer token to authenticate API calls and integrate with external webhooks.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#141211] border border-[#e6e6e4] dark:border-[#292524] space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e]">
                Personal API Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="flex-1 px-3 py-2 bg-white dark:bg-[#1c1917] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-xs font-mono text-[#191919] dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-4 py-2 bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl text-xs font-bold hover:bg-[#333] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#737373] dark:text-[#a8a29e]">
                  Created on Sep 7, 2026 • Never expires
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="text-xs font-semibold text-[#dc2626] hover:underline cursor-pointer"
                >
                  Regenerate token
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Plan & Billing */}
        {activeTab === "billing" && (
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] p-8 shadow-xs max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#191919] dark:text-white mb-1">
                Current Plan & Quotas
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a8a29e]">
                Your workspace is active on the Pro Creator subscription tier.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#191919] to-[#333] text-white shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Pro Plan Active</span>
                </span>
                <span className="text-xs font-mono opacity-80">Renews Oct 2026</span>
              </div>
              <div className="text-2xl font-black mb-1">Unlimited Responses</div>
              <p className="text-xs opacity-80 mb-6">
                All 8 question types, unlimited forms, CSV exports, and team collaboration.
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 text-xs">
                <div>
                  <div className="opacity-75">Monthly Form Views</div>
                  <div className="font-bold text-sm mt-0.5">50,000 / month</div>
                </div>
                <div>
                  <div className="opacity-75">CSV Exports</div>
                  <div className="font-bold text-sm mt-0.5">Unlimited</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
