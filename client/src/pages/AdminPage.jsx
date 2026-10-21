import React, { useEffect, useState, useCallback, Suspense } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { adminRequest, createAdminSession, refreshAdminSession } from "../api/http";
import { LoadingScreen } from "../components/LoadingIndicator";
import {
  AdminHeader, AdminSidebar, AdminFooter, AdminLogin,
  TabErrorBoundary, TabLoadingFallback, NAVIGATION_GROUPS,
  LayoutResizeDivider, useAdminLayout, LAYOUT_CONSTRAINTS,
  useAdminSync, WorkspaceUnavailable, JobProgressCenter,
} from "../features/admin";
import { AdminAiCoPilotDrawer } from "../features/admin/ai";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setAdminSession, clearAccessToken, setFeedbackMessage, setAuthLoading,
} from "../store/slices/authSlice";

// Lazy-loaded Admin Tabs for high-performance bundle code-splitting
import {
  OverviewTab, FinanceTab, AnalyticsTab, ParticipantsTab,
  VolunteersTab, DelegationsTab, PartnersTab, VendorsTab,
  CommunityTab, GalleryManager, OffersTab, MembersTab, SettingsTab,
} from "../features/admin/tabs/lazyTabs";

export function AdminPage() {
  const prefersReducedMotion = useReducedMotion();
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken, accessTokenExpiresAt, message, loading } = useAppSelector((state) => state.auth);
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coPilotOpen, setCoPilotOpen] = useState(false);
  const [coPilotPrompt, setCoPilotPrompt] = useState("");

  const {
    sidebarWidth, aiWidth, updateSidebarWidth,
    commitSidebarWidth, updateAiWidth, commitAiWidth, resetLayout,
  } = useAdminLayout();
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

  const { syncStatus, triggerRefresh } = useAdminSync({
    accessToken,
    onSync: load,
    enabled: Boolean(accessToken),
  });

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

  const activeTabLabel =
    NAVIGATION_GROUPS.flatMap((g) => g.items).find((i) => i.id === tab)?.label || "Overview";

  const pendingRidersCount = Math.max(
    0,
    Number(data.analytics?.total_registrations || 0) -
      Number(data.analytics?.approved_registrations || 0)
  );
  const badges = { riders: pendingRidersCount };

  if (!data.analytics) {
    return <WorkspaceUnavailable message={message} onRetry={() => void load()} />;
  }

  return (
    <div className="admin-workspace h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-[#0078d4] selection:text-white transition-colors">
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
        onResetLayout={resetLayout}
        syncStatus={syncStatus}
        onRefresh={triggerRefresh}
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
          width={sidebarWidth}
        />

        {/* RESIZE DIVIDER: SIDEBAR */}
        <LayoutResizeDivider
          panel="sidebar"
          currentWidth={sidebarWidth}
          minWidth={LAYOUT_CONSTRAINTS.sidebar.min}
          maxWidth={LAYOUT_CONSTRAINTS.sidebar.max}
          onResize={updateSidebarWidth}
          onResizeEnd={commitSidebarWidth}
          onReset={() => commitSidebarWidth(LAYOUT_CONSTRAINTS.sidebar.default)}
          label="Sidebar Navigation Width"
          className="hidden lg:flex"
        />

        {/* Overlay root retained for forms and detail drawers. */}
        <div id="admin-slideover-root" className="absolute inset-0 z-40 pointer-events-none" />

        {/* SCROLLABLE WORKSPACE */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f4f6f8] transition-colors">
          <div className="mx-auto max-w-[1520px] w-full space-y-6 pb-6">
            {message && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0078d4] shrink-0" />
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

        {/* RESIZE DIVIDER: AI ASSISTANT PANEL */}
        {coPilotOpen && (
          <LayoutResizeDivider
            panel="ai"
            currentWidth={aiWidth}
            minWidth={LAYOUT_CONSTRAINTS.aiPanel.min}
            maxWidth={LAYOUT_CONSTRAINTS.aiPanel.max}
            onResize={updateAiWidth}
            onResizeEnd={commitAiWidth}
            onReset={() => commitAiWidth(LAYOUT_CONSTRAINTS.aiPanel.default)}
            label="AI Assistant Panel Width"
            className="hidden lg:flex"
          />
        )}

        {/* Docked AI workspace: takes layout space with custom resizable width */}
        <AdminAiCoPilotDrawer
          isOpen={coPilotOpen}
          onClose={() => {
            setCoPilotOpen(false);
            setCoPilotPrompt("");
          }}
          initialPrompt={coPilotPrompt}
          customWidth={aiWidth}
          onResetWidth={() => commitAiWidth(LAYOUT_CONSTRAINTS.aiPanel.default)}
          isCustomWidth={aiWidth !== LAYOUT_CONSTRAINTS.aiPanel.default}
        />
      </div>

      {/* 3. ENTERPRISE FOOTER */}
      <AdminFooter />

      {/* 4. DURABLE BACKGROUND JOB CENTER */}
      <JobProgressCenter accessToken={accessToken} />
    </div>
  );
}

export default AdminPage;
