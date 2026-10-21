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
    <div className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0078d4] text-xs font-bold text-white shadow-sm">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold tracking-wide text-slate-700">
          participant{selectedCount === 1 ? "" : "s"} selected
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 ml-2 transition-colors"
        >
          Clear selection
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* APPROVE BUTTON */}
        <Button
          size="sm"
          onClick={() => onBulkSetStatus("approved")}
          disabled={busy}
          className="h-8 text-xs font-semibold px-3 bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
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
            className="h-8 border-slate-300 bg-slate-50 text-xs text-slate-700 hover:bg-slate-100 px-2.5"
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
            className="h-8 bg-[#0078d4] hover:bg-[#005a9e] text-white text-xs px-3 font-semibold transition shadow-sm"
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

        {checkedInSelectedCount === 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onPreviewCertificate}
            disabled={busy}
            className="h-8 border-slate-300 bg-slate-50 text-xs text-slate-700 hover:bg-slate-100 px-2.5"
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
              className="h-8 bg-[#0078d4] hover:bg-[#005a9e] text-white text-xs px-3 font-semibold transition shadow-sm"
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
              className="cursor-pointer inline-flex items-center h-8 rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Upload className="h-3.5 w-3.5 mr-1 text-slate-500" />
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
                className="h-8 bg-[#0078d4] hover:bg-[#005a9e] text-white text-xs px-3 font-semibold transition shadow-sm"
              >
                Send Uploaded
              </Button>
            )}
          </>
        )}
      </div>

      {/* REAL-TIME BATCH PROGRESS BAR */}
      {batchProgress && (
        <div className="w-full mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#0078d4]">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0078d4]" />
              {batchProgress.label}
            </span>
            <span className="font-bold">{batchProgress.percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-[#0078d4] transition-all duration-300 rounded-full"
              style={{ width: `${batchProgress.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
