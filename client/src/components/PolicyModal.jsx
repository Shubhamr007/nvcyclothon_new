import { useState, useEffect } from "react";
import { X, ShieldAlert, FileText, Lock, AlertTriangle } from "lucide-react";

export function PolicyModal({ isOpen, onClose, initialTab = "refund" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-white/10 bg-[#0d1717] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#ff5f3d]" />
            <h2 id="policy-modal-title" className="text-lg font-black tracking-tight uppercase">
              Official Policies & Terms · NV Cyclothon 2026
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 px-6 overflow-x-auto text-xs font-black uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab("refund")}
            className={`border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
              activeTab === "refund"
                ? "border-[#ff5f3d] text-[#ff5f3d]"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Cancellation & Refund
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
              activeTab === "terms"
                ? "border-[#ff5f3d] text-[#ff5f3d]"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Terms & Conditions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("waiver")}
            className={`border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
              activeTab === "waiver"
                ? "border-[#ff5f3d] text-[#ff5f3d]"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Rider Waiver
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
              activeTab === "privacy"
                ? "border-[#ff5f3d] text-[#ff5f3d]"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm leading-relaxed text-white/80 space-y-4">
          {activeTab === "refund" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#ff5f3d]/30 bg-[#ff5f3d]/10 p-4 text-[#ff5f3d]">
                <div className="flex items-center gap-2 font-black text-sm uppercase">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Strict Non-Refundable Policy
                </div>
                <p className="mt-1 text-xs text-white/90">
                  All registration fees, kit allocations, and ticket payments are 100% non-refundable and non-transferable under all circumstances.
                </p>
              </div>

              <h3 className="text-base font-bold text-white">1. No Refunds Upon Cancellation</h3>
              <p>
                Once a registration is confirmed and payment is completed, NV Cyclothon (organized in association with Rewa District Cycling Association) incurs immediate costs including customized jersey manufacturing, event insurance, timing bib allocation, and municipal permissions. Therefore, no refunds will be granted for any cancellation requests initiated by the participant.
              </p>

              <h3 className="text-base font-bold text-white">2. Absence / No-Show on Race Day</h3>
              <p>
                If a registered participant is absent or unable to attend the event on <strong>22 November 2026</strong> for any reason whatsoever—including but not limited to personal emergencies, medical conditions, travel delays, vehicle breakdowns, work commitments, or change of mind—<strong>no refund, partial reimbursement, rollover, or credit for future editions will be provided</strong>.
              </p>

              <h3 className="text-base font-bold text-white">3. Non-Transferability of Entry & Bibs</h3>
              <p>
                Registrations and race bibs are strictly personal and non-transferable. You cannot transfer, reassign, or sell your registration slot or race pass to another rider. Unauthorized transfer voids insurance coverage and results in immediate disqualification.
              </p>

              <h3 className="text-base font-bold text-white">4. Event Postponement, Route Changes & Force Majeure</h3>
              <p>
                If the event is rescheduled, postponed, delayed, or routes are altered due to adverse weather conditions, administrative/police directives, civic regulations, natural calamities, or unforeseen circumstances beyond our control (Force Majeure):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-white/70">
                <li>Your registration will automatically roll over to the rescheduled event date or revised route.</li>
                <li>No monetary refunds, travel compensation, or lodging reimbursements will be issued under any circumstances.</li>
              </ul>

              <h3 className="text-base font-bold text-white">5. Duplicate Transactions</h3>
              <p>
                In the rare event of an accidental double debit caused by network glitches where multiple charges occur for the same rider registration ID, the duplicate amount will be verified and refunded to the original payment source within 7–10 working days upon written notification to <strong>nvcyclothon@gmail.com</strong>.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">1. Event Guidelines & Eligibility</h3>
              <p>
                Participants must strictly abide by the rules laid out by the organizing committee and race marshals. Riders must register under the appropriate category corresponding to their age and capability:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-white/70">
                <li><strong>25 Km Senior Masters:</strong> Reserved strictly for riders aged 50 years and above.</li>
                <li><strong>Kid-o-thon:</strong> Reserved for children accompanied by parents/guardians.</li>
                <li><strong>60 Km / 30 Km / 10 Km:</strong> Open to eligible riders adhering to event rules.</li>
              </ul>

              <h3 className="text-base font-bold text-white">2. Mandatory Safety Gear (Helmet Compulsory)</h3>
              <p>
                Wearing a certified bicycle helmet is <strong>strictly mandatory</strong> for all participants throughout the duration of the ride. Any participant without a helmet will not be permitted to cross the starting line or will be removed from the route by race marshals immediately.
              </p>

              <h3 className="text-base font-bold text-white">3. Bicycle Roadworthiness</h3>
              <p>
                Participants are solely responsible for ensuring that their bicycle (brakes, tires, chain, gears) is in safe working order before arriving at the venue. Basic mechanical support may be available at designated points, but roadworthiness remains the rider's responsibility.
              </p>

              <h3 className="text-base font-bold text-white">4. Code of Conduct & Disqualification</h3>
              <p>
                Unsportsmanlike conduct, aggressive cycling, littering on the route, unauthorized motorized assistance, or non-compliance with marshal instructions will lead to instant disqualification with zero liability to the organizers.
              </p>

              <h3 className="text-base font-bold text-white">5. Media & Photography Release</h3>
              <p>
                By participating, riders grant NV Cyclothon and its authorized media partners the irrevocable right to use event photographs, drone footage, and video interviews for event promotion, documentaries, and social media without compensation.
              </p>
            </div>
          )}

          {activeTab === "waiver" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase font-bold text-[#d9ff38]">Participant Declaration of Fitness & Assumption of Risk</p>
              </div>

              <h3 className="text-base font-bold text-white">Assumption of Inherent Risks</h3>
              <p>
                I acknowledge that cycling on public highways and mixed-terrain routes is an endurance activity that carries inherent risks, including but not limited to physical exertion, dehydration, heat exhaustion, collisions with vehicles, pedestrians, or fellow riders, and falls caused by road conditions.
              </p>

              <h3 className="text-base font-bold text-white">Medical Fitness Declaration</h3>
              <p>
                I confirm that I am in sound physical and mental health, adequately trained for the selected cycling distance, and have not been advised otherwise by a qualified medical practitioner. I understand that medical assistance at the event is for emergency stabilization only.
              </p>

              <h3 className="text-base font-bold text-white">Release of Liability</h3>
              <p>
                I hereby release, waive, discharge, and hold harmless the Rewa District Cycling Association (RDCA), NV Cyclothon organizing committee, sponsors, volunteers, government authorities, and event staff from any and all claims, liabilities, damages, or injuries arising out of my participation in this event, whether caused by negligence or otherwise.
              </p>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">1. Information We Collect</h3>
              <p>
                During registration, we collect essential rider details: Full Name, Email, Phone Number, Emergency Contact, Age, Gender, City, Jersey Size, and Payment Transaction IDs.
              </p>

              <h3 className="text-base font-bold text-white">2. How Your Data is Used</h3>
              <p>
                Your personal data is used solely for operational event purposes: generating your unique race bib and check-in pass, assigning timing categories, coordinating medical assistance in emergencies, transmitting official race updates and certificates, and issuing payment receipts.
              </p>

              <h3 className="text-base font-bold text-white">3. Data Security & Third-Party Protection</h3>
              <p>
                We do not sell, rent, or trade your personal information to third-party marketing companies. Payment details are processed securely by our certified PCI-DSS compliant payment gateway (Razorpay) over 256-bit SSL encryption; our servers never store raw credit card numbers or banking passwords.
              </p>

              <h3 className="text-base font-bold text-white">4. Contact & Inquiries</h3>
              <p>
                For data modification or inquiries, contact us at <strong>nvcyclothon@gmail.com</strong> or reach out to Joint Secretary, Rewa District Cycling Association (+91 88395 03099).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-6 py-4">
          <span className="text-xs text-white/50">
            NV Cyclothon · Rewa District Cycling Association (RDCA)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#ff5f3d] px-6 py-2 text-xs font-black uppercase text-white transition-transform hover:scale-105 active:scale-95"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
}
