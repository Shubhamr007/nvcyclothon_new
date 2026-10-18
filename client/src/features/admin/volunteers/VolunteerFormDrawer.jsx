import React, { useState } from "react";
import { toast } from "react-toastify";
import { UserCheck, RefreshCw, Loader2, Sparkles, Send } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AdminSlideOver } from "../components/AdminSlideOver";
import { ROLE_OPTIONS } from "../../../store/slices/volunteersSlice";

const FRIENDLY_WORDS = ["Rewa", "Cyclo", "Ride", "Sprint", "Pedal", "Champion", "Hero", "Velox"];
function makeFriendlyPassword() {
  const word = FRIENDLY_WORDS[Math.floor(Math.random() * FRIENDLY_WORDS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${word}@${num}`;
}

const BLANK_FORM = {
  display_name: "",
  email: "",
  phone: "",
  role: "Check-in Desk",
  organization: "",
  volunteer_id: "",
  password: "",
  send_email: true,
};

export function VolunteerFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  busy = false,
}) {
  const [form, setForm] = useState(() => ({
    ...BLANK_FORM,
    password: makeFriendlyPassword(),
  }));

  const handleResetPassword = () => {
    setForm((prev) => ({ ...prev, password: makeFriendlyPassword() }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.display_name.trim()) {
      toast.error("Please provide the volunteer's full name.");
      return;
    }
    onSubmit(form);
  };

  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      title="Provision Race Volunteer"
      subtitle="Create a volunteer profile and generate credentials for the check-in portal"
      icon={UserCheck}
      width="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
        <div className="space-y-6 p-6">
          {/* Volunteer Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.display_name}
                onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="e.g. Ankit Verma"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assigned Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="volunteer@example.com"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Organization & Custom ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Affiliated Organization / College
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value }))}
                placeholder="e.g. Rewa Engineering College / NCC"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Custom Volunteer ID (Optional)
              </label>
              <input
                type="text"
                value={form.volunteer_id}
                onChange={(e) => setForm((prev) => ({ ...prev, volunteer_id: e.target.value }))}
                placeholder="Auto-generated if empty"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Generated Password Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Portal Access Password
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            </div>
            <input
              type="text"
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
            <p className="text-[10px] text-slate-500">
              This password will be used by the volunteer to access the /checkin mobile portal.
            </p>
          </div>

          {/* Email Notification Option */}
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={form.send_email}
              onChange={(e) => setForm((prev) => ({ ...prev, send_email: e.target.checked }))}
              className="accent-slate-900 rounded cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Send className="h-4 w-4 text-slate-500" />
              <span>Email portal credentials directly to volunteer</span>
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl h-10 px-6 shadow-sm transition"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Provisioning…
              </span>
            ) : (
              "Provision Volunteer"
            )}
          </Button>
        </div>
      </form>
    </AdminSlideOver>
  );
}

export default VolunteerFormDrawer;
