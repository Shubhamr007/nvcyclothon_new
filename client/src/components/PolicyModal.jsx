import { useState, useEffect, useRef, useId } from "react";
import {
  X,
  ShieldAlert,
  FileText,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Copyright,
  Search,
  Bike,
  HeartPulse,
  Printer,
  Info,
} from "lucide-react";

export function PolicyModal({ isOpen, onClose, initialTab = "refund" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef(null);
  const tabListRef = useRef(null);
  const searchInputRef = useRef(null);
  const previousFocusRef = useRef(null);

  const titleId = useId();
  const subtitleId = useId();

  // Sync tab on initialTab prop change
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Accessibility: Focus trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    // Set initial focus to the active tab button
    const timer = setTimeout(() => {
      const activeTabBtn = tabListRef.current?.querySelector('[aria-selected="true"]');
      if (activeTabBtn) {
        activeTabBtn.focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Trap Tab key within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Arrow key navigation across tablist (WAI-ARIA tabs pattern)
  const handleTabKeyDown = (e, tabs) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextTab = tabs[nextIndex];
      setActiveTab(nextTab.id);
      const tabButtons = tabListRef.current?.querySelectorAll('[role="tab"]');
      tabButtons?.[nextIndex]?.focus();
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "refund", label: "Cancellation & Refund", icon: ShieldAlert },
    { id: "terms", label: "Terms & Conditions", icon: Scale },
    { id: "waiver", label: "Rider Waiver", icon: HeartPulse },
    { id: "privacy", label: "Privacy Policy", icon: Lock },
    { id: "copyright", label: "Copyright & IP", icon: Copyright },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        tabIndex={-1}
        className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-[#071313] bg-[#f8f7f2] text-[#071313] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] outline-none sm:max-h-[92vh] sm:rounded-3xl"
      >
        {/* Top Header */}
        <header className="border-b-2 border-[#071313] bg-[#071313] px-3 py-3 text-white sm:px-7 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ff5f3d] text-white shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id={titleId} className="text-[13px] font-black leading-snug tracking-tight uppercase sm:text-lg">
                  Official Event Policies & Legal Guidelines
                </h2>
                <p id={subtitleId} className="text-[11px] sm:text-xs text-white/70">
                  NV Cyclothon 2026 · Rewa District Cycling Association (RDCA)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                title="Print current policy document"
                aria-label="Print or save policies as PDF"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-[#d9ff38] focus-visible:outline-none"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Print / PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#ff5f3d] hover:text-white focus-visible:ring-2 focus-visible:ring-[#d9ff38] focus-visible:outline-none"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Navigation (WAI-ARIA Tablist) */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Policy sections"
          onKeyDown={(e) => handleTabKeyDown(e, tabs)}
          className="flex overflow-x-auto border-b border-[#071313]/15 bg-white px-1 sm:px-6 no-scrollbar"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`policy-tab-${tab.id}`}
                aria-controls={`policy-panel-${tab.id}`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f3d] sm:gap-2 sm:px-4 sm:py-3.5 sm:text-xs ${
                  isSelected
                    ? "border-[#ff5f3d] text-[#ff5f3d] bg-[#ff5f3d]/5"
                    : "border-transparent text-[#071313]/65 hover:text-[#071313] hover:border-[#071313]/20"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isSelected ? "text-[#ff5f3d]" : "text-[#071313]/40 group-hover:text-[#071313]"
                  }`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Quick Filter Bar */}
        <div className="border-b border-[#071313]/10 bg-[#f1efe8] px-3 py-2 sm:px-7 sm:py-2.5">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#071313]/50" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in policies (e.g. refund, helmet, bib, transfer, medical)..."
              aria-label="Filter policy clauses"
              className="min-h-11 w-full rounded-full border border-[#071313]/15 bg-white py-1.5 pl-9 pr-8 text-xs text-[#071313] placeholder:text-[#071313]/40 focus:border-[#ff5f3d] focus:outline-none focus:ring-2 focus:ring-[#ff5f3d]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear policy search"
                className="absolute right-2.5 text-xs text-[#071313]/50 hover:text-[#071313]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body Panels */}
        <main
          role="tabpanel"
          id={`policy-panel-${activeTab}`}
          aria-labelledby={`policy-tab-${activeTab}`}
          tabIndex={0}
          className="flex-1 overflow-y-auto px-3 py-4 sm:px-7 sm:py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f3d]/40"
        >
          {activeTab === "refund" && <RefundPolicyContent searchQuery={searchQuery} />}
          {activeTab === "terms" && <TermsPolicyContent searchQuery={searchQuery} />}
          {activeTab === "waiver" && <WaiverPolicyContent searchQuery={searchQuery} />}
          {activeTab === "privacy" && <PrivacyPolicyContent searchQuery={searchQuery} />}
          {activeTab === "copyright" && <CopyrightPolicyContent searchQuery={searchQuery} />}
        </main>

        {/* Accessible Footer Bar */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t-2 border-[#071313]/10 bg-white px-3 py-3 text-xs sm:flex-row sm:gap-3 sm:px-7 sm:py-3.5">
          <div className="flex items-center gap-2 text-[#071313]/70 text-[11px] sm:text-xs">
            <Info className="h-4 w-4 shrink-0 text-[#ff5f3d]" aria-hidden="true" />
            <span>Registration implies full acceptance of these terms and conditions.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-full bg-[#071313] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#d9ff38] transition hover:bg-[#ff5f3d] hover:text-white focus-visible:ring-2 focus-visible:ring-[#ff5f3d] focus-visible:outline-none min-h-[44px]"
          >
            I Understand & Close
          </button>
        </footer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 1. Cancellation & Refund Policy
 * ------------------------------------------------------------------------- */
function RefundPolicyContent({ searchQuery }) {
  const clauses = [
    {
      id: "no-refund",
      title: "1. No Refunds Upon Cancellation",
      summary: "Once paid, registrations cannot be refunded under any condition.",
      badge: "Strict Non-Refundable",
      badgeColor: "bg-red-100 text-red-800 border-red-300",
      content: (
        <>
          <p>
            Once payment is completed, NV Cyclothon immediately commits funds for customized rider jerseys, personalized timing bibs with RFID chips, Finisher medals, municipal police escorts, and comprehensive event day insurance.
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-[#071313]/80">
            <li>No voluntary cancellation request by a participant is eligible for a cash refund or payment reversal.</li>
            <li>No partial refunds are issued if a participant opts not to collect their jersey or finisher kit.</li>
          </ul>
        </>
      ),
    },
    {
      id: "no-show",
      title: "2. Participant Absence or No-Show on Race Day",
      summary: "Missing the ride due to personal emergencies, illness, travel, or work will not yield a refund or rollover.",
      badge: "Zero No-Show Reimbursement",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      content: (
        <>
          <p>
            If a registered rider fails to report at the starting line on <strong>Sunday, 22 November 2026</strong> for any reason whatsoever:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-[#071313]/80">
            <li><strong>Personal Reasons:</strong> Illness, injury, family emergency, travel delay, or transport breakdown.</li>
            <li><strong>No Credit or Rollover:</strong> Slots cannot be converted into store credits or rolled over to the 2027 edition.</li>
          </ul>
        </>
      ),
    },
    {
      id: "non-transferable",
      title: "3. Non-Transferability of Entry & Bib Numbers",
      summary: "You cannot give or sell your bib to a friend. Doing so invalidates insurance and disqualifies both riders.",
      badge: "Personal & Non-Transferable",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      content: (
        <>
          <p>
            Race bibs and registration entries are strictly unique to the registered individual and linked directly to emergency medical records and insurance coverage.
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-[#071313]/80">
            <li>Transferring, assigning, or selling your bib to another rider is strictly prohibited.</li>
            <li>Riding under another person's name voids all medical indemnity and leads to immediate disqualification.</li>
          </ul>
        </>
      ),
    },
    {
      id: "force-majeure",
      title: "4. Event Postponement, Bad Weather & Force Majeure",
      summary: "If postponed due to severe weather, road safety, or police orders, your entry rolls over to the new date automatically.",
      badge: "Automatic Rollover",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      content: (
        <>
          <p>
            If the event date or route must be adjusted due to adverse weather (heavy rain, dense fog), administrative or police directives, or unforeseen Force Majeure events:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-[#071313]/80">
            <li>Your registration will automatically remain valid for the rescheduled event date or revised route.</li>
            <li>The organizers are not liable for private travel, accommodation, or incidental expenses incurred.</li>
          </ul>
        </>
      ),
    },
    {
      id: "duplicate",
      title: "5. Accidental Duplicate Transactions",
      summary: "Double debits due to bank server timeouts will be 100% refunded to the original account within 7–10 days.",
      badge: "100% Duplicate Refund Protected",
      badgeColor: "bg-green-100 text-green-800 border-green-300",
      content: (
        <>
          <p>
            If a network disruption results in your card or UPI account being debited more than once for the same registration ID:
          </p>
          <p className="mt-1 text-xs text-[#071313]/80">
            Notify our support desk at <strong>nvcyclothon@gmail.com</strong> with your Cashfree payment IDs or transaction reference. Following verification, the extra charge will be reversed to the original payment source within 7–10 banking days.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Visual Callout Hero */}
      <div className="rounded-2xl border-2 border-[#ff5f3d] bg-[#ff5f3d]/10 p-4 sm:p-5 text-[#071313]">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 text-[#ff5f3d] shrink-0" aria-hidden="true" />
          <h3 className="font-black text-sm uppercase tracking-wide text-[#ff5f3d]">
            Key Takeaway: 100% Non-Refundable Entry
          </h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#071313]/90 font-medium">
          Once confirmed, all registrations are <strong>final, non-refundable, and non-transferable</strong>. There are no exceptions for illness, travel delays, absence on event morning, or event rescheduling.
        </p>
      </div>

      <ClauseList clauses={clauses} searchQuery={searchQuery} />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 2. Terms & Conditions Content
 * ------------------------------------------------------------------------- */
function TermsPolicyContent({ searchQuery }) {
  const clauses = [
    {
      id: "categories",
      title: "1. Rider Age & Check-in",
      summary: "Age rules apply to challenge routes, while Kid-o-thon (ages 10–13) is held in a closed, monitored area with parent or guardian accompaniment.",
      badge: "Age Verification Required",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      content: (
        <>
          <p>Rider age is collected during registration and may be verified at check-in. Riders must meet the following route requirements:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-[#071313]/80">
            <li><strong>60 Km Road Challenge:</strong> Open to riders aged 18 and above.</li>
            <li><strong>30 Km MTB Challenge:</strong> Open to riders aged 16 and above.</li>
            <li><strong>Kid-o-thon:</strong> For children aged 10–13, in a closed and monitored riding area. A parent or legal guardian must accompany each child.</li>
            <li><strong>Check-in:</strong> Please carry a government-issued ID if requested by the event team for age verification.</li>
          </ul>
        </>
      ),
    },
    {
      id: "helmet",
      title: "2. Mandatory Safety Gear (Helmet Compulsory)",
      summary: "No helmet = No ride. 60 Km Road and 30 Km MTB riders must also carry all event-required safety equipment.",
      badge: "Strict Safety Mandate",
      badgeColor: "bg-red-100 text-red-800 border-red-300",
      content: (
        <>
          <p>
            Wearing a secure, certified cycling helmet is <strong>non-negotiable</strong>. Any rider arriving at the start grid without a helmet will not be permitted to ride. Riders in the <strong>60 Km Road Challenge</strong> and <strong>30 Km MTB Challenge</strong> must also carry all event-required safety equipment. Marshals have full authority to stop a rider who does not meet these requirements or removes their helmet on route.
          </p>
        </>
      ),
    },
    {
      id: "bicycle",
      title: "3. Bicycle Roadworthiness & Mechanical Readiness",
      summary: "Your bicycle brakes, gears, and tires must be in safe working order before you reach the venue.",
      badge: "Rider Responsibility",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      content: (
        <>
          <p>
            Participants are solely responsible for ensuring their bicycle (brakes, tire pressure, drivetrain, pedals) is roadworthy and safe. While technical support stations and sweep vehicles are present for emergencies, routine mechanical fitness remains the rider's obligation.
          </p>
        </>
      ),
    },
    {
      id: "conduct",
      title: "4. Code of Conduct & Disqualification",
      summary: "Aggressive riding, littering, or motorized assistance will result in instant disqualification.",
      badge: "Fair Play & Ecology",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      content: (
        <>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#071313]/80">
            <li><strong>Zero Littering:</strong> Throwing gel packets, bottles, or trash on Rewa's roads is strictly forbidden; use designated disposal zones.</li>
            <li><strong>No Motorized Assist:</strong> E-bikes, mopeds, or towing are forbidden in pedal-cycling categories.</li>
            <li><strong>Rider Respect:</strong> Harassment of volunteers, marshals, or other cyclists will lead to immediate police reporting and blacklisting.</li>
          </ul>
        </>
      ),
    },
    {
      id: "media-release",
      title: "5. Media, Photography & Broadcast Consent",
      summary: "Event photography and video footage may be used for official promotion, broadcast, and historical archives.",
      badge: "Media Release",
      badgeColor: "bg-green-100 text-green-800 border-green-300",
      content: (
        <>
          <p>
            By entering the event zone, riders grant NV Cyclothon and RDCA irrevocable permission to record, photograph, and broadcast their participation across digital, print, and video channels for sports promotion and historical documentation without compensation.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#071313] bg-white p-4 sm:p-5 text-[#071313] shadow-sm">
        <div className="flex items-center gap-2.5">
          <Scale className="h-5 w-5 text-[#071313] shrink-0" aria-hidden="true" />
          <h3 className="font-black text-sm uppercase tracking-wide">
            Key Takeaway: Rider Safety & Fair Play
          </h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#071313]/80">
          Helmets are mandatory at all times. Riders must maintain roadworthy pedal cycles, adhere to traffic marshal directions, and treat fellow cyclists and volunteers with sportsmanship.
        </p>
      </div>

      <ClauseList clauses={clauses} searchQuery={searchQuery} />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 3. Rider Liability Waiver Content
 * ------------------------------------------------------------------------- */
function WaiverPolicyContent({ searchQuery }) {
  const clauses = [
    {
      id: "medical-fitness",
      title: "1. Medical Fitness Self-Declaration",
      summary: "You confirm you are in good physical health and medically certified for endurance cycling.",
      badge: "Health Declaration",
      badgeColor: "bg-green-100 text-green-800 border-green-300",
      content: (
        <>
          <p>
            I declare that I am physically fit, sufficiently trained, and have no known cardiac, respiratory, or musculoskeletal impairments that would make long-distance cycling dangerous to my health. I have consulted a physician where appropriate.
          </p>
        </>
      ),
    },
    {
      id: "risk-assumption",
      title: "2. Voluntary Assumption of Inherent Hazards",
      summary: "You acknowledge that cycling on open public roads carries inherent physical and vehicular risks.",
      badge: "Assumption of Risk",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      content: (
        <>
          <p>
            I recognize that road cycling involves significant inherent dangers, including collisions with motor vehicles, unpredictable road surface conditions (potholes, loose gravel), weather changes, dehydration, and exhaustion. I voluntarily choose to participate knowing these risks.
          </p>
        </>
      ),
    },
    {
      id: "liability-release",
      title: "3. Full Release of Liability & Indemnity",
      summary: "You release RDCA, organizers, and volunteers from legal claims arising from participation.",
      badge: "Legal Release",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      content: (
        <>
          <p>
            I irrevocably release, waive, and hold harmless Rewa District Cycling Association (RDCA), NV Cyclothon organizers, district administration, event sponsors, medical responders, and volunteers from all claims, damages, liabilities, or losses arising from injury or property damage during the event.
          </p>
        </>
      ),
    },
    {
      id: "emergency-medical",
      title: "4. Authorization for Emergency Medical Treatment",
      summary: "Medical staff are authorized to provide first aid and hospital transport if required.",
      badge: "Medical Authorization",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      content: (
        <>
          <p>
            In the event of an accident or acute illness, I authorize official medical personnel and ambulances to administer first aid, stabilization, and transportation to the nearest hospital facility if deemed necessary.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#ff5f3d] bg-[#ff5f3d]/10 p-4 sm:p-5 text-[#071313]">
        <div className="flex items-center gap-2.5">
          <HeartPulse className="h-5 w-5 text-[#ff5f3d] shrink-0" aria-hidden="true" />
          <h3 className="font-black text-sm uppercase tracking-wide text-[#ff5f3d]">
            Key Takeaway: Rider Responsibility & Risk
          </h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#071313]/90">
          Cycling is an active endurance sport. By registering, you confirm your medical readiness and agree to ride responsibly, releasing the organizers from accident liability.
        </p>
      </div>

      <ClauseList clauses={clauses} searchQuery={searchQuery} />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 4. Privacy Policy Content
 * ------------------------------------------------------------------------- */
function PrivacyPolicyContent({ searchQuery }) {
  const clauses = [
    {
      id: "data-collection",
      title: "1. Information We Collect",
      summary: "We only collect essential details needed to print bibs, allocate jersey sizes, and ensure safety.",
      badge: "Data Minimalism",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      content: (
        <>
          <p>We collect only the information strictly necessary for race administration:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-[#071313]/80">
            <li><strong>Rider Identification:</strong> Full Name, Age, Gender, City, and Emergency Contact details.</li>
            <li><strong>Kit Logistics:</strong> Jersey Size (XS through 3XL) and Cycling Club affiliation.</li>
            <li><strong>Transaction Reference:</strong> Order ID and Payment Confirmation token.</li>
          </ul>
        </>
      ),
    },
    {
      id: "data-use",
      title: "2. How Your Data is Used",
      summary: "Your data is used solely for bib timing, race day updates, emergency dispatch, and finisher certificates.",
      badge: "Legitimate Purpose",
      badgeColor: "bg-green-100 text-green-800 border-green-300",
      content: (
        <>
          <p>
            Your details are used exclusively to process your check-in, assign timing chips, provide medical staff with emergency contacts, issue official finisher certificates, and send race updates. We <strong>never sell, rent, or trade your data</strong> to third-party advertisers.
          </p>
        </>
      ),
    },
    {
      id: "payment-security",
      title: "3. Bank & Payment Gateway Security",
      summary: "Payments are processed over 256-bit SSL encryption via Cashfree Payments. We never store bank or card numbers.",
      badge: "PCI-DSS Level 1 Compliance",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      content: (
        <>
          <p>
            All financial transactions are conducted directly through Cashfree Payments' certified PCI-DSS Level 1 payment gateway using 256-bit bank-grade encryption. The NV Cyclothon servers never touch or store raw credit card numbers, CVVs, UPI PINs, or net banking passwords.
          </p>
        </>
      ),
    },
    {
      id: "contact-dpo",
      title: "4. Official Data Contact",
      summary: "Have questions about your data? Reach out directly to our coordination desk.",
      badge: "Direct Support",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      content: (
        <>
          <p>
            For data correction, certificate reprints, or inquiries, email <strong>nvcyclothon@gmail.com</strong> or call Joint Secretary, Rewa District Cycling Association at <strong>+91 88395 03099</strong>.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#071313] bg-white p-4 sm:p-5 text-[#071313] shadow-sm">
        <div className="flex items-center gap-2.5">
          <Lock className="h-5 w-5 text-[#071313] shrink-0" aria-hidden="true" />
          <h3 className="font-black text-sm uppercase tracking-wide">
            Key Takeaway: Safe, Minimal & Protected Data
          </h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#071313]/80">
          Your details are strictly used for event safety and race timing. We do not sell data or share it with marketing third parties.
        </p>
      </div>

      <ClauseList clauses={clauses} searchQuery={searchQuery} />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 5. Copyright & IP Content
 * ------------------------------------------------------------------------- */
function CopyrightPolicyContent({ searchQuery }) {
  const clauses = [
    {
      id: "ownership",
      title: "1. Ownership of Brand & Visual Assets",
      summary: "All NV Cyclothon and RDCA logos, graphics, route maps, and medal artwork are proprietary intellectual property.",
      badge: "Exclusive Intellectual Property",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      content: (
        <>
          <p>
            The names <strong>NV Cyclothon</strong>, <strong>Rewa District Cycling Association</strong>, associated emblems, route visual designs, timing algorithms, medal designs, and website code are the exclusive intellectual property of NV Cyclothon and RDCA, protected under Indian and international copyright and trademark laws.
          </p>
        </>
      ),
    },
    {
      id: "personal-use",
      title: "2. Permitted Personal & Social Sharing",
      summary: "You are warmly encouraged to share your finisher certificate and race day photos on personal social media.",
      badge: "Personal Sharing Welcome",
      badgeColor: "bg-green-100 text-green-800 border-green-300",
      content: (
        <>
          <p>
            Participants are welcome and encouraged to download and share their official timing certificates, finisher photos, and medals on social media platforms for personal, non-commercial purposes with attribution to NV Cyclothon.
          </p>
        </>
      ),
    },
    {
      id: "commercial-ban",
      title: "3. Strict Ban on Commercial Reproduction",
      summary: "Unauthorized commercial merchandise, re-selling tickets, or unapproved sponsor claims are strictly forbidden.",
      badge: "Commercial Misuse Prohibited",
      badgeColor: "bg-red-100 text-red-800 border-red-300",
      content: (
        <>
          <p>
            No organization or individual may reproduce, sell, or exploit NV Cyclothon logos, promotional videos, or branding for commercial gain or unauthorized promotional tie-ins without express prior written authorization from the organizing committee.
          </p>
        </>
      ),
    },
    {
      id: "community-media",
      title: "4. User-Submitted Media (Community Wall)",
      summary: "You retain ownership of photos you submit, granting NV Cyclothon a license to display them on the event wall.",
      badge: "Contributor Rights",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      content: (
        <>
          <p>
            By submitting photos or ride memories to the Community Wall, contributors warrant that they own the content and grant NV Cyclothon a royalty-free license to showcase the submission for event promotion and community memory archives.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#071313] bg-white p-4 sm:p-5 text-[#071313] shadow-sm">
        <div className="flex items-center gap-2.5">
          <Copyright className="h-5 w-5 text-[#071313] shrink-0" aria-hidden="true" />
          <h3 className="font-black text-sm uppercase tracking-wide">
            Key Takeaway: Respect for Creative Assets
          </h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#071313]/80">
          Personal sharing of your achievements is encouraged! Commercial exploitation, counterfeiting, or trademark dilution without written authorization is legally prohibited.
        </p>
      </div>

      <ClauseList clauses={clauses} searchQuery={searchQuery} />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Shared Clause Card Component with High-Contrast Human-Readable Layout
 * ------------------------------------------------------------------------- */
function ClauseList({ clauses, searchQuery }) {
  const query = searchQuery.trim().toLowerCase();

  const filtered = query
    ? clauses.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.summary.toLowerCase().includes(query) ||
          c.badge.toLowerCase().includes(query)
      )
    : clauses;

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#071313]/30 bg-white p-8 text-center text-xs text-[#071313]/60">
        No policy clauses matching "{searchQuery}". Try searching for words like "refund", "helmet", "bib", or "medical".
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border-2 border-[#071313]/10 bg-white p-4 sm:p-5 shadow-sm transition hover:border-[#071313]/30"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#071313]/10 pb-2.5">
            <h4 className="text-sm sm:text-base font-black text-[#071313]">{item.title}</h4>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${item.badgeColor}`}>
              {item.badge}
            </span>
          </div>

          {/* Plain English Summary Callout */}
          <div className="mt-3 rounded-xl bg-[#f5f3ec] p-3 border border-[#071313]/5">
            <div className="flex items-start gap-2">
              <span className="font-black text-[11px] uppercase tracking-wider text-[#ff5f3d] shrink-0 mt-0.5">
                In Plain English:
              </span>
              <p className="text-xs font-bold leading-snug text-[#071313]/90">{item.summary}</p>
            </div>
          </div>

          {/* Detailed Legal Text */}
          <div className="mt-3.5 text-xs sm:text-sm leading-relaxed text-[#071313]/80 space-y-2">
            {item.content}
          </div>
        </article>
      ))}
    </div>
  );
}
