import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { LoadingIndicator } from "./components/LoadingIndicator";

const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((module) => ({ default: module.AdminPage }))
);
const CheckinPage = lazy(() =>
  import("./pages/CheckinPage").then((module) => ({ default: module.CheckinPage }))
);

const metadata = {
  "/admin": ["Admin | NV Cyclothon 2026", "Secure event administration dashboard."],
  "/check-in": [
    "Volunteer Check-in | NV Cyclothon 2026",
    "Internal race-day participant check-in terminal for volunteers.",
  ],
};

function InternalSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const [title, description] = metadata[pathname] || metadata["/check-in"];
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [pathname]);

  return null;
}

function PageFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#071313] text-white">
      <LoadingIndicator label="Loading internal workspace..." />
    </main>
  );
}

export default function InternalApp() {
  return (
    <>
      <InternalSeo />
      <main id="main-content">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/check-in" replace />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/check-in" element={<CheckinPage />} />
            <Route path="*" element={<Navigate to="/check-in" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
