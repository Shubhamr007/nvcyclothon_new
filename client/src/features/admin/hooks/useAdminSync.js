import { useEffect, useRef, useState, useCallback } from "react";
import { adminRequest } from "../../../api/http";

/**
 * Real-Time Admin Synchronization Hook
 *
 * Implements a dual-layer freshness strategy:
 * 1. Primary: Server-Sent Events (SSE) stream for instantaneous push invalidations.
 * 2. Fallback: Bounded polling against lightweight revision checks (/api/admin/sync/status)
 *    when SSE is disconnected or when tab visibility changes.
 */
export function useAdminSync({ accessToken, onSync, enabled = true }) {
  const [syncStatus, setSyncStatus] = useState("disconnected"); // "connected" | "polling" | "syncing" | "disconnected"
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now());
  const [lastEvent, setLastEvent] = useState(null);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const revisionRef = useRef(0);
  const retryCountRef = useRef(0);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const performSync = useCallback(async (eventMeta) => {
    setSyncStatus((prev) => (prev === "connected" ? "connected" : "syncing"));
    try {
      if (typeof onSyncRef.current === "function") {
        await onSyncRef.current(eventMeta);
      }
      setLastSyncedAt(Date.now());
      if (eventMeta) {
        setLastEvent(eventMeta);
      }
    } finally {
      setSyncStatus((prev) => (eventSourceRef.current?.readyState === EventSource.OPEN ? "connected" : "polling"));
    }
  }, []);

  const triggerRefresh = useCallback(() => {
    return performSync({ type: "manual", action: "refresh", timestamp: Date.now() });
  }, [performSync]);

  // Lightweight status check: queries revision (200 bytes) instead of heavy payloads
  const checkRevisionStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const status = await adminRequest("/sync/status", accessToken);
      if (status && typeof status.revision === "number") {
        if (revisionRef.current > 0 && status.revision > revisionRef.current) {
          revisionRef.current = status.revision;
          await performSync(status.lastEvent || { type: "poll", action: "stale_detected" });
        } else {
          revisionRef.current = status.revision;
        }
      }
    } catch {
      // Non-blocking status check error
    }
  }, [accessToken, performSync]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setSyncStatus("disconnected");
      return undefined;
    }

    let isMounted = true;

    function connectSSE() {
      if (!isMounted) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Connect to SSE stream passing access token in query param
      const streamUrl = `/api/admin/events/stream?token=${encodeURIComponent(accessToken)}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setSyncStatus("connected");
        retryCountRef.current = 0;
      };

      es.onmessage = (messageEvent) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(messageEvent.data);
          if (payload?.type === "connection") {
            if (payload.revision) revisionRef.current = payload.revision;
            return;
          }

          if (payload?.revision && payload.revision > revisionRef.current) {
            revisionRef.current = payload.revision;
          }

          // Broadcast custom event for any listening sub-components
          window.dispatchEvent(new CustomEvent("nv:admin-sync", { detail: payload }));
          void performSync(payload);
        } catch {
          // Ignore malformed ping or non-JSON chunk
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        es.close();
        eventSourceRef.current = null;
        setSyncStatus("polling");

        // Exponential backoff reconnect: 3s, 6s, 12s, max 30s
        const backoff = Math.min(30000, 3000 * Math.pow(2, retryCountRef.current));
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (isMounted) connectSSE();
        }, backoff);
      };
    }

    connectSSE();

    // Setup bounded polling fallback (every 15s in polling mode, 60s sanity in connected mode)
    const pollInterval = window.setInterval(() => {
      if (isMounted) {
        void checkRevisionStatus();
      }
    }, syncStatus === "connected" ? 60000 : 15000);
    pollIntervalRef.current = pollInterval;

    // Visibility change: instant refresh check when returning from another browser tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isMounted) {
        void checkRevisionStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, [accessToken, enabled, checkRevisionStatus, performSync, syncStatus]);

  return {
    syncStatus,
    lastSyncedAt,
    lastEvent,
    triggerRefresh,
  };
}
