import React, { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Plus,
  Download,
  Upload,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Building,
  Award,
  FileText,
  Send,
  Search,
  X,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  listVolunteers,
  createVolunteer,
  updateVolunteer,
  downloadVolunteerTemplate,
  bulkUploadVolunteers,
  sendVolunteerCredentials,
  previewVolunteerCertificate,
  sendVolunteerCertificate,
  bulkDeleteAdminRecords,
} from "../../../api/http";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";

const ROLE_OPTIONS = [
  "Check-in Desk",
  "Bib Distribution",
  "Route Marshal",
  "Hydration Station",
  "Medical Support",
  "Finish Line & Medals",
  "Lead Vehicle Escort",
  "VIP & Stage Management",
  "General Operations Crew",
];

const FRIENDLY_WORDS = ["Rewa", "Cyclo", "Ride", "Sprint", "Pedal", "Champion", "Hero", "Velox"];
function makeFriendlyPassword() {
  const word = FRIENDLY_WORDS[Math.floor(Math.random() * FRIENDLY_WORDS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${word}@${num}`;
}

export function VolunteersTab({ accessToken, onFeedback }) {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [recentImports, setRecentImports] = useState(null);
  const [modalError, setModalError] = useState("");

  // Filters & Search
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Single Add Form State
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    phone: "",
    role: "Check-in Desk",
    organization: "",
    volunteer_id: "",
    password: makeFriendlyPassword(),
    send_email: true,
  });

  // Bulk Upload Form State
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkSendEmail, setBulkSendEmail] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Quick Action feedback
  const [copiedKey, setCopiedKey] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const load = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listVolunteers(accessToken);
      setVolunteers(data || []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load volunteers.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = async () => {
    setBusy(true);
    setErrorMessage("");
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "volunteer", selectedIds);
      setSelectedIds([]);
      setSuccessMessage(`${result.deleted} volunteer record(s) deleted.`);
      await load();
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete selected volunteers.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken]);

  const copyToClipboard = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch (_) {
      // fallback
    }
  };

  // 1. Download Template Handler
  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadVolunteerTemplate(accessToken);
      onFeedback?.("Downloaded official volunteer Excel template.");
    } catch (error) {
      setErrorMessage(error.message || "Failed to download template.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // 2. Create Single Volunteer Handler
  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    setBusy(true);
    setModalError("");
    setErrorMessage("");
    try {
      const result = await createVolunteer(accessToken, form);
      setIsAddModalOpen(false);
      setModalError("");
      setForm({
        display_name: "",
        email: "",
        phone: "",
        role: "Check-in Desk",
        organization: "",
        volunteer_id: "",
        password: makeFriendlyPassword(),
        send_email: true,
      });
      const note = result.email_sent
        ? `Volunteer created and login credentials emailed to ${result.email}.`
        : `Volunteer account created. ID: ${result.volunteer_id}, Password: ${result.generated_password}`;
      setSuccessMessage(note);
      onFeedback?.(note);
      await load();
    } catch (error) {
      setModalError(error.message || "Unable to create volunteer.");
    } finally {
      setBusy(false);
    }
  };

  // 3. Bulk Upload Handler
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;
    setBulkLoading(true);
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      formData.append("send_email", bulkSendEmail ? "true" : "false");

      const result = await bulkUploadVolunteers(accessToken, formData);
      setRecentImports(result);
      setBulkFile(null);
      const note = `Successfully imported ${result.imported_count} volunteers (${result.skipped_count} skipped).`;
      setSuccessMessage(note);
      onFeedback?.(note);
      await load();
    } catch (error) {
      setErrorMessage(error.message || "Failed to bulk upload volunteers.");
    } finally {
      setBulkLoading(false);
    }
  };

  // 4. Toggle Status (Active / Disabled)
  const handleToggleStatus = async (vol) => {
    try {
      await updateVolunteer(accessToken, vol.id, { active: !vol.active });
      onFeedback?.(`Volunteer ${vol.display_name} is now ${vol.active ? "disabled" : "active"}.`);
      await load();
    } catch (error) {
      setErrorMessage(error.message || "Unable to update status.");
    }
  };

  // 5. Send/Reset Login Credentials
  const handleSendCredentials = async (vol) => {
    setBusy(true);
    try {
      const result = await sendVolunteerCredentials(accessToken, vol.id);
      const note = result.email_sent
        ? `Login credentials dispatched to ${vol.email}. (Password: ${result.generated_password})`
        : `New password generated for ${vol.volunteer_id}: ${result.generated_password}`;
      setSuccessMessage(note);
      onFeedback?.(note);
      await load();
    } catch (error) {
      setErrorMessage(error.message || "Failed to dispatch credentials.");
    } finally {
      setBusy(false);
    }
  };

  // 6. Preview Certificate
  const handlePreviewCertificate = async (vol) => {
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setErrorMessage("Allow pop-ups to preview the volunteer certificate.");
      return;
    }
    previewWindow.document.title = `Volunteer Certificate - ${vol.display_name}`;
    try {
      const blob = await previewVolunteerCertificate(accessToken, vol.id);
      const url = URL.createObjectURL(blob);
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      previewWindow.close();
      setErrorMessage(error.message || "Failed to generate certificate preview.");
    }
  };

  // 7. Send Certificate
  const handleSendCertificate = async (vol) => {
    if (!vol.email) {
      setErrorMessage("Please update the volunteer with an email address first.");
      return;
    }
    setBusy(true);
    try {
      const result = await sendVolunteerCertificate(accessToken, vol.id);
      const note = result.sent
        ? `Certificate of Appreciation successfully emailed to ${vol.email}.`
        : "Failed to email certificate. Check SMTP settings.";
      setSuccessMessage(note);
      onFeedback?.(note);
      await load();
    } catch (error) {
      setErrorMessage(error.message || "Failed to send certificate.");
    } finally {
      setBusy(false);
    }
  };

  // Filtered List
  const filteredVolunteers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return volunteers.filter((vol) => {
      if (roleFilter !== "all" && vol.role !== roleFilter) return false;
      if (statusFilter === "active" && !vol.active) return false;
      if (statusFilter === "disabled" && vol.active) return false;

      if (!query) return true;
      return [
        vol.display_name,
        vol.volunteer_id,
        vol.email,
        vol.phone,
        vol.role,
        vol.organization,
      ].some((val) => String(val || "").toLowerCase().includes(query));
    });
  }, [volunteers, searchText, roleFilter, statusFilter]);

  // Unique roles in current database
  const availableRoles = useMemo(() => {
    const roles = new Set(ROLE_OPTIONS);
    volunteers.forEach((v) => {
      if (v.role) roles.add(v.role);
    });
    return Array.from(roles);
  }, [volunteers]);

  return (
    <div className="space-y-6">
      {/* 1. TOP COMMAND HEADER & ACTION BUTTON GROUP */}
      <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#071313] text-[#d9ff38]">
                <UserCheck className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#071313]/50 font-mono">
                Workforce & Staff Operations
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#071313] mt-1">Volunteer & Station Desks</h2>
            <p className="text-xs text-[#071313]/60 max-w-2xl mt-0.5">
              Provision dedicated credentials for race-day check-in desks, manage station duties,
              and issue official Certificates of Appreciation to volunteers.
            </p>
          </div>

          {/* THE BUTTON GROUP */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Add Volunteer Button */}
            <Button
              variant="accent"
              onClick={() => {
                setModalError("");
                setForm((prev) => ({
                  ...prev,
                  password: makeFriendlyPassword(),
                }));
                setIsAddModalOpen(true);
              }}
              className="h-10 font-bold px-4 text-xs shadow-sm hover:scale-[1.02] transition-transform"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Volunteer
            </Button>

            {/* Download Excel Template Button */}
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="h-10 text-xs font-bold border-black/15 bg-white text-[#071313] hover:bg-black/5 px-3.5"
            >
              {downloadingTemplate ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5 text-emerald-700" />
              )}
              Template (.xlsx)
            </Button>

            {/* Bulk Import Button */}
            <Button
              variant="outline"
              onClick={() => setIsBulkModalOpen(true)}
              className="h-10 text-xs font-bold border-black/15 bg-white text-[#071313] hover:bg-black/5 px-3.5"
            >
              <Upload className="h-4 w-4 mr-1.5 text-[#ff5f3d]" />
              Bulk Import
            </Button>

            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={load}
              disabled={loading}
              title="Refresh volunteers list"
              className="h-10 w-10 text-black/50 hover:text-black"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* METRICS HUD TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-black/5 mt-6">
          <div className="rounded-xl bg-[#fbf8ef] p-3.5 border border-black/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black/50 block font-mono">
              Total Volunteers
            </span>
            <span className="text-2xl font-black text-[#071313] mt-0.5 block">
              {volunteers.length}
            </span>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block font-mono">
              Active Desks
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
              {volunteers.filter((v) => v.active).length}
            </span>
          </div>

          <div className="rounded-xl bg-blue-50 p-3.5 border border-blue-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block font-mono">
              Check-In Staff
            </span>
            <span className="text-2xl font-black text-blue-900 mt-0.5 block">
              {volunteers.filter((v) => v.role === "Check-in Desk" && v.active).length}
            </span>
          </div>

          <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block font-mono">
              Certs Issued
            </span>
            <span className="text-2xl font-black text-amber-950 mt-0.5 block">
              {volunteers.filter((v) => v.certificate_status === "issued").length}
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-xs text-emerald-950 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-300 p-4 text-xs text-red-950 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-600 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, ID, role, college, email..."
              className="h-10 w-full rounded-xl border border-black/15 bg-white pl-9 pr-8 text-xs text-[#071313] placeholder:text-black/40 focus:border-[#071313] focus:outline-none"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* ROLE FILTER */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
          >
            <option value="all">All Roles & Stations</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled / Revoked</option>
          </select>
        </div>
      </div>

      {/* 3. VOLUNTEERS DIRECTORY TABLE */}
      <SelectedDeleteAction
        count={selectedIds.length}
        label="volunteer"
        busy={busy}
        onDelete={deleteSelected}
      />
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingIndicator label="Loading volunteers directory…" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/10 bg-[#fbf8ef] text-[#071313] font-mono">
                <tr>
                  <th className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={filteredVolunteers.length > 0 && filteredVolunteers.every((vol) => selectedIds.includes(vol.id))}
                      onChange={(event) => setSelectedIds(event.target.checked ? filteredVolunteers.map((vol) => vol.id) : [])}
                      aria-label="Select all visible volunteers"
                    />
                  </th>
                  <th className="p-4 uppercase font-bold">Volunteer & College</th>
                  <th className="p-4 uppercase font-bold">Assigned Duty</th>
                  <th className="p-4 uppercase font-bold">Volunteer ID</th>
                  <th className="p-4 uppercase font-bold">Contact</th>
                  <th className="p-4 uppercase font-bold text-center">Status</th>
                  <th className="p-4 uppercase font-bold">Certificate</th>
                  <th className="p-4 uppercase font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredVolunteers.map((vol) => (
                  <tr key={vol.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(vol.id)}
                        onChange={() => setSelectedIds((current) => current.includes(vol.id) ? current.filter((id) => id !== vol.id) : [...current, vol.id])}
                        aria-label={`Select volunteer ${vol.display_name}`}
                      />
                    </td>
                    {/* Volunteer & College */}
                    <td className="p-4">
                      <p className="font-black text-sm text-[#071313]">{vol.display_name}</p>
                      {vol.organization ? (
                        <span className="text-[11px] text-black/60 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3 text-black/40" />
                          {vol.organization}
                        </span>
                      ) : (
                        <span className="text-[10px] text-black/40 italic">Individual Volunteer</span>
                      )}
                    </td>

                    {/* Assigned Duty */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-[#071313] text-[#d9ff38] px-2.5 py-1 rounded-md">
                        {vol.role || "Check-in Desk"}
                      </span>
                    </td>

                    {/* Volunteer ID */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-[#071313] bg-black/5 px-2 py-0.5 rounded">
                          {vol.volunteer_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(vol.volunteer_id, `id-${vol.id}`)}
                          title="Copy Volunteer ID"
                          className="text-black/30 hover:text-black p-1"
                        >
                          {copiedKey === `id-${vol.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {vol.credentials_sent_at ? (
                        <span className="text-[10px] text-emerald-800 font-semibold block mt-1">
                          ✓ Credentials emailed
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-800 block mt-1">
                          Login email pending
                        </span>
                      )}
                    </td>

                    {/* Contact Info */}
                    <td className="p-4 font-mono text-xs">
                      {vol.email ? (
                        <p className="text-[#071313] flex items-center gap-1">
                          <Mail className="h-3 w-3 text-black/40" />
                          {vol.email}
                        </p>
                      ) : (
                        <span className="text-black/30 text-[11px]">No email</span>
                      )}
                      {vol.phone && (
                        <p className="text-black/60 flex items-center gap-1 mt-0.5 text-[11px]">
                          <Phone className="h-3 w-3 text-black/40" />
                          {vol.phone}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      {vol.active ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-sm">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-700">
                          <ShieldAlert className="h-3 w-3" /> Revoked
                        </span>
                      )}
                    </td>

                    {/* Volunteer Certificate */}
                    <td className="p-4">
                      {vol.certificate_status === "issued" ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            <Award className="h-3 w-3" /> Issued
                          </span>
                          {vol.certificate_sent_at && (
                            <p className="text-[10px] text-black/40 font-mono mt-0.5">
                              {new Date(vol.certificate_sent_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-black/50 font-mono">Not Issued</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Send / Resend Login Email */}
                        {vol.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendCredentials(vol)}
                            disabled={busy}
                            title="Generate/reset friendly password & email to volunteer"
                            className="h-7 text-[11px] px-2 text-[#071313] hover:bg-black/5"
                          >
                            <Mail className="h-3 w-3 mr-1 text-[#ff5f3d]" />
                            {vol.credentials_sent_at ? "Resend Login" : "Send Login"}
                          </Button>
                        )}

                        {/* Certificate Preview */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewCertificate(vol)}
                          disabled={busy}
                          title="Preview Certificate of Volunteering PDF"
                          className="h-7 text-[11px] px-2 text-emerald-900 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                        >
                          <Award className="h-3 w-3 mr-1" />
                          Cert Preview
                        </Button>

                        {/* Send Certificate */}
                        {vol.email && (
                          <Button
                            size="sm"
                            onClick={() => handleSendCertificate(vol)}
                            disabled={busy}
                            title="Email Certificate of Volunteering to volunteer"
                            className="h-7 text-[11px] px-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            {vol.certificate_status === "issued" ? "Resend Cert" : "Send Cert"}
                          </Button>
                        )}

                        {/* Toggle Active Status */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(vol)}
                          className={`h-7 px-2 text-[11px] font-bold ${
                            vol.active
                              ? "text-red-700 hover:bg-red-50 hover:border-red-300"
                              : "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                          }`}
                        >
                          {vol.active ? "Revoke" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredVolunteers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-xs text-black/50">
                      No volunteers match the current search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. "ADD VOLUNTEER" MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#071313] text-[#d9ff38]">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#071313]">Register New Volunteer</h3>
                  <p className="text-xs text-black/50">
                    Add personal details, assign duty station, and provision login credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!busy) {
                    setIsAddModalOpen(false);
                    setModalError("");
                  }
                }}
                className="h-8 w-8 rounded-full bg-black/5 font-bold text-black/60 hover:bg-black/10 flex items-center justify-center disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* In-Modal Error Banner */}
            {modalError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-950 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-950">Unable to create volunteer</p>
                  <p className="text-rose-800 text-[11px] mt-0.5">{modalError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalError("")}
                  className="text-[11px] font-bold text-rose-700 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <form onSubmit={handleCreateVolunteer} className="space-y-4 text-xs">
              {/* Row 1: Full Name & Role */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#071313]">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="e.g. Siddharth Verma"
                    className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#071313]">
                    Assigned Station / Role *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#071313]">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. siddharth@example.com"
                    className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                  />
                  <p className="text-[10px] text-black/50 mt-1">
                    Login credentials and certificates will be emailed here.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#071313]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: College / Organization */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#071313]">
                  College / Delegation / Club
                </label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="e.g. Rewa Engineering College, NCC Unit, Rotary Club"
                  className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>

              {/* Row 4: Credentials Card (Auto-generated & Memorable) */}
              <div className="rounded-2xl border border-black/10 bg-[#fbf8ef] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#071313] font-mono flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-[#ff5f3d]" />
                    Event-Day Check-in Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        password: makeFriendlyPassword(),
                      }))
                    }
                    className="text-[11px] font-bold text-[#ff5f3d] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> Regenerate Password
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/60">
                      Volunteer ID (Username)
                    </label>
                    <input
                      type="text"
                      value={form.volunteer_id}
                      onChange={(e) => {
                        setModalError("");
                        setForm({
                          ...form,
                          volunteer_id: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
                        });
                      }}
                      placeholder="Leave blank to auto-generate (e.g. vol-siddharth)"
                      className="mt-1 h-9 w-full rounded-lg border border-black/20 bg-white px-3 font-mono text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/60">
                      Friendly Password
                    </label>
                    <input
                      required
                      type="text"
                      value={form.password}
                      onChange={(e) => {
                        setModalError("");
                        setForm({ ...form, password: e.target.value });
                      }}
                      className="mt-1 h-9 w-full rounded-lg border border-black/20 bg-white px-3 font-mono text-xs text-[#071313] font-bold focus:border-[#071313] focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.send_email}
                    onChange={(e) => setForm({ ...form, send_email: e.target.checked })}
                    className="accent-[#071313] h-4 w-4 rounded"
                  />
                  <span className="text-xs font-semibold text-[#071313]">
                    Send login credentials to volunteer via email immediately
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-black/10">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (!busy) {
                      setIsAddModalOpen(false);
                      setModalError("");
                    }
                  }}
                  className="h-10 text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={busy}
                  className="h-10 text-xs font-bold px-5"
                >
                  {busy ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering Volunteer…
                    </span>
                  ) : (
                    "Create Volunteer"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. "BULK IMPORT EXCEL" MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#071313] text-[#d9ff38]">
                  <Upload className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#071313]">Bulk Import Volunteers</h3>
                  <p className="text-xs text-black/50">
                    Upload an Excel (.xlsx) or CSV file with the volunteer roster to auto-generate
                    credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setRecentImports(null);
                }}
                className="h-8 w-8 rounded-full bg-black/5 font-bold text-black/60 hover:bg-black/10 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-950">
              <div className="space-y-0.5">
                <p className="font-bold">Need the official roster template?</p>
                <p className="text-blue-900/80 text-[11px]">
                  Columns: Full Name, Email, Phone, Assigned Role, College / Organization.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                className="h-8 text-xs bg-white text-blue-950 font-bold border-blue-300"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Download .xlsx
              </Button>
            </div>

            {/* Upload Form */}
            {!recentImports ? (
              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-black/20 bg-black/[0.02] p-8 text-center hover:bg-black/[0.04] transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-black/40 mb-2" />
                  <label htmlFor="bulk-file-input" className="cursor-pointer block">
                    <span className="text-xs font-bold text-[#ff5f3d] hover:underline block">
                      Choose an Excel (.xlsx, .xls) or CSV file
                    </span>
                    <span className="text-[11px] text-black/50 block mt-1">
                      {bulkFile ? (
                        <strong className="text-[#071313] font-mono text-xs">
                          Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
                        </strong>
                      ) : (
                        "or drag and drop here up to 10 MB"
                      )}
                    </span>
                  </label>
                  <input
                    id="bulk-file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </div>

                <div className="rounded-xl bg-[#fbf8ef] p-3.5 border border-black/5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkSendEmail}
                      onChange={(e) => setBulkSendEmail(e.target.checked)}
                      className="accent-[#071313] h-4 w-4 rounded"
                    />
                    <span className="text-xs font-semibold text-[#071313]">
                      Auto-send event-day credentials to each volunteer via email upon import
                    </span>
                  </label>
                  <p className="text-[11px] text-black/50 ml-6 mt-0.5">
                    Credentials will also be shown on screen and can be copied or resent at any time.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="h-10 text-xs px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={bulkLoading || !bulkFile}
                    className="h-10 text-xs font-bold px-6"
                  >
                    {bulkLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Importing & Generating Credentials…
                      </>
                    ) : (
                      "Start Import"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* IMPORT RESULT SUMMARY & CREDENTIALS REVIEW */
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-xs text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">
                        Successfully provisioned {recentImports.imported_count} volunteer accounts!
                      </p>
                      {recentImports.skipped_count > 0 && (
                        <p className="text-emerald-900/80">
                          {recentImports.skipped_count} row(s) were skipped due to missing names.
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const allText = recentImports.imported
                        .map(
                          (a) =>
                            `Name: ${a.display_name} | Role: ${a.role} | ID: ${a.volunteer_id} | Password: ${a.generated_password}`
                        )
                        .join("\n");
                      copyToClipboard(allText, "all-creds");
                    }}
                    className="h-8 text-xs font-bold bg-white text-emerald-900 border-emerald-300"
                  >
                    {copiedKey === "all-creds" ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy All Credentials
                      </>
                    )}
                  </Button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-xl border border-black/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fbf8ef] text-[#071313] font-mono sticky top-0 border-b border-black/10">
                      <tr>
                        <th className="p-2.5">Name & Role</th>
                        <th className="p-2.5">Volunteer ID</th>
                        <th className="p-2.5">Password</th>
                        <th className="p-2.5">Email Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-mono text-[11px]">
                      {recentImports.imported.map((acc) => (
                        <tr key={acc.id} className="hover:bg-black/[0.02]">
                          <td className="p-2.5 font-sans font-bold text-[#071313]">
                            {acc.display_name}
                            <span className="block font-normal text-[10px] text-black/50">
                              {acc.role}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-[#071313]">{acc.volunteer_id}</td>
                          <td className="p-2.5 text-emerald-800 font-bold">
                            {acc.generated_password}
                          </td>
                          <td className="p-2.5">
                            {acc.email_sent ? (
                              <span className="text-emerald-700 font-bold">✓ Emailed</span>
                            ) : acc.email ? (
                              <span className="text-black/40">Pending</span>
                            ) : (
                              <span className="text-black/30">No email</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="accent"
                    onClick={() => {
                      setIsBulkModalOpen(false);
                      setRecentImports(null);
                    }}
                    className="h-9 text-xs font-bold px-5"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
