import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { adminDownload, adminRequest, createAdminSession, getAdminSettings, updateSiteSettings, listAdminCommunityPosts, moderateCommunityPost, getAdminCommunityMedia, createVolunteer, listVolunteers, updateVolunteer } from "../api/http";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { useDebouncedValue } from "../components/useDebouncedValue";
import nvCyclothonLogo from "../../assets/NV_Cyclothon_logo.png";

const emptyOffer = { title: "", description: "", code: "", active: true };
const emptyGuest = {
  name: "",
  designation: "",
  bio: "",
  image_url: "",
  featured: true,
  display_order: 0,
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

const adminAuthDisabled =
  import.meta.env.VITE_ADMIN_AUTH_DISABLED === "true" || import.meta.env.DEV;

const emptyAnalytics = {
  total_registrations: 0,
  approved_registrations: 0,
  checked_in_registrations: 0,
  registrations_today: 0,
  registrations_by_route: {},
  registrations_by_status: {},
  registrations_by_city: [],
  delegation_count: 0,
  delegation_members: 0,
  active_offers: 0,
};

const tabs = [
  ["overview", "Overview"],
  ["riders", "Participants"],
  ["offers", "Offers"],
  ["guests", "Chief guests"],
  ["delegations", "Delegations"],
  ["volunteers", "Volunteers"],
  ["community", "Community wall"],
  ["settings", "Site settings"],
];

function buildFallbackAdminData() {
  return {
    analytics: emptyAnalytics,
    registrations: [],
    offers: [],
    guests: [],
    delegations: [],
  };
}

function formatStatus(status) {
  return String(status || "").replaceAll("_", " ");
}

export function AdminPage() {
  const prefersReducedMotion = useReducedMotion();
  const [accessToken, setAccessToken] = useState(() =>
    adminAuthDisabled ? "admin-auth-disabled" : ""
  );
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const [analytics, registrations, offers, guests, delegations] =
        await Promise.all([
          adminRequest("/analytics", accessToken),
          adminRequest("/registrations", accessToken),
          adminRequest("/offers", accessToken),
          adminRequest("/chief-guests", accessToken),
          adminRequest("/delegations", accessToken),
        ]);

      setData({ analytics, registrations, offers, guests, delegations });
    } catch (error) {
      setMessage(error.message);
      if (!adminAuthDisabled && error.message.includes("expired")) {
        setAccessToken("");
      }
      if (adminAuthDisabled) {
        setData(buildFallbackAdminData());
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
      setMessage("Saved.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const remove = async (path) => {
    if (!window.confirm("Remove this record?")) {
      return;
    }

    try {
      await adminRequest(path, accessToken, { method: "DELETE" });
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const login = async (adminKey) => {
    if (adminAuthDisabled) {
      setAccessToken("admin-auth-disabled");
      return;
    }

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

  if (!adminAuthDisabled && !accessToken) {
    return <Login onLogin={login} message={message} loading={loading} />;
  }

  if (!data.analytics && loading) {
    return (
      <main className="min-h-screen bg-[#f4f1e9] px-5 pb-16 pt-28 text-[#071313]">
        <div className="mx-auto max-w-[1240px] rounded-3xl bg-[#071313] p-10 text-center text-white">
          <LoadingIndicator
            label="Loading admin workspace..."
            className="justify-center text-sm font-bold"
          />
        </div>
      </main>
    );
  }

  if (!data.analytics) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1e9] px-5 pt-28 text-[#071313]">
        <section className="max-w-xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">Admin workspace unavailable</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-black/70">{message || "The dashboard data could not be loaded."}</p>
          <button type="button" onClick={() => void load()} className="mt-6 rounded-xl bg-[#071313] px-5 py-3 text-sm font-bold text-white">Retry</button>
        </section>
      </main>
    );
  }

  return (
    <motion.main
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="min-h-screen bg-[#f4f1e9] px-5 pb-16 pt-28 text-[#071313]"
    >
      <div className="mx-auto max-w-[1240px]">
        <section className="relative overflow-hidden rounded-3xl bg-[#071313] px-6 py-7 text-white shadow-[0_20px_50px_rgba(7,19,19,.28)] sm:px-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#d9ff38]/20 blur-3xl" />
          <div className="absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-[#ff5f3d]/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={nvCyclothonLogo}
                alt="NV Cyclothon"
                className="h-14 w-24 rounded-md object-cover"
              />
              <div>
                <p className="text-[11px] font-black tracking-[.22em] text-[#d9ff38] uppercase">
                  NV Cyclothon 2026
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  Admin control center
                </h1>
              </div>
            </div>
            <button
              onClick={() => {
                if (adminAuthDisabled) {
                  setMessage(
                    "Admin authentication is disabled for development preview."
                  );
                  return;
                }
                setAccessToken("");
                setData({});
                setMessage("");
              }}
              className="rounded-full border border-white/35 px-4 py-2 text-xs font-black tracking-wide uppercase transition hover:bg-white/10"
            >
              {adminAuthDisabled ? "Auth disabled" : "Sign out"}
            </button>
          </div>
          <p className="relative mt-4 max-w-3xl text-sm text-white/75">
            Manage registrations, offers, guests, and delegation operations from
            one place using the same visual identity as the public NV Cyclothon
            experience.
          </p>
          {adminAuthDisabled && (
            <p className="relative mt-3 inline-flex rounded-full bg-[#d9ff38] px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-[#071313]">
              Development mode: authentication bypass enabled
            </p>
          )}
        </section>

        <nav className="mt-7 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <motion.button
              layout
              key={id}
              onClick={() => setTab(id)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              className={`rounded-full px-4 py-2 text-sm font-black tracking-[.06em] uppercase transition ${
                tab === id
                  ? "bg-[#071313] text-[#d9ff38]"
                  : "border border-[#071313]/18 bg-white text-[#071313] hover:border-[#ff5f3d]/45"
              }`}
            >
              {label}
            </motion.button>
          ))}
        </nav>

        {message && (
          <p
            className="mt-4 rounded-2xl border border-[#ff5f3d]/30 bg-[#fff1eb] px-4 py-3 text-sm text-[#7a260f]"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-6"
          >
            {tab === "overview" && (
              <Overview
                analytics={data.analytics}
                registrations={data.registrations}
              />
            )}
            {tab === "riders" && (
              <Riders
                riders={data.registrations}
                adminKey={accessToken}
                refresh={load}
              />
            )}
            {tab === "offers" && (
              <Manage
                title="Run an offer"
                fields={emptyOffer}
                items={data.offers}
                onSave={(value, reset, id) =>
                  save(
                    id ? `/offers/${id}` : "/offers",
                    value,
                    reset,
                    id ? "PUT" : "POST"
                  )
                }
                onRemove={(id) => remove(`/offers/${id}`)}
                render={(item) => (
                  <>
                    <b>{item.title}</b>
                    <span>
                      {item.code ? `Code: ${item.code}` : "No code"} ·{" "}
                      {item.active ? "Active" : "Paused"}
                    </span>
                  </>
                )}
              />
            )}
            {tab === "guests" && (
              <Manage
                title="Add chief guest"
                fields={emptyGuest}
                items={data.guests}
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
                  <>
                    <b>{item.name}</b>
                    <span>
                      {item.designation} · {item.featured ? "Featured" : "Hidden"}
                    </span>
                  </>
                )}
              />
            )}
            {tab === "delegations" && (
              <Manage
                title="Add delegation"
                fields={emptyDelegation}
                items={data.delegations}
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
                  <>
                    <b>{item.organization}</b>
                    <span>
                      {item.contact_name} · {item.member_count} members ·{" "}
                      {item.status}
                    </span>
                  </>
                )}
              />
            )}
            {tab === "volunteers" && (
              <VolunteerManagementPanel accessToken={accessToken} onFeedback={setMessage} />
            )}
            {tab === "settings" && (
              <SiteSettingsPanel accessToken={accessToken} onFeedback={setMessage} />
            )}
            {tab === "community" && (
              <CommunityModerationPanel accessToken={accessToken} onFeedback={setMessage} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.main>
  );
}

function Login({ onLogin, message, loading }) {
  const [keyValue, setKey] = useState("");

  const submit = () => {
    if (keyValue.trim() && !loading) {
      onLogin(keyValue);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#071313] p-5 text-white">
      <div className="w-full max-w-md rounded-3xl bg-[#f4f1e9] p-8 text-[#071313] shadow-2xl">
        <p className="text-xs font-black tracking-[.18em] text-[#ff5f3d] uppercase">
          Staff only
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Admin access</h1>
        <p className="mt-3 text-sm text-black/65">
          Enter the event admin key. It is held only for this browser session.
        </p>
        <label htmlFor="admin-key" className="mt-6 block text-xs font-black uppercase tracking-[.12em]">
          Admin key
        </label>
        <input
          id="admin-key"
          type="password"
          value={keyValue}
          onChange={(event) => setKey(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submit();
            }
          }}
          className="mt-2 w-full rounded-xl border border-black/15 bg-white p-3"
          placeholder="Admin key"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !keyValue.trim()}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#071313] p-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <LoadingIndicator label="Checking..." className="text-white" />
          ) : (
            "Open dashboard"
          )}
        </button>
        {message && (
          <p role="status" aria-live="polite" className="mt-4 text-sm text-red-700">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

function Overview({ analytics, registrations }) {
  const cards = [
    ["Riders", analytics.total_registrations, "bg-white"],
    ["Approved", analytics.approved_registrations, "bg-[#d9ff38]"],
    ["Checked in", analytics.checked_in_registrations, "bg-[#ffdfc9]"],
    ["Today", analytics.registrations_today, "bg-white"],
    ["Delegates", analytics.delegation_members, "bg-white"],
    ["Live offers", analytics.active_offers, "bg-white"],
  ];

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, bg]) => (
          <article
            key={label}
            className={`rounded-2xl border border-[#071313]/8 p-5 shadow-sm ${bg}`}
          >
            <p className="text-xs font-black tracking-[.14em] text-black/55 uppercase">
              {label}
            </p>
            <p className="mt-2 text-4xl font-black">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#071313]/8 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Route mix</h2>
          {Object.entries(analytics.registrations_by_route).length === 0 && (
            <p className="mt-3 text-sm text-black/55">No route data yet.</p>
          )}
          {Object.entries(analytics.registrations_by_route).map(([route, count]) => (
            <p
              key={route}
              className="mt-3 flex items-center justify-between border-b border-black/10 pb-2 text-sm"
            >
              <span>{route}</span>
              <b>{count} riders</b>
            </p>
          ))}
        </article>

        <article className="rounded-2xl border border-[#071313]/8 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Latest registrations</h2>
          {registrations.length === 0 && (
            <p className="mt-3 text-sm text-black/55">No registrations available yet.</p>
          )}
          {registrations.slice(0, 5).map((registration) => (
            <p key={registration.id} className="mt-3 flex justify-between text-sm">
              <span>
                {registration.full_name}{" "}
                <i className="not-italic text-black/45">· {registration.ride_category}</i>
              </span>
              <b>{formatStatus(registration.status)}</b>
            </p>
          ))}
        </article>
      </div>
    </section>
  );
}

function Riders({ riders, adminKey, refresh }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [certificateFile, setCertificateFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText.trim().toLowerCase(), 250);

  const visibleRiders = !debouncedSearchText
    ? riders
    : riders.filter((rider) => [
      rider.id,
      rider.full_name,
      rider.email,
      rider.phone,
      rider.ride_category,
      rider.city,
      rider.status,
      rider.checked_in_by,
    ].some((value) => String(value || "").toLowerCase().includes(debouncedSearchText)));

  const selectedSet = new Set(selectedIds);
  const checkedInSelected = riders.filter(
    (rider) => selectedSet.has(rider.id) && rider.status === "checked_in"
  );
  const allSelected = visibleRiders.length > 0 && visibleRiders.every((rider) => selectedIds.includes(rider.id));

  const toggle = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : Array.from(new Set([...selectedIds, ...visibleRiders.map((rider) => rider.id)])));
  };

  const changeStatus = async (id, status) => {
    try {
      await adminRequest(`/registrations/${id}`, adminKey, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (error) {
      setActionMessage(error.message);
    }
  };

  const bulkSetStatus = async (status) => {
    if (!selectedIds.length) {
      return;
    }

    setBusy(true);
    setActionMessage("");
    try {
      const result = await adminRequest("/registrations/bulk-status", adminKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_ids: selectedIds, status }),
      });

      setActionMessage(
        `${result.updated} participant${
          result.updated === 1 ? "" : "s"
        } marked ${formatStatus(status)}.`
      );
      setSelectedIds([]);
      await refresh();
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const sendCertificates = async () => {
    if (!certificateFile || !checkedInSelected.length) {
      return;
    }

    setBusy(true);
    setActionMessage("");
    try {
      const body = new FormData();
      body.append(
        "registration_ids",
        JSON.stringify(checkedInSelected.map((rider) => rider.id))
      );
      body.append("certificate_file", certificateFile);

      const result = await adminRequest("/registrations/certificates", adminKey, {
        method: "POST",
        body,
      });

      const skipped = result.skipped + result.missing_ids.length;
      setActionMessage(
        `${result.queued} certificate${
          result.queued === 1 ? "" : "s"
        } queued. ${skipped} participant${
          skipped === 1 ? " was" : "s were"
        } skipped.`
      );
      setCertificateFile(null);
      setSelectedIds([]);
      const certificateInput = document.getElementById("certificate-file");
      if (certificateInput) {
        certificateInput.value = "";
      }
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const generateCertificates = async () => {
    if (!checkedInSelected.length) {
      return;
    }

    setBusy(true);
    setActionMessage("");
    try {
      const result = await adminRequest(
        "/registrations/certificates/generate",
        adminKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checkedInSelected.map((rider) => rider.id)),
        }
      );

      const skipped = result.skipped + result.missing_ids.length;
      setActionMessage(
        `${result.queued} personalized certificate${
          result.queued === 1 ? "" : "s"
        } generated and queued. ${skipped} participant${
          skipped === 1 ? " was" : "s were"
        } skipped.`
      );
      setSelectedIds([]);
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const previewCertificate = async () => {
    if (checkedInSelected.length !== 1) {
      return;
    }

    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setActionMessage("Allow pop-ups to preview the certificate.");
      return;
    }

    previewWindow.document.title = "Loading certificate preview...";
    try {
      const certificate = await adminDownload(
        `/registrations/${checkedInSelected[0].id}/certificate-preview`,
        adminKey
      );
      const url = URL.createObjectURL(certificate);
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      previewWindow.close();
      setActionMessage(error.message);
    }
  };

  return (
    <section className="rounded-3xl border border-[#071313]/10 bg-white shadow-sm">
      <article className="rounded-t-3xl border-b border-[#071313]/10 bg-[#fbf8ef] p-5 sm:p-6">
        <h2 className="text-2xl font-black tracking-tight">Participant actions</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">
          Review participant, payment, QR, and check-in information in one place.
          Approve selected riders, then generate and send certificates after check-in.
        </p>

        <label className="mt-5 block max-w-xl text-xs font-black tracking-[.12em] text-black/60 uppercase">
          Search participants
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="ID, name, email, phone, route, city, status, or volunteer"
            className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-normal normal-case text-[#071313]"
          />
        </label>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-[#071313]/12 bg-white p-3">
            <p className="text-[11px] font-black tracking-[.16em] text-black/55 uppercase">
              Status updates
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => bulkSetStatus("approved")}
                disabled={busy || !selectedIds.length}
                className="rounded-lg border border-black/20 px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Approve ({selectedIds.length})
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#071313]/12 bg-white p-3">
            <p className="text-[11px] font-black tracking-[.16em] text-black/55 uppercase">
              Certificates
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={previewCertificate}
                disabled={busy || checkedInSelected.length !== 1}
                className="rounded-lg border border-[#071313] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Preview one
              </button>
              <button
                type="button"
                onClick={generateCertificates}
                disabled={busy || !checkedInSelected.length}
                className="rounded-lg bg-[#d9ff38] px-3 py-2 text-xs font-bold text-[#071313] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generate & send ({checkedInSelected.length})
              </button>
              <label
                htmlFor="certificate-file"
                className="cursor-pointer rounded-lg border border-black/20 px-3 py-2 text-xs font-bold"
              >
                {certificateFile ? certificateFile.name : "Choose PDF"}
              </label>
              <input
                id="certificate-file"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) =>
                  setCertificateFile(event.target.files?.[0] || null)
                }
              />
              <button
                type="button"
                onClick={sendCertificates}
                disabled={busy || !certificateFile || !checkedInSelected.length}
                className="rounded-lg bg-[#ff5f3d] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send uploaded ({checkedInSelected.length})
              </button>
            </div>
          </div>
        </div>

        {actionMessage && (
          <p className="mt-4 rounded-xl bg-[#eef2f3] px-3 py-2 text-sm text-black/70">
            {actionMessage}
          </p>
        )}
      </article>

      <div className="overflow-x-auto rounded-b-3xl">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-black/10 bg-white">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all participants"
                />
              </th>
              {[
                "Rider",
                "Contact",
                "Route",
                "City",
                "Gender",
                "T-shirt",
                "QR",
                "Check-in",
                "Status",
              ].map((item) => (
                <th
                  key={item}
                  className="p-4 text-xs font-black tracking-[.12em] uppercase"
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRiders.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-sm text-black/55">
                  {riders.length ? "No participants match this search." : "No participants available yet."}
                </td>
              </tr>
            )}
            {visibleRiders.map((rider) => (
              <tr key={rider.id} className="border-b border-black/5">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(rider.id)}
                    onChange={() => toggle(rider.id)}
                    aria-label={`Select ${rider.full_name}`}
                  />
                </td>
                <td className="p-4 font-bold">#{rider.id} · {rider.full_name}</td>
                <td className="p-4 text-black/75">
                  {rider.email}<br />{rider.phone}
                </td>
                <td className="p-4">{rider.ride_category}</td>
                <td className="p-4">{rider.city}</td>
                <td className="p-4">{rider.gender}</td>
                <td className="p-4">{rider.t_shirt_size}</td>
                <td className="p-4">
                  {rider.checkin_token ? (
                    <QRCodeSVG
                      value={`nvcyclothon-checkin:${rider.checkin_token}`}
                      size={58}
                      level="M"
                      aria-label={`Check-in QR code for ${rider.full_name}`}
                    />
                  ) : "-"}
                </td>
                <td className="p-4 text-xs text-black/70">
                  <p>{rider.checked_in_at ? new Date(rider.checked_in_at).toLocaleString() : "Not checked in"}</p>
                  {rider.checked_in_by && <p className="mt-1">By {rider.checked_in_by} · {rider.checkin_method || "manual"}</p>}
                </td>
                <td className="p-4">
                  {rider.status === "checked_in" ? (
                    <span className="rounded-lg bg-[#d9ff38] px-3 py-2 text-xs font-black uppercase text-[#071313]">Checked in</span>
                  ) : (
                    <select
                      value={rider.status}
                      onChange={(event) => changeStatus(rider.id, event.target.value)}
                      className="rounded-lg border border-black/20 bg-white p-2 text-sm"
                    >
                      {["pending", "approved", "cancelled"].map((status) => <option key={status}>{status}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function toEditableForm(fields, item) {
  const next = { ...fields };
  for (const key of Object.keys(fields)) {
    if (item[key] !== undefined && item[key] !== null) {
      next[key] = item[key];
    }
  }
  return next;
}

function Manage({ title, fields, items, onSave, onRemove, render }) {
  const [form, setForm] = useState(fields);
  const [editing, setEditing] = useState(null);

  const reset = () => {
    setForm(fields);
    setEditing(null);
  };

  const submit = (event) => {
    event.preventDefault();
    const normalized = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        key === "member_count" || key === "display_order"
          ? Number(value)
          : value,
      ])
    );
    onSave(normalized, reset, editing);
  };

  const beginEdit = (item) => {
    setEditing(item.id);
    setForm(toEditableForm(fields, item));
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-black">
          {editing ? `Edit ${title.toLowerCase()}` : title}
        </h2>

        {Object.entries(form).map(([name, value]) => (
          <label
            key={name}
            className="mt-4 block text-xs font-black tracking-[.12em] uppercase"
          >
            {name.replaceAll("_", " ")}
            {typeof value === "boolean" ? (
              <input
                className="ml-3 accent-[#ff5f3d]"
                type="checkbox"
                checked={value}
                onChange={(event) =>
                  setForm({ ...form, [name]: event.target.checked })
                }
              />
            ) : name === "notes" || name === "bio" || name === "description" ? (
              <textarea
                value={value}
                onChange={(event) =>
                  setForm({ ...form, [name]: event.target.value })
                }
                className="mt-1 min-h-20 w-full rounded-lg border border-black/20 p-2 text-sm font-normal normal-case"
              />
            ) : (
              <input
                required={
                  !["contact_email", "contact_phone", "code", "image_url"].includes(
                    name
                  )
                }
                type={typeof value === "number" ? "number" : "text"}
                value={value}
                onChange={(event) =>
                  setForm({ ...form, [name]: event.target.value })
                }
                className="mt-1 w-full rounded-lg border border-black/20 p-2 text-sm font-normal normal-case"
              />
            )}
          </label>
        ))}

        <button className="mt-6 rounded-xl bg-[#071313] px-5 py-3 text-sm font-bold text-white">
          {editing ? "Update" : "Save"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={reset}
            className="ml-3 text-sm font-bold underline"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#071313]/20 bg-white p-6 text-sm text-black/55">
            No records yet.
          </div>
        )}
        {items.map((item) => (
          <article
            key={item.id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-1 text-sm text-black/70">{render(item)}</div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => beginEdit(item)}
                className="rounded-lg border border-black/20 px-3 py-2 text-xs font-black uppercase"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded-lg bg-[#ff5f3d] px-3 py-2 text-xs font-black uppercase text-white"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const SECTION_LABELS = [
  ["editions", "Editions timeline"],
  ["about", "About / mission"],
  ["routes", "Route categories"],
  ["updates", "Event updates"],
  ["gallery", "Gallery"],
  ["why_sport", "Why cycling"],
  ["community", "Community wall"],
  ["contact", "Point of contact + map"],
  ["sponsors", "People & sponsors"],
];

function SiteSettingsPanel({ accessToken, onFeedback }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localFeedback, setLocalFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminSettings(accessToken)
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoading(false);
        setLocalFeedback(error.message || "Could not load settings.");
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading || !settings) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <LoadingIndicator label="Loading site settings…" className="text-sm" />
      </section>
    );
  }

  const updateField = (key, value) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const toggleSection = (key) =>
    setSettings((current) => ({
      ...current,
      sections: { ...current.sections, [key]: !current.sections?.[key] },
    }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setLocalFeedback("");
    try {
      const updated = await updateSiteSettings(accessToken, {
        event_date: settings.event_date,
        event_start_time: settings.event_start_time,
        event_location: settings.event_location,
        edition_label: settings.edition_label,
        registration_open: settings.registration_open,
        hero_images: settings.hero_images || [],
        feature_section: settings.feature_section || {},
        sections: settings.sections,
      });
      setSettings(updated);
      setLocalFeedback("Site settings updated.");
      if (typeof onFeedback === "function") {
        onFeedback("Site settings updated.");
      }
    } catch (error) {
      setLocalFeedback(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-black text-[#071313]">Site settings</h3>
      <p className="mt-1 text-sm text-black/60">
        Control what visitors see on the public homepage. Changes go live within about 30 seconds.
      </p>
      <form className="mt-6 grid gap-6" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[.1em] text-[#071313]/70">
            Event date
            <input
              type="date"
              value={settings.event_date || ""}
              onChange={(event) => updateField("event_date", event.target.value)}
              className="mt-1 rounded-lg border border-black/20 p-2 text-sm font-normal normal-case text-[#071313]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[.1em] text-[#071313]/70">
            Start time
            <input
              type="text"
              value={settings.event_start_time || ""}
              onChange={(event) => updateField("event_start_time", event.target.value)}
              className="mt-1 rounded-lg border border-black/20 p-2 text-sm font-normal normal-case text-[#071313]"
              placeholder="5:30 AM"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[.1em] text-[#071313]/70">
            Location
            <input
              type="text"
              value={settings.event_location || ""}
              onChange={(event) => updateField("event_location", event.target.value)}
              className="mt-1 rounded-lg border border-black/20 p-2 text-sm font-normal normal-case text-[#071313]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[.1em] text-[#071313]/70">
            Edition label
            <input
              type="text"
              value={settings.edition_label || ""}
              onChange={(event) => updateField("edition_label", event.target.value)}
              className="mt-1 rounded-lg border border-black/20 p-2 text-sm font-normal normal-case text-[#071313]"
              placeholder="3rd Edition"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm font-bold text-[#071313]">
          <input
            type="checkbox"
            checked={Boolean(settings.registration_open)}
            onChange={(event) => updateField("registration_open", event.target.checked)}
            className="h-4 w-4"
          />
          Registration is open
        </label>

        <fieldset className="rounded-2xl border border-black/10 p-4">
          <legend className="px-2 text-xs font-black tracking-[.14em] text-[#071313]/70 uppercase">Hero images</legend>
          <p className="mb-3 text-sm text-black/60">Use up to five HTTPS image URLs, one per line. These replace the default hero carousel when saved.</p>
          <textarea
            rows={5}
            value={(settings.hero_images || []).join("\n")}
            onChange={(event) => updateField("hero_images", event.target.value.split("\n").map((url) => url.trim()).filter(Boolean))}
            className="w-full rounded-xl border border-black/20 p-3 text-sm"
            placeholder="https://example.com/event-photo.webp"
          />
        </fieldset>

        <fieldset className="rounded-2xl border border-black/10 p-4">
          <legend className="px-2 text-xs font-black tracking-[.14em] text-[#071313]/70 uppercase">Optional feature section</legend>
          <label className="flex items-center gap-3 text-sm font-bold text-[#071313]"><input type="checkbox" checked={Boolean(settings.feature_section?.enabled)} onChange={(event) => updateField("feature_section", { ...settings.feature_section, enabled: event.target.checked })} className="h-4 w-4" /> Show this section on the homepage</label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-[.1em]">Eyebrow<input value={settings.feature_section?.eyebrow || ""} onChange={(event) => updateField("feature_section", { ...settings.feature_section, eyebrow: event.target.value })} className="mt-2 w-full rounded-lg border border-black/20 p-2 text-sm normal-case" /></label>
            <label className="text-xs font-bold uppercase tracking-[.1em]">Image URL<input type="url" value={settings.feature_section?.image_url || ""} onChange={(event) => updateField("feature_section", { ...settings.feature_section, image_url: event.target.value })} className="mt-2 w-full rounded-lg border border-black/20 p-2 text-sm normal-case" placeholder="https://…" /></label>
            <label className="sm:col-span-2 text-xs font-bold uppercase tracking-[.1em]">Title<input value={settings.feature_section?.title || ""} onChange={(event) => updateField("feature_section", { ...settings.feature_section, title: event.target.value })} className="mt-2 w-full rounded-lg border border-black/20 p-2 text-sm normal-case" /></label>
            <label className="sm:col-span-2 text-xs font-bold uppercase tracking-[.1em]">Body<textarea rows={4} value={settings.feature_section?.body || ""} onChange={(event) => updateField("feature_section", { ...settings.feature_section, body: event.target.value })} className="mt-2 w-full rounded-lg border border-black/20 p-2 text-sm normal-case" /></label>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-black/10 p-4">
          <legend className="px-2 text-xs font-black tracking-[.14em] text-[#071313]/70 uppercase">
            Public sections
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTION_LABELS.map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-lg border border-black/10 bg-[#f4f1e9] px-3 py-2 text-sm text-[#071313]"
              >
                <input
                  type="checkbox"
                  checked={settings.sections?.[key] !== false}
                  onChange={() => toggleSection(key)}
                  className="h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#071313] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          {localFeedback && (
            <p role="status" aria-live="polite" className="text-sm text-black/70">
              {localFeedback}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function CommunityModerationPanel({ accessToken, onFeedback }) {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [state, setState] = useState({ loading: true, error: "" });
  const [workingId, setWorkingId] = useState(null);

  const load = async () => {
    setState({ loading: true, error: "" });
    try {
      const response = await listAdminCommunityPosts(accessToken, statusFilter);
      setItems(response.items || []);
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({ loading: false, error: error.message || "Unable to load submissions." });
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken, statusFilter]);

  const moderate = async (id, status) => {
    const reason = status === "rejected"
      ? window.prompt("Optional private moderation reason:", "") || ""
      : "";
    setWorkingId(id);
    try {
      await moderateCommunityPost(accessToken, id, { status, reason });
      setItems((current) => current.filter((item) => item.id !== id));
      onFeedback?.(`Community post ${status}.`);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || "Unable to save moderation." }));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-[#071313]">Community wall moderation</h3>
          <p className="mt-1 text-sm text-black/60">Review every submission before it is displayed publicly.</p>
        </div>
        <label className="text-xs font-black tracking-[.1em] text-[#071313]/70 uppercase">
          Queue
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="ml-2 rounded-lg border border-black/20 bg-white p-2 text-sm font-normal normal-case text-[#071313]"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </label>
      </div>

      {state.error && (
        <div role="alert" className="mt-5 rounded-xl border border-[#ff5f3d]/30 bg-[#fff1eb] p-4 text-sm text-[#7a260f]">
          {state.error} <button type="button" onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>
        </div>
      )}
      {state.loading ? (
        <div className="mt-6"><LoadingIndicator label="Loading moderation queue…" className="text-sm" /></div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/20 bg-[#f4f1e9] p-6 text-sm text-black/60">No {statusFilter} submissions.</div>
      ) : (
        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <CommunityModerationItem
              key={item.id}
              item={item}
              accessToken={accessToken}
              working={workingId === item.id}
              onModerate={moderate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommunityModerationItem({ item, accessToken, working, onModerate }) {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let revoked = false;
    let objectUrl = "";
    const key = item.image_url?.split("/").pop();
    if (!key) return undefined;
    getAdminCommunityMedia(accessToken, key)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .catch(() => setImageUrl(""));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, item.image_url]);

  return (
    <article className="grid gap-4 rounded-2xl border border-black/10 p-5 md:grid-cols-[160px_1fr_auto]">
      <div className="min-h-24 rounded-xl bg-[#f4f1e9]">
        {imageUrl && <img src={imageUrl} alt="Submitted community content" className="h-36 w-full rounded-xl object-cover" />}
      </div>
      <div>
        <p className="font-black text-[#071313]">{item.name}</p>
        <p className="mt-2 text-sm leading-6 text-black/75">{item.message}</p>
        <p className="mt-3 text-xs text-black/50">Submitted {new Date(item.created_at).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap content-start gap-2">
        <button type="button" disabled={working} onClick={() => onModerate(item.id, "approved")} className="rounded-lg bg-[#d9ff38] px-3 py-2 text-xs font-black text-[#071313] disabled:opacity-50">Approve</button>
        <button type="button" disabled={working} onClick={() => onModerate(item.id, "rejected")} className="rounded-lg bg-[#ff5f3d] px-3 py-2 text-xs font-black text-white disabled:opacity-50">Reject</button>
      </div>
    </article>
  );
}

function VolunteerManagementPanel({ accessToken, onFeedback }) {
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState({ volunteer_id: "", display_name: "", password: "" });
  const [state, setState] = useState({ loading: true, saving: false, error: "" });

  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setVolunteers(await listVolunteers(accessToken));
      setState({ loading: false, saving: false, error: "" });
    } catch (error) {
      setState({ loading: false, saving: false, error: error.message || "Unable to load volunteers." });
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken]);

  const create = async (event) => {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      await createVolunteer(accessToken, form);
      setForm({ volunteer_id: "", display_name: "", password: "" });
      onFeedback?.("Volunteer account created.");
      await load();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message || "Unable to create volunteer." }));
    }
  };

  const update = async (id, payload) => {
    try {
      await updateVolunteer(accessToken, id, payload);
      onFeedback?.("Volunteer account updated.");
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || "Unable to update volunteer." }));
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="rounded-3xl bg-[#071313] p-6 text-white shadow-sm">
        <p className="text-xs font-black tracking-[.18em] text-[#d9ff38] uppercase">Volunteer access</p>
        <h3 className="mt-2 text-2xl font-black">Create account</h3>
        <p className="mt-2 text-sm leading-6 text-white/70">Volunteer IDs and passwords are stored securely. Once the first account exists, legacy shared PINs no longer grant access.</p>
        <label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Volunteer ID
          <input required minLength="3" maxLength="80" pattern="[A-Za-z0-9._-]+" value={form.volunteer_id} onChange={(event) => setForm({ ...form, volunteer_id: event.target.value })} placeholder="desk-01" className="mt-2 w-full rounded-xl bg-white/10 p-3 text-sm normal-case outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-[#d9ff38]" />
        </label>
        <label className="mt-4 block text-xs font-bold uppercase tracking-[.1em]">Display name
          <input required minLength="2" maxLength="120" value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} placeholder="Registration Desk 1" className="mt-2 w-full rounded-xl bg-white/10 p-3 text-sm normal-case outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-[#d9ff38]" />
        </label>
        <label className="mt-4 block text-xs font-bold uppercase tracking-[.1em]">Temporary password
          <input required type="password" minLength="8" maxLength="128" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 w-full rounded-xl bg-white/10 p-3 text-sm normal-case outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-[#d9ff38]" />
        </label>
        <button disabled={state.saving} className="mt-6 rounded-xl bg-[#d9ff38] px-5 py-3 text-sm font-black text-[#071313] disabled:opacity-50">{state.saving ? "Creating…" : "Create volunteer"}</button>
      </form>
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black">Volunteer accounts</h3>
        {state.error && <p role="alert" className="mt-4 rounded-xl bg-[#fff1eb] p-3 text-sm text-[#7a260f]">{state.error}</p>}
        {state.loading ? <div className="mt-5"><LoadingIndicator label="Loading volunteers…" /></div> : (
          <div className="mt-5 overflow-x-auto rounded-xl border border-black/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f4f1e9]"><tr><th className="p-3">Volunteer</th><th className="p-3">ID</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-black/10">
                {volunteers.map((volunteer) => <tr key={volunteer.id}>
                  <td className="p-3 font-bold">{volunteer.display_name}</td><td className="p-3">{volunteer.volunteer_id}</td><td className="p-3">{volunteer.active ? "Active" : "Disabled"}</td>
                  <td className="p-3 text-right"><button type="button" onClick={() => update(volunteer.id, { active: !volunteer.active })} className="rounded-lg border border-black/20 px-3 py-2 text-xs font-bold">{volunteer.active ? "Disable" : "Enable"}</button></td>
                </tr>)}
                {!volunteers.length && <tr><td colSpan="4" className="p-5 text-center text-black/55">No volunteer accounts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
