import { EVENT } from "../features/cyclothon/constants";
import { FaArrowRight, FaMoon, FaSun } from "react-icons/fa6";
import nvCyclothonLogo from "../../assets/NV_Cyclothon_logo.png";

export function SiteHeader({ theme, onToggleTheme }) {
  return (
    <header className="site-header site-header--glass fixed inset-x-0 top-0 z-40 border-b border-white/10 text-white">
      <a
        href="#main-content"
        className="skip-link absolute left-3 top-2 rounded bg-[#d9ff38] px-3 py-2 text-xs font-black text-[#071313]"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-20 w-[min(1240px,calc(100%-40px))] items-center justify-between text-white">
        <a
          href="/"
          aria-label={`${EVENT.name} home`}
          className="block overflow-hidden rounded-md focus:outline-none focus:ring-4 focus:ring-[#d9ff38]"
        >
          <img src={nvCyclothonLogo} alt="NV Cyclothon" className="h-14 w-24 object-cover" />
        </a>
        <nav
          aria-label="Main navigation"
          className="hidden gap-8 text-xs font-bold tracking-[.16em] uppercase md:flex"
        >
          <a href="/#about">The ride</a>
          <a href="/#routes">Routes</a>
          <a href="/#about">Impact</a>
          <a href="/#sponsors">Sponsors</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={onToggleTheme} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-[#d9ff38]" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
          </button>
          <a href="/register" className="rounded-full bg-[#d9ff38] px-4 py-3 text-xs font-black tracking-wider text-[#071313] transition focus:outline-none focus:ring-4 focus:ring-white hover:-translate-y-1 sm:px-5"><span className="inline-flex items-center gap-2">Register <span className="hidden sm:inline">now</span><FaArrowRight aria-hidden="true" /></span></a>
        </div>
      </div>
    </header>
  );
}
