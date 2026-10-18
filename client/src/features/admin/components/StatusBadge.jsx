import React from "react";

const STATUS_COLOR_MAP = {
  // Success
  approved: "bg-emerald-100 text-emerald-950 border-emerald-400 font-bold",
  completed: "bg-emerald-100 text-emerald-950 border-emerald-400 font-bold",
  event_ready: "bg-emerald-100 text-emerald-950 border-emerald-400 font-bold",
  checked_in: "bg-emerald-100 text-emerald-950 border-emerald-400 font-bold",
  paid: "bg-emerald-100 text-emerald-950 border-emerald-400 font-bold",
  active: "bg-emerald-100 text-emerald-950 border-emerald-400 font-bold",

  // Danger / Reject
  rejected: "bg-rose-100 text-rose-950 border-rose-400 font-bold",
  cancelled: "bg-rose-100 text-rose-950 border-rose-400 font-bold",
  failed: "bg-rose-100 text-rose-950 border-rose-400 font-bold",
  inactive: "bg-rose-100 text-rose-950 border-rose-400 font-bold",

  // Info / Progress
  payment_verified: "bg-blue-100 text-blue-950 border-blue-400 font-bold",
  under_review: "bg-sky-100 text-sky-950 border-sky-400 font-bold",
  sent: "bg-indigo-100 text-indigo-950 border-indigo-400 font-bold",
  invited: "bg-purple-100 text-purple-950 border-purple-400 font-bold",

  // Warning / Pending
  pending: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
  submitted: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
  pending_payment: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
  unpaid: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
};

export const StatusBadge = React.memo(function StatusBadge({
  status,
  label,
  className = "",
  size = "sm",
}) {
  if (!status) return null;
  const normalized = String(status).toLowerCase().trim().replace(/[\s-]+/g, "_");
  const colorClasses =
    STATUS_COLOR_MAP[normalized] || "bg-slate-100 text-slate-900 border-slate-300 font-bold";

  const sizeClasses =
    size === "xs"
      ? "px-2 py-0.5 text-[10px] font-bold"
      : "px-2.5 py-0.5 text-xs font-bold";

  const displayText = label || String(status).replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center justify-center uppercase tracking-wider rounded-full border shadow-2xs ${colorClasses} ${sizeClasses} ${className}`}
    >
      {displayText}
    </span>
  );
});

export default StatusBadge;
