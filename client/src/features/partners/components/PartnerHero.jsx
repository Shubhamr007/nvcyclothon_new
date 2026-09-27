import { Link } from "react-router-dom";
import { Reveal } from "../../../components/Reveal";
import { EVENT_DETAILS } from "../constants";

export function PartnerHero({ onBecomePartnerClick, onExplorePackagesClick }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#071313] px-5 pb-16 pt-32 text-white sm:pt-40 lg:pb-24">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#ff5f3d]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#d9ff38]/10 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9ff38]/30 bg-[#d9ff38]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
            <span className="h-2 w-2 rounded-full bg-[#d9ff38] animate-pulse" />
            PARTNER WITH NV CYCLOTHON
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            PUT YOUR BRAND WHERE <br className="hidden sm:inline" />
            <span className="text-[#ff5f3d]">VINDHYA COMES TOGETHER.</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80 sm:text-xl">
            NV Cyclothon is more than a cycling event. It is a growing community platform connecting riders,
            families, businesses and communities across the Vindhya region.
          </p>

          {/* Official Event Facts */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Date & Location</span>
              <p className="mt-1 font-bold text-white sm:text-lg">22 Nov 2026</p>
              <p className="text-xs text-white/70">Rewa, Madhya Pradesh</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Expected Riders</span>
              <p className="mt-1 font-display text-2xl font-black text-[#d9ff38] sm:text-3xl">{EVENT_DETAILS.expectedRiders}</p>
              <p className="text-xs text-white/70">Across 4 ride categories</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Ride Categories</span>
              <p className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">4</p>
              <p className="text-xs text-white/70">Road, MTB, Green & Kids</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Regional Reach</span>
              <p className="mt-1 font-display text-2xl font-black text-[#ff5f3d] sm:text-3xl">5</p>
              <p className="text-xs text-white/70">Rewa, Satna, Sidhi, Singrauli, Shahdol</p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onBecomePartnerClick}
              className="inline-flex items-center justify-center rounded-full bg-[#ff5f3d] px-8 py-4 text-sm font-black uppercase tracking-wider text-[#071313] transition hover:bg-[#ff5f3d]/90 hover:shadow-lg hover:shadow-[#ff5f3d]/20 active:scale-95"
            >
              BECOME A PARTNER
            </button>
            <button
              type="button"
              onClick={onExplorePackagesClick}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-wider text-white backdrop-blur-sm transition hover:border-[#d9ff38] hover:text-[#d9ff38] active:scale-95"
            >
              EXPLORE PARTNERSHIP OPTIONS
            </button>
          </div>

          {/* Dual Path Explanatory Banner: Sponsor vs. Vendor */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent p-6">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d9ff38]">TWO WAYS TO ENGAGE</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/30 p-5">
                <div>
                  <h3 className="text-lg font-bold uppercase text-white">Commercial Sponsorship</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Align your brand at scale through jersey placement, start/finish branding, digital visibility, and VIP hospitality.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBecomePartnerClick}
                  className="mt-4 text-left text-xs font-bold uppercase tracking-wider text-[#ff5f3d] hover:underline"
                >
                  Apply as Sponsor &rarr;
                </button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/30 p-5">
                <div>
                  <h3 className="text-lg font-bold uppercase text-white">Event Stalls & Vendors</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Sell or sample your products and services directly to athletes and visitors in cycling, food, nutrition, apparel, or photography.
                  </p>
                </div>
                <Link
                  to="/vendors"
                  className="mt-4 text-left text-xs font-bold uppercase tracking-wider text-[#d9ff38] hover:underline"
                >
                  Apply as Event Vendor &rarr;
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
