import { Reveal } from "../../../components/Reveal";
import { apiUrl } from "../../../api/http";

export function OurPartners({ partners = [], onApplyClick }) {
  const hasPartners = Array.isArray(partners) && partners.length > 0;

  // Group by tier
  const titlePartners = partners.filter((p) => /title/i.test(p.tier_name));
  const poweredPartners = partners.filter((p) => /powered/i.test(p.tier_name));
  const associatePartners = partners.filter((p) => /associate/i.test(p.tier_name));
  const supportingPartners = partners.filter((p) => /supporting/i.test(p.tier_name));
  const categoryPartners = partners.filter((p) => /hydration|medical/i.test(p.tier_name));
  const mediaPartners = partners.filter((p) => /media/i.test(p.tier_name));

  return (
    <section className="relative border-b border-white/10 bg-[#071313] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
              OFFICIAL ROSTER
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              OUR PARTNERS
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
              Honoring the visionary brands and organizations fueling NV Cyclothon 3rd Edition.
            </p>
          </div>

          {hasPartners ? (
            <div className="mt-16 space-y-12">
              {titlePartners.length > 0 && (
                <div className="text-center">
                  <h3 className="text-xs font-black uppercase tracking-[.3em] text-[#ff5f3d]">TITLE PARTNER</h3>
                  <div className="mt-6 flex flex-wrap justify-center gap-8">
                    {titlePartners.map((p) => (
                      <PartnerCard key={p.id} partner={p} isTitle />
                    ))}
                  </div>
                </div>
              )}

              {poweredPartners.length > 0 && (
                <div className="text-center">
                  <h3 className="text-xs font-black uppercase tracking-[.3em] text-[#d9ff38]">POWERED BY</h3>
                  <div className="mt-6 flex flex-wrap justify-center gap-8">
                    {poweredPartners.map((p) => (
                      <PartnerCard key={p.id} partner={p} />
                    ))}
                  </div>
                </div>
              )}

              {associatePartners.length > 0 && (
                <div className="text-center">
                  <h3 className="text-xs font-black uppercase tracking-[.3em] text-white/60">ASSOCIATE PARTNERS</h3>
                  <div className="mt-6 flex flex-wrap justify-center gap-6">
                    {associatePartners.map((p) => (
                      <PartnerCard key={p.id} partner={p} small />
                    ))}
                  </div>
                </div>
              )}

              {supportingPartners.length > 0 && (
                <div className="text-center">
                  <h3 className="text-xs font-black uppercase tracking-[.3em] text-white/60">SUPPORTING PARTNERS</h3>
                  <div className="mt-6 flex flex-wrap justify-center gap-6">
                    {supportingPartners.map((p) => (
                      <PartnerCard key={p.id} partner={p} small />
                    ))}
                  </div>
                </div>
              )}

              {categoryPartners.length > 0 && (
                <div className="text-center">
                  <h3 className="text-xs font-black uppercase tracking-[.3em] text-white/60">CATEGORY PARTNERS</h3>
                  <div className="mt-6 flex flex-wrap justify-center gap-6">
                    {categoryPartners.map((p) => (
                      <PartnerCard key={p.id} partner={p} small />
                    ))}
                  </div>
                </div>
              )}

              {mediaPartners.length > 0 && (
                <div className="text-center">
                  <h3 className="text-xs font-black uppercase tracking-[.3em] text-white/60">MEDIA PARTNER</h3>
                  <div className="mt-6 flex flex-wrap justify-center gap-6">
                    {mediaPartners.map((p) => (
                      <PartnerCard key={p.id} partner={p} small />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tasteful empty state strictly following prompt guidelines */
            <div className="mt-14 mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#d9ff38]">
                <span className="text-2xl">&bull;</span>
              </div>
              <p className="mt-5 text-lg font-medium text-white/90">
                Partner with us and become part of the NV Cyclothon journey.
              </p>
              <p className="mt-2 text-xs text-white/50">
                Sponsorship applications for the 3rd Edition are currently open for review.
              </p>
              <button
                type="button"
                onClick={onApplyClick}
                className="mt-6 inline-flex rounded-full bg-[#ff5f3d] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#071313] transition hover:bg-[#ff5f3d]/90 active:scale-95"
              >
                BECOME A PARTNER
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function PartnerCard({ partner, isTitle, small }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-white/30 ${
        isTitle ? "min-w-[260px] p-8" : small ? "min-w-[160px] p-4" : "min-w-[200px] p-6"
      }`}
    >
      {partner.logo_key ? (
        <img
          src={
            partner.logo_key.startsWith('http://') || partner.logo_key.startsWith('https://')
              ? partner.logo_key
              : apiUrl(`/partners/${partner.id}/logo`)
          }
          alt={partner.brand_name || partner.company_name}
          className="max-h-16 w-auto object-contain"
        />
      ) : (
        <div className="font-display font-bold uppercase tracking-tight text-white">
          {partner.brand_name || partner.company_name}
        </div>
      )}
      <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#d9ff38]">
        {partner.tier_name}
      </span>
    </div>
  );
}
