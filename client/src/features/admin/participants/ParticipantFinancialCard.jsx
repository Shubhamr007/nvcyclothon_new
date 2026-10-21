import React from "react";
import { CreditCard, CheckCircle2, Clock, Copy, Check, MessageSquare, Mail } from "lucide-react";

export function ParticipantFinancialCard({ rider, copyToClipboard, copiedId }) {
  const isPaid = rider.payment_status === "paid";

  // Resolve fee amount in rupees
  let feeRupees = Math.round(Number(rider.registration_fee_paise || 0) / 100);
  if (feeRupees <= 0) {
    if (rider.ride_category?.includes("60")) feeRupees = 1099;
    else if (rider.ride_category?.includes("30")) feeRupees = 999;
    else if (rider.ride_category?.includes("10")) feeRupees = 499;
    else feeRupees = 299;
  }

  // Pre-fill zero-cost WhatsApp receipt message
  const cleanPhone = String(rider.phone || "").replace(/\D+/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const waReceiptText = encodeURIComponent(
    `Hello ${rider.full_name},\n\n` +
      `Here is your NV Cyclothon 2026 Registration Receipt:\n` +
      `• Rider ID: #${rider.id}\n` +
      `• Category: ${rider.ride_category}\n` +
      `• Fee Paid: ₹${feeRupees}\n` +
      `• Payment Status: ${isPaid ? "PAID (Confirmed)" : "PENDING"}\n` +
      `• Transaction ID: ${rider.payment_id || rider.payment_order_id || "Cashfree Ref"}\n\n` +
      `We look forward to seeing you at the starting line in Rewa! 🚴`
  );
  const waUrl = `https://wa.me/${formattedPhone}?text=${waReceiptText}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-slate-600" />
          Payment & Billing
        </span>
        {isPaid ? (
          <span className="rounded-md bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold uppercase flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid ₹{feeRupees}
          </span>
        ) : (
          <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-bold flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Unpaid ₹{feeRupees}
          </span>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-semibold">Registration Fee</span>
          <span className="font-mono font-black text-slate-900 text-sm">₹{feeRupees.toLocaleString("en-IN")}</span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-semibold">Gateway / Provider</span>
          <span className="font-bold text-slate-900">
            {rider.payment_provider ? String(rider.payment_provider).toUpperCase() : "CASHFREE"}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-semibold">Order Reference</span>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-900 font-medium truncate max-w-[130px]">
              {rider.payment_order_id || `order_${rider.id}`}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(rider.payment_order_id || `order_${rider.id}`, `order-${rider.id}`)}
              className="text-slate-500 hover:text-slate-950 p-0.5"
              title="Copy Order ID"
              aria-label="Copy Order ID"
            >
              {copiedId === `order-${rider.id}` ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-semibold">Payment ID</span>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-900 font-medium truncate max-w-[130px]">
              {rider.payment_id || (isPaid ? "verified" : "pending")}
            </span>
            {rider.payment_id && (
              <button
                type="button"
                onClick={() => copyToClipboard(rider.payment_id, `pay-${rider.id}`)}
                className="text-slate-500 hover:text-slate-950 p-0.5"
                title="Copy Payment ID"
                aria-label="Copy Payment ID"
              >
                {copiedId === `pay-${rider.id}` ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {rider.payment_verified_at && (
          <div className="py-1">
            <span className="text-xs text-slate-600 uppercase font-mono font-bold block">Settled At</span>
            <p className="text-slate-900 font-mono text-xs font-semibold">
              {new Date(rider.payment_verified_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Zero-Cost Direct Receipt Actions */}
      <div className="pt-2.5 flex flex-wrap gap-2 border-t border-slate-100">
        {cleanPhone.length >= 10 && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
            title="Open WhatsApp with pre-filled payment receipt"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
            <span>WhatsApp Receipt</span>
          </a>
        )}
        {rider.email && (
          <a
            href={`mailto:${rider.email}?subject=${encodeURIComponent("NV Cyclothon 2026 - Payment Receipt")}&body=${waReceiptText}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <Mail className="h-3.5 w-3.5 text-slate-600" />
            <span>Email Receipt</span>
          </a>
        )}
      </div>
    </div>
  );
}
