import { Reveal } from "../../../components/Reveal";
import { SPONSORSHIP_PACKAGES } from "../constants";

export function SponsorshipPackages({ selectedPackageId, onSelectPackage, onCustomClick }) {
  return (
    <section id="sponsorship-packages" className="relative border-b border-white/10 bg-[#071313] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
              COMMERCIAL OPPORTUNITIES
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              SPONSORSHIP PACKAGES
            </h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Structured tiers designed to maximize your brand&apos;s physical and digital visibility across all race touchpoints.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SPONSORSHIP_PACKAGES.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              const isTitle = pkg.isTitle;

              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-300 ${
                    isTitle
                      ? "border-[#ff5f3d] bg-gradient-to-b from-[#ff5f3d]/15 via-white/[0.04] to-white/[0.02] shadow-xl shadow-[#ff5f3d]/10 lg:scale-105"
                      : isSelected
                      ? "border-[#d9ff38] bg-white/[0.08]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]"
                  } p-7`}
                >
                  {isTitle && (
                    <div className="absolute -top-3.5 right-6 rounded-full bg-[#ff5f3d] px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-[#071313]">
                      HIGHEST TIER
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                        {pkg.availability}
                      </span>
                      {pkg.complimentaryEntries ? (
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[#d9ff38]">
                          {pkg.complimentaryEntries} Free Entries
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-white">
                      {pkg.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/60">{pkg.tagline}</p>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                        {pkg.price}
                      </span>
                      {pkg.amountPaise > 0 && (
                        <span className="text-xs text-white/50 uppercase tracking-wider">+ GST</span>
                      )}
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                        Included Benefits
                      </p>
                      <ul className="mt-4 space-y-2.5">
                        {pkg.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-white/80 leading-relaxed">
                            <span className="mt-0.5 text-[#d9ff38] font-bold">&check;</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <button
                      type="button"
                      onClick={() => onSelectPackage(pkg)}
                      className={`w-full rounded-full py-3.5 text-xs font-black uppercase tracking-wider transition ${
                        isTitle
                          ? "bg-[#ff5f3d] text-[#071313] hover:bg-[#ff5f3d]/90 shadow-md"
                          : isSelected
                          ? "bg-[#d9ff38] text-[#071313]"
                          : "border border-white/20 bg-white/5 text-white hover:border-[#d9ff38] hover:text-[#d9ff38]"
                      }`}
                    >
                      {isSelected ? "SELECTED FOR APPLICATION" : "SELECT & APPLY"}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Custom Partnership Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-7 transition hover:border-[#d9ff38]/60 hover:bg-white/[0.04]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#d9ff38]">
                  TAILORED ARRANGEMENTS
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-white">
                  CUSTOM PARTNERSHIP
                </h3>
                <p className="mt-1 text-xs text-white/60">Bespoke collaboration model</p>
                <div className="mt-6">
                  <span className="font-display text-2xl font-extrabold text-white">
                    Flexible Terms
                  </span>
                </div>
                <div className="mt-6 border-t border-white/10 pt-6">
                  <p className="text-sm leading-relaxed text-white/75">
                    Custom packages are available for in-kind, hybrid cash + product and multi-year partnerships.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-white/70">
                    <li className="flex items-center gap-2">
                      <span className="text-[#d9ff38]">&bull;</span>
                      In-Kind & Product Exchanges
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#d9ff38]">&bull;</span>
                      Hybrid Cash + Service Collaborations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#d9ff38]">&bull;</span>
                      Multi-Year Vindhya Sports Initiatives
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={onCustomClick}
                  className="w-full rounded-full border border-[#d9ff38]/50 bg-[#d9ff38]/10 py-3.5 text-xs font-black uppercase tracking-wider text-[#d9ff38] transition hover:bg-[#d9ff38] hover:text-[#071313]"
                >
                  DISCUSS A CUSTOM PARTNERSHIP
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
