import { useState } from "react";
import { EVENT } from "../features/cyclothon/constants";
import nvCyclothonLogo from "../../assets/NV_Cyclothon_logo.png";
import associationLogo from "../../assets/Rewa_District_Cycyling_Association.jpeg";
import { PolicyModal } from "./PolicyModal";

export function SiteFooter() {
  const [modalState, setModalState] = useState({ isOpen: false, tab: "refund" });

  const openPolicy = (tab) => {
    setModalState({ isOpen: true, tab });
  };

  const closePolicy = () => {
    setModalState({ isOpen: false, tab: "refund" });
  };

  return (
    <>
      <footer className="border-t border-white/10 bg-[#071313] px-5 py-10 text-white/60 overflow-hidden">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 text-xs md:flex-row md:items-center md:justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <img src={nvCyclothonLogo} alt="NV Cyclothon" className="h-10 w-16 rounded object-cover" />
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-wide">NV CYCLOTHON · 2026</span>
              <span className="text-[11px] text-white/50">3rd Edition · Ride for Vindhya</span>
            </div>
          </div>

          {/* Legal & Policy Links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/70">
            <button
              type="button"
              onClick={() => openPolicy("refund")}
              className="transition-colors hover:text-[#ff5f3d] underline decoration-white/30 underline-offset-4"
            >
              Cancellation & Refund Policy
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => openPolicy("terms")}
              className="transition-colors hover:text-[#ff5f3d] underline decoration-white/30 underline-offset-4"
            >
              Terms & Conditions
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => openPolicy("waiver")}
              className="transition-colors hover:text-[#ff5f3d] underline decoration-white/30 underline-offset-4"
            >
              Rider Waiver
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => openPolicy("privacy")}
              className="transition-colors hover:text-[#ff5f3d] underline decoration-white/30 underline-offset-4"
            >
              Privacy Policy
            </button>
          </div>

          {/* Association */}
          <div className="flex items-center gap-2">
            <img
              src={associationLogo}
              alt="Rewa District Cycling Association"
              className="h-8 w-8 rounded-full bg-white object-cover"
            />
            <span className="text-right">In association with {EVENT.association}</span>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-[1400px] border-t border-white/5 pt-4 text-center text-[10px] text-white/40">
          © 2026 NV Cyclothon. All rights reserved. Registration fees are strictly non-refundable and non-transferable under all circumstances.
        </div>
      </footer>

      <PolicyModal
        isOpen={modalState.isOpen}
        onClose={closePolicy}
        initialTab={modalState.tab}
      />
    </>
  );
}
