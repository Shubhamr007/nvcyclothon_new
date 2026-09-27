import { useState } from "react";
import { Reveal } from "../../../components/Reveal";
import { BRAND_VISIBILITY_ITEMS } from "../constants";

export function BrandVisibility() {
  const [activeItem, setActiveItem] = useState(BRAND_VISIBILITY_ITEMS[0]);

  return (
    <section className="relative border-b border-white/10 bg-[#071313] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
              TOUCHPOINT INVENTORY
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              BRAND VISIBILITY
            </h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Explore the 12 tangible and digital race-day touchpoints where your brand identity is prominently placed.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-12">
            {/* Interactive Selector List */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-2">
              {BRAND_VISIBILITY_ITEMS.map((item) => {
                const isActive = activeItem.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition duration-200 ${
                      isActive
                        ? "border-[#ff5f3d] bg-white/[0.08] shadow-md shadow-[#ff5f3d]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#d9ff38]">
                      {item.category}
                    </span>
                    <span className="mt-1 font-display text-sm font-bold uppercase tracking-tight text-white">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Touchpoint Detail Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-8 lg:col-span-5">
              <div>
                <div className="inline-flex rounded-full bg-[#ff5f3d]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff5f3d]">
                  {activeItem.category}
                </div>
                <h3 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-white">
                  {activeItem.name}
                </h3>
                <div className="mt-6 border-t border-white/10 pt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                    Branding Placement
                  </span>
                  <p className="mt-1.5 font-bold text-white text-sm">
                    {activeItem.placement}
                  </p>
                </div>
                <div className="mt-6 border-t border-white/10 pt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                    Visibility Context
                  </span>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                    {activeItem.description}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/60">
                <span className="font-bold text-[#d9ff38]">Quality Standard: </span>
                All partner artwork is reproduced using official high-resolution vector assets verified by the RDCA organizing committee.
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
