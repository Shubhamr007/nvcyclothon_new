import React, { useState, useCallback } from "react";
import { Sparkles, Mail, Send, X, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { adminAiDraftEmail, sendAdminEventUpdateEmail } from "../../../api/http";
import { Button } from "../../../components/ui/button";

const CATEGORIES = [
  "all",
  "60 Km Road Challenge",
  "30 Km MTB Challenge",
  "10 Km Green Ride",
  "Kid-o-thon",
];

export function AiEmailBroadcastModal({ open, onClose, accessToken, onFeedback }) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("all");
  const [purpose, setPurpose] = useState("event_update");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleDraft = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please describe the email intent or key details.");
      return;
    }
    setError(null);
    setDrafting(true);
    try {
      const res = await adminAiDraftEmail(accessToken, { prompt, category });
      if (res.subject) setSubject(res.subject);
      if (res.body) setBody(res.body);
    } catch (err) {
      setError(err?.message || "Failed to generate AI email draft. Please try again.");
    } finally {
      setDrafting(false);
    }
  }, [accessToken, prompt, category]);

  const handleSend = useCallback(async () => {
    if (purpose === "event_update" && (!subject.trim() || !body.trim())) {
      setError("Subject and message are required to broadcast an email.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await sendAdminEventUpdateEmail(accessToken, {
        subject: purpose === "event_update" ? subject.trim() : "",
        message: purpose === "event_update" ? body.trim() : "",
        filter_category: category,
        purpose,
      });
      onFeedback?.(purpose === "registration_details"
        ? `Secure participant detail forms queued for ${res.queued_recipients || 0} participants.`
        : `Email broadcast queued for ${res.queued_recipients || "participants"}.`);
      onClose();
    } catch (err) {
      setError(err?.message || "Unable to queue broadcast email.");
    } finally {
      setSending(false);
    }
  }, [accessToken, subject, body, category, purpose, onFeedback, onClose]);

  const handleCopy = useCallback(() => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [subject, body]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0078d4] text-white shadow-xs">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{purpose === "registration_details" ? "Request Missing Participant Details" : "Broadcast Participant Update"}</h3>
                {purpose === "event_update" && <span className="rounded-md bg-[#deecf9] border border-[#c7e0f4] px-2 py-0.5 text-[10px] font-bold text-[#005a9e]">
                  AI ASSISTED
                </span>}
              </div>
              <p className="text-xs text-slate-500">
                Compose or auto-generate race updates for registered riders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
              Email type
            </label>
            <select
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className="h-9 w-full rounded-xl border border-slate-300 bg-[#faf9f6] px-3 text-xs text-slate-800"
            >
              <option value="event_update">Custom event announcement</option>
              <option value="registration_details">Request missing participant details</option>
            </select>
            {purpose === "registration_details" && (
              <p className="mt-2 rounded-lg bg-sky-50 p-3 text-xs leading-5 text-sky-900">
                Each recipient gets their own one-time secure link. Only participants with missing address, emergency-contact, or under-18 guardian contact details are included. The form is linked to their existing registration.
              </p>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
              Target Audience
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-300 bg-[#faf9f6] px-3 text-xs text-slate-800 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
            >
              <option value="all">All Registered Riders (Broadcast)</option>
              {CATEGORIES.filter((c) => c !== "all").map((cat) => (
                <option key={cat} value={cat}>
                  {cat} Only
                </option>
              ))}
            </select>
          </div>

          {purpose === "event_update" && <>
          {/* AI Drafting Prompt Box */}
          <div className="rounded-xl border border-[#c7e0f4] bg-[#deecf9]/30 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#005a9e]">
              <Sparkles className="h-3.5 w-3.5 text-[#0078d4]" />
              <span>Draft with AI Assistant</span>
            </div>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Tell riders bib collection is on Saturday 10am at Rewa Stadium. Helmets mandatory."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleDraft}
                disabled={drafting || !prompt.trim()}
                className="h-8 text-xs font-semibold bg-[#0078d4] hover:bg-[#005a9e] text-white shadow-xs"
              >
                {drafting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Drafting email…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    <span>Generate Email Draft</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Email Subject */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="NV Cyclothon 2026: Official Announcement…"
              className="h-9 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 font-semibold focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
              Email Content
            </label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dear Cyclists,&#10;&#10;Write your official announcement here…"
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 leading-relaxed focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none font-mono"
            />
          </div>
          </>}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={purpose !== "event_update" || !body.trim()}
            className="h-9 text-xs border-slate-200"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />
                <span>Copy Draft</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs border-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || (purpose === "event_update" && (!subject.trim() || !body.trim()))}
              className="h-9 text-xs font-bold bg-[#0078d4] hover:bg-[#005a9e] text-white shadow-xs"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Queuing…</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5 text-blue-100" />
                    <span>{purpose === "registration_details" ? "Send detail form links" : "Send Broadcast"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiEmailBroadcastModal;
