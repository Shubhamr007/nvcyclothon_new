import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { SiteSettingsProvider } from "./state/SiteSettingsContext";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const CheckinPage = lazy(() => import("./pages/CheckinPage").then((module) => ({ default: module.CheckinPage })));
const PartnerPage = lazy(() => import('./pages/PartnerPage').then((module) => ({ default: module.PartnerPage })));
const VendorPage = lazy(() => import('./pages/VendorPage').then((module) => ({ default: module.VendorPage })));
const PageFallback = () => <main className="grid min-h-screen place-items-center bg-[#071313] text-white"><LoadingIndicator label="Loading page…" /></main>;

const metadata = {
  "/": [
    "NV Cyclothon 2026 | Own the Road",
    "Rewa's bicycle-only community ride. Choose the 60 Km Road Challenge, 30 Km MTB Challenge, 10 Km Green Ride, or Kid-o-thon.",
  ],
  "/register": [
    "Register | NV Cyclothon 2026",
    "Reserve a place in the NV Cyclothon bicycle event.",
  ],
  "/checkin": [
    "Volunteer Check-in | NV Cyclothon 2026",
    "Race-day volunteer workspace for scanning QR codes and checking in riders.",
  ],
  "/partners": [
    "NV Cyclothon Partners & Sponsors | Ride for Vindhya",
    "Partner with NV Cyclothon 2026 in Rewa, Madhya Pradesh. Explore sponsorship and event partnership opportunities for the 3rd Edition of NV Cyclothon.",
  ],
  "/partners/apply": [
    "NV Cyclothon Partners & Sponsors | Ride for Vindhya",
    "Partner with NV Cyclothon 2026 in Rewa, Madhya Pradesh. Explore sponsorship and event partnership opportunities for the 3rd Edition of NV Cyclothon.",
  ],
  "/vendors": [
    "Official Event Vendors | NV Cyclothon 2026",
    "Apply to become an official event vendor for NV Cyclothon 2026 in Rewa, Madhya Pradesh. Showcase your products and services to participants and visitors.",
  ],
  "/vendors/apply": [
    "Official Event Vendors | NV Cyclothon 2026",
    "Apply to become an official event vendor for NV Cyclothon 2026 in Rewa, Madhya Pradesh. Showcase your products and services to participants and visitors.",
  ],
};
function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const [title, description] = metadata[pathname] || metadata["/"];
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    const shouldNoIndex = pathname.startsWith("/checkin");
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement("meta");
      robotsTag.setAttribute("name", "robots");
      document.head.appendChild(robotsTag);
    }
    robotsTag.setAttribute("content", shouldNoIndex ? "noindex, nofollow" : "index, follow");
  }, [pathname]);
  return null;
}
export default function App() {
  const { pathname } = useLocation();
  const isCheckinRoute = pathname.startsWith("/checkin");
  const [theme, setTheme] = useState(() => localStorage.getItem("nv-theme") || "dark");
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("nv-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (isCheckinRoute || sessionStorage.getItem(`nv-visit:${pathname}`)) return;
    sessionStorage.setItem(`nv-visit:${pathname}`, "1");
    fetch(`${import.meta.env.VITE_API_URL || "/api"}/content/visits`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: pathname, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: navigator.language }), keepalive: true }).catch(() => {});
  }, [pathname, isCheckinRoute]);
  return (
    <SiteSettingsProvider>
      <Seo />
      {!isCheckinRoute && <SiteHeader theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} />}
      <main id="main-content">
        <Suspense fallback={<PageFallback />}><Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="/partners" element={<PartnerPage />} />
            <Route path="/partners/apply" element={<PartnerPage />} />
            <Route path="/vendors" element={<VendorPage />} />
            <Route path="/vendors/apply" element={<VendorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Suspense>
      </main>
      {!isCheckinRoute && <SiteFooter />}
    </SiteSettingsProvider>
  );
}
