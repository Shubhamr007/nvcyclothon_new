import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, Flag, Home, MapPin, Users, Award } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 - Page Not Found | NV Cyclothon 2026";
  }, []);

  const quickLinks = [
    {
      title: "Event Home",
      desc: "Overview of the 3rd Edition in Rewa",
      to: "/",
      icon: Home,
      color: "hover:border-[#d9ff38]",
    },
    {
      title: "Register for Ride",
      desc: "60KM, 30KM, 10KM & Kid-o-thon",
      to: "/register",
      icon: Flag,
      color: "hover:border-[#ff5f3d]",
    },
    {
      title: "Explore Race Categories",
      desc: "Check elevation, routes & prize rules",
      to: "/#routes",
      icon: MapPin,
      color: "hover:border-[#d9ff38]",
    },
    {
      title: "Volunteer Check-in",
      desc: "Race-day participant scanner",
      to: "/checkin",
      icon: Users,
      color: "hover:border-[#ff5f3d]",
    },
    {
      title: "Corporate Partners",
      desc: "Brand sponsorship opportunities",
      to: "/partners",
      icon: Award,
      color: "hover:border-[#d9ff38]",
    },
  ];

  return (
    <main className="relative min-h-screen bg-[#071313] px-4 pb-24 pt-32 text-white sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 h-[350px] w-[500px] rounded-full bg-gradient-to-tr from-[#ff5f3d]/15 to-[#d9ff38]/10 blur-[100px]"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Error badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ff5f3d]/30 bg-[#ff5f3d]/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#ff5f3d]">
          <Compass className="h-4 w-4 animate-spin text-[#ff5f3d]" style={{ animationDuration: "12s" }} />
          <span>CODE: ERR_ROUTE_NOT_FOUND (404)</span>
        </div>

        {/* 404 Headline */}
        <h1 className="mt-6 text-6xl font-black uppercase tracking-[-0.08em] sm:text-8xl">
          Off <span className="text-[#ff5f3d]">Course</span>
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
          Looks like you took an uncharted detour! This waypoint doesn't exist on the official NV Cyclothon 2026 route map.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/15 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#d9ff38] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#071313] transition hover:bg-[#c2e62e] active:scale-95 shadow-[0_0_20px_rgba(217,255,56,0.3)]"
          >
            <Home className="h-4 w-4" />
            <span>Back to Course Home</span>
          </Link>
        </div>

        {/* Fast Route Directory */}
        <div className="mt-14 text-left">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#d9ff38]">
            Popular Course Destinations
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:bg-white/[0.07] ${item.color}`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d9ff38] transition group-hover:bg-[#ff5f3d] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-[#d9ff38]">
                      {item.title}
                    </p>
                    <p className="text-xs text-white/60 truncate">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/50">
          Need assistance or looking for group registrations? Contact RDCA at{" "}
          <a href="mailto:nvcyclothon@gmail.com" className="font-bold text-[#d9ff38] underline">
            nvcyclothon@gmail.com
          </a>{" "}
          or call <span className="font-bold text-white">+91 88395 03099</span>.
        </div>
      </div>
    </main>
  );
}
