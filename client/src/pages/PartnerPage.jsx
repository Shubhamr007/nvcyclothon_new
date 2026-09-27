import { useState, useEffect, useRef } from "react";
import { useSiteSettings } from "../state/SiteSettingsContext";
import { getApprovedPartners } from "../api/http";
import { PartnerHero } from "../features/partners/components/PartnerHero";
import { WhyPartner } from "../features/partners/components/WhyPartner";
import { SponsorshipPackages } from "../features/partners/components/SponsorshipPackages";
import { SponsorshipComparison } from "../features/partners/components/SponsorshipComparison";
import { BrandVisibility } from "../features/partners/components/BrandVisibility";
import { OurPartners } from "../features/partners/components/OurPartners";
import { PartnerApplicationForm } from "../features/partners/components/PartnerApplicationForm";
import { CONTACT_INFO } from "../features/partners/constants";

export function PartnerPage() {
  const { settings } = useSiteSettings();
  const [approvedPartners, setApprovedPartners] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const applicationRef = useRef(null);
  const packagesRef = useRef(null);

  useEffect(() => {
    getApprovedPartners()
      .then((data) => setApprovedPartners(data || []))
      .catch(() => setApprovedPartners([]));
  }, []);

  const scrollToApplication = () => {
    applicationRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPackages = () => {
    packagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    scrollToApplication();
  };

  const handleCustomClick = () => {
    setSelectedPackage({ id: null, name: "Custom Partnership" });
    scrollToApplication();
  };

  return (
    <main className="min-h-screen bg-[#071313] text-white">
      {/* 1. Hero Section */}
      <PartnerHero
        onBecomePartnerClick={scrollToApplication}
        onExplorePackagesClick={scrollToPackages}
      />

      {/* 2. Why Partner Section */}
      <WhyPartner />

      {/* 3. Sponsorship Packages */}
      <div ref={packagesRef}>
        <SponsorshipPackages
          selectedPackageId={selectedPackage?.id}
          onSelectPackage={handleSelectPackage}
          onCustomClick={handleCustomClick}
        />
      </div>

      {/* 4. Sponsorship Comparison Matrix */}
      <SponsorshipComparison />

      {/* 5. Brand Visibility Touchpoints */}
      <BrandVisibility />

      {/* 6. Dynamic Approved Partners Section */}
      <OurPartners
        partners={approvedPartners}
        onApplyClick={scrollToApplication}
      />

      {/* 7. Become a Partner Application Form */}
      <section
        ref={applicationRef}
        aria-labelledby="partner-apply-heading"
        className="relative px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
              OFFICIAL SPONSORSHIP PORTAL
            </span>
            <h2
              id="partner-apply-heading"
              className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl lg:text-5xl"
            >
              BECOME A PARTNER
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
              Submit your company and brand details to begin the official partnership review process for NV Cyclothon 2026.
            </p>
          </div>

          {settings.partner_applications_open === false ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <span className="rounded-full bg-[#ff5f3d]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff5f3d]">
                Applications Temporarily Closed
              </span>
              <p className="mt-4 text-sm text-white/80">
                Partner applications for the 3rd Edition are currently in committee review.
              </p>
              <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">
                For commercial inquiries, please contact: <br />
                <span className="font-bold text-white">{CONTACT_INFO.lead}</span>, {CONTACT_INFO.designation} <br />
                Phone: {CONTACT_INFO.phone} | Email: {CONTACT_INFO.email}
              </div>
            </div>
          ) : (
            <PartnerApplicationForm initialPackage={selectedPackage} />
          )}
        </div>
      </section>
    </main>
  );
}
