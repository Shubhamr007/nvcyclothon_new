import React, { useState } from "react";
import { Upload, Download, FileText, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AdminSlideOver } from "../components/AdminSlideOver";

export function VolunteerBulkImportDrawer({
  isOpen,
  onClose,
  onSubmit,
  onDownloadTemplate,
  downloadingTemplate = false,
  busy = false,
  recentImports = null,
}) {
  const [file, setFile] = useState(null);
  const [sendEmail, setSendEmail] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("send_email", sendEmail ? "true" : "false");

    onSubmit(formData);
  };

  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      title="Bulk Import Volunteer Roster"
      subtitle="Upload an Excel/CSV spreadsheet to mass-provision volunteer accounts"
      icon={Upload}
      width="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
        <div className="space-y-6 p-6">
          {/* Instructions & Template Download Card */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-blue-900">
                Official CSV Format
              </span>
              <button
                type="button"
                onClick={onDownloadTemplate}
                disabled={downloadingTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
              >
                {downloadingTemplate ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download Template (.csv)
              </button>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Include columns: <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-[11px]">name</code>, <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-[11px]">email</code>, <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-[11px]">phone</code>, <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-[11px]">role</code>, <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-[11px]">organization</code>.
            </p>
          </div>

          {/* File Picker Zone */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center hover:border-slate-300 transition">
            <input
              type="file"
              id="bulk-volunteer-file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={busy}
            />
            <label htmlFor="bulk-volunteer-file" className="cursor-pointer block space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-xs border border-slate-200">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-xs">
                {file ? (
                  <span className="font-bold text-slate-900">{file.name}</span>
                ) : (
                  <>
                    <span className="font-bold text-slate-900">Click to upload spreadsheet</span>
                    <span className="text-slate-500 block text-[11px] mt-0.5">Supports .CSV, .XLSX</span>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Notification Checkbox */}
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="accent-slate-900 rounded cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Send className="h-4 w-4 text-slate-500" />
              <span>Automatically email login credentials to imported volunteers</span>
            </span>
          </label>

          {/* Recent Import Result Summary */}
          {recentImports && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Import Completed Successfully</span>
              </div>
              <div className="text-xs text-emerald-800 space-y-1">
                <p>Imported: <strong>{recentImports.imported_count}</strong> volunteers</p>
                {recentImports.skipped_count > 0 && (
                  <p className="text-amber-800">
                    Skipped: {recentImports.skipped_count} duplicates/invalid rows
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl h-10 px-4"
          >
            Close
          </Button>
          <Button
            type="submit"
            disabled={busy || !file}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl h-10 px-6 shadow-sm transition"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing Roster…
              </span>
            ) : (
              "Upload & Provision Roster"
            )}
          </Button>
        </div>
      </form>
    </AdminSlideOver>
  );
}

export default VolunteerBulkImportDrawer;
