import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { adminDownload, adminRequest, createAdminSession } from "../api/http";
import { LoadingIndicator } from "../components/LoadingIndicator";

const emptyOffer = { title: "", description: "", code: "", active: true };
const emptyGuest = { name: "", designation: "", bio: "", image_url: "", featured: true, display_order: 0 };
const emptyDelegation = { organization: "", contact_name: "", contact_email: "", contact_phone: "", member_count: 1, status: "invited", notes: "" };

export function AdminPage() {
  const prefersReducedMotion = useReducedMotion();
  const [accessToken, setAccessToken] = useState("");
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (!accessToken) return;
    setLoading(true); setMessage("");
    try {
      const [analytics, registrations, offers, guests, delegations] = await Promise.all([
        adminRequest("/analytics", accessToken), adminRequest("/registrations", accessToken), adminRequest("/offers", accessToken),
        adminRequest("/chief-guests", accessToken), adminRequest("/delegations", accessToken),
      ]);
      setData({ analytics, registrations, offers, guests, delegations });
    } catch (error) { setMessage(error.message); if (error.message.includes("expired")) setAccessToken(""); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (accessToken) load(); }, [accessToken]);
  const save = async (path, payload, reset, method = "POST") => {
    try { await adminRequest(path, accessToken, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); reset?.(); await load(); setMessage("Saved."); }
    catch (error) { setMessage(error.message); }
  };
  const remove = async (path) => {
    if (!window.confirm("Remove this record?")) return;
    try { await adminRequest(path, accessToken, { method: "DELETE" }); await load(); }
    catch (error) { setMessage(error.message); }
  };
  const login = async (adminKey) => {
    setLoading(true); setMessage("");
    try { const session = await createAdminSession(adminKey); setAccessToken(session.access_token); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };
  if (!accessToken || (!data.analytics && message)) return <Login onLogin={login} message={message} loading={loading} />;
  if (!data.analytics) return <div className="grid min-h-screen place-items-center bg-[#071313] p-10 text-white"><LoadingIndicator label="Loading admin workspace…" className="text-sm font-bold" /></div>;
  const tabs = [["overview", "Overview"], ["riders", "Participants"], ["offers", "Offers"], ["guests", "Chief guests"], ["delegations", "Delegations"]];
  return <motion.main initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="min-h-screen bg-[#f4f1e9] text-[#071313]">
    <header className="bg-[#071313] px-5 py-5 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between"><div><a href="/" className="text-xs font-black tracking-[.2em] text-[#d9ff38]">NV CYCLOTHON</a><h1 className="mt-1 text-2xl font-black tracking-tight">Event control centre</h1></div><button onClick={() => { setAccessToken(""); setData({}); }} className="text-xs font-bold text-white/70 underline">Sign out</button></div></header>
    <div className="mx-auto max-w-7xl px-5 py-8"><nav className="mb-8 flex gap-2 overflow-auto">{tabs.map(([id, label]) => <motion.button layout key={id} onClick={() => setTab(id)} whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${tab === id ? "bg-[#071313] text-white" : "bg-white"}`}>{label}</motion.button>)}</nav>
      {message && <p className="mb-5 rounded-lg bg-[#ffdfc9] p-3 text-sm">{message}</p>}
      <AnimatePresence mode="wait"><motion.div key={tab} initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
        {tab === "overview" && <Overview analytics={data.analytics} registrations={data.registrations} />}
        {tab === "riders" && <Riders riders={data.registrations} adminKey={accessToken} refresh={load} />}
        {tab === "offers" && <Manage title="Run an offer" fields={emptyOffer} items={data.offers} onSave={(v, reset, id) => save(id ? `/offers/${id}` : "/offers", v, reset, id ? "PUT" : "POST")} onRemove={(id) => remove(`/offers/${id}`)} render={(item) => <><b>{item.title}</b><span>{item.code ? `Code: ${item.code}` : "No code"} · {item.active ? "Active" : "Paused"}</span></>} />}
        {tab === "guests" && <Manage title="Add chief guest" fields={emptyGuest} items={data.guests} onSave={(v, reset, id) => save(id ? `/chief-guests/${id}` : "/chief-guests", v, reset, id ? "PUT" : "POST")} onRemove={(id) => remove(`/chief-guests/${id}`)} render={(item) => <><b>{item.name}</b><span>{item.designation} · {item.featured ? "Featured" : "Hidden"}</span></>} />}
        {tab === "delegations" && <Manage title="Add delegation" fields={emptyDelegation} items={data.delegations} onSave={(v, reset, id) => save(id ? `/delegations/${id}` : "/delegations", v, reset, id ? "PUT" : "POST")} onRemove={(id) => remove(`/delegations/${id}`)} render={(item) => <><b>{item.organization}</b><span>{item.contact_name} · {item.member_count} members · {item.status}</span></>} />}
      </motion.div></AnimatePresence>
    </div></motion.main>;
}

function Login({ onLogin, message, loading }) {
  const [keyValue, setKey] = useState("");
  const submit = () => {
    if (keyValue.trim() && !loading) onLogin(keyValue);
  };
  return <main className="grid min-h-screen place-items-center bg-[#071313] p-5 text-white"><div className="w-full max-w-md rounded-3xl bg-[#f4f1e9] p-8 text-[#071313]"><p className="text-xs font-black tracking-[.18em] text-[#ff5f3d]">STAFF ONLY</p><h1 className="mt-2 text-4xl font-black tracking-tight">Admin access</h1><p className="mt-3 text-sm text-black/65">Enter the event admin key. It is held only for this browser session.</p><input type="password" value={keyValue} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} className="mt-7 w-full rounded-xl border border-black/15 bg-white p-3" placeholder="Admin key" autoComplete="off" /><button type="button" onClick={submit} disabled={loading || !keyValue.trim()} className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#071313] p-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? <LoadingIndicator label="Checking…" className="text-white" /> : "Open dashboard"}</button>{message && <p className="mt-4 text-sm text-red-700">{message}</p>}</div></main>;
}
function Overview({ analytics, registrations }) { const cards = [["Riders", analytics.total_registrations], ["Approved", analytics.approved_registrations], ["Checked in", analytics.checked_in_registrations], ["Today", analytics.registrations_today], ["Delegates", analytics.delegation_members], ["Live offers", analytics.active_offers]]; return <section><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-black/50">{label}</p><p className="mt-2 text-4xl font-black">{value}</p></article>)}</div><div className="mt-7 grid gap-5 lg:grid-cols-2"><article className="rounded-2xl bg-[#d9ff38] p-6"><h2 className="font-black">Route mix</h2>{Object.entries(analytics.registrations_by_route).map(([route, count]) => <p key={route} className="mt-3 flex justify-between border-b border-black/15 pb-2"><span>{route}</span><b>{count} riders</b></p>)}</article><article className="rounded-2xl bg-white p-6"><h2 className="font-black">Latest registrations</h2>{registrations.slice(0, 5).map((r) => <p key={r.id} className="mt-3 flex justify-between text-sm"><span>{r.full_name} <i className="not-italic text-black/45">· {r.ride_category}</i></span><b>{r.status}</b></p>)}</article></div></section>; }
function Riders({ riders, adminKey, refresh }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [certificateFile, setCertificateFile] = useState(null);
  const [rosterFile, setRosterFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const selectedSet = new Set(selectedIds);
  const checkedInSelected = riders.filter((rider) => selectedSet.has(rider.id) && rider.status === "checked_in");
  const allSelected = riders.length > 0 && selectedIds.length === riders.length;
  const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAll = () => setSelectedIds(allSelected ? [] : riders.map((rider) => rider.id));
  const changeStatus = async (id, status) => {
    try {
      await adminRequest(`/registrations/${id}`, adminKey, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      refresh();
    } catch (error) { setActionMessage(error.message); }
  };
  const bulkSetStatus = async (status) => {
    if (!selectedIds.length) return;
    setBusy(true); setActionMessage("");
    try {
      const result = await adminRequest("/registrations/bulk-status", adminKey, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration_ids: selectedIds, status }) });
      setActionMessage(`${result.updated} participant${result.updated === 1 ? "" : "s"} marked ${status.replace("_", " ")}.`);
      setSelectedIds([]); refresh();
    } catch (error) { setActionMessage(error.message); }
    finally { setBusy(false); }
  };
  const sendCertificates = async () => {
    if (!certificateFile || !checkedInSelected.length) return;
    setBusy(true); setActionMessage("");
    try {
      const body = new FormData();
      body.append("registration_ids", JSON.stringify(checkedInSelected.map((rider) => rider.id)));
      body.append("certificate_file", certificateFile);
      const result = await adminRequest("/registrations/certificates", adminKey, { method: "POST", body });
      setActionMessage(`${result.queued} certificate${result.queued === 1 ? "" : "s"} queued. ${result.skipped + result.missing_ids.length} participant${result.skipped + result.missing_ids.length === 1 ? " was" : "s were"} skipped.`);
      setCertificateFile(null); setSelectedIds([]);
      document.getElementById("certificate-file").value = "";
    } catch (error) { setActionMessage(error.message); }
    finally { setBusy(false); }
  };
  const generateCertificates = async () => {
    if (!checkedInSelected.length) return;
    setBusy(true); setActionMessage("");
    try {
      const result = await adminRequest("/registrations/certificates/generate", adminKey, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(checkedInSelected.map((rider) => rider.id)) });
      setActionMessage(`${result.queued} personalized certificate${result.queued === 1 ? "" : "s"} generated and queued. ${result.skipped + result.missing_ids.length} participant${result.skipped + result.missing_ids.length === 1 ? " was" : "s were"} skipped.`);
      setSelectedIds([]);
    } catch (error) { setActionMessage(error.message); }
    finally { setBusy(false); }
  };
  const previewCertificate = async () => {
    if (checkedInSelected.length !== 1) return;
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) { setActionMessage("Allow pop-ups to preview the certificate."); return; }
    previewWindow.document.title = "Loading certificate preview…";
    try {
      const certificate = await adminDownload(`/registrations/${checkedInSelected[0].id}/certificate-preview`, adminKey);
      const url = URL.createObjectURL(certificate);
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { previewWindow.close(); setActionMessage(error.message); }
  };
  const matchRoster = async () => {
    if (!rosterFile) return;
    setBusy(true); setActionMessage("");
    try {
      const body = new FormData(); body.append("roster_file", rosterFile);
      const result = await adminRequest("/registrations/roster-match", adminKey, { method: "POST", body });
      setSelectedIds(result.matched_ids);
      setActionMessage(`${result.matched} participant${result.matched === 1 ? "" : "s"} matched from the roster. ${result.unmatched} row${result.unmatched === 1 ? " was" : "s were"} not found.`);
    } catch (error) { setActionMessage(error.message); }
    finally { setBusy(false); }
  };
  return <section className="overflow-x-auto rounded-2xl bg-white">
    <div className="grid gap-4 border-b border-black/10 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div><h2 className="text-xl font-black">Participant actions</h2><p className="mt-1 text-sm text-black/60">Upload a CSV, Excel, or text-based PDF attendance roster to select matching riders. Mark them checked in, preview one personalized certificate, then generate and send the approved batch.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="roster-file" className="cursor-pointer rounded-xl border border-black/20 px-4 py-3 text-xs font-bold">{rosterFile ? rosterFile.name : "Choose attendance roster"}</label>
        <input id="roster-file" type="file" accept=".csv,.xlsx,.pdf,application/pdf" className="sr-only" onChange={(event) => setRosterFile(event.target.files?.[0] || null)} />
        <button type="button" onClick={matchRoster} disabled={busy || !rosterFile} className="rounded-xl border border-black/20 px-4 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">Match roster</button>
        <button type="button" onClick={() => bulkSetStatus("approved")} disabled={busy || !selectedIds.length} className="rounded-xl border border-black/20 px-4 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">Approve selected ({selectedIds.length})</button>
        <button type="button" onClick={() => bulkSetStatus("checked_in")} disabled={busy || !selectedIds.length} className="rounded-xl bg-[#071313] px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Working…" : `Mark checked in (${selectedIds.length})`}</button>
        <button type="button" onClick={previewCertificate} disabled={busy || checkedInSelected.length !== 1} className="rounded-xl border border-[#071313] px-4 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">Preview selected certificate</button>
        <button type="button" onClick={generateCertificates} disabled={busy || !checkedInSelected.length} className="rounded-xl bg-[#d9ff38] px-4 py-3 text-xs font-bold text-[#071313] disabled:cursor-not-allowed disabled:opacity-40">Generate & send ({checkedInSelected.length})</button>
        <label htmlFor="certificate-file" className="cursor-pointer rounded-xl border border-black/20 px-4 py-3 text-xs font-bold">{certificateFile ? certificateFile.name : "Choose PDF certificate"}</label>
        <input id="certificate-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setCertificateFile(event.target.files?.[0] || null)} />
        <button type="button" onClick={sendCertificates} disabled={busy || !certificateFile || !checkedInSelected.length} className="rounded-xl bg-[#ff5f3d] px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Send to checked-in ({checkedInSelected.length})</button>
      </div>
      {actionMessage && <p className="text-sm text-black/70 lg:col-span-2" aria-live="polite">{actionMessage}</p>}
    </div>
    <table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b"><tr><th className="p-4"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all participants" /></th>{["Rider", "Contact", "Route", "City", "Gender", "T-shirt", "Status"].map((x) => <th key={x} className="p-4 text-xs uppercase tracking-wider">{x}</th>)}</tr></thead><tbody>{riders.map((r) => <tr className="border-b border-black/5" key={r.id}><td className="p-4"><input type="checkbox" checked={selectedSet.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.full_name}`} /></td><td className="p-4 font-bold">{r.full_name}</td><td className="p-4">{r.email}<br />{r.phone}</td><td className="p-4">{r.ride_category}</td><td className="p-4">{r.city}</td><td className="p-4">{r.gender}</td><td className="p-4">{r.t_shirt_size}</td><td className="p-4"><select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} className="rounded border p-2">{["pending", "approved", "checked_in", "cancelled"].map((x) => <option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table>
  </section>;
}
function Manage({ title, fields, items, onSave, onRemove, render }) { const [form, setForm] = useState(fields); const [editing, setEditing] = useState(null); const reset = () => { setForm(fields); setEditing(null); }; const submit = (e) => { e.preventDefault(); const normalized = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, k === "member_count" || k === "display_order" ? Number(v) : v])); onSave(normalized, reset, editing); }; return <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><form onSubmit={submit} className="rounded-2xl bg-white p-6"><h2 className="text-xl font-black">{editing ? `Edit ${title.toLowerCase()}` : title}</h2>{Object.entries(form).map(([name, value]) => <label key={name} className="mt-4 block text-xs font-black uppercase tracking-wider">{name.replaceAll("_", " ")}{typeof value === "boolean" ? <input className="ml-3 accent-[#ff5f3d]" type="checkbox" checked={value} onChange={(e) => setForm({ ...form, [name]: e.target.checked })} /> : name === "notes" || name === "bio" || name === "description" ? <textarea value={value} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="mt-1 min-h-20 w-full rounded border p-2 text-sm font-normal normal-case" /> : <input required={!["contact_email", "contact_phone", "code", "image_url"].includes(name)} type={typeof value === "number" ? "number" : "text"} value={value} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="mt-1 w-full rounded border p-2 text-sm font-normal normal-case" />}</label>)}<button className="mt-6 rounded-xl bg-[#071313] px-5 py-3 text-sm font-bold text-white">{editing ? "Update" : "Save"}</button>{editing && <button type="button" onClick={reset} className="ml-3 text-sm font-bold underline">Cancel</button>}</form><div className="space-y-3">{items.map((item) => <article key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5"><div className="grid gap-1 text-sm">{render(item)}</div><div className="flex gap-3"><button onClick={() => { setForm(Object.fromEntries(Object.entries(fields).map(([key, fallback]) => [key, item[key] ?? fallback]))); setEditing(item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-xs font-bold">Edit</button><button onClick={() => onRemove(item.id)} className="text-xs font-bold text-red-700">Remove</button></div></article>)}{!items.length && <p className="rounded-2xl border-2 border-dashed border-black/10 p-7 text-sm text-black/55">Nothing here yet.</p>}</div></section>; }
