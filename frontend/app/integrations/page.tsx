"use client";

import { useState } from "react";
import {
  Plug,
  Search,
  Settings,
  Send,
  X,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/components/toast";

type IntegrationItem = {
  id: string;
  name: string;
  category: string;
  badge?: string;
  description: string;
  connected: boolean;
  iconBg: string;
  iconLetter: string;
};

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  {
    id: "sheets",
    name: "Google Sheets",
    category: "Productivity",
    badge: "Popular",
    description: "Automatically send form responses to a new row in your Google spreadsheet in real-time.",
    connected: true,
    iconBg: "#0F9D58",
    iconLetter: "GS",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    badge: "Popular",
    description: "Receive instant notifications in a designated Slack channel whenever a respondent submits a form.",
    connected: true,
    iconBg: "#4A154B",
    iconLetter: "SL",
  },
  {
    id: "webhooks",
    name: "Custom Webhooks",
    category: "Developer",
    badge: "Advanced",
    description: "Trigger secure HTTP POST payloads with response JSON to your backend server or API gateway.",
    connected: false,
    iconBg: "#191919",
    iconLetter: "WH",
  },
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    description: "Create pages and sync responses directly into your Notion workspace databases.",
    connected: false,
    iconBg: "#000000",
    iconLetter: "NO",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM & Sales",
    description: "Capture leads and automatically enrich contacts and deals in your HubSpot CRM pipeline.",
    connected: false,
    iconBg: "#FF7A59",
    iconLetter: "HS",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automation",
    description: "Connect Typeform with over 5,000+ web applications without writing a single line of code.",
    connected: false,
    iconBg: "#FF4A00",
    iconLetter: "ZP",
  },
];

export default function IntegrationsPage() {
  const pushToast = useToast();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Config Modal
  const [activeItem, setActiveItem] = useState<IntegrationItem | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("https://api.example.com/webhooks/typeform");
  const [slackChannel, setSlackChannel] = useState("#customer-feedback");

  const categories = ["All", "Productivity", "Communication", "CRM & Sales", "Developer", "Automation"];

  const filtered = integrations.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" ? true : item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const toggleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.connected;
          pushToast(nextState ? `Connected to ${item.name}` : `Disconnected from ${item.name}`);
          return { ...item, connected: nextState };
        }
        return item;
      })
    );
    if (activeItem && activeItem.id === id) {
      setActiveItem((prev) => (prev ? { ...prev, connected: !prev.connected } : prev));
    }
  };

  const handleTestWebhook = () => {
    pushToast("Test payload sent! Status 200 OK received.");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0a09] text-[#191919] dark:text-[#f5f5f4] flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f0ee] dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] text-xs font-semibold text-[#191919] dark:text-[#f5f5f4] mb-3">
            <Plug size={14} className="text-[#0445af] dark:text-[#60a5fa]" />
            <span>Connect Ecosystem</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#191919] dark:text-white tracking-tight leading-tight">
            Connect Typeform with your favorite tools
          </h1>
          <p className="text-sm text-[#737373] dark:text-[#a8a29e] mt-3 leading-relaxed">
            Automate data workflows, sync answers directly to your spreadsheets, or trigger real-time team notifications.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] dark:text-[#666]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1c1917] border border-[#e6e6e4] dark:border-[#292524] rounded-2xl text-xs sm:text-sm text-[#191919] dark:text-white placeholder:text-[#999] focus:outline-none focus:border-[#191919] dark:focus:border-white shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1c1917] rounded-3xl border border-[#e6e6e4] dark:border-[#292524] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    style={{ backgroundColor: item.iconBg }}
                    className="w-12 h-12 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center shadow-xs"
                  >
                    {item.iconLetter}
                  </div>

                  {item.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f4ea] dark:bg-[#13381e] text-[#137333] dark:text-[#4ade80] text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#137333] dark:bg-[#4ade80]" />
                      Connected
                    </span>
                  ) : item.badge ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f0f0ee] dark:bg-[#292524] text-[#191919] dark:text-[#f5f5f4] text-[10px] font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-[#191919] dark:text-white group-hover:text-[#0445af] dark:group-hover:text-[#60a5fa] transition-colors">
                  {item.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-[#737373] dark:text-[#a8a29e] mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action */}
              <div className="mt-6 pt-4 border-t border-[#f0f0ee] dark:border-[#292524] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#999] dark:text-[#666]">
                  {item.category}
                </span>

                <button
                  type="button"
                  onClick={() => setActiveItem(item)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    item.connected
                      ? "border border-[#e6e6e4] dark:border-[#333] text-[#191919] dark:text-white hover:bg-[#f6f5f1] dark:hover:bg-[#282828]"
                      : "bg-[#191919] dark:bg-white text-white dark:text-[#191919] hover:bg-[#333]"
                  }`}
                >
                  <Settings size={13} />
                  <span>{item.connected ? "Configure" : "Connect"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Configuration Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1917] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e6e6e4] dark:border-[#292524] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: activeItem.iconBg }}
                  className="w-10 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-xs"
                >
                  {activeItem.iconLetter}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191919] dark:text-white">
                    {activeItem.name} Integration
                  </h3>
                  <p className="text-xs text-[#737373] dark:text-[#a8a29e]">
                    {activeItem.connected ? "Currently active and syncing" : "Setup connection"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1 rounded-md text-[#737373] dark:text-[#a8a29e] hover:text-[#191919] dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 py-3">
              {activeItem.id === "webhooks" ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                    Webhook Destination URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-xs font-mono text-[#191919] dark:text-white focus:outline-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      className="text-xs font-semibold text-[#0445af] dark:text-[#60a5fa] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Send test payload</span>
                    </button>
                  </div>
                </div>
              ) : activeItem.id === "slack" ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#a8a29e] mb-1.5">
                    Target Slack Channel
                  </label>
                  <input
                    type="text"
                    value={slackChannel}
                    onChange={(e) => setSlackChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fbf9f4] dark:bg-[#121212] border border-[#dcdcd8] dark:border-[#333] rounded-xl text-xs text-[#191919] dark:text-white focus:outline-none"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#141211] border border-[#e6e6e4] dark:border-[#292524] text-xs text-[#737373] dark:text-[#a8a29e] leading-relaxed">
                  Automatic data synchronization is configured via OAuth. Form responses will instantly sync to your {activeItem.name} account upon completion.
                </div>
              )}

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f0f0ee] dark:bg-[#202020]">
                <div>
                  <div className="text-xs font-bold text-[#191919] dark:text-white">
                    Integration Status
                  </div>
                  <div className="text-[11px] text-[#737373] dark:text-[#a8a29e]">
                    {activeItem.connected ? "Sync is currently running" : "Disabled"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleConnect(activeItem.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    activeItem.connected
                      ? "bg-[#dc2626] text-white hover:bg-[#b91c1c]"
                      : "bg-[#191919] dark:bg-white text-white dark:text-[#191919] hover:bg-[#333]"
                  }`}
                >
                  {activeItem.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f0f0ee] dark:border-[#292524] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-5 py-2 bg-[#191919] dark:bg-white text-white dark:text-[#191919] rounded-xl text-xs font-bold hover:bg-[#333] transition-colors cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
