import { Reveal } from "../../../components/Reveal";
import { VENDOR_CATEGORIES, VENDOR_DISCLAIMER } from "../constants";

export function VendorSection({ onApplyClick }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#071313] px-5 pb-16 pt-32 text-white sm:pt-40 lg:pb-24">
      {/* Background ambient accents */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#d9ff38]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#ff5f3d]/10 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9ff38]/30 bg-[#d9ff38]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
            <span className="h-2 w-2 rounded-full bg-[#d9ff38]" />
            EVENT VENDORS
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            BRING YOUR BRAND TO THE <br className="hidden sm:inline" />
            <span className="text-[#d9ff38]">NV CYCLOTHON COMMUNITY.</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Become an official event vendor and bring your products or services to participants and visitors at NV Cyclothon.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onApplyClick}
              className="inline-flex items-center justify-center rounded-full bg-[#d9ff38] px-8 py-4 text-sm font-black uppercase tracking-wider text-[#071313] transition hover:bg-[#d9ff38]/90 active:scale-95 shadow-lg shadow-[#d9ff38]/10"
            >
              BECOME A VENDOR
            </button>
          </div>

          {/* Official terms disclaimer banner */}
          <div className="mt-12 rounded-xl border border-white/15 bg-white/[0.04] p-5 text-sm text-white/80">
            <span className="font-bold text-[#d9ff38]">Commercial Terms & Allocation: </span>
            {VENDOR_DISCLAIMER}
          </div>

          {/* 13 Categories Display */}
          <div className="mt-14">
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              VENDOR CATEGORIES
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Applications are welcomed across the following thirteen commercial sectors.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {VENDOR_CATEGORIES.map((cat) => (
                <div
                  key={cat.value}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-[#d9ff38]/40 hover:bg-white/[0.05]"
                >
                  <div className="text-2xl">{cat.icon}</div>
                  <h3 className="mt-3 font-display font-bold uppercase tracking-tight text-white text-base">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-xs text-white/70 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
