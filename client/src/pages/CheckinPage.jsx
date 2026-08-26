import { useEffect, useMemo, useRef, useState } from "react";
import { checkinRequest, createCheckinSession, getCheckinStatus } from "../api/http";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { useDebouncedValue } from "../components/useDebouncedValue";

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
      setMessage(error.message);
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
          ? "Participant was already checked in."
          : "Check-in completed successfully."
      );
    } catch (error) {
      setMessage(error.message);
      if (error.message.toLowerCase().includes("session")) {
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      cameraRunningRef.current = true;
      setCameraRunning(true);
      frameRef.current = window.requestAnimationFrame(() => {
        void detectQrFrame();
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
      setMessage(error.message);
      if (error.message.toLowerCase().includes("session")) {
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
          ? "Participant was already checked in."
          : "Manual check-in completed successfully."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (availability.state === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#071313] px-5 text-white">
        <LoadingIndicator label="Loading check-in workspace…" />
      </main>
    );
  }

  if (!availability.enabled) {
    return (
      <main className="min-h-screen bg-[#071313] px-5 pb-16 pt-10 text-white">
        <div className="mx-auto w-full max-w-xl rounded-3xl bg-[#f4f1e9] p-8 text-[#071313] shadow-2xl">
          <p className="text-xs font-black tracking-[.16em] text-[#ff5f3d] uppercase">
            Volunteer check-in
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Check-in is closed.
          </h1>
          <p className="mt-3 text-sm text-black/65">
            Thanks for supporting NV Cyclothon. The volunteer check-in workspace is
            currently disabled — reach out to the organizing team if you believe this
            is unexpected.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#071313] px-5 py-3 text-xs font-black tracking-[.12em] uppercase text-white hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#ff5f3d]"
          >
            Back to main site →
          </a>
        </div>
      </main>
    );
  }

  if (!sessionToken) {
    return (
      <main className="min-h-screen bg-[#071313] px-5 pb-16 pt-10 text-white">
        <div className="mx-auto w-full max-w-xl rounded-3xl bg-[#f4f1e9] p-8 text-[#071313] shadow-2xl">
          <p className="text-xs font-black tracking-[.16em] text-[#ff5f3d] uppercase">
            Volunteer check-in
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Race-day access</h1>
          <p className="mt-3 text-sm text-black/65">
            Sign in with the volunteer ID and password issued by the event administrator.
          </p>
          <form className="mt-6 space-y-3" onSubmit={login}>
            <label htmlFor="volunteer-name" className="block text-xs font-bold uppercase tracking-[.1em]">
              Volunteer ID
            </label>
            <input
              id="volunteer-name"
              className="w-full rounded-xl border border-black/15 bg-white p-3"
              placeholder="desk-01"
              value={volunteerName}
              onChange={(event) => setVolunteerName(event.target.value)}
              autoComplete="off"
            />
            <label htmlFor="volunteer-pin" className="block text-xs font-bold uppercase tracking-[.1em]">
              Password
            </label>
            <input
              id="volunteer-pin"
              className="w-full rounded-xl border border-black/15 bg-white p-3"
              placeholder="Volunteer password"
              value={volunteerPin}
              onChange={(event) => setVolunteerPin(event.target.value)}
              autoComplete="off"
              type="password"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#071313] p-3 font-bold text-white disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Open check-in workspace"}
            </button>
          </form>
          {message && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl border border-[#ff5f3d]/30 bg-[#fff1eb] px-4 py-3 text-sm text-[#7a260f]"
            >
              {message}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
      <main className="min-h-screen bg-[#f4f1e9] px-3 pb-10 pt-3 text-[#071313] sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="border-b-2 border-[#071313] bg-transparent px-1 py-4 sm:px-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-[.16em] text-[#ff5f3d] uppercase">
                Race-day check-in
              </p>
              <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                {activeVolunteer || "Volunteer"} · ready to scan
              </h1>
            </div>
            <button
              onClick={clearSession}
              className="rounded-full border border-[#071313]/25 px-4 py-2 text-xs font-black tracking-[.08em] uppercase hover:bg-[#071313] hover:text-white"
            >
              Sign out
            </button>
          </div>
        </section>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 rounded-2xl border border-[#ff5f3d]/25 bg-[#fff1eb] px-4 py-3 text-sm text-[#7a260f]"
          >
            {message}
          </p>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">QR check-in</h2>
            <p className="mt-1 text-sm text-black/60">
              Scan using phone camera or paste a scanned QR value.
            </p>

            <div className="mt-4 space-y-3">
              <div className="overflow-hidden rounded-2xl bg-black">
                <video
                  ref={videoRef}
                  aria-label="Camera preview for QR scanning"
                  className="aspect-video w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={cameraRunning ? stopCamera : startCamera}
                  className="rounded-xl bg-[#071313] px-4 py-2 text-sm font-bold text-white"
                >
                  {cameraRunning ? "Stop camera" : "Start camera"}
                </button>
                {!barcodeDetectionSupported && (
                  <span className="inline-flex items-center rounded-xl bg-[#ffe6e0] px-3 py-2 text-xs font-bold text-[#7a260f]">
                    Browser camera scan not supported
                  </span>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <label htmlFor="scan-payload" className="sr-only">
                  Scanned QR payload
                </label>
                <input
                  id="scan-payload"
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  placeholder="Paste scanned QR payload"
                  className="rounded-xl border border-black/15 bg-white px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => void submitScan(scanValue)}
                  className="rounded-xl bg-[#ff5f3d] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                  disabled={busy || !scanValue.trim()}
                >
                  Mark check-in
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Manual search fallback</h2>
            <p className="mt-1 text-sm text-black/60">
              Search by rider id, phone, email, full name, or city.
            </p>

            <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={searchParticipants}>
              <label htmlFor="participant-search" className="sr-only">
                Search participants
              </label>
              <input
                id="participant-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Example: 120, +9198..., rider@email.com"
                className="rounded-xl border border-black/15 bg-white px-3 py-2"
              />
              <button
                type="submit"
                disabled={searching}
                className="rounded-xl bg-[#071313] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
              >
                {searching ? "Searching…" : "Search"}
              </button>
            </form>

            <div className="mt-4 max-h-[440px] overflow-auto rounded-2xl border border-black/10" role="region" aria-label="Participant search results" tabIndex="0">
              {searching && !searchResults.length ? (
                <div className="p-4">
                  <LoadingIndicator label="Searching participants..." className="text-sm" />
                </div>
              ) : searchResults.length ? (
                <table className="w-full min-w-[820px] text-left text-xs">
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
                          <button
                            type="button"
                            onClick={() => void checkInManually(participant.id)}
                            disabled={busy || participant.status === "cancelled" || participant.status === "checked_in"}
                            className="rounded-lg bg-[#ff5f3d] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {participant.status === "checked_in" ? "Done" : "Check in"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-sm text-black/55">
                  Search results will appear here.
                </p>
              )}
            </div>
          </article>
        </section>

        {lastResult?.participant && (
          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs font-black tracking-[.12em] text-[#ff5f3d] uppercase">
              Latest check-in result ({lastResult.mode})
            </p>
            <h3 className="mt-2 text-2xl font-black">
              #{lastResult.participant.id} · {lastResult.participant.full_name}
            </h3>
            <p className="mt-1 text-sm text-black/65">
              {lastResult.participant.ride_category} · {lastResult.participant.city}
            </p>
            <p className="mt-1 text-sm text-black/65">
              Status: {formatStatus(lastResult.participant.status)}
              {" · "}
              Checked in at: {formatDateTime(lastResult.participant.checked_in_at)}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
