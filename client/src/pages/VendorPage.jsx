import { useRef } from "react";
import { useSiteSettings } from "../state/SiteSettingsContext";
import { VendorSection } from "../features/vendors/components/VendorSection";
import { VendorApplicationForm } from "../features/vendors/components/VendorApplicationForm";
import { CONTACT_INFO } from "../features/partners/constants";

export function VendorPage() {
  const { settings } = useSiteSettings();
  const formRef = useRef(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#071313] text-white">
      {/* Vendor Hero & Category Showcase */}
      <VendorSection onApplyClick={scrollToForm} />

      {/* Vendor Application Form */}
      <section
        ref={formRef}
        aria-labelledby="vendor-apply-heading"
        className="relative px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          {settings.vendor_applications_open === false ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <span className="rounded-full bg-[#ff5f3d]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff5f3d]">
                Vendor Registration Closed
              </span>
              <p className="mt-4 text-sm text-white/80">
                Vendor stall applications for NV Cyclothon 2026 are currently closed.
              </p>
              <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">
                For urgent logistical queries: <br />
                <span className="font-bold text-white">{CONTACT_INFO.lead}</span>, {CONTACT_INFO.designation} <br />
                Phone: {CONTACT_INFO.phone} | Email: {CONTACT_INFO.email}
              </div>
            </div>
          ) : (
            <VendorApplicationForm />
          )}
        </div>
      </section>
    </main>
  );
}
