import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { adminRequest, createAdminSession, refreshAdminSession } from "../api/http";
import { LoadingScreen } from "../components/LoadingIndicator";
import {
  AdminHeader,
  AdminSidebar,
  AdminFooter,
  AdminLogin,
  TabErrorBoundary,
  TabLoadingFallback,
  NAVIGATION_GROUPS,
} from "../features/admin";
import {
  AdminAiCoPilotDrawer,
} from "../features/admin/ai";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setAdminSession,
  clearAccessToken,
  setFeedbackMessage,
  setAuthLoading,
} from "../store/slices/authSlice";

// Lazy-loaded Admin Tabs for high-performance bundle code-splitting
const OverviewTab = lazy(() => import("../features/admin/tabs/OverviewTab").then((m) => ({ default: m.OverviewTab })));
const FinanceTab = lazy(() => import("../features/admin/tabs/FinanceTab").then((m) => ({ default: m.FinanceTab })));
const AnalyticsTab = lazy(() => import("../features/admin/tabs/AnalyticsTab").then((m) => ({ default: m.AnalyticsTab })));
const ParticipantsTab = lazy(() => import("../features/admin/tabs/ParticipantsTab").then((m) => ({ default: m.ParticipantsTab })));
const VolunteersTab = lazy(() => import("../features/admin/tabs/VolunteersTab").then((m) => ({ default: m.VolunteersTab })));
const DelegationsTab = lazy(() => import("../features/admin/tabs/DelegationsTab").then((m) => ({ default: m.DelegationsTab })));
const PartnersTab = lazy(() => import("../features/admin/tabs/PartnersTab").then((m) => ({ default: m.PartnersTab })));
const VendorsTab = lazy(() => import("../features/admin/tabs/VendorsTab").then((m) => ({ default: m.VendorsTab })));
const CommunityTab = lazy(() => import("../features/admin/tabs/CommunityTab").then((m) => ({ default: m.CommunityTab })));
const GalleryManager = lazy(() => import("../features/admin/tabs/GalleryManager").then((m) => ({ default: m.GalleryManager })));
const OffersTab = lazy(() => import("../features/admin/tabs/OffersTab").then((m) => ({ default: m.OffersTab })));
const MembersTab = lazy(() => import("../features/admin/tabs/MembersTab").then((m) => ({ default: m.MembersTab })));
const SettingsTab = lazy(() => import("../features/admin/tabs/SettingsTab").then((m) => ({ default: m.SettingsTab })));

export function AdminPage() {
  const prefersReducedMotion = useReducedMotion();
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken, accessTokenExpiresAt, message, loading } = useAppSelector((state) => state.auth);
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coPilotOpen, setCoPilotOpen] = useState(false);
  const [coPilotPrompt, setCoPilotPrompt] = useState("");

  const setMessage = (msg) => dispatch(setFeedbackMessage(msg));
  const setLoading = (val) => dispatch(setAuthLoading(val));

  const handleRidersLoaded = useCallback((registrations) => {
    setData((prev) => ({ ...prev, registrations }));
  }, []);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setMessage("");

    try {
      const [analytics, registrations] = await Promise.all([
        adminRequest("/analytics", accessToken),
        adminRequest("/registrations", accessToken).catch(() => []),
      ]);
      setData((prev) => ({ ...prev, analytics, registrations }));
    } catch (error) {
      setMessage(error.message);
      if (error.message?.includes("expired")) {
        dispatch(clearAccessToken());
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (accessToken) {
      void load();
    }
  }, [accessToken, load]);

  useEffect(() => {
    if (!refreshToken || !accessTokenExpiresAt) return undefined;
    const refreshInMs = Math.max(0, accessTokenExpiresAt - Date.now() - 60_000);
    const refreshTimer = window.setTimeout(async () => {
      try {
        const session = await refreshAdminSession(refreshToken);
        dispatch(setAdminSession(session));
      } catch {
        dispatch(clearAccessToken());
      }
    }, refreshInMs);
    return () => window.clearTimeout(refreshTimer);
  }, [accessTokenExpiresAt, dispatch, refreshToken]);

  const login = async (adminKey) => {
    setLoading(true);
    setMessage("");
    try {
      const session = await createAdminSession(adminKey);
      dispatch(setAdminSession(session));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) {
    return <AdminLogin onLogin={login} message={message} loading={loading} />;
  }

  if (!data.analytics && loading) {
    return <LoadingScreen label="Loading admin workspace…" />;
  }

  if (!data.analytics) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-slate-100">
        <section className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-white">Workspace Unavailable</h1>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {message || "The dashboard data could not be loaded from the backend."}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-900 transition shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Retry Connection
          </button>
        </section>
      </main>
    );
  }

  // Find active tab label for header
  let activeTabLabel = "Overview";
  for (const group of NAVIGATION_GROUPS) {
    const found = group.items.find((i) => i.id === tab);
    if (found) {
      activeTabLabel = found.label;
      break;
    }
  }

  // Badges
  const pendingRidersCount = Math.max(
    0,
    Number(data.analytics?.total_registrations || 0) -
      Number(data.analytics?.approved_registrations || 0)
  );
  const badges = {
    riders: pendingRidersCount,
  };

  return (
    <div className="admin-workspace h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-[#f5f5f5] text-slate-900 selection:bg-[#0078d4] selection:text-white">
      {/* 1. FIXED TOP HEADER */}
      <AdminHeader
        onSignOut={() => {
          dispatch(clearAccessToken());
          setData({});
        }}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        activeTabLabel={activeTabLabel}
        onOpenAiCoPilot={() => setCoPilotOpen(true)}
      />

      {/* 2. BODY ROW */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden relative">
        {/* FIXED LEFT SIDEBAR */}
        <AdminSidebar
          currentTab={tab}
          onSelectTab={setTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          badges={badges}
        />

        {/* Overlay root retained for forms and detail drawers. */}
        <div id="admin-slideover-root" className="absolute inset-0 z-40 pointer-events-none" />

        {/* SCROLLABLE WORKSPACE */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1520px] w-full space-y-6 pb-6">
            {message && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-900 shrink-0" />
                  <span>{message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMessage("")}
                  className="text-slate-400 hover:text-slate-900 font-bold transition-colors ml-4 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={tab}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              >
                <TabErrorBoundary tabKey={tab} onRetry={load}>
                  <Suspense fallback={<TabLoadingFallback label={`Loading ${activeTabLabel}...`} />}>
                    {/* COMMAND CENTER */}
                    {tab === "overview" && (
                      <OverviewTab
                        analytics={data.analytics}
                        registrations={data.registrations}
                        onNavigate={setTab}
                      />
                    )}
                    {tab === "finance" && (
                      <FinanceTab
                        riders={data.registrations}
                        analytics={data.analytics}
                        onTriggerAiPrompt={(p) => {
                          setCoPilotPrompt(p);
                          setCoPilotOpen(true);
                        }}
                      />
                    )}
                    {tab === "visitors" && <AnalyticsTab />}

                    {/* RIDER OPERATIONS */}
                    {tab === "riders" && (
                      <ParticipantsTab
                        riders={data.registrations}
                        onLoaded={handleRidersLoaded}
                        refresh={load}
                      />
                    )}
                    {tab === "volunteers" && <VolunteersTab />}
                    {tab === "delegations" && <DelegationsTab />}

                    {/* COMMERCIAL & COMMUNITY */}
                    {tab === "partners" && <PartnersTab />}
                    {tab === "vendors" && <VendorsTab />}
                    {tab === "community" && <CommunityTab />}

                    {/* EVENT CONTENT */}
                    {tab === "gallery" && <GalleryManager />}
                    {tab === "offers" && <OffersTab refresh={load} />}
                    {tab === "members" && <MembersTab />}

                    {/* SYSTEM */}
                    {tab === "settings" && <SettingsTab />}
                  </Suspense>
                </TabErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Docked AI workspace: this takes layout space rather than covering the active tab. */}
        <AdminAiCoPilotDrawer
          isOpen={coPilotOpen}
          onClose={() => {
            setCoPilotOpen(false);
            setCoPilotPrompt("");
          }}
          initialPrompt={coPilotPrompt}
        />
      </div>

      {/* 3. ENTERPRISE FOOTER */}
      <AdminFooter />

    </div>
  );
}

export default AdminPage;
