import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { SiteSettingsProvider } from "./state/SiteSettingsContext";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const CheckinPage = lazy(() => import("./pages/CheckinPage").then((module) => ({ default: module.CheckinPage })));
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
  const [theme, setTheme] = useState(() => localStorage.getItem("nv-theme") || "dark");
  const { pathname } = useLocation();
  const isCheckinRoute = pathname === "/checkin";
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("nv-theme", theme);
  }, [theme]);
  return (
    <SiteSettingsProvider>
      <Seo />
      {!isCheckinRoute && <SiteHeader theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} />}
      <main id="main-content">
        <Suspense fallback={<PageFallback />}><Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Suspense>
      </main>
      {!isCheckinRoute && <SiteFooter />}
    </SiteSettingsProvider>
  );
}
