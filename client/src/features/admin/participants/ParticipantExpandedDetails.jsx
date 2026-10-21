import React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  UserCheck,
  CheckCircle2,
  Eye,
  Copy,
  Shirt,
  Mail,
  FileText,
  Send,
  Award,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ParticipantFinancialCard } from "./ParticipantFinancialCard";
import { ParticipantWhatsAppCard } from "./ParticipantWhatsAppCard";

export function ParticipantExpandedDetails({
  rider,
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

  return (
    <tr className="bg-slate-50/70 border-b border-slate-200">
      <td colSpan={7} className="p-0">
        <div className="p-5 border-l-4 border-l-[#0078d4] space-y-5">
          {/* 5-COLUMN LOGISTICS, WHATSAPP & FINANCIAL GRID */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* CARD 1: CHECK-IN & QR TOKEN */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-slate-600" />
                  Race-Day Check-in
                </span>
                {isCheckedIn ? (
                  <span className="rounded-md bg-emerald-700 text-white px-2.5 py-0.5 text-xs font-bold uppercase">
                    Verified
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-xs font-bold">
                    Not Checked In
                  </span>
                )}
              </div>

              {isCheckedIn ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Checked in on {new Date(rider.checked_in_at).toLocaleString()}
                  </p>
                  {rider.checked_in_by && (
                    <p className="text-xs text-emerald-900 font-medium">
                      Station / Staff: <strong>{rider.checked_in_by}</strong>
                    </p>
                  )}
                  <p className="text-xs text-emerald-900 font-medium">
                    Method:{" "}
                    <span className="uppercase font-mono font-bold">
                      {rider.checkin_method || "manual"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 font-medium">
                  Pending race-day arrival. Volunteer will scan this rider's QR pass or look up by ID.
                </div>
              )}

              {/* QR Code Pass Preview */}
              <div className="pt-2 flex items-center gap-4">
                {rider.checkin_token ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onShowQr(rider)}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white shadow-xs hover:border-[#0078d4] transition"
                      title="Click to enlarge QR pass"
                    >
                      <QRCodeSVG
                        value={`nvcyclothon-checkin:${rider.checkin_token}`}
                        size={64}
                        level="M"
                      />
                    </button>
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-900 block">
                        Rider QR Pass
                      </span>
                      <button
                        type="button"
                        onClick={() => onShowQr(rider)}
                        className="text-xs font-bold text-[#0078d4] hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View full screen
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            rider.checkin_token,
                            `token-${rider.id}`
                          )
                        }
                        className="text-xs font-mono text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedId === `token-${rider.id}` ? "Copied!" : "Copy Token"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">No QR token issued</p>
                )}
              </div>
            </div>

            {/* CARD 2: RIDER APPAREL & PROFILE */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt className="h-4 w-4 text-slate-600" />
                  Apparel & Profile
                </span>
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
              </div>
            </div>

            {/* CARD 3: WHATSAPP UPDATES & CONTACT */}
            <ParticipantWhatsAppCard rider={rider} />

            {/* CARD 4: DOCUMENT & EMAIL DELIVERY LOG */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-600" />
                  Email & Document Logs
                </span>
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
            </div>

            {/* CARD 4: PAYMENT & FINANCIAL DETAILS */}
            <ParticipantFinancialCard
              rider={rider}
              copyToClipboard={copyToClipboard}
              copiedId={copiedId}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}
