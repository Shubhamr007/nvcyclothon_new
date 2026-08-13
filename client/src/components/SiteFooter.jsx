import { EVENT } from "../features/cyclothon/constants";
import nvCyclothonLogo from "../../assets/NV_Cyclothon_logo.png";
import associationLogo from "../../assets/Rewa_District_Cycyling_Association.jpeg";

export function SiteFooter() {
  return (
    <footer className="bg-[#071313] px-5 py-8 text-white/60">
      <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 text-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <img src={nvCyclothonLogo} alt="NV Cyclothon" className="h-10 w-16 rounded object-cover" />
          <span>NV CYCLOTHON · 2026</span>
        </div>
        <span>Ride bright. Ride together.</span>
        <div className="flex items-center gap-2">
          <img src={associationLogo} alt="Rewa District Cycling Association" className="h-9 w-9 rounded-full bg-white object-cover" />
          <span>In association with {EVENT.association}</span>
        </div>
      </div>
    </footer>
  );
}
