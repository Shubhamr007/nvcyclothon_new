import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, Flag, Tag, UsersRound, AlertCircle, RefreshCw } from "lucide-react";
import { adminRequest, createAdminSession } from "../api/http";
import { LoadingScreen } from "../components/LoadingIndicator";
import {
  AdminHeader,
  AdminSidebar,
  AdminLogin,
  OverviewTab,
  ParticipantsTab,
  VolunteersTab,
  PartnersTab,
  VendorsTab,
  CommunityTab,
  ManagePanel,
  AnalyticsTab,
  SettingsTab,
  NAVIGATION_GROUPS,
} from "../features/admin";

const emptyOffer = { title: "", description: "", code: "", active: true };
const emptyGuest = {
  name: "",
  designation: "",
  bio: "",
  image_url: "",
  featured: true,
  display_order: 0,
};
const emptyMember = {
  name: "",
  role: "",
  message: "",
  image_url: "",
  display_order: 0,
  visible: true,
};
const emptyDelegation = {
  organization: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  member_count: 1,
  status: "invited",
  notes: "",
};

export function AdminPage() {
  const prefersReducedMotion = useReducedMotion();
  const [accessToken, setAccessToken] = useState("");
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    setMessage("");

    try {
      const [analytics, registrations, offers, guests, delegations, members] =
        await Promise.all([
          adminRequest("/analytics", accessToken),
          adminRequest("/registrations", accessToken),
          adminRequest("/offers", accessToken),
          adminRequest("/chief-guests", accessToken),
          adminRequest("/delegations", accessToken),
          adminRequest("/organizing-members", accessToken),
        ]);

      setData({ analytics, registrations, offers, guests, delegations, members });
    } catch (error) {
      setMessage(error.message);
      if (error.message?.includes("expired")) {
        setAccessToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      void load();
    }
  }, [accessToken]);

  const save = async (path, payload, reset, method = "POST") => {
    try {
      await adminRequest(path, accessToken, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      reset?.();
      await load();
      setMessage("Saved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const remove = async (path) => {
    if (!window.confirm("Are you sure you want to remove this record?")) {
      return;
    }
    try {
      await adminRequest(path, accessToken, { method: "DELETE" });
      await load();
      setMessage("Record removed.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const login = async (adminKey) => {
    setLoading(true);
    setMessage("");
    try {
      const session = await createAdminSession(adminKey);
      setAccessToken(session.access_token);
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
      <main className="grid min-h-screen place-items-center bg-[#071313] px-5 text-white">
        <section className="max-w-md rounded-3xl border border-white/10 bg-[#071313]/90 p-8 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-black">Workspace Unavailable</h1>
          <p className="mt-2 text-xs leading-5 text-white/60">
            {message || "The dashboard data could not be loaded from the backend."}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d9ff38] px-5 py-2.5 text-xs font-black uppercase text-[#071313]"
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
    <div className="min-h-screen bg-[#f4f1e9] text-[#071313] flex flex-col font-sans">
      {/* 1. TOP HEADER */}
      <AdminHeader
        onSignOut={() => {
          setAccessToken("");
          setData({});
          setMessage("");
        }}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        activeTabLabel={activeTabLabel}
      />

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="mx-auto flex w-full max-w-[1520px] flex-1 gap-6 px-4 py-6 sm:px-8">
        {/* SIDEBAR NAVIGATION */}
        <AdminSidebar
          currentTab={tab}
          onSelectTab={setTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          badges={badges}
        />

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 min-w-0">
          {message && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-black/10 bg-white p-4 shadow-sm text-xs font-semibold text-[#071313]">
              <span>{message}</span>
              <button
                type="button"
                onClick={() => setMessage("")}
                className="text-black/40 hover:text-black font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* COMMAND CENTER */}
              {tab === "overview" && (
                <OverviewTab
                  analytics={data.analytics}
                  registrations={data.registrations}
                  onNavigate={setTab}
                />
              )}
              {tab === "visitors" && <AnalyticsTab accessToken={accessToken} />}

              {/* RIDER OPERATIONS */}
              {tab === "riders" && (
                <ParticipantsTab
                  riders={data.registrations}
                  adminKey={accessToken}
                  refresh={load}
                />
              )}
              {tab === "volunteers" && (
                <VolunteersTab accessToken={accessToken} onFeedback={setMessage} />
              )}
              {tab === "delegations" && (
                <ManagePanel
                  title="Delegation"
                  icon={Flag}
                  description="Manage institutional, corporate, and club cycling teams"
                  fields={emptyDelegation}
                  items={data.delegations}
                  adminKey={accessToken}
                  onSave={(value, reset, id) =>
                    save(
                      id ? `/delegations/${id}` : "/delegations",
                      value,
                      reset,
                      id ? "PUT" : "POST"
                    )
                  }
                  onRemove={(id) => remove(`/delegations/${id}`)}
                  render={(item) => (
                    <div>
                      <p className="font-black text-sm text-[#071313]">{item.organization}</p>
                      <p className="text-xs text-black/60">
                        {item.contact_name} • {item.member_count} riders • Status: {item.status}
                      </p>
                    </div>
                  )}
                />
              )}

              {/* COMMERCIAL & COMMUNITY */}
              {tab === "partners" && (
                <PartnersTab accessToken={accessToken} onFeedback={setMessage} />
              )}
              {tab === "vendors" && (
                <VendorsTab accessToken={accessToken} onFeedback={setMessage} />
              )}
              {tab === "community" && (
                <CommunityTab accessToken={accessToken} onFeedback={setMessage} />
              )}

              {/* EVENT CONTENT */}
              {tab === "offers" && (
                <ManagePanel
                  title="Promo Offer"
                  icon={Tag}
                  description="Configure coupon codes, discount campaigns, and promotional tiers"
                  fields={emptyOffer}
                  items={data.offers}
                  onSave={(value, reset, id) =>
                    save(id ? `/offers/${id}` : "/offers", value, reset, id ? "PUT" : "POST")
                  }
                  onRemove={(id) => remove(`/offers/${id}`)}
                  render={(item) => (
                    <div>
                      <p className="font-black text-sm text-[#071313]">{item.title}</p>
                      <p className="text-xs text-black/60 font-mono">
                        {item.code ? `CODE: ${item.code}` : "NO CODE"} •{" "}
                        {item.active ? "ACTIVE" : "PAUSED"}
                      </p>
                    </div>
                  )}
                />
              )}
              {tab === "guests" && (
                <ManagePanel
                  title="Chief Guest"
                  icon={Award}
                  description="Distinguished guests, dignitaries, and VIPs attending NV Cyclothon"
                  fields={emptyGuest}
                  items={data.guests}
                  adminKey={accessToken}
                  onSave={(value, reset, id) =>
                    save(
                      id ? `/chief-guests/${id}` : "/chief-guests",
                      value,
                      reset,
                      id ? "PUT" : "POST"
                    )
                  }
                  onRemove={(id) => remove(`/chief-guests/${id}`)}
                  render={(item) => (
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border border-black/10"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#071313] text-xs font-black text-[#d9ff38]">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-sm text-[#071313]">{item.name}</p>
                        <p className="text-xs text-black/60">
                          {item.designation} • {item.featured ? "Featured" : "Hidden"}
                        </p>
                      </div>
                    </div>
                  )}
                />
              )}
              {tab === "members" && (
                <ManagePanel
                  title="Organizing Member"
                  icon={UsersRound}
                  description="Executive leadership, race directors, and organizing committee"
                  fields={emptyMember}
                  items={data.members || []}
                  adminKey={accessToken}
                  onSave={(value, reset, id) =>
                    save(
                      id ? `/organizing-members/${id}` : "/organizing-members",
                      value,
                      reset,
                      id ? "PUT" : "POST"
                    )
                  }
                  onRemove={(id) => remove(`/organizing-members/${id}`)}
                  render={(item) => (
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border border-black/10"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#071313] text-xs font-black text-[#d9ff38]">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-sm text-[#071313]">{item.name}</p>
                        <p className="text-xs text-black/60">
                          {item.role} • {item.visible ? "Visible" : "Hidden"}
                        </p>
                      </div>
                    </div>
                  )}
                />
              )}

              {/* SYSTEM */}
              {tab === "settings" && (
                <SettingsTab accessToken={accessToken} onFeedback={setMessage} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
