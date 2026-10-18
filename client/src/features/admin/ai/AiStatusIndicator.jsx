import React, { useEffect, useState, useRef, memo } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { getAdminAiStatus } from "../../../api/http";
import { useAppSelector } from "../../../store/hooks";

export const AiStatusIndicator = memo(function AiStatusIndicator({ className = "" }) {
  const accessToken = useAppSelector((state) => state.auth?.accessToken);
  const [status, setStatus] = useState({
    loading: true,
    available: false,
    model: "llama3.2:latest",
  });
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (!accessToken || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    getAdminAiStatus(accessToken)
      .then((res) => {
        if (!active) return;
        setStatus({
          loading: false,
          available: !!res.available,
          model: res.currentModel || "llama3.2",
          reason: res.reason,
        });
      })
      .catch((err) => {
        if (!active) return;
        setStatus({
          loading: false,
          available: false,
          model: "llama3.2",
          reason: err.message,
        });
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  if (status.loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200/70 rounded-full px-2.5 py-0.5 ${className}`}>
        <Sparkles className="h-3 w-3 animate-spin text-slate-400" />
        <span>Connecting AI…</span>
      </div>
    );
  }

  if (status.available) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-[#004578] bg-[#deecf9] border border-[#c7e0f4] rounded-full px-2.5 py-0.5 shadow-2xs ${className}`}
        title="Executive AI intelligence service is active and responsive"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#50e6ff] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0078d4]" />
        </span>
        <span className="font-bold">AI Assistant Active</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5 ${className}`}
      title="AI assistant is in standby mode"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      <span className="font-semibold">AI Standby</span>
    </div>
  );
});

export default AiStatusIndicator;
