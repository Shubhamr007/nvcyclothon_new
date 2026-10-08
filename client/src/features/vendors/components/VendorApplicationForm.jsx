import { useState } from "react";
import { useForm } from "react-hook-form";
import Confetti from "react-confetti";
import { toast } from "react-toastify";
import { VENDOR_CATEGORIES, VENDOR_DISCLAIMER } from "../constants";
import { submitVendorApplication } from "../../../api/http";
import { normalizeError } from "../../../utils/errorHandler";
import { ErrorAlert } from "../../../components/ErrorAlert";

export function VendorApplicationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [docFile, setDocFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      business_name: "",
      representative_name: "",
      phone: "",
      email: "",
      category: "Cycling & Sports",
      gst_number: "",
      pan_number: "",
      address: "",
      city: "",
      state: "Madhya Pradesh",
      pincode: "",
      products_services: "",
      description: "",
      space_requirement: "",
      electricity_required: false,
      water_required: false,
      furniture_required: false,
      branding_support_required: false,
      vehicle_access_required: false,
      staff_count: 2,
      accurate_info_consent: false,
    },
  });

  const handleDocChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Document file size must not exceed 10MB.");
      return;
    }
    setDocFile(file);
  };

  const onSubmit = async (data) => {
    if (!data.accurate_info_consent) {
      toast.error("Please confirm that the information provided is accurate.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          formData.append(key, String(val));
        }
      });

      if (docFile) {
        formData.append("document", docFile);
      }

      const result = await submitVendorApplication(formData);
      setSuccessData({
        referenceNumber: result.reference_number || result.application?.application_number,
        businessName: data.business_name,
        category: data.category,
      });
      toast.success("Vendor application submitted successfully!");
    } catch (err) {
      const appErr = normalizeError(err);
      setSubmitError(appErr);
      toast.error(appErr.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="relative mx-auto max-w-2xl rounded-2xl border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 text-center text-white sm:p-12">
        <Confetti numberOfPieces={150} recycle={false} />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9ff38] text-[#071313]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="mt-6 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
          APPLICATION RECEIVED
        </h3>

        <p className="mt-4 text-base leading-relaxed text-white/80">
          Thank you for your interest in becoming an NV Cyclothon event vendor. Our team will review your application and contact you regarding availability and next steps.
        </p>

        <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-6">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">Vendor Reference Number</span>
          <p className="mt-2 font-display text-2xl font-black text-[#d9ff38] sm:text-3xl">
            {successData.referenceNumber}
          </p>
          <p className="mt-2 text-xs text-white/60">
            Please quote this reference number during all operational and space allocation discussions.
          </p>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/60">
          {VENDOR_DISCLAIMER}
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-application" className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-white/[0.02] p-6 text-white sm:p-10 backdrop-blur-md">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
          BECOME A VENDOR
        </h2>
        <p className="mt-2 text-xs text-white/60 leading-relaxed">
          Submit your business details and race-day stall requirements below. Submitting does not guarantee acceptance; our operations team will evaluate each application.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* BUSINESS INFORMATION */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[.25em] text-[#d9ff38] mb-4">
            01. BUSINESS INFORMATION
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Business Name *
              </label>
              <input
                type="text"
                {...register("business_name", { required: "Business name is required" })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Business or store name"
              />
              {errors.business_name && (
                <p className="mt-1 text-xs text-[#ff5f3d]">{errors.business_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Owner / Representative *
              </label>
              <input
                type="text"
                {...register("representative_name", { required: "Representative name is required" })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Full name"
              />
              {errors.representative_name && (
                <p className="mt-1 text-xs text-[#ff5f3d]">{errors.representative_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Phone Number *
              </label>
              <input
                type="tel"
                {...register("phone", {
                  required: "Phone is required",
                  pattern: {
                    value: /^(?:\+91[ -]?)?[6-9]\d{9}$/,
                    message: "Valid 10-digit Indian mobile required",
                  },
                })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="+91 98765 43210"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-[#ff5f3d]">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Email Address *
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Valid email address required",
                  },
                })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="contact@business.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#ff5f3d]">{errors.email.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Business Category *
              </label>
              <select
                {...register("category", { required: "Please select a category" })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#071313] px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                GST Number
              </label>
              <input
                type="text"
                {...register("gst_number")}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Optional GSTIN"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                PAN Number
              </label>
              <input
                type="text"
                {...register("pan_number")}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Optional PAN"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Business Address *
              </label>
              <input
                type="text"
                {...register("address", { required: "Address is required" })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Shop / office street address"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-[#ff5f3d]">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                City
              </label>
              <input
                type="text"
                {...register("city")}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Rewa"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                State
              </label>
              <input
                type="text"
                {...register("state")}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Madhya Pradesh"
              />
            </div>
          </div>
        </div>

        {/* PRODUCT / SERVICE */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[.25em] text-[#d9ff38] mb-4">
            02. PRODUCT & SERVICE DETAILS
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Products / Services *
              </label>
              <input
                type="text"
                {...register("products_services", { required: "Products/services description required" })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="e.g. Energy bars, bicycle tubes, recovery shakes"
              />
              {errors.products_services && (
                <p className="mt-1 text-xs text-[#ff5f3d]">{errors.products_services.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Business Description *
              </label>
              <textarea
                rows={3}
                {...register("description", { required: "Business description required" })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="Tell us about your brand, products, and how you will serve race participants."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-[#ff5f3d]">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* EVENT REQUIREMENTS */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[.25em] text-[#d9ff38] mb-4">
            03. RACE-DAY EVENT REQUIREMENTS
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Expected Space Requirement
              </label>
              <input
                type="text"
                {...register("space_requirement")}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
                placeholder="e.g. 10x10 ft stall or tabletop setup"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                Operational Support Checklist
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("electricity_required")}
                    className="rounded text-[#d9ff38] focus:ring-0"
                  />
                  <span>Electricity Required (Power Socket)</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("water_required")}
                    className="rounded text-[#d9ff38] focus:ring-0"
                  />
                  <span>Water Supply Required</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("furniture_required")}
                    className="rounded text-[#d9ff38] focus:ring-0"
                  />
                  <span>Furniture Required (Tables / Chairs)</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("branding_support_required")}
                    className="rounded text-[#d9ff38] focus:ring-0"
                  />
                  <span>Branding Support Required</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("vehicle_access_required")}
                    className="rounded text-[#d9ff38] focus:ring-0"
                  />
                  <span>Vehicle Access Required for Unloading</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Number of On-Ground Staff
              </label>
              <input
                type="number"
                min={1}
                max={50}
                {...register("staff_count", { valueAsNumber: true })}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#d9ff38] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[.25em] text-[#d9ff38] mb-4">
            04. SUPPORTING DOCUMENTS
          </h3>
          <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/80">
              UPLOAD BUSINESS REGISTRATION / GST / SUPPORTING DOCUMENT
            </label>
            <p className="mt-1 text-xs text-white/50">
              Accepted formats: PDF, PNG, JPG, JPEG. Maximum file size: 10MB.
            </p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleDocChange}
              className="mt-4 block w-full text-xs text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-[#d9ff38] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-[#071313] hover:file:bg-[#d9ff38]/90 cursor-pointer"
            />
            {docFile && (
              <p className="mt-2 text-xs text-[#d9ff38]">
                Selected file: {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        {/* CONSENT & SUBMIT */}
        <div className="space-y-4 border-t border-white/10 pt-6">
          <label className="flex items-start gap-3 text-xs text-white/80 cursor-pointer">
            <input
              type="checkbox"
              {...register("accurate_info_consent", { required: true })}
              className="mt-0.5 rounded text-[#d9ff38] focus:ring-0"
            />
            <span>I confirm that the information provided is accurate.</span>
          </label>

          {submitError && (
            <ErrorAlert error={submitError} onDismiss={() => setSubmitError(null)} />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#d9ff38] py-4 text-xs font-black uppercase tracking-wider text-[#071313] transition hover:bg-[#d9ff38]/90 active:scale-95 disabled:opacity-50 shadow-lg shadow-[#d9ff38]/10"
          >
            {submitting ? "SUBMITTING VENDOR APPLICATION..." : "SUBMIT VENDOR APPLICATION"}
          </button>
        </div>
      </form>
    </div>
  );
}
