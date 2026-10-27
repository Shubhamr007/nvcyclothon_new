import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function ParticipantQrModal({ rider, onClose }) {
  if (!rider?.checkin_token) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl border border-slate-200 text-slate-900"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-mono font-semibold text-slate-500">
            #{rider.id} CHECK-IN PASS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-6 flex justify-center">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <QRCodeSVG
              value={`nvcyclothon-checkin:${rider.checkin_token}`}
              size={190}
              level="H"
            />
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900">{rider.full_name}</h3>
        <p className="text-xs text-slate-500 font-medium">{rider.ride_category}</p>
        <p className="mt-1 text-[11px] font-mono text-slate-400">
          Token: {rider.checkin_token.slice(0, 16)}…
        </p>

        <Button
          onClick={onClose}
          className="mt-6 w-full bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold rounded-xl shadow-xs"
        >
          Close Pass
        </Button>
      </div>
    </div>
  );
}
