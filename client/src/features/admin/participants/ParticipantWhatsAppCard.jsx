import React from "react";
import { MessageSquare, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

export function getCleanWaNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D+/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export function getPrefilledWaMessage(rider) {
  const riderId = rider?.id ? `#${rider.id}` : "";
  const category = rider?.ride_category || "NV Cyclothon";
  const name = rider?.full_name || "Rider";
  return `Hello ${name}, greeting from the NV Cyclothon organizing team! Your registration for ${category} (Rider ${riderId}) is confirmed. We look forward to seeing you at the starting line in Rewa. Please let us know if you have any questions!`;
}

export function ParticipantWhatsAppCard({ rider }) {
  const isOptedIn = Boolean(rider?.whatsapp_opt_in);
  const preferredNumber =
    rider?.preferred_whatsapp_number ||
    (rider?.whatsapp_use_primary !== false ? rider?.phone : rider?.whatsapp_number) ||
    rider?.phone;

  const cleanNumber = getCleanWaNumber(preferredNumber);
  const message = getPrefilledWaMessage(rider);
  const waUrl = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          WhatsApp Updates
        </span>
        {isOptedIn ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Opted In
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-bold">
            <XCircle className="h-3 w-3 text-slate-500" />
            Not Opted In
          </span>
        )}
      </div>

      {/* Contact Details */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-semibold">WhatsApp Number</span>
          <span className="font-mono font-bold text-slate-900">
            {preferredNumber || "—"}
          </span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-semibold">Number Type</span>
          <span className="font-medium text-slate-800">
            {rider?.whatsapp_use_primary !== false
              ? "Primary Mobile"
              : "Alternate WhatsApp"}
          </span>
        </div>
        {rider?.whatsapp_consent_at && (
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600 font-semibold">Consent Recorded</span>
            <span className="font-mono text-slate-600 text-[11px]">
              {new Date(rider.whatsapp_consent_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="pt-1 space-y-2">
        {isOptedIn && waUrl ? (
          <>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <MessageSquare className="h-4 w-4" />
              Chat on WhatsApp
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
            <p className="text-[10px] leading-tight text-slate-500">
              Opens WhatsApp Web or mobile app. Messages are sent manually from your device; standard WhatsApp Business limits and account apply.
            </p>
          </>
        ) : (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 leading-relaxed">
            Participant has not opted in to receive WhatsApp notifications. Direct message link is disabled to respect participant privacy.
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipantWhatsAppCard;
