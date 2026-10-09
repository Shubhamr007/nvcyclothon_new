import React from "react";
import {
  CheckCircle2,
  Eye,
  Send,
  Award,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "../../../components/ui/button";

export function ParticipantBulkActionBar({
  selectedCount,
  busy,
  batchProgress,
  riderPassSelectedCount,
  checkedInSelectedCount,
  certificateFile,
  onClearSelection,
  onBulkSetStatus,
  onPreviewRiderPass,
  onGenerateRiderPasses,
  onPreviewCertificate,
  onGenerateCertificates,
  onCertificateFileChange,
  onSendUploadedCertificates,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#071313] p-4 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d9ff38] text-xs font-black text-[#071313]">
          {selectedCount}
        </span>
        <span className="text-xs font-bold tracking-wide">
          participant{selectedCount === 1 ? "" : "s"} selected
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-white/50 hover:text-white underline underline-offset-2 ml-2"
        >
          Clear selection
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* APPROVE BUTTON */}
        <Button
          size="sm"
          variant="accent"
          onClick={() => onBulkSetStatus("approved")}
          disabled={busy}
          className="h-8 text-xs font-bold px-3"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Approve ({selectedCount})
        </Button>

        {/* RIDER PASS BUTTONS */}
        {riderPassSelectedCount === 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onPreviewRiderPass}
            disabled={busy}
            className="h-8 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10 px-2.5"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Pass Preview
          </Button>
        )}

        {riderPassSelectedCount > 0 && (
          <Button
            size="sm"
            onClick={onGenerateRiderPasses}
            disabled={busy}
            className="h-8 bg-[#ff5f3d] text-white hover:bg-[#e04f2f] text-xs px-3 font-bold"
          >
            {busy && batchProgress ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1" />
            )}
            {busy && batchProgress
              ? `Passes (${batchProgress.current}/${batchProgress.total})`
              : `Send Pass (${riderPassSelectedCount})`}
          </Button>
        )}

        {/* CERTIFICATE BUTTONS */}
        {checkedInSelectedCount === 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onPreviewCertificate}
            disabled={busy}
            className="h-8 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10 px-2.5"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Cert Preview
          </Button>
        )}

        {checkedInSelectedCount > 0 && (
          <>
            <Button
              size="sm"
              onClick={onGenerateCertificates}
              disabled={busy}
              className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3 font-bold"
            >
              {busy && batchProgress ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Award className="h-3.5 w-3.5 mr-1" />
              )}
              {busy && batchProgress
                ? `Certs (${batchProgress.current}/${batchProgress.total})`
                : `Generate Certs (${checkedInSelectedCount})`}
            </Button>

            <label
              htmlFor="p-cert-file"
              className="cursor-pointer inline-flex items-center h-8 rounded-full border border-white/20 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              {certificateFile ? certificateFile.name.slice(0, 12) + "…" : "Upload PDF"}
            </label>
            <input
              id="p-cert-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => onCertificateFileChange(e.target.files?.[0] || null)}
            />

            {certificateFile && (
              <Button
                size="sm"
                onClick={onSendUploadedCertificates}
                disabled={busy}
                className="h-8 bg-[#ff5f3d] text-white text-xs px-3 font-bold"
              >
                Send Uploaded
              </Button>
            )}
          </>
        )}
      </div>

      {/* REAL-TIME BATCH PROGRESS BAR */}
      {batchProgress && (
        <div className="w-full mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#d9ff38]">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d9ff38]" />
              {batchProgress.label}
            </span>
            <span className="font-bold">{batchProgress.percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-[#d9ff38] transition-all duration-300 rounded-full"
              style={{ width: `${batchProgress.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
