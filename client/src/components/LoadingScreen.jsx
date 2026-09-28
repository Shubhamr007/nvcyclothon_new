import React, { useEffect, useState } from "react";
import { Zap, Flame, Gauge, Flag, Trophy, Activity, Wind } from "lucide-react";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

const MOTIVATIONAL_MESSAGES = [
  "Tuning high-performance gears & prepping the peloton…",
  "Route locked: 60 KM Road • 30 KM MTB • 10 KM Green Ride…",
  "Drafting through Rewa's scenic tracks at peak velocity…",
  "Cadence locked at 112 RPM — Adrenaline surging…",
  "Final sprint unlocked — Approaching the finish line…",
];

const CHECKPOINTS = [
  { distance: "0 KM", label: "START", sub: "Rewa Stadium", percent: 0 },
  { distance: "10 KM", label: "GREEN RIDE", sub: "City Circuit", percent: 25 },
  { distance: "30 KM", label: "MTB RIDE", sub: "Rugged Trail", percent: 50 },
  { distance: "60 KM", label: "CHALLENGE", sub: "Highway Loop", percent: 75 },
  { distance: "FINISH", label: "PODIUM", sub: "Victory Arch", percent: 100 },
];

export function LoadingScreen({
  label = "Gearing up for the ride…",
  progress: externalProgress,
  className = "",
}) {
  const [internalProgress, setInternalProgress] = useState(12);
  const [messageIndex, setMessageIndex] = useState(0);
  const [speed, setSpeed] = useState(44.6);
  const [cadence, setCadence] = useState(106);
  const [power, setPower] = useState(385);

  // Smooth continuous progress simulation that speeds up then rests near completion
  useEffect(() => {
    if (typeof externalProgress === "number") {
      setInternalProgress(externalProgress);
      return;
    }

    const progressInterval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 96) return 96;
        const remaining = 96 - prev;
        const step = Math.max(0.4, remaining * 0.08);
        return Math.min(96, prev + step);
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, [externalProgress]);

  // Rotate energetic motivational messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 2400);

    return () => clearInterval(messageInterval);
  }, []);

  // Jitter athletic telemetry for authentic live race energy
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setSpeed(+(44.0 + Math.random() * 5.2).toFixed(1));
      setCadence(Math.floor(104 + Math.random() * 12));
      setPower(Math.floor(370 + Math.random() * 60));
    }, 800);

    return () => clearInterval(telemetryInterval);
  }, []);

  const currentPercent = Math.round(
    typeof externalProgress === "number" ? externalProgress : internalProgress
  );

  return (
    <main
      data-theme="dark"
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`fixed inset-0 z-50 flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#071313] text-white select-none ${className}`}
    >
      {/* 1. TOP EDGE FULL-WIDTH LASER RUNNER */}
      <div className="absolute top-0 left-0 right-0 z-30 h-1 w-full overflow-hidden bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-transparent via-[#ff5f3d] to-[#d9ff38] transition-all duration-300 ease-out shadow-[0_0_12px_#d9ff38]"
          style={{ width: `${currentPercent}%` }}
        />
      </div>

      {/* AMBIENT SPEED & NEON GLOWS */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-[#ff5f3d]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-96 w-96 rounded-full bg-[#d9ff38]/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,95,61,0.15),rgba(255,255,255,0))]" />

      {/* BACKGROUND VELODROME PERSPECTIVE GRID */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* HEADER BAR */}
      <header className="relative z-10 flex w-full items-center justify-between px-6 pt-7 sm:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff5f3d] to-[#b94d25] p-2 shadow-[0_0_20px_rgba(255,95,61,0.4)]">
            <Flame className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <span className="block font-black text-sm tracking-wider uppercase text-white sm:text-base font-display">
              NV CYCLOTHON <span className="text-[#d9ff38]">2026</span>
            </span>
            <span className="block text-[11px] font-semibold tracking-widest uppercase text-white/50">
              REWA • 3RD EDITION • OFFICIAL SPEEDWAY
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="accent"
            className="hidden sm:inline-flex items-center gap-2 border-[#d9ff38]/40 bg-[#d9ff38]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d9ff38]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d9ff38] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d9ff38]" />
            </span>
            VELOCITY PROTOCOL ACTIVE
          </Badge>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-white/70">
            <Activity className="h-3.5 w-3.5 text-[#ff5f3d]" />
            <span>LIVE PACING</span>
          </div>
        </div>
      </header>

      {/* CENTER HUD: HERO HEADLINE & TELEMETRY */}
      <section className="relative z-10 my-auto flex flex-col items-center justify-center px-4 text-center">
        {/* ENERGETIC MINI BADGE */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ff5f3d]/30 bg-[#ff5f3d]/10 px-4 py-1 text-xs font-black tracking-widest uppercase text-[#ff5f3d] shadow-[0_0_20px_rgba(255,95,61,0.25)]">
          <Zap className="h-3.5 w-3.5 fill-[#ff5f3d]" />
          <span>OWN THE ROAD</span>
        </div>

        {/* BOLD ENTHUSIASTIC TITLE */}
        <h1 className="font-display max-w-3xl text-3xl font-black uppercase tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-sm">
          FEEL THE{" "}
          <span className="bg-gradient-to-r from-[#ff5f3d] via-[#f7f0df] to-[#d9ff38] bg-clip-text text-transparent underline decoration-[#d9ff38]/40 decoration-4 underline-offset-8">
            MOMENTUM
          </span>
        </h1>

        {/* DYNAMIC ROTATING MOTIVATIONAL STATUS */}
        <div className="mt-4 flex h-8 items-center justify-center">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-all duration-300 sm:text-base">
            <Wind className="h-4 w-4 text-[#d9ff38] animate-pulse" />
            <span className="font-sans">{MOTIVATIONAL_MESSAGES[messageIndex]}</span>
          </p>
        </div>

        {/* ATHLETIC TELEMETRY STATS */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 w-full max-w-2xl px-2">
          {/* SPEED */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-md transition-all hover:border-[#ff5f3d]/40 hover:bg-white/[0.06]">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold tracking-widest uppercase text-white/50">
              <Zap className="h-3 w-3 text-[#ff5f3d]" />
              SPEED
            </div>
            <div className="mt-1 font-mono text-xl font-black text-white sm:text-2xl">
              {speed}{" "}
              <span className="text-xs font-bold text-[#ff5f3d]">KM/H</span>
            </div>
          </div>

          {/* CADENCE */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-md transition-all hover:border-[#d9ff38]/40 hover:bg-white/[0.06]">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold tracking-widest uppercase text-white/50">
              <Activity className="h-3 w-3 text-[#d9ff38]" />
              CADENCE
            </div>
            <div className="mt-1 font-mono text-xl font-black text-white sm:text-2xl">
              {cadence}{" "}
              <span className="text-xs font-bold text-[#d9ff38]">RPM</span>
            </div>
          </div>

          {/* POWER */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-md transition-all hover:border-[#e0b04a]/40 hover:bg-white/[0.06]">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold tracking-widest uppercase text-white/50">
              <Flame className="h-3 w-3 text-[#e0b04a]" />
              POWER
            </div>
            <div className="mt-1 font-mono text-xl font-black text-white sm:text-2xl">
              {power}{" "}
              <span className="text-xs font-bold text-[#e0b04a]">WATTS</span>
            </div>
          </div>

          {/* ROUTE */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/[0.06]">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold tracking-widest uppercase text-white/50">
              <Gauge className="h-3 w-3 text-white/70" />
              STATUS
            </div>
            <div className="mt-1 font-mono text-xl font-black text-[#d9ff38] sm:text-2xl">
              {currentPercent}%
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE HERO: FULL WIDTH FROM LEFT TO RIGHT RACING TRACK */}
      <section className="relative z-20 w-full overflow-hidden pb-6">
        {/* FULL-WIDTH DISTANCE CHECKPOINT MARKERS (LEFT TO RIGHT) */}
        <div className="relative mx-auto w-full px-4 sm:px-12 mb-3">
          <div className="relative flex w-full items-end justify-between">
            {CHECKPOINTS.map((cp) => {
              const isPassed = currentPercent >= cp.percent;
              return (
                <div
                  key={cp.label}
                  className={`flex flex-col items-center transition-colors duration-300 ${
                    isPassed ? "text-[#d9ff38]" : "text-white/40"
                  }`}
                  style={{
                    transform:
                      cp.percent === 0
                        ? "none"
                        : cp.percent === 100
                        ? "none"
                        : "translateX(0%)",
                  }}
                >
                  <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase font-mono">
                    {cp.distance}
                  </span>
                  <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-widest text-white/60">
                    {cp.label}
                  </span>
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full border transition-all duration-300 ${
                      isPassed
                        ? "border-[#d9ff38] bg-[#d9ff38] shadow-[0_0_8px_#d9ff38]"
                        : "border-white/20 bg-white/5"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* FULL-WIDTH VELODROME ROAD TRACK CONTAINER */}
        <div className="relative w-full border-y border-white/10 bg-[#071313]/90 py-5 backdrop-blur-md overflow-hidden">
          {/* ASPHALT ROAD TEXTURE & MOVING DASHED ROAD STRIPES */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-around opacity-25">
            <div
              className="h-[2px] w-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #ffffff 0, #ffffff 18px, transparent 18px, transparent 40px)",
                animation: "road-dash-stream 0.8s linear infinite",
              }}
            />
          </div>

          {/* FULL WIDTH SHADCN PROGRESS TRACK (EDGE-TO-EDGE) */}
          <div className="relative w-full px-2 sm:px-6">
            <Progress
              value={currentPercent}
              className="h-3 w-full rounded-full bg-white/10 border border-white/15"
              indicatorClassName="bg-gradient-to-r from-[#ff5f3d] via-[#e0b04a] to-[#d9ff38] shadow-[0_0_24px_rgba(217,255,56,0.8)]"
            />
          </div>

          {/* DYNAMIC RACING CYCLIST SURGING FULL-WIDTH FROM LEFT TO RIGHT */}
          <div
            className="pointer-events-none absolute bottom-5 left-0 w-full px-2 sm:px-6"
            style={{ height: "48px" }}
          >
            <div
              className="absolute bottom-1 -translate-x-1/2 transition-all duration-200 ease-out will-change-transform"
              style={{
                left: `${Math.max(4, Math.min(96, currentPercent))}%`,
              }}
            >
              {/* SLIPSTREAM / EXHAUST FLAME TRAIL (Leftwards behind bike) */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-28 bg-gradient-to-l from-[#d9ff38]/60 via-[#ff5f3d]/40 to-transparent blur-sm -z-10 rounded-full" />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 h-1.5 w-16 bg-gradient-to-l from-white via-[#d9ff38] to-transparent -z-10 rounded-full" />

              {/* FORWARD HEADLIGHT BEAM (Rightwards in front of bike) */}
              <div
                className="absolute left-9 top-1/2 -translate-y-1/2 h-7 w-20 bg-gradient-to-r from-[#d9ff38]/40 to-transparent blur-md -z-10"
                style={{
                  clipPath: "polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)",
                }}
              />

              {/* DETAILED AERO RACING CYCLIST SVG */}
              <div
                className="relative flex items-center justify-center text-white"
                style={{
                  animation: "racer-bob 0.5s ease-in-out infinite",
                }}
              >
                <svg
                  className="h-11 w-14 drop-shadow-[0_0_12px_rgba(217,255,56,0.9)]"
                  viewBox="0 0 74 46"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* REAR WHEEL */}
                  <g
                    style={{
                      transformOrigin: "16px 32px",
                      animation: "racer-wheel-spin 0.4s linear infinite",
                    }}
                  >
                    <circle
                      cx="16"
                      cy="32"
                      r="10"
                      stroke="#ff5f3d"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="16"
                      cy="32"
                      r="7"
                      stroke="#d9ff38"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                    />
                    <line
                      x1="16"
                      y1="22"
                      x2="16"
                      y2="42"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <line
                      x1="6"
                      y1="32"
                      x2="26"
                      y2="32"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <circle cx="16" cy="32" r="2.5" fill="#d9ff38" />
                  </g>

                  {/* FRONT WHEEL */}
                  <g
                    style={{
                      transformOrigin: "56px 32px",
                      animation: "racer-wheel-spin 0.4s linear infinite",
                    }}
                  >
                    <circle
                      cx="56"
                      cy="32"
                      r="10"
                      stroke="#d9ff38"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="56"
                      cy="32"
                      r="7"
                      stroke="#ff5f3d"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                    />
                    <line
                      x1="56"
                      y1="22"
                      x2="56"
                      y2="42"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <line
                      x1="46"
                      y1="32"
                      x2="66"
                      y2="32"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <circle cx="56" cy="32" r="2.5" fill="#ff5f3d" />
                  </g>

                  {/* BIKE FRAME (AERODYNAMIC GEOMETRY) */}
                  <path
                    d="M16 32 L34 32 L50 16 L28 16 Z"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="34"
                    y1="32"
                    x2="28"
                    y2="16"
                    stroke="#ff5f3d"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="50"
                    y1="16"
                    x2="56"
                    y2="32"
                    stroke="#d9ff38"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />

                  {/* SEAT POST & SADDLE */}
                  <line
                    x1="28"
                    y1="16"
                    x2="26"
                    y2="12"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M21 12 C24 11 29 11 31 12"
                    stroke="#ff5f3d"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />

                  {/* HANDLEBARS (AERO DROP BARS) */}
                  <path
                    d="M48 15 L52 11 L55 14"
                    stroke="#d9ff38"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* CYCLIST BODY IN AGGRESSIVE AERO TUCK */}
                  {/* Helmet & Head */}
                  <ellipse
                    cx="44"
                    cy="8"
                    rx="5"
                    ry="3.5"
                    transform="rotate(-15 44 8)"
                    fill="#d9ff38"
                  />
                  <path
                    d="M47 8 L50 7.5"
                    stroke="#071313"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Torso */}
                  <path
                    d="M26 13 C30 11 36 10 42 10"
                    stroke="#ff5f3d"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />

                  {/* Arms to Handlebars */}
                  <path
                    d="M40 11 L48 14 L52 12"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Legs Pedaling */}
                  <path
                    d="M27 14 L33 22 L35 31"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* FINISH LINE CHECKERED FLAG AT RIGHT EDGE */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 sm:pr-8 pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#071313]/80 px-2.5 py-1 text-xs font-black text-[#d9ff38] shadow-[0_0_15px_rgba(217,255,56,0.3)]">
              <Flag className="h-3.5 w-3.5 fill-[#d9ff38]" />
              <span className="hidden sm:inline">FINISH</span>
            </div>
          </div>
        </div>

        {/* BOTTOM METRIC & FOOTER NOTICE */}
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-4 text-xs text-white/50 sm:px-12 font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#d9ff38] animate-pulse" />
            <span className="uppercase text-white/80 font-bold tracking-wider font-display">
              {label}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/40">
              REWA VELODROME • HIGH VELOCITY LOAD
            </span>
            <span className="font-bold text-white tracking-widest">
              {currentPercent}% COMPLETED
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoadingScreen;
