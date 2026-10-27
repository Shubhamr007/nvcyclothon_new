import React, { useMemo, useState } from "react";
import { AdminSlideOver } from "./AdminSlideOver";
import { Button } from "../../../components/ui/button";

const vendorCategories = ["Cycling & Sports", "Food & Nutrition", "Hydration", "Healthcare", "Apparel", "Photography", "Media", "Equipment", "Logistics", "Printing", "Merchandise", "Technology", "Other"];

export function PartnerVendorCreateDrawer({ kind, isOpen, onClose, onCreate, busy = false }) {
  const isPartner = kind === "partner";
  const steps = useMemo(() => isPartner
    ? [
        { title: "Organization", fields: [["company_name", "Company name", true], ["brand_name", "Brand name"], ["business_type", "Business type"]] },
        { title: "Contact & address", fields: [["contact_name", "Contact person", true], ["designation", "Designation"], ["email", "Email", true, "email"], ["phone", "Phone (+91)", true], ["website", "Website", false, "url"], ["address", "Address"], ["city", "City"], ["state", "State"], ["pincode", "PIN code"]] },
        { title: "Partnership", fields: [["partnership_type", "Partnership type"], ["package_name", "Package / tier"], ["proposed_value", "Proposed value"], ["industry", "Industry"], ["custom_description", "Proposal details", false, "textarea"]] },
      ]
    : [
        { title: "Business", fields: [["business_name", "Business name", true], ["category", "Category", true, "select"], ["products_services", "Products / services", true, "textarea"]] },
        { title: "Contact & address", fields: [["representative_name", "Representative name", true], ["email", "Email", true, "email"], ["phone", "Phone (+91)", true], ["address", "Address", true], ["city", "City"], ["state", "State"], ["pincode", "PIN code"], ["gst_number", "GST number"], ["pan_number", "PAN number"]] },
        { title: "Stall & requirements", fields: [["description", "Business / stall description", true, "textarea"], ["space_requirement", "Space requirement"], ["staff_count", "Staff count", true, "number"]], checks: [["electricity_required", "Electricity required"], ["water_required", "Water required"], ["furniture_required", "Furniture required"], ["branding_support_required", "Branding support required"], ["vehicle_access_required", "Vehicle access required"]] },
      ], [isPartner]);

  const initial = isPartner
    ? { business_type: "Corporate", partnership_type: "Cash Sponsorship" }
    : { category: "Other", staff_count: "1" };
  const [values, setValues] = useState(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const advance = async () => {
    const current = steps[step];
    const missing = current.fields.find(([key, label, required]) => required && !String(values[key] || "").trim());
    if (missing) {
      setError(`${missing[1]} is required.`);
      return;
    }
    if (step < steps.length - 1) {
      setError("");
      setStep((value) => value + 1);
      return;
    }
    try {
      setError("");
      await onCreate?.(values);
      setValues(initial);
      setStep(0);
      onClose?.();
    } catch (err) {
      setError(err?.message || `Unable to add ${kind}.`);
    }
  };

  const close = () => {
    if (busy) return;
    setError("");
    setStep(0);
    setValues(initial);
    onClose?.();
  };

  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={close}
      title={`Add ${isPartner ? "partner" : "vendor"}`}
      subtitle={`Step ${step + 1} of ${steps.length} · ${steps[step].title}`}
      side="right"
      width="max-w-xl"
      bodyClassName="flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-6"
      footer={(
        <div className="flex w-full items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={close} disabled={busy} className="border-[#0078d4] text-[#005a9e] hover:bg-[#eff6fc]">Close</Button>
          <div className="flex gap-2">
            {step > 0 && <Button type="button" variant="outline" onClick={() => { setError(""); setStep((value) => value - 1); }} disabled={busy}>Back</Button>}
            <Button type="button" onClick={advance} disabled={busy} className="bg-[#0078d4] text-white hover:bg-[#106ebe]">
              {busy ? "Saving…" : step === steps.length - 1 ? `Add ${isPartner ? "partner" : "vendor"}` : "Save and continue"}
            </Button>
          </div>
        </div>
      )}
    >
      <div className="mb-6 flex gap-2" aria-label="Form progress">
        {steps.map((item, index) => <div key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#0078d4]" : "bg-slate-200"}`} />)}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <section className="space-y-4">
        {steps[step].fields.map(([key, label, required = false, type = "text"]) => (
          <label key={key} className="block space-y-1.5 text-sm font-medium text-slate-700">
            <span>{label}{required && <span className="text-red-600"> *</span>}</span>
            {type === "textarea" ? (
              <textarea value={values[key] || ""} onChange={(event) => update(key, event.target.value)} required={required} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20" />
            ) : type === "select" ? (
              <select value={values[key] || ""} onChange={(event) => update(key, event.target.value)} required={required} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0078d4]">{vendorCategories.map((category) => <option key={category}>{category}</option>)}</select>
            ) : (
              <input type={type} min={type === "number" ? 1 : undefined} value={values[key] || ""} onChange={(event) => update(key, event.target.value)} required={required} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20" />
            )}
          </label>
        ))}
        {steps[step].checks?.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{steps[step].checks.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(values[key])} onChange={(event) => update(key, event.target.checked)} className="h-4 w-4 accent-[#0078d4]" />{label}</label>)}</div>}
      </section>
      {step < steps.length - 1 && <p className="mt-5 text-xs text-slate-500">Your entries remain in this form as you continue. The record is created after the final step.</p>}
    </AdminSlideOver>
  );
}
