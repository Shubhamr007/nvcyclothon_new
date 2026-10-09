import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function ParticipantQrModal({ rider, onClose }) {
  if (!rider) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl text-[#071313]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <span className="text-xs font-mono font-bold text-black/50">
            #{rider.id} CHECK-IN PASS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-black/40 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-6 flex justify-center">
          <div className="p-4 rounded-2xl border-2 border-[#071313] bg-white shadow-inner">
            <QRCodeSVG
              value={`nvcyclothon-checkin:${rider.checkin_token || rider.id}`}
              size={190}
              level="H"
            />
          </div>
        </div>

        <h3 className="text-base font-black">{rider.full_name}</h3>
        <p className="text-xs text-black/60 font-semibold">{rider.ride_category}</p>
        <p className="mt-1 text-[11px] font-mono text-black/40">
          Token: {(rider.checkin_token || `ID-${rider.id}`).slice(0, 16)}…
        </p>

        <Button onClick={onClose} className="mt-6 w-full" variant="default">
          Close Pass
        </Button>
      </div>
    </div>
  );
}
