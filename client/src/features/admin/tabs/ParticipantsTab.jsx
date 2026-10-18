import React, { useState, useEffect, useCallback, useRef } from "react";
import { Users, Award, AlertCircle, X, Sparkles } from "lucide-react";
import { adminRequest } from "../../../api/http";
import { ParticipantDirectoryView, ParticipantRosterView } from "../participants";
import { AiEmailBroadcastModal } from "../ai/AiEmailBroadcastModal";
import { useAppSelector } from "../../../store/hooks";

export function ParticipantsTab({
  riders: propRiders,
  adminKey: propAdminKey,
  refresh: propRefresh,
  onLoaded,
}) {
  const reduxKey = useAppSelector((state) => state.auth?.accessToken);
  const adminKey = propAdminKey || reduxKey;
  const [riders, setRiders] = useState(propRiders || []);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("directory"); // "directory" | "roster"
  const [actionMessage, setActionMessage] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const hasFetchedRef = useRef(false);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const fetchRiders = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const data = await adminRequest("/registrations", adminKey);
      setRiders(data || []);
      onLoadedRef.current?.(data || []);
    } catch (err) {
      setActionMessage(err.message || "Failed to load participants.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (propRiders && propRiders.length > 0) {
      setRiders(propRiders);
    } else if (adminKey && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchRiders();
    }
  }, [propRiders, adminKey, fetchRiders]);

  const handleRefresh = useCallback(async () => {
    if (propRefresh) {
      await propRefresh();
    }
    await fetchRiders();
  }, [propRefresh, fetchRiders]);

  const handleFeedback = (msg) => {
    setActionMessage(msg || "");
  };

  return (
    <div className="space-y-6">
      {/* ACTION MESSAGE NOTIFICATION */}
      {actionMessage && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="font-medium">{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="text-blue-500 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW MODE SELECTOR (FULL DIRECTORY VS EVENT-DAY RACE ROSTER) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode("directory")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              viewMode === "directory"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Full Directory ({riders.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("roster")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              viewMode === "roster"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award className="h-4 w-4 text-blue-600" />
            Event-Day Race Roster
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI Broadcast Email</span>
          </button>
        </div>
      </div>

      {loading && riders.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-700">Loading participant directory…</p>
        </div>
      ) : viewMode === "directory" ? (
        <ParticipantDirectoryView
          riders={riders}
          adminKey={adminKey}
          refresh={handleRefresh}
          onFeedback={handleFeedback}
        />
      ) : (
        <ParticipantRosterView
          riders={riders}
          adminKey={adminKey}
          refresh={handleRefresh}
          onFeedback={handleFeedback}
        />
      )}

      <AiEmailBroadcastModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        accessToken={adminKey}
        onFeedback={handleFeedback}
      />
    </div>
  );
}

export default ParticipantsTab;
