import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  Clock,
  RefreshCw,
} from "lucide-react";
import { fetchAdminJobs, cancelAdminJob } from "../../../api/jobs";

function getFriendlyType(type) {
  switch (type) {
    case "certificates_generate":
      return "Certificate Generation";
    case "certificates_send":
      return "Certificate Dispatch";
    case "passes_generate":
      return "Rider Pass Generation";
    case "event_update_email":
      return "Broadcast Participant Email";
    case "volunteer_bulk_upload":
      return "Volunteer Roster Import";
    case "finance_export":
      return "CA Audit Report Export";
    default:
      return type || "Background Operation";
  }
}

export function JobProgressCenter({ accessToken }) {
  const [activeJobs, setActiveJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const refreshRecent = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchAdminJobs(accessToken, { limit: 15 });
      if (Array.isArray(data.jobs)) {
        setRecentJobs(data.jobs);
        const active = data.jobs.filter((j) => ["queued", "processing"].includes(j.status));
        setActiveJobs(active);
      }
    } catch (_) {}
  }, [accessToken]);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  // Listen to live Server-Sent Events dispatched via nv:admin-sync
  useEffect(() => {
    const handleSyncEvent = (e) => {
      const event = e.detail;
      if (!event || event.type !== "jobs") return;

      const jobData = event.data || {};
      const jobId = event.id || jobData.id;
      if (!jobId) return;

      setActiveJobs((prev) => {
        const existingIdx = prev.findIndex((j) => j.id === jobId);
        const isFinished = ["completed", "failed", "cancelled"].includes(event.action) ||
          ["completed", "failed", "cancelled"].includes(jobData.status);

        if (isFinished) {
          return prev.filter((j) => j.id !== jobId);
        }

        const updated = {
          id: jobId,
          type: jobData.type,
          status: jobData.status || (event.action === "started" ? "processing" : "queued"),
          progress: jobData.progress ?? (existingIdx >= 0 ? prev[existingIdx].progress : 0),
          created_at: jobData.created_at || new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          const clone = [...prev];
          clone[existingIdx] = { ...clone[existingIdx], ...updated };
          return clone;
        }
        return [updated, ...prev];
      });

      // Update recent jobs list
      setRecentJobs((prev) => {
        const existingIdx = prev.findIndex((j) => j.id === jobId);
        const updated = {
          id: jobId,
          type: jobData.type,
          status: jobData.status || event.action,
          progress: jobData.progress,
          result: jobData.result,
          error_message: jobData.error,
          updated_at: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          const clone = [...prev];
          clone[existingIdx] = { ...clone[existingIdx], ...updated };
          return clone;
        }
        return [updated, ...prev].slice(0, 20);
      });
    };

    window.addEventListener("nv:admin-sync", handleSyncEvent);
    return () => {
      window.removeEventListener("nv:admin-sync", handleSyncEvent);
    };
  }, []);

  const handleCancel = async (jobId) => {
    if (!accessToken || !jobId) return;
    setCancellingId(jobId);
    try {
      await cancelAdminJob(accessToken, jobId);
      await refreshRecent();
    } catch (_) {
    } finally {
      setCancellingId(null);
    }
  };

  const hasActive = activeJobs.length > 0;
  const topActive = activeJobs[0];

  if (!hasActive && recentJobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full font-sans">
      {/* Minimized Docked Bar */}
      <div
        className="flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-3 cursor-pointer hover:border-[#0078d4]/40 transition"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              hasActive ? "bg-[#deecf9] text-[#0078d4]" : "bg-slate-100 text-slate-600"
            }`}
          >
            {hasActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate">
                {hasActive ? getFriendlyType(topActive.type) : "Background Tasks"}
              </span>
              {hasActive && (
                <span className="text-[10px] font-bold text-[#0078d4] bg-[#deecf9] px-1.5 py-0.5 rounded-full">
                  {topActive.progress || 0}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {hasActive
                ? `${activeJobs.length} active operation${activeJobs.length > 1 ? "s" : ""}`
                : `${recentJobs.length} recent operations`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Operations Flyout */}
      {isOpen && (
        <div className="mt-2 bg-[#f8f9fa] border border-slate-200 shadow-2xl rounded-2xl p-4 space-y-3 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Operations Center
            </span>
            <button
              type="button"
              onClick={refreshRecent}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              title="Refresh job status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentJobs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No recent background jobs.</p>
            ) : (
              recentJobs.map((job) => {
                const isRunning = ["queued", "processing"].includes(job.status);
                const isSuccess = job.status === "completed";
                const isFailed = job.status === "failed";
                const isCancelled = job.status === "cancelled";

                return (
                  <div
                    key={job.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {getFriendlyType(job.type)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 truncate block">
                          {job.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
                          </span>
                        )}
                        {isRunning && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#005a9e] bg-[#deecf9] px-2 py-0.5 rounded-full border border-[#c7e0f4]">
                            <Loader2 className="w-3 h-3 animate-spin text-[#0078d4]" />
                            {job.status === "processing" ? `${job.progress || 0}%` : "Queued"}
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> Failed
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3 h-3" /> Cancelled
                          </span>
                        )}
                        {isRunning && (
                          <button
                            type="button"
                            disabled={cancellingId === job.id}
                            onClick={() => handleCancel(job.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Cancel job"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Running Tasks */}
                    {isRunning && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#0078d4] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(5, job.progress || 0)}%` }}
                        />
                      </div>
                    )}

                    {/* Failure details */}
                    {isFailed && job.error_message && (
                      <p className="text-[11px] text-rose-600 leading-tight">
                        {job.error_message}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
