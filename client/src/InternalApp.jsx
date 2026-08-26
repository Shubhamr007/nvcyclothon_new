import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { LoadingIndicator } from "./components/LoadingIndicator";

const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((module) => ({ default: module.AdminPage }))
);

const metadata = {
  "/admin": ["Admin | NV Cyclothon 2026", "Secure event administration dashboard."],
};

function InternalSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const [title, description] = metadata[pathname] || metadata["/admin"];
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
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
