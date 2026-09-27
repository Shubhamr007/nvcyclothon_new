import { Reveal } from "../../../components/Reveal";
import { COMPARISON_FEATURES, COMPARISON_MATRIX } from "../constants";

export function SponsorshipComparison() {
  return (
    <section className="relative border-b border-white/10 bg-[#071313] px-5 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
              DELIVERABLE MATRIX
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              SPONSORSHIP COMPARISON
            </h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Detailed side-by-side comparison of rights, visibility, and benefits across primary tiers.
            </p>
          </div>

          {/* Horizontally scrollable table container */}
          <div className="mt-12 overflow-x-auto pb-4">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-4 pr-6 text-sm font-bold uppercase tracking-wider text-white/50 w-1/4">
                    Deliverables / Rights
                  </th>
                  {COMPARISON_MATRIX.map((col) => (
                    <th key={col.packageName} className="px-4 py-4 text-center">
                      <div className="font-display text-base font-bold text-white sm:text-lg">
                        {col.packageName}
                      </div>
                      <div className="mt-1 text-xs font-black text-[#ff5f3d]">
                        {col.price}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {COMPARISON_FEATURES.map((feature) => (
                  <tr key={feature.key} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 pr-6 text-sm font-medium text-white/80">
                      {feature.label}
                    </td>
                    {COMPARISON_MATRIX.map((col) => {
                      const val = col.features[feature.key];
                      const isNone = val === "—";
                      return (
                        <td
                          key={col.packageName}
                          className={`px-4 py-4 text-center text-xs ${
                            isNone
                              ? "text-white/30"
                              : "text-white font-medium"
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clarification footnote */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60 leading-relaxed">
            <span className="font-bold text-white">Note: </span>
            Hydration / Medical Partner (₹50,000, Category Exclusive) and Media Partner (In-Kind, Exclusive) are specialized category partnerships with dedicated branding at water stations/medical booths and broadcast rights respectively, and are managed separately from the general branding matrix.
          </div>
        </Reveal>
      </div>
    </section>
  );
}
