import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { LoadingIndicator } from "./components/LoadingIndicator";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((module) => ({ default: module.AdminPage })));
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
  "/admin": ["Admin | NV Cyclothon 2026", "Secure event administration dashboard."],
};
function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const [title, description] = metadata[pathname] || metadata["/"];
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [pathname]);
  return null;
}
export default function App() {
  const { pathname } = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("nv-theme") || "dark");
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("nv-theme", theme);
  }, [theme]);
  if (pathname === "/admin") return <><Seo /><Suspense fallback={<PageFallback />}><AdminPage /></Suspense></>;
  return (
    <>
      <Seo />
      <SiteHeader theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} />
      <Suspense fallback={<PageFallback />}><Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></Suspense>
      <SiteFooter />
    </>
  );
}
