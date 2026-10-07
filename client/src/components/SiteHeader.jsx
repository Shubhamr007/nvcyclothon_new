import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaArrowRight, FaMoon, FaSun } from "react-icons/fa6";
import {
  Bike,
  Compass,
  Handshake,
  MapPin,
  Menu,
  Store,
  Trophy,
  X,
  ChevronRight,
} from "lucide-react";
import { EVENT } from "../features/cyclothon/constants";
import nvCyclothonLogo from "../../assets/NV_Cyclothon_logo.png";

const NAV_ITEMS = [
  { label: "The Ride", href: "/#about", description: "Movement & philosophy", icon: Bike },
  { label: "Routes", href: "/#routes", description: "5 ride challenges & maps", icon: Compass },
  { label: "Editions", href: "/#editions", description: "Rewa's cycling legacy", icon: Trophy },
  { label: "Partners", href: "/partners", description: "Sponsorship & brand packages", icon: Handshake },
  { label: "Vendors", href: "/vendors", description: "Stalls & event expo", icon: Store },
  { label: "Contact", href: "/#contact", description: "Office & venue location", icon: MapPin },
];

export function SiteHeader({ theme, onToggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu whenever route or hash changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLinkClick = (event, href) => {
    setMobileMenuOpen(false);
    if (href.startsWith("/#")) {
      const targetId = href.replace("/#", "");
      if (location.pathname === "/") {
        event.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", href);
        }
      }
    }
  };

  return (
    <>
      <header className="site-header site-header--glass fixed inset-x-0 top-0 z-40 border-b border-white/10 text-white">
        <a
          href="#main-content"
          className="skip-link absolute left-3 top-2 rounded bg-[#d9ff38] px-3 py-2 text-xs font-black text-[#071313]"
        >
          Skip to main content
        </a>
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8 text-white">
          {/* Logo */}
          <Link
            to="/"
            aria-label={`${EVENT.name} home`}
            className="block shrink-0 overflow-hidden rounded-md focus:outline-none focus:ring-4 focus:ring-[#d9ff38]"
          >
            <img
              src={nvCyclothonLogo}
              alt="NV Cyclothon"
              className="h-11 sm:h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-5 lg:gap-8 text-xs font-bold tracking-[.16em] uppercase md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href.startsWith("/#")
                  ? location.pathname === "/" && location.hash === item.href.slice(1)
                  : location.pathname === item.href;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={`relative py-1 transition hover:text-[#d9ff38] ${
                    isActive ? "font-black text-[#d9ff38]" : "text-white/80"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#d9ff38]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-[#d9ff38]"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
            </button>

            {/* Register CTA */}
            <Link
              to="/register"
              className="rounded-full bg-[#d9ff38] px-3.5 py-2.5 sm:px-5 sm:py-3 text-xs font-black tracking-wider text-[#071313] transition focus:outline-none focus:ring-4 focus:ring-white hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-1.5 sm:gap-2">
                Register <span className="hidden sm:inline">now</span>
                <FaArrowRight aria-hidden="true" className="h-3 w-3" />
              </span>
            </Link>

            {/* Mobile Hamburger / Close Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/5 text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-[#d9ff38] md:hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-[#d9ff38]" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="mobile-nav-panel overflow-hidden border-b border-white/15 bg-[#071313] md:hidden shadow-2xl"
            >
              <div className="mx-auto max-h-[calc(100vh-5.5rem)] overflow-y-auto px-4 py-5 space-y-3">
                <p className="px-1 text-[10px] font-black uppercase tracking-[.25em] text-[#d9ff38]">
                  Menu & Categories
                </p>
                <div className="grid gap-2">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href.startsWith("/#")
                        ? location.pathname === "/" && location.hash === item.href.slice(1)
                        : location.pathname === item.href;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={(e) => handleLinkClick(e, item.href)}
                        className={`mobile-nav-card group flex items-center justify-between rounded-2xl border p-3.5 transition ${
                          isActive
                            ? "border-[#d9ff38] bg-[#d9ff38]/10 text-white"
                            : "border-white/10 bg-white/5 text-white hover:border-[#d9ff38]/50 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${
                              isActive
                                ? "border-[#d9ff38] bg-[#d9ff38] text-[#071313]"
                                : "border-white/10 bg-white/5 text-[#d9ff38] group-hover:border-[#d9ff38]/40 group-hover:bg-[#d9ff38] group-hover:text-[#071313]"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black tracking-wide uppercase">
                                {item.label}
                              </span>
                              {isActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#d9ff38]" />
                              )}
                            </div>
                            <p className="mobile-nav-subtext text-xs text-white/50">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 transition group-hover:translate-x-0.5 ${
                            isActive ? "text-[#d9ff38]" : "text-white/40"
                          }`}
                        />
                      </a>
                    );
                  })}
                </div>

                {/* Mobile Menu Quick Register CTA & Event Info */}
                <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d9ff38] py-3.5 text-xs font-black uppercase tracking-wider text-[#071313] transition hover:brightness-105"
                  >
                    <span>Register for NV Cyclothon</span>
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <div className="flex items-center justify-between px-2 text-[11px] font-bold text-white/60">
                    <span>22 Nov 2026 • Rewa, MP</span>
                    <span className="text-[#d9ff38]">3rd Edition</span>
                  </div>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Backdrop overlay for mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
