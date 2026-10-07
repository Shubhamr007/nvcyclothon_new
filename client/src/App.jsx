import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { LoadingIndicator, LoadingScreen } from "./components/LoadingIndicator";
import { SiteSettingsProvider } from "./state/SiteSettingsContext";
import { apiUrl } from "./api/http";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const CheckinPage = lazy(() => import("./pages/CheckinPage").then((module) => ({ default: module.CheckinPage })));
const PartnerPage = lazy(() => import('./pages/PartnerPage').then((module) => ({ default: module.PartnerPage })));
const VendorPage = lazy(() => import('./pages/VendorPage').then((module) => ({ default: module.VendorPage })));
const PageFallback = () => <LoadingScreen label="Gearing up for the ride…" />;

const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://nvcyclothon.in").replace(/\/$/, "");
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=1200&q=85";
const metadata = {
  "/": {
    title: "NV Cyclothon 2026 | Cycling Event in Rewa, Madhya Pradesh",
    description: "Join NV Cyclothon 2026 in Rewa: 60 Km Road Challenge, 30 Km MTB Challenge, 10 Km Green Ride, Senior Masters and Kid-o-thon.",
  },
  "/register": {
    title: "Register for NV Cyclothon 2026 | Rewa Cycling Event",
    description: "Register for NV Cyclothon 2026 in Rewa and choose the cycling route that fits your ride.",
  },
  "/partners": {
    title: "Partner with NV Cyclothon 2026 | Rewa, Madhya Pradesh",
    description: "Explore sponsorship and partnership opportunities with NV Cyclothon 2026, Rewa's community cycling event.",
  },
  "/vendors": {
    title: "Become an Official Vendor | NV Cyclothon 2026",
    description: "Apply to showcase your products and services as an official vendor at NV Cyclothon 2026 in Rewa.",
  },
  "/checkin": {
    title: "Volunteer Check-in | NV Cyclothon 2026",
    description: "Race-day volunteer workspace for scanning QR codes and checking in riders.",
  },
};

const canonicalPaths = {
  "/partners/apply": "/partners",
  "/vendors/apply": "/vendors",
};

function setMeta(selector, attribute, content) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const [name, value] = selector.match(/\[([^=]+)=\"([^\"]+)\"\]/)?.slice(1) || [];
    if (name && value) element.setAttribute(name, value);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, content);
}

function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const canonicalPath = canonicalPaths[pathname] || pathname;
    const page = metadata[canonicalPath] || metadata["/"];
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    const shouldNoIndex = pathname.startsWith("/checkin");
    const title = page.title;
    const description = page.description;
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[name="robots"]', "content", shouldNoIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:image"]', "content", DEFAULT_IMAGE);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", DEFAULT_IMAGE);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
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
    fetch(apiUrl("/content/visits"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: pathname, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: navigator.language }), keepalive: true }).catch(() => {});
  }, [pathname, isCheckinRoute]);
  return (
    <SiteSettingsProvider>
      <div className="app-shell relative min-h-screen w-full max-w-full overflow-x-hidden">
        <Seo />
        {!isCheckinRoute && <SiteHeader theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} />}
        <main id="main-content" className="w-full max-w-full overflow-x-hidden">
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
      </div>
    </SiteSettingsProvider>
  );
}
