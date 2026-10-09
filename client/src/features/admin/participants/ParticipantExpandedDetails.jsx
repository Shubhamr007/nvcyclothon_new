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
    <tr className="bg-[#fbf8ef] border-b border-black/10">
      <td colSpan={7} className="p-0">
        <div className="p-6 border-l-4 border-l-[#071313] space-y-6">
          {/* 3-COLUMN LOGISTICS GRID */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* CARD 1: CHECK-IN & QR TOKEN */}
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black/50 font-mono flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-[#071313]" />
                  Race-Day Check-in
                </span>
                {isCheckedIn ? (
                  <span className="rounded-md bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black uppercase">
                    Verified
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                    Not Checked In
                  </span>
                )}
              </div>

              {isCheckedIn ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-950 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    Checked in on {new Date(rider.checked_in_at).toLocaleString()}
                  </p>
                  {rider.checked_in_by && (
                    <p className="text-[11px] text-emerald-900/80">
                      Station / Staff: <strong>{rider.checked_in_by}</strong>
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-900/80">
                    Method:{" "}
                    <span className="uppercase font-mono">
                      {rider.checkin_method || "manual"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-black/5 p-3 text-xs text-black/60">
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
                      className="p-1.5 rounded-xl border border-black/15 bg-white shadow-sm hover:scale-105 transition-transform"
                      title="Click to enlarge QR pass"
                    >
                      <QRCodeSVG
                        value={`nvcyclothon-checkin:${rider.checkin_token}`}
                        size={64}
                        level="M"
                      />
                    </button>
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-[#071313] block">
                        Rider QR Pass
                      </span>
                      <button
                        type="button"
                        onClick={() => onShowQr(rider)}
                        className="text-[11px] font-bold text-[#ff5f3d] hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> View full screen
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            rider.checkin_token,
                            `token-${rider.id}`
                          )
                        }
                        className="text-[10px] font-mono text-black/50 hover:text-black flex items-center gap-1"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        {copiedId === `token-${rider.id}` ? "Copied!" : "Copy Token"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-black/40">No QR token issued</p>
                )}
              </div>
            </div>

            {/* CARD 2: RIDER APPAREL & PROFILE */}
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm space-y-3">
              <div className="border-b border-black/10 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black/50 font-mono flex items-center gap-1.5">
                  <Shirt className="h-3.5 w-3.5 text-[#071313]" />
                  Apparel & Profile
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-black/5">
                  <span className="text-black/50">T-Shirt Size</span>
                  <span className="font-mono font-bold text-[#071313] bg-[#fbf8ef] px-2 py-0.5 rounded border border-black/10">
                    {rider.t_shirt_size || "Not specified"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-black/5">
                  <span className="text-black/50">City / Location</span>
                  <span className="font-bold text-[#071313]">
                    {rider.city || "Rewa (M.P.)"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-black/5">
                  <span className="text-black/50">Gender</span>
                  <span className="font-bold text-[#071313] capitalize">
                    {rider.gender || "Unspecified"}
                  </span>
                </div>

                {rider.batch_name && (
                  <div className="flex items-center justify-between py-1 border-b border-black/5">
                    <span className="text-black/50">Batch / Wave</span>
                    <span className="font-bold text-purple-900 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded">
                      {rider.batch_name}
                    </span>
                  </div>
                )}

                {rider.organization_name && (
                  <div className="pt-1">
                    <span className="text-[10px] text-black/50 uppercase font-mono block">
                      Delegation / Club
                    </span>
                    <p className="font-bold text-[#071313] text-xs">
                      🏛️ {rider.organization_name} ({rider.organization_type || "Club"})
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: DOCUMENT & EMAIL DELIVERY LOG */}
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm space-y-3">
              <div className="border-b border-black/10 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black/50 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#071313]" />
                  Email & Document Logs
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-black/5">
                  <span className="text-black/50">Registration Email</span>
                  <span className="font-bold text-[#071313]">
                    {rider.registration_email_status || "not sent"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-black/5">
                  <span className="text-black/50">Official Rider Pass</span>
                  <span className="font-bold text-[#071313]">
                    {rider.rider_pass_status || "not sent"}
                  </span>
                </div>

                <div className="py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-black/50">Finisher Certificate</span>
                    <span className="font-bold text-[#071313]">
                      {rider.certificate_delivery_status ||
                        rider.certificate_status ||
                        "not sent"}
                    </span>
                  </div>
                  {rider.certificate_sent_at && (
                    <p className="text-[10px] text-black/40 font-mono mt-0.5">
                      Sent {new Date(rider.certificate_sent_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Actions for this single rider */}
              <div className="pt-2 flex flex-wrap gap-2 border-t border-black/5">
                {rider.payment_status === "paid" &&
                  rider.status !== "cancelled" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => previewRiderPass(rider.id)}
                        className="h-7 text-[11px] px-2.5"
                      >
                        <FileText className="h-3 w-3 mr-1" /> Pass Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => generateRiderPasses([rider.id])}
                        disabled={busy}
                        className="h-7 text-[11px] px-2.5 bg-[#ff5f3d] text-white hover:bg-[#e04f2f] font-bold"
                      >
                        <Send className="h-3 w-3 mr-1" />
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
                      className="h-7 text-[11px] px-2.5 text-emerald-800 border-emerald-300 bg-emerald-50"
                    >
                      <Award className="h-3 w-3 mr-1" /> Cert Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generateCertificates([rider.id])}
                      disabled={busy}
                      className="h-7 text-[11px] px-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {rider.certificate_delivery_status === "sent" ? "Re-send Cert" : "Send Cert"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
