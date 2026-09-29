import React, { useState, useEffect } from "react";
import { getAdminSettings, updateSiteSettings } from "../../../api/http";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Settings,
  Calendar,
  Trophy,
  Package,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";

const SECTION_LABELS = [
  ["editions", "Editions Timeline"],
  ["about", "About / Mission"],
  ["routes", "Route Categories"],
  ["updates", "Event Updates"],
  ["gallery", "Photo Gallery"],
  ["why_sport", "Why Cycling Section"],
  ["community", "Community Wall"],
  ["contact", "Point of Contact + Map"],
  ["sponsors", "Association & Commercial Collaborations"],
];

export function SettingsTab({ accessToken, onFeedback }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localFeedback, setLocalFeedback] = useState("");
  const [activeSectionTab, setActiveSectionTab] = useState("logistics");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminSettings(accessToken)
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoading(false);
        setLocalFeedback(error.message || "Could not load settings.");
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading || !settings) {
    return (
      <div className="py-20 flex justify-center rounded-2xl bg-white shadow-sm border border-black/10">
        <LoadingIndicator label="Loading site settings…" />
      </div>
    );
  }

  const updateField = (key, value) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const toggleSection = (key) =>
    setSettings((current) => ({
      ...current,
      sections: { ...current.sections, [key]: !current.sections?.[key] },
    }));

  const updatePrizePool = (key, value) =>
    updateField("prize_pool", { ...settings.prize_pool, [key]: value });

  const updatePrize = (index, key, value) => {
    const prizes = [...(settings.prize_pool?.prizes || [])];
    prizes[index] = { ...prizes[index], [key]: value };
    updatePrizePool("prizes", prizes);
  };

  const updateParticipantKit = (key, value) =>
    updateField("participant_kit", { ...settings.participant_kit, [key]: value });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setLocalFeedback("");
    try {
      const updated = await updateSiteSettings(accessToken, {
        event_date: settings.event_date,
        event_start_time: settings.event_start_time,
        event_location: settings.event_location,
        edition_label: settings.edition_label,
        registration_open: settings.registration_open,
        partner_applications_open: settings.partner_applications_open,
        vendor_applications_open: settings.vendor_applications_open,
        hero_images: settings.hero_images || [],
        feature_section: settings.feature_section || {},
        prize_pool: settings.prize_pool || {},
        participant_kit: settings.participant_kit || {},
        sections: settings.sections,
      });
      setSettings(updated);
      setLocalFeedback("Site settings updated successfully.");
      onFeedback?.("Site settings updated.");
    } catch (error) {
      setLocalFeedback(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const navTabs = [
    { id: "logistics", label: "Event & Registrations", icon: Calendar },
    { id: "prizes", label: "Prize Pool & Rider Kit", icon: Trophy },
    { id: "visuals", label: "Hero & Visuals", icon: Layers },
    { id: "visibility", label: "Page Sections Visibility", icon: Eye },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#071313]">Public Site Configuration</h2>
          <p className="text-xs text-[#071313]/60">
            Control live event information, registration status, prize pools, and visible website sections.
          </p>
        </div>

        <Button
          onClick={submit}
          disabled={saving}
          className="bg-[#071313] text-[#d9ff38] font-bold h-9"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving…" : "Publish Changes"}
        </Button>
      </div>

      {localFeedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-xs font-semibold ${
            localFeedback.includes("Failed") || localFeedback.includes("Could not")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{localFeedback}</span>
        </div>
      )}

      {/* INTERNAL SETTINGS TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSectionTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#071313] text-[#d9ff38] shadow-sm"
                  : "bg-white border border-black/10 text-black/70 hover:bg-black/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT CARDS */}
      <form onSubmit={submit} className="space-y-6">
        {/* 1. LOGISTICS & REGISTRATION */}
        {activeSectionTab === "logistics" && (
          <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-base font-black text-[#071313] border-b border-black/10 pb-3">
              Event Details & Application Gates
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/60 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={settings.event_date || ""}
                  onChange={(e) => updateField("event_date", e.target.value)}
                  className="h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/60 mb-1">
                  Race Flag-off Time
                </label>
                <input
                  type="text"
                  value={settings.event_start_time || ""}
                  onChange={(e) => updateField("event_start_time", e.target.value)}
                  placeholder="5:30 AM"
                  className="h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/60 mb-1">
                  Event Venue / Location
                </label>
                <input
                  type="text"
                  value={settings.event_location || ""}
                  onChange={(e) => updateField("event_location", e.target.value)}
                  placeholder="Rewa Stadium, Rewa, MP"
                  className="h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/60 mb-1">
                  Edition Label
                </label>
                <input
                  type="text"
                  value={settings.edition_label || ""}
                  onChange={(e) => updateField("edition_label", e.target.value)}
                  placeholder="3rd Edition"
                  className="h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-[#fbf8ef] p-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-[#071313]">
                Application Gate Toggles
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-black/10">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.registration_open)}
                    onChange={(e) => updateField("registration_open", e.target.checked)}
                    className="h-4 w-4 rounded accent-[#071313]"
                  />
                  <span className="text-xs font-bold text-[#071313]">Rider Registrations Open</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-black/10">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.partner_applications_open)}
                    onChange={(e) => updateField("partner_applications_open", e.target.checked)}
                    className="h-4 w-4 rounded accent-[#071313]"
                  />
                  <span className="text-xs font-bold text-[#071313]">Partner Applications Open</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-black/10">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.vendor_applications_open)}
                    onChange={(e) => updateField("vendor_applications_open", e.target.checked)}
                    className="h-4 w-4 rounded accent-[#071313]"
                  />
                  <span className="text-xs font-bold text-[#071313]">Vendor Applications Open</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRIZES & RIDER KIT */}
        {activeSectionTab === "prizes" && (
          <div className="space-y-6">
            {/* PRIZE POOL CARD */}
            <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-base font-black text-[#071313]">Prize Pool</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.prize_pool?.enabled)}
                    onChange={(e) => updatePrizePool("enabled", e.target.checked)}
                    className="h-4 w-4 rounded accent-[#071313]"
                  />
                  <span className="text-xs font-bold text-[#071313]">Show Prize Pool</span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Eyebrow
                  </label>
                  <input
                    value={settings.prize_pool?.eyebrow || ""}
                    onChange={(e) => updatePrizePool("eyebrow", e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Total Prize Amount
                  </label>
                  <input
                    value={settings.prize_pool?.total || ""}
                    onChange={(e) => updatePrizePool("total", e.target.value)}
                    placeholder="₹1,00,000"
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Heading Title
                  </label>
                  <input
                    value={settings.prize_pool?.title || ""}
                    onChange={(e) => updatePrizePool("title", e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Introduction Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.prize_pool?.body || ""}
                    onChange={(e) => updatePrizePool("body", e.target.value)}
                    className="w-full rounded-xl border border-black/20 p-3 text-xs"
                  />
                </div>
              </div>

              {/* INDIVIDUAL PRIZES */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-black uppercase text-[#071313]">
                  Individual Prize Breakdown
                </span>
                {(settings.prize_pool?.prizes || []).map((prize, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 rounded-xl bg-[#fbf8ef] p-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
                  >
                    <input
                      value={prize.label || ""}
                      onChange={(e) => updatePrize(idx, "label", e.target.value)}
                      placeholder="Category / Rank (e.g. 60KM Winner)"
                      className="rounded-lg border border-black/15 bg-white p-2 text-xs"
                    />
                    <input
                      value={prize.amount || ""}
                      onChange={(e) => updatePrize(idx, "amount", e.target.value)}
                      placeholder="Amount (e.g. ₹25,000)"
                      className="rounded-lg border border-black/15 bg-white p-2 text-xs font-mono font-bold"
                    />
                    <input
                      value={prize.detail || ""}
                      onChange={(e) => updatePrize(idx, "detail", e.target.value)}
                      placeholder="Optional notes"
                      className="rounded-lg border border-black/15 bg-white p-2 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updatePrizePool(
                          "prizes",
                          settings.prize_pool.prizes.filter((_, pIdx) => pIdx !== idx)
                        )
                      }
                      className="text-red-600 hover:bg-red-50 text-xs px-2.5 h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updatePrizePool("prizes", [
                      ...(settings.prize_pool?.prizes || []),
                      { label: "", amount: "", detail: "" },
                    ])
                  }
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Prize Entry
                </Button>
              </div>
            </div>

            {/* RIDER KIT CARD */}
            <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-base font-black text-[#071313]">Official Rider Kit</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.participant_kit?.enabled)}
                    onChange={(e) => updateParticipantKit("enabled", e.target.checked)}
                    className="h-4 w-4 rounded accent-[#071313]"
                  />
                  <span className="text-xs font-bold text-[#071313]">Show Rider Kit</span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Eyebrow
                  </label>
                  <input
                    value={settings.participant_kit?.eyebrow || ""}
                    onChange={(e) => updateParticipantKit("eyebrow", e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Section Title
                  </label>
                  <input
                    value={settings.participant_kit?.title || ""}
                    onChange={(e) => updateParticipantKit("title", e.target.value)}
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Kit Items (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={(settings.participant_kit?.items || []).join("\n")}
                    onChange={(e) =>
                      updateParticipantKit(
                        "items",
                        e.target.value.split("\n").map((i) => i.trim()).filter(Boolean)
                      )
                    }
                    className="w-full rounded-xl border border-black/20 p-3 text-xs"
                    placeholder="Dry-fit Athletic Jersey&#10;Finisher Medal&#10;Timing Chip"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. HERO & VISUALS */}
        {activeSectionTab === "visuals" && (
          <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-[#071313] border-b border-black/10 pb-3">
                Hero Carousel Images
              </h3>
              <p className="text-xs text-black/60 mt-2 mb-3">
                Provide up to 5 HTTPS image URLs (one per line) for the homepage hero carousel.
              </p>
              <textarea
                rows={4}
                value={(settings.hero_images || []).join("\n")}
                onChange={(e) =>
                  updateField(
                    "hero_images",
                    e.target.value.split("\n").map((url) => url.trim()).filter(Boolean)
                  )
                }
                className="w-full rounded-xl border border-black/20 p-3 text-xs font-mono"
                placeholder="https://..."
              />
            </div>

            <div className="border-t border-black/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-[#071313]">Featured Spotlight Section</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.feature_section?.enabled)}
                    onChange={(e) =>
                      updateField("feature_section", {
                        ...settings.feature_section,
                        enabled: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded accent-[#071313]"
                  />
                  <span className="text-xs font-bold text-[#071313]">Enable Spotlight</span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Eyebrow
                  </label>
                  <input
                    value={settings.feature_section?.eyebrow || ""}
                    onChange={(e) =>
                      updateField("feature_section", {
                        ...settings.feature_section,
                        eyebrow: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={settings.feature_section?.image_url || ""}
                    onChange={(e) =>
                      updateField("feature_section", {
                        ...settings.feature_section,
                        image_url: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Title
                  </label>
                  <input
                    value={settings.feature_section?.title || ""}
                    onChange={(e) =>
                      updateField("feature_section", {
                        ...settings.feature_section,
                        title: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-black/20 px-3 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
                    Body Content
                  </label>
                  <textarea
                    rows={3}
                    value={settings.feature_section?.body || ""}
                    onChange={(e) =>
                      updateField("feature_section", {
                        ...settings.feature_section,
                        body: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-black/20 p-3 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PUBLIC SECTION VISIBILITY */}
        {activeSectionTab === "visibility" && (
          <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#071313] border-b border-black/10 pb-3">
              Homepage Module Toggles
            </h3>
            <p className="text-xs text-black/60">
              Select which content blocks appear publicly on the cyclothon landing page.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              {SECTION_LABELS.map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#fbf8ef] p-3 text-xs font-bold text-[#071313] cursor-pointer hover:border-black/25 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={settings.sections?.[key] !== false}
                    onChange={() => toggleSection(key)}
                    className="h-4 w-4 rounded accent-[#071313]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
