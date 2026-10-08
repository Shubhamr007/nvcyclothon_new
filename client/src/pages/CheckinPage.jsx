import { useEffect, useMemo, useRef, useState } from "react";
import { checkinRequest, createCheckinSession, getCheckinStatus } from "../api/http";
import { normalizeError } from "../utils/errorHandler";
import { LoadingIndicator, LoadingScreen } from "../components/LoadingIndicator";
import { useDebouncedValue } from "../components/useDebouncedValue";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Camera, CheckCircle2, LogOut, Search, X } from "lucide-react";

const SESSION_STORAGE_KEY = "nv-checkin-session";

function formatStatus(status) {
  return String(status || "").replaceAll("_", " ");
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString();
}

function statusPillClasses(status) {
  if (status === "checked_in") {
    return "bg-[#d9ff38] text-[#071313]";
  }
  if (status === "approved") {
    return "bg-[#e9f8ff] text-[#063858]";
  }
  if (status === "cancelled") {
    return "bg-[#ffe6e0] text-[#7a260f]";
  }
  return "bg-[#f5f5f5] text-[#353535]";
}

/* ─── Mobile card for search results (< lg) ─── */
function ParticipantMobileCard({ participant, busy, onCheckIn }) {
  const unavailable = participant.status === "cancelled" || participant.status === "checked_in";
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4 transition-shadow active:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black leading-snug">
            #{participant.id} · {participant.full_name}
          </p>
          <p className="mt-1 text-sm text-black/65">{participant.ride_category}</p>
        </div>
        <span className={"shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase " + statusPillClasses(participant.status)}>
          {formatStatus(participant.status)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-black/65">
        <div>
          <dt className="font-bold text-black/85">City</dt>
          <dd className="mt-0.5">{participant.city}</dd>
        </div>
        <div>
          <dt className="font-bold text-black/85">Phone</dt>
          <dd className="mt-0.5">{participant.phone}</dd>
        </div>
        {participant.organization_name && (
          <div className="col-span-2">
            <dt className="font-bold text-black/85">Organization</dt>
            <dd className="mt-0.5">🏛️ {participant.organization_name}</dd>
          </div>
        )}
        {participant.checked_in_at && (
          <div className="col-span-2">
            <dt className="font-bold text-black/85">Check-in</dt>
            <dd className="mt-0.5">{formatDateTime(participant.checked_in_at)}</dd>
          </div>
        )}
      </dl>
      <Button
        type="button"
        size="lg"
        onClick={() => onCheckIn(participant.id)}
        disabled={busy || unavailable}
        className="mt-4 w-full rounded-xl bg-[#ff5f3d] text-sm hover:bg-[#d9492c] active:scale-[.98]"
      >
        {participant.status === "checked_in" ? "Already checked in" : participant.status === "cancelled" ? "Registration cancelled" : "Check in rider"}
      </Button>
    </article>
  );
}

/* ─── Check-in result banner ─── */
function CheckinResult({ result, resultRef }) {
  const participant = result.participant;
  const duplicate = Boolean(result.already_checked_in);
  return (
    <section
      ref={resultRef}
      tabIndex="-1"
      aria-live="assertive"
      className={
        "mt-4 rounded-2xl border p-4 shadow-sm outline-none sm:p-5 " +
        (duplicate ? "border-[#f2bc63] bg-[#fff8e8]" : "border-[#c4e86b] bg-[#f4ffd8]")
      }
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[.12em] uppercase sm:text-xs">
            {duplicate ? "Already checked in" : "Check-in complete"}
          </p>
          <h2 className="mt-1 truncate text-lg font-black tracking-tight sm:text-2xl">
            #{participant.id} · {participant.full_name}
          </h2>
          <p className="mt-1 text-xs text-black/70 sm:text-sm">
            {participant.ride_category} · {participant.city}
          </p>
          <p className="mt-1 text-xs font-semibold sm:text-sm">
            {formatDateTime(participant.checked_in_at)}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Main CheckinPage component ─── */
export function CheckinPage() {
  const [volunteerPin, setVolunteerPin] = useState("");
  const [volunteerName, setVolunteerName] = useState("");
  const [sessionToken, setSessionToken] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return "";
      }
      const parsed = JSON.parse(raw);
      return parsed.accessToken || "";
    } catch {
      return "";
    }
  });
  const [activeVolunteer, setActiveVolunteer] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return "";
      }
      const parsed = JSON.parse(raw);
      return parsed.volunteerName || "";
    } catch {
      return "";
    }
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 350);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [availability, setAvailability] = useState({ state: "loading", enabled: false });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const detectorRef = useRef(null);
  const cameraRunningRef = useRef(false);
  const submittingScanRef = useRef(false);
  const searchAbortRef = useRef(null);
  const resultRef = useRef(null);

  const barcodeDetectionSupported = useMemo(
    () => typeof window !== "undefined" && "BarcodeDetector" in window,
    []
  );

  useEffect(() => {
    if (!sessionToken) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: sessionToken,
        volunteerName: activeVolunteer,
      })
    );
  }, [activeVolunteer, sessionToken]);

  useEffect(() => {
    let cancelled = false;
    getCheckinStatus()
      .then((data) => {
        if (cancelled) return;
        setAvailability({ state: "ready", enabled: Boolean(data?.enabled) });
      })
      .catch(() => {
        if (cancelled) return;
        setAvailability({ state: "error", enabled: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function prepareDetector() {
      if (!barcodeDetectionSupported) {
        detectorRef.current = null;
        return;
      }

      try {
        const formats =
          typeof window.BarcodeDetector.getSupportedFormats === "function"
            ? await window.BarcodeDetector.getSupportedFormats()
            : [];
        if (cancelled) {
          return;
        }
        if (formats.length && !formats.includes("qr_code")) {
          detectorRef.current = null;
          return;
        }
        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detectorRef.current = null;
      }
    }

    void prepareDetector();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [barcodeDetectionSupported]);

  useEffect(() => {
    if (lastResult?.participant) {
      resultRef.current?.focus();
    }
  }, [lastResult]);

  function stopCamera() {
    cameraRunningRef.current = false;
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraRunning(false);
  }

  function clearSession() {
    stopCamera();
    setSessionToken("");
    setActiveVolunteer("");
    setSearchResults([]);
    setLastResult(null);
    setMessage("");
  }

  async function login(event) {
    event.preventDefault();
    if (!volunteerPin.trim() || !volunteerName.trim()) {
      setMessage("Enter volunteer name and PIN.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const session = await createCheckinSession(volunteerPin.trim(), volunteerName.trim());
      setSessionToken(session.access_token);
      setActiveVolunteer(session.volunteer_name || volunteerName.trim());
      setVolunteerPin("");
    } catch (error) {
      const norm = normalizeError(error);
      setMessage(norm.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitScan(rawValue) {
    if (!sessionToken) {
      return;
    }
    const value = String(rawValue || scanValue).trim();
    if (!value || submittingScanRef.current) {
      return;
    }

    submittingScanRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await checkinRequest("/participants/scan", sessionToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan_value: value,
          source_device: navigator.userAgent,
        }),
      });

      setScanValue("");
      setLastResult({
        mode: "qr",
        ...result,
      });
      setMessage(
        result.already_checked_in
          ? `${result.participant?.full_name || "Participant"} was already checked in.`
          : `${result.participant?.full_name || "Participant"} checked in successfully.`
      );
    } catch (error) {
      const norm = normalizeError(error);
      setMessage(norm.message);
      if (error?.status === 401 || (error?.message || "").toLowerCase().includes("session")) {
        clearSession();
      }
    } finally {
      submittingScanRef.current = false;
      setBusy(false);
    }
  }

  async function detectQrFrame() {
    if (!cameraRunningRef.current || !videoRef.current || !detectorRef.current) {
      return;
    }

    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      if (codes.length && codes[0].rawValue) {
        stopCamera();
        await submitScan(String(codes[0].rawValue));
        return;
      }
    } catch {
      // Camera frame reads can fail while focus or exposure adjusts.
    }

    frameRef.current = window.requestAnimationFrame(() => {
      void detectQrFrame();
    });
  }

  async function startCamera() {
    if (!barcodeDetectionSupported || !detectorRef.current) {
      setMessage("Camera scan is not supported on this browser. Use manual scan input.");
      return;
    }

    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraRunning(true);
      window.requestAnimationFrame(() => {
        void (async () => {
          if (!videoRef.current || streamRef.current !== stream) {
            return;
          }
          try {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            cameraRunningRef.current = true;
            frameRef.current = window.requestAnimationFrame(() => {
              void detectQrFrame();
            });
          } catch {
            stopCamera();
            setMessage("Unable to start the camera preview. Use manual search instead.");
          }
        })();
      });
    } catch {
      setMessage("Unable to access camera. Allow camera permission or use manual input.");
    }
  }

  async function searchParticipants(event, requestedQuery) {
    event?.preventDefault();
    const query = String(
      requestedQuery ?? event?.currentTarget?.elements?.["participant-search"]?.value ?? searchQuery
    ).trim();
    if (!query) {
      setMessage("Enter rider id, phone, email, name, or city.");
      return;
    }
    const numericOnly = /^\d+$/.test(query);
    if (query.length < 2 && !numericOnly) {
      setSearchResults([]);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearching(true);
    setMessage("");
    try {
      const data = await checkinRequest(
        `/participants/search?q=${encodeURIComponent(query)}`,
        sessionToken,
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return;
      setSearchResults(data.items || []);
      if (!data.items?.length) {
        setMessage("No participants matched this search.");
      }
    } catch (error) {
      if (error.name === "AbortError" || controller.signal.aborted) return;
      const norm = normalizeError(error);
      setMessage(norm.message);
      if (error?.status === 401 || (error?.message || "").toLowerCase().includes("session")) {
        clearSession();
      }
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  useEffect(() => {
    if (!sessionToken) return undefined;
    const numericOnly = /^\d+$/.test(debouncedSearchQuery);
    if (!debouncedSearchQuery || (debouncedSearchQuery.length < 2 && !numericOnly)) {
      searchAbortRef.current?.abort();
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }
    void searchParticipants(undefined, debouncedSearchQuery);
    return () => searchAbortRef.current?.abort();
  }, [debouncedSearchQuery, sessionToken]);

  async function checkInManually(registrationId) {
    setBusy(true);
    setMessage("");
    try {
      const result = await checkinRequest("/participants/manual-checkin", sessionToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          source_device: navigator.userAgent,
        }),
      });
      setSearchResults((current) =>
        current.map((item) =>
          item.id === registrationId ? { ...item, ...result.participant } : item
        )
      );
      setLastResult({
        mode: "manual",
        ...result,
      });
      setMessage(
        result.already_checked_in
          ? `${result.participant?.full_name || "Participant"} was already checked in.`
          : `${result.participant?.full_name || "Participant"} checked in successfully.`
      );
    } catch (error) {
      const norm = normalizeError(error);
      setMessage(norm.message);
    } finally {
      setBusy(false);
    }
  }

  /* ─── LOADING STATE ─── */
  if (availability.state === "loading") {
    return <LoadingScreen label="Loading check-in workspace…" />;
  }

  /* ─── CLOSED STATE ─── */
  if (!availability.enabled) {
    return (
      <main data-theme="dark" className="flex min-h-screen items-center justify-center bg-[#071313] px-4 pb-16 pt-10 text-white sm:px-6">
        <div className="mx-auto w-full max-w-xl rounded-3xl bg-[#f4f1e9] p-6 text-[#071313] shadow-2xl sm:p-8">
          <p className="text-[10px] font-black tracking-[.16em] text-[#ff5f3d] uppercase sm:text-xs">
            Volunteer check-in
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Check-in is closed.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-black/65">
            Thanks for supporting NV Cyclothon. The volunteer check-in workspace is
            currently disabled — reach out to the organizing team if you believe this
            is unexpected.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#071313] px-5 py-3 text-xs font-black tracking-[.12em] uppercase text-white transition-transform hover:-translate-y-0.5 active:scale-[.97] focus:outline-none focus:ring-4 focus:ring-[#ff5f3d]"
          >
            Back to main site →
          </a>
        </div>
      </main>
    );
  }

  /* ─── LOGIN STATE ─── */
  if (!sessionToken) {
    return (
      <main data-theme="dark" className="flex min-h-screen items-center justify-center bg-[#071313] px-4 pb-16 pt-10 text-white sm:px-6">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-[#f4f1e9] p-6 text-[#071313] shadow-2xl sm:p-8">
          <p className="text-[10px] font-black tracking-[.16em] text-[#ff5f3d] uppercase sm:text-xs">
            Volunteer check-in
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Race-day access</h1>
          <p className="mt-3 text-sm leading-relaxed text-black/65">
            Sign in with the volunteer ID and password issued by the event administrator.
          </p>
          <form className="mt-6 space-y-4" onSubmit={login}>
            <div>
              <label htmlFor="volunteer-name" className="block text-xs font-bold uppercase tracking-[.1em]">
                Volunteer ID
              </label>
              <Input
                id="volunteer-name"
                className="mt-1.5 rounded-xl border border-black/15 bg-white px-3 text-base"
                placeholder="desk-01"
                value={volunteerName}
                onChange={(event) => setVolunteerName(event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div>
              <label htmlFor="volunteer-pin" className="block text-xs font-bold uppercase tracking-[.1em]">
                Password
              </label>
              <Input
                id="volunteer-pin"
                className="mt-1.5 rounded-xl border border-black/15 bg-white px-3 text-base"
                placeholder="Volunteer password"
                value={volunteerPin}
                onChange={(event) => setVolunteerPin(event.target.value)}
                autoComplete="off"
                type="password"
                enterKeyHint="go"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl text-sm"
            >
              {busy ? "Signing in..." : "Open check-in workspace"}
            </Button>
          </form>
          {message && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl border border-[#ff5f3d]/30 bg-[#fff1eb] px-4 py-3 text-sm leading-relaxed text-[#7a260f]"
            >
              {message}
            </p>
          )}
        </div>
      </main>
    );
  }

  /* ─── MAIN WORKSPACE ─── */
  return (
    <main className="min-h-screen bg-[#f4f1e9] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-[#071313] sm:px-5 sm:pt-4 md:px-6 md:pt-6">
      <div className="mx-auto w-full max-w-[1440px]">

        {/* ── Header bar ── */}
        <section className="border-b-2 border-[#071313] bg-transparent px-1 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[.16em] text-[#ff5f3d] uppercase sm:text-xs">
                Race-day check-in
              </p>
              <h1 className="mt-0.5 truncate text-lg font-black tracking-tight sm:mt-1 sm:text-2xl">
                {activeVolunteer || "Volunteer"} · ready to scan
              </h1>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={clearSession}
              className="shrink-0 rounded-full px-3 text-xs uppercase sm:px-5"
            >
              <LogOut className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </section>

        {/* ── Status / error message ── */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-start gap-2 rounded-2xl border border-[#ff5f3d]/25 bg-[#fff1eb] px-3 py-2.5 text-sm leading-relaxed text-[#7a260f] sm:mt-4 sm:px-4 sm:py-3"
          >
            <p className="min-w-0 flex-1">{message}</p>
            <button
              type="button"
              aria-label="Dismiss message"
              className="shrink-0 rounded-lg p-1 transition-colors hover:bg-[#ff5f3d]/10 active:bg-[#ff5f3d]/20"
              onClick={() => setMessage("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Last check-in result ── */}
        {lastResult?.participant && <CheckinResult result={lastResult} resultRef={resultRef} />}

        {/* ── Two-column workspace (stacks on mobile) ── */}
        <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-2">

          {/* ▸ QR Check-in card */}
          <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-black sm:text-lg">QR check-in</h2>
            <p className="mt-1 text-xs text-black/60 sm:text-sm">
              Scan using phone camera or paste a scanned QR value.
            </p>

            <div className="mt-3 space-y-3 sm:mt-4">
              {/* Camera preview */}
              {cameraRunning ? (
                <div className="overflow-hidden rounded-2xl bg-black">
                  <video
                    ref={videoRef}
                    aria-label="Camera preview for QR scanning"
                    className="aspect-[3/4] w-full object-cover sm:aspect-video"
                    playsInline
                    muted
                    autoPlay
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#f4f1e9] p-3 text-xs leading-relaxed text-black/65 sm:p-4 sm:text-sm">
                  Point the rear camera at a rider QR code. Camera preview opens only while scanning.
                </div>
              )}

              {/* Camera toggle + unsupported badge */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={cameraRunning ? stopCamera : startCamera}
                  className="rounded-xl text-sm active:scale-[.97]"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {cameraRunning ? "Stop camera" : "Start camera"}
                </Button>
                {!barcodeDetectionSupported && (
                  <span className="inline-flex items-center rounded-xl bg-[#ffe6e0] px-3 py-2 text-xs font-bold text-[#7a260f]">
                    Browser camera scan not supported
                  </span>
                )}
              </div>

              {/* Manual QR input */}
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitScan(scanValue);
                }}
              >
                <label htmlFor="scan-payload" className="sr-only">
                  Scanned QR payload
                </label>
                <Input
                  id="scan-payload"
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  placeholder="Paste scanned QR payload"
                  className="mt-0 flex-1 rounded-xl border border-black/15 bg-white px-3 text-base"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                />
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-[#ff5f3d] text-sm hover:bg-[#d9492c] active:scale-[.97] sm:w-auto"
                  disabled={busy || !scanValue.trim()}
                >
                  Mark check-in
                </Button>
              </form>
            </div>
          </article>

          {/* ▸ Manual search card */}
          <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-black sm:text-lg">Manual search fallback</h2>
            <p className="mt-1 text-xs text-black/60 sm:text-sm">
              Search by rider id, phone, email, full name, or city.
            </p>

            {/* Search input */}
            <form className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row" onSubmit={searchParticipants}>
              <label htmlFor="participant-search" className="sr-only">
                Search participants
              </label>
              <Input
                id="participant-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ID, phone, email, or name"
                className="mt-0 flex-1 rounded-xl border border-black/15 bg-white px-3 text-base"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
              />
              <Button
                type="submit"
                disabled={searching}
                className="w-full rounded-xl text-sm active:scale-[.97] sm:w-auto"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                {searching ? "Searching…" : "Search"}
              </Button>
            </form>

            {/* Results container */}
            <div
              className="mt-3 overflow-visible rounded-2xl border border-black/10 sm:mt-4 lg:max-h-[440px] lg:overflow-auto"
              role="region"
              aria-label="Participant search results"
              tabIndex="0"
            >
              {searching && !searchResults.length ? (
                <div className="p-4">
                  <LoadingIndicator label="Searching participants..." className="text-sm" />
                </div>
              ) : searchResults.length ? (
                <>
                  {/* Mobile cards (< lg) */}
                  <div className="space-y-3 p-3 lg:hidden">
                    {searchResults.map((participant) => (
                      <ParticipantMobileCard
                        key={participant.id}
                        participant={participant}
                        busy={busy}
                        onCheckIn={(id) => void checkInManually(id)}
                      />
                    ))}
                  </div>

                  {/* Desktop table (≥ lg) */}
                  <table className="hidden w-full min-w-[820px] text-left text-xs lg:table">
                    <thead className="sticky top-0 bg-[#071313] text-white">
                      <tr>
                        <th scope="col" className="p-3 font-black uppercase">Rider</th>
                        <th scope="col" className="p-3 font-black uppercase">Route</th>
                        <th scope="col" className="p-3 font-black uppercase">Status</th>
                        <th scope="col" className="p-3 font-black uppercase">Check-in detail</th>
                        <th scope="col" className="p-3 font-black uppercase"><span className="sr-only">Action</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/8 bg-white">
                      {searchResults.map((participant) => (
                        <tr key={participant.id}>
                          <td className="p-3 align-top">
                            <p className="font-black">#{participant.id} · {participant.full_name}</p>
                            <p className="mt-1 text-black/60">{participant.phone}</p>
                            <p className="text-black/60">{participant.email}</p>
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-bold">{participant.ride_category}</p>
                            <p className="mt-1 text-black/60">{participant.city}</p>
                            {participant.organization_name && (
                              <p className="mt-1 text-xs font-semibold text-black/70">
                                🏛️ {participant.organization_name}
                              </p>
                            )}
                          </td>
                          <td className="p-3 align-top">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusPillClasses(participant.status)}`}>
                              {formatStatus(participant.status)}
                            </span>
                          </td>
                          <td className="p-3 align-top text-black/65">
                            <p>{formatDateTime(participant.checked_in_at)}</p>
                            {participant.checked_in_by && <p className="mt-1">By {participant.checked_in_by} · {participant.checkin_method || "manual"}</p>}
                          </td>
                          <td className="p-3 align-top text-right">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void checkInManually(participant.id)}
                              disabled={busy || participant.status === "cancelled" || participant.status === "checked_in"}
                              className="rounded-lg bg-[#ff5f3d] hover:bg-[#d9492c] disabled:cursor-not-allowed"
                            >
                              {participant.status === "checked_in" ? "Done" : "Check in"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="p-4 text-sm text-black/55">
                  Search results will appear here.
                </p>
              )}
            </div>
          </article>
        </section>

      </div>
    </main>
  );
}
