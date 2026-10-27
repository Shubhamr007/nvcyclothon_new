import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserCheck,
  Eye,
  Copy,
  Check,
  QrCode,
  Shirt,
  Mail,
  FileText,
  Send,
  Award,
  UserRound,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AdminSlideOver } from "../components/AdminSlideOver";
import { ParticipantFinancialCard } from "./ParticipantFinancialCard";
import { ParticipantWhatsAppCard } from "./ParticipantWhatsAppCard";
import { needsRegistrationFollowup } from "./directoryUtils";

export function ParticipantExpandedDetails({
  rider,
  onClose,
  onSaveGuardianConsent,
  onSendFollowupLink,
  onShowQr,
  copyToClipboard,
  copiedId,
  previewRiderPass,
  generateRiderPasses,
  previewCertificate,
  generateCertificates,
  busy = false,
}) {
  const isCheckedIn = rider.status === "checked_in";
  const followupNeeded = needsRegistrationFollowup(rider);
  const missingDetailLabels = [
    ["address_line1", "Street address"],
    ["state", "State"],
    ["postal_code", "Postal code"],
    ["emergency_contact", "Emergency contact"],
    ...(Number(rider.age) < 18
      ? [
          ["guardian_name", "Guardian name"],
          ["guardian_relationship", "Guardian relationship"],
          ["guardian_email", "Guardian email"],
          ["guardian_phone", "Guardian phone"],
        ]
      : []),
  ]
    .filter(([key]) => !String(rider[key] || "").trim())
    .map(([, label]) => label);
  const [guardianForm, setGuardianForm] = useState({
    guardian_name: rider.guardian_name || "",
    guardian_relationship: rider.guardian_relationship || "",
    guardian_email: rider.guardian_email || "",
    guardian_phone: rider.guardian_phone || "",
  });
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: UserCheck },
    { id: "contact", label: "Contact & consent", icon: UserRound },
    { id: "payments", label: "Payment", icon: CreditCard },
    { id: "deliveries", label: "Emails & documents", icon: ClipboardList },
  ];

  return (
    <AdminSlideOver
      isOpen={Boolean(rider)}
      onClose={onClose}
      title={rider.full_name}
      subtitle={`Participant #${rider.id} · ${rider.ride_category || "Ride category unavailable"}`}
      icon={UserCheck}
      side="right"
      width="max-w-[40vw] max-sm:max-w-[calc(100vw-1rem)]"
      bodyClassName="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6"
      footer={(
        <div className="flex w-full justify-start">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    >
        <div className="space-y-5">
          {followupNeeded && <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">Need updated details from this participant?</p>
            <Button type="button" variant="outline" size="sm" onClick={() => onSendFollowupLink?.(rider.id)}>
              Email participant details form
            </Button>
          </div>}
          <div role="tablist" aria-label="Participant details" className="flex gap-3 overflow-x-auto border-b border-slate-200 bg-transparent px-1">
            {tabs.map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                id={`participant-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`participant-panel-${id}`}
                tabIndex={activeTab === id ? 0 : -1}
                onClick={() => setActiveTab(id)}
                onKeyDown={(event) => {
                  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
                  let nextIndex = currentIndex;
                  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
                  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                  if (event.key === "Home") nextIndex = 0;
                  if (event.key === "End") nextIndex = tabs.length - 1;
                  if (nextIndex !== currentIndex) {
                    event.preventDefault();
                    const nextTab = tabs[nextIndex];
                    setActiveTab(nextTab.id);
                    document.getElementById(`participant-tab-${nextTab.id}`)?.focus();
                  }
                }}
                className={`-mb-px inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors sm:flex-1 ${activeTab === id ? "border-[#0078d4] text-[#0067b8]" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                <TabIcon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
          {activeTab === "overview" && (
          <div role="tabpanel" id="participant-panel-overview" aria-labelledby="participant-tab-overview" className="space-y-6">
            <section aria-label="Registration record timeline" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Registration record</h4>
                {rider.followup_email_status && (
                  <span className="text-xs text-slate-500">Details form email: {rider.followup_email_status}</span>
                )}
              </div>
              <div className="relative grid grid-cols-2 gap-4 pt-1">
                <div aria-hidden="true" className="absolute left-1/4 right-1/4 top-[15px] h-0.5 bg-slate-950" />
                <div className="relative z-10 flex min-w-0 flex-col items-center gap-2 text-center">
                  <span className="h-6 w-6 rounded-full border-2 border-white bg-[#0078d4] shadow-sm" />
                  <span className="text-xs font-semibold text-slate-900">Registration created</span>
                  <span className="text-[11px] leading-4 text-slate-500">
                    {rider.created_at
                      ? `${new Date(rider.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST`
                      : "Timestamp unavailable"}
                  </span>
                </div>
                <div className="relative z-10 flex min-w-0 flex-col items-center gap-2 text-center">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-white shadow-sm ${followupNeeded ? "bg-red-600" : "bg-green-600"}`}>
                    {followupNeeded ? <span className="text-sm font-bold leading-none">!</span> : <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`text-xs font-semibold ${followupNeeded ? "text-red-700" : "text-green-700"}`}>
                    {followupNeeded ? "Required details missing" : rider.registration_details_completed_at ? "Details submitted" : "Details complete"}
                  </span>
                  <span className="text-[11px] leading-4 text-slate-500">
                    {followupNeeded
                      ? missingDetailLabels.join(", ")
                      : rider.registration_details_completed_at
                        ? `${new Date(rider.registration_details_completed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST`
                        : "Provided during registration"}
                  </span>
                </div>
              </div>
            </section>
            {/* CARD 2: RIDER APPAREL & PROFILE */}
            <section className="space-y-3 border-t border-slate-200 pt-5">
              <div className="pb-1">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Shirt className="h-4 w-4 text-slate-600" />
                  Apparel & Profile
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">T-Shirt Size</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {rider.t_shirt_size || "Not specified"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">City / Location</span>
                  <span className="font-bold text-slate-900">
                    {rider.city || "Rewa (M.P.)"}
                  </span>
                </div>

                {(rider.address_line1 || rider.address_line2 || rider.state || rider.postal_code) && (
                  <div className="py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-semibold block">Postal Address</span>
                    <p className="mt-1 whitespace-pre-line break-words font-medium text-slate-900">
                      {[rider.address_line1, rider.address_line2, rider.city, rider.state, rider.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Gender</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {rider.gender || "Unspecified"}
                  </span>
                </div>

                {rider.batch_name && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-semibold">Batch / Wave</span>
                    <span className="font-bold text-[#005a9e] bg-[#deecf9] border border-[#c7e0f4] px-2.5 py-0.5 rounded">
                      {rider.batch_name}
                    </span>
                  </div>
                )}

                {rider.organization_name && (
                  <div className="pt-1">
                    <span className="text-xs text-slate-600 uppercase font-mono font-bold block">
                      Delegation / Club
                    </span>
                    <p className="font-bold text-slate-900 text-xs">
                      🏛️ {rider.organization_name} ({rider.organization_type || "Club"})
                    </p>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2">
                  <span className="text-slate-600 font-semibold">Identifiable media permission</span>
                  <p className={rider.media_consent_accepted ? "font-bold text-emerald-700" : "font-bold text-slate-600"}>
                    {rider.media_consent_accepted ? "Granted" : "Not granted"}
                  </p>
                  <p className="text-[10px] text-slate-500">Recorded: {rider.media_consent_at ? `${new Date(rider.media_consent_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" })} IST` : "not recorded"}</p>
                  <p className="mt-1 text-[10px] text-slate-500">Waiver accepted: {rider.waiver_accepted ? "Yes" : "No"} · {rider.waiver_accepted_at ? `${new Date(rider.waiver_accepted_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" })} IST` : "timestamp unavailable"}</p>
                  <p className="text-[10px] text-slate-500">Privacy notice acknowledged: {rider.privacy_accepted ? "Yes" : "No"} · {rider.privacy_accepted_at ? `${new Date(rider.privacy_accepted_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" })} IST` : "timestamp unavailable"}</p>
                  <p className="mt-1 text-[10px] text-slate-500">Policy version: {rider.privacy_notice_version || "legacy-unversioned"}</p>
                </div>
              </div>
            </section>
          </div>
          )}

            {/* CARD 3: WHATSAPP UPDATES & CONTACT */}
          {activeTab === "contact" && (
          <div role="tabpanel" id="participant-panel-contact" aria-labelledby="participant-tab-contact" className="space-y-6">
            {Number(rider.age) < 18 && (
              <section className="space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-semibold text-slate-900">Parent / Guardian</h4>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900">{rider.guardian_name || "Details missing"}</p>
                  {rider.guardian_relationship && <p className="text-slate-600">{rider.guardian_relationship}</p>}
                  {rider.guardian_phone && <p><a className="text-blue-700 underline" href={`tel:${rider.guardian_phone}`}>{rider.guardian_phone}</a></p>}
                  {rider.guardian_email && <p className="break-all"><a className="text-blue-700 underline" href={`mailto:${rider.guardian_email}`}>{rider.guardian_email}</a></p>}
                  <p className={rider.guardian_consent_accepted ? "font-bold text-emerald-700" : "font-bold text-amber-800"}>
                    {rider.guardian_consent_accepted ? "Guardian consent: recorded" : rider.guardian_name ? "Guardian contact details captured; consent not verified" : "Guardian contact details missing"}
                  </p>
                  {rider.guardian_consent_source && rider.guardian_consent_source !== "not-applicable" && (
                    <p className="text-slate-500">Source: {rider.guardian_consent_source === "in-person-admin" ? "in-person check-in" : rider.guardian_consent_source === "participant-provided" ? "contact details entered during registration; consent not verified" : "online declaration; identity not verified"}</p>
                  )}
                  {rider.guardian_consent_accepted && <p className="text-slate-500">Recorded: {rider.guardian_consent_at ? `${new Date(rider.guardian_consent_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" })} IST` : "timestamp unavailable"}</p>}
                  <p className="text-[10px] text-slate-500">Guardian contact details alone do not establish consent. Staff may record consent after the guardian is present and their identity and relationship are checked.</p>
                  {!rider.guardian_consent_accepted && (
                    <form
                      className="mt-3 space-y-2 border-t border-slate-100 pt-3"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (!onSaveGuardianConsent) return;
                        setSavingGuardian(true);
                        try {
                          const saved = await onSaveGuardianConsent(rider.id, guardianForm);
                          if (!saved) return;
                        } finally {
                          setSavingGuardian(false);
                        }
                      }}
                    >
                      <p className="font-bold text-slate-700">Record in-person consent</p>
                      <p className="text-[10px] leading-4 text-slate-500">Use only after the parent / lawful guardian is present, has consented, and staff have checked their identity and relationship. Do not upload or retain ID copies.</p>
                      {[
                        ["guardian_name", "Guardian full name", "text"],
                        ["guardian_relationship", "Relationship", "text"],
                        ["guardian_email", "Guardian email", "email"],
                        ["guardian_phone", "Guardian mobile", "tel"],
                      ].map(([key, label, type]) => (
                        <label key={key} className="block text-[10px] font-semibold text-slate-600">
                          {label}
                          <input
                            required
                            type={type}
                            value={guardianForm[key]}
                            onChange={(event) => setGuardianForm((current) => ({ ...current, [key]: event.target.value }))}
                            className="mt-1 min-h-9 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-900"
                          />
                        </label>
                      ))}
                      <label className="flex items-start gap-2 text-[10px] leading-4 text-slate-700">
                        <input required type="checkbox" className="mt-0.5" />
                        I confirm the parent / lawful guardian gave consent in person and I checked their identity and relationship.
                      </label>
                      <Button type="submit" size="sm" disabled={savingGuardian} className="w-full">
                        {savingGuardian ? "Saving…" : "Record guardian consent"}
                      </Button>
                    </form>
                  )}
                </div>
              </section>
            )}

            <ParticipantWhatsAppCard rider={rider} />
          </div>
          )}

            {/* CARD 4: DOCUMENT & EMAIL DELIVERY LOG */}
          {activeTab === "deliveries" && (
          <div role="tabpanel" id="participant-panel-deliveries" aria-labelledby="participant-tab-deliveries" className="space-y-6">
            <section className="space-y-3">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Mail className="h-4 w-4 text-slate-600" />
                  Email & Document Logs
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Registration Email</span>
                  <span className="font-bold text-slate-900">
                    {rider.registration_email_status || "not sent"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Official Rider Pass</span>
                  <span className="font-bold text-slate-900">
                    {rider.rider_pass_status || "not sent"}
                  </span>
                </div>

                <div className="py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">Finisher Certificate</span>
                    <span className="font-bold text-slate-900">
                      {rider.certificate_delivery_status ||
                        rider.certificate_status ||
                        "not sent"}
                    </span>
                  </div>
                  {rider.certificate_sent_at && (
                    <p className="text-xs text-slate-600 font-mono font-medium mt-0.5">
                      Sent {new Date(rider.certificate_sent_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {rider.checkin_token && ["generated", "sent"].includes(rider.rider_pass_status) && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <QrCode className="h-4 w-4 text-slate-500" />
                    Check-in QR is ready with this rider pass
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={() => onShowQr(rider)} size="sm" variant="outline">
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View QR
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(rider.checkin_token, `token-${rider.id}`)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {copiedId === `token-${rider.id}` ? "Copied!" : "Copy token"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Actions for this single rider */}
              <div className="pt-2.5 flex flex-wrap gap-2 border-t border-slate-100">
                {rider.payment_status === "paid" &&
                  rider.status !== "cancelled" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => previewRiderPass(rider.id)}
                        className="h-7 text-xs px-2.5 border border-slate-300 text-slate-800 bg-white font-bold hover:bg-slate-100"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> Pass Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => generateRiderPasses([rider.id])}
                        disabled={busy}
                        className="h-7 text-xs px-2.5 bg-[#0078d4] text-white hover:bg-[#005a9e] font-bold shadow-xs"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        {rider.rider_pass_status === "sent" ? "Re-send Pass" : "Send Pass"}
                      </Button>
                    </>
                  )}

                {isCheckedIn && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => previewCertificate(rider.id)}
                      className="h-7 text-xs px-2.5 text-emerald-900 border border-emerald-300 bg-emerald-50 font-bold hover:bg-emerald-100"
                    >
                      <Award className="h-3.5 w-3.5 mr-1" /> Cert Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generateCertificates([rider.id])}
                      disabled={busy}
                      className="h-7 text-xs px-2.5 bg-emerald-700 text-white hover:bg-emerald-800 font-bold"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      {rider.certificate_delivery_status === "sent" ? "Re-send Cert" : "Send Cert"}
                    </Button>
                  </>
                )}
              </div>
            </section>
          </div>
          )}

            {/* CARD 4: PAYMENT & FINANCIAL DETAILS */}
          {activeTab === "payments" && (
          <div role="tabpanel" id="participant-panel-payments" aria-labelledby="participant-tab-payments" className="space-y-4">
            <ParticipantFinancialCard
              rider={rider}
              copyToClipboard={copyToClipboard}
              copiedId={copiedId}
            />
          </div>
          )}
          </motion.div>
          </AnimatePresence>
        </div>
    </AdminSlideOver>
  );
}
