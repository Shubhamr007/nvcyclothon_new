import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRegistrationFollowup, submitRegistrationFollowup } from "../api/http";

const EMPTY = {
  address_line1: "", address_line2: "", state: "", postal_code: "", emergency_contact: "",
  guardian_name: "", guardian_relationship: "", guardian_email: "", guardian_phone: "",
};

export function RegistrationDetailsPage() {
  const { token = "" } = useParams();
  const [participant, setParticipant] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    getRegistrationFollowup(token)
      .then(({ participant: record }) => {
        if (!active) return;
        setParticipant(record);
        setForm((current) => ({
          ...current,
          address_line1: record.address_line1 || "",
          address_line2: record.address_line2 || "",
          state: record.state || "",
          postal_code: record.postal_code || "",
          emergency_contact: record.emergency_contact || "",
          guardian_name: record.guardian_name || "",
          guardian_relationship: record.guardian_relationship || "",
          guardian_email: record.guardian_email || "",
          guardian_phone: record.guardian_phone || "",
        }));
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const setField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await submitRegistrationFollowup(token, form);
      setDone(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, options = {}) => (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      <input
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        name={name}
        value={form[name]}
        onChange={setField}
        required={options.required !== false}
        type={options.type || "text"}
        maxLength={options.maxLength || 200}
        autoComplete={options.autoComplete}
        inputMode={options.inputMode}
      />
    </label>
  );

  return (
    <main className="min-h-[75vh] bg-slate-100 px-4 py-10 text-slate-900 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.16em] text-orange-600">NV Cyclothon 2026</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Complete participant details</h1>
        {loading ? <p className="mt-5 text-sm text-slate-600">Loading secure form…</p> : null}
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
        {done && <div role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Thank you. Your details have been saved to your existing registration.</div>}
        {!loading && participant && !done && (
          <>
            <p className="mt-3 text-sm text-slate-600">Participant: <strong>{participant.full_name}</strong> · Age {participant.age} · Registration #{participant.id}</p>
            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {field("address_line1", "House / flat, building and street")}
                {field("address_line2", "Area or landmark", { required: false })}
                {field("state", "State / union territory")}
                {field("postal_code", "6-digit PIN code", { maxLength: 6, inputMode: "numeric" })}
                {field("emergency_contact", "Emergency contact mobile", { type: "tel", inputMode: "tel", maxLength: 32 })}
              </div>
              {Number(participant.age) < 18 && (
                <fieldset className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <legend className="px-1 font-bold">Parent / lawful guardian contact details</legend>
                  <p className="mb-4 text-xs leading-5 text-slate-600">These contact details do not record guardian consent. A parent or lawful guardian must confirm consent at event check-in.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("guardian_name", "Guardian full name")}
                    {field("guardian_relationship", "Relationship to participant")}
                    {field("guardian_email", "Guardian email", { type: "email" })}
                    {field("guardian_phone", "Guardian mobile", { type: "tel", inputMode: "tel", maxLength: 32 })}
                  </div>
                </fieldset>
              )}
              <p className="text-xs leading-5 text-slate-500">This secure link is one-time use. Submitted details update registration #{participant.id}; a second registration is not created.</p>
              <button disabled={saving} className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save participant details"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default RegistrationDetailsPage;
