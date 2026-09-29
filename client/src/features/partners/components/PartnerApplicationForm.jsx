import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Confetti from "react-confetti";
import { toast } from "react-toastify";
import {
  SPONSORSHIP_PACKAGES,
  PARTNERSHIP_TYPES,
  ACTIVATION_OPTIONS,
  VISIBILITY_OPTIONS,
  CONTACT_INFO,
} from "../constants";
import { submitPartnerApplication } from "../../../api/http";
import { uploadImage, isCloudinaryConfigured } from "../../../services/cloudinary";

const STEPS = [
  { id: 1, label: "01 Company", title: "Company Information" },
  { id: 2, label: "02 Partnership", title: "Partnership Selection" },
  { id: 3, label: "03 Brand", title: "Brand Assets & Identity" },
  { id: 4, label: "04 Activation", title: "Activation & Visibility" },
  { id: 5, label: "05 Review", title: "Review & Submission" },
];

const SESSION_STORAGE_KEY = "nv_partner_application_draft";

export function PartnerApplicationForm({ initialPackage = null }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: () => {
      try {
        const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
      return {
        company_name: "",
        business_type: "Corporate",
        contact_name: "",
        designation: "",
        phone: "",
        email: "",
        website: "",
        gst_number: "",
        pan_number: "",
        address: "",
        city: "",
        state: "Madhya Pradesh",
        pincode: "",
        selected_package: initialPackage?.name || "Title Sponsor",
        sponsorship_tier_id: initialPackage?.id || 1,
        partnership_type: "Cash Sponsorship",
        proposed_value: "",
        custom_description: "",
        brand_name: "",
        brand_tagline: "",
        brand_description: "",
        industry: "",
        instagram: "",
        facebook: "",
        youtube: "",
        linkedin: "",
        activation_options: [],
        activation_description: "",
        visibility_interests: [],
        accurate_info_consent: false,
        contact_consent: false,
      };
    },
  });

  const formValues = watch();

  // Keep package updated if changed from props
  useEffect(() => {
    if (initialPackage) {
      setValue("selected_package", initialPackage.name);
      setValue("sponsorship_tier_id", initialPackage.id);
    }
  }, [initialPackage, setValue]);

  // Persist form state in session storage
  useEffect(() => {
    try {
      const dataToSave = { ...formValues };
      delete dataToSave.logo;
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // ignore
    }
  }, [formValues]);

  const isCustomPackage = watch("selected_package") === "Custom Partnership";

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/svg+xml", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an SVG, PNG, JPG, or WebP logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo artwork must be under 5MB.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validateCurrentStep = async () => {
    if (step === 1) {
      return await trigger([
        "company_name",
        "business_type",
        "contact_name",
        "designation",
        "phone",
        "email",
        "address",
        "city",
        "state",
        "pincode",
      ]);
    }
    if (step === 2) {
      return await trigger(["selected_package", "partnership_type"]);
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: document.getElementById("partner-application")?.offsetTop - 100, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    if (!data.accurate_info_consent || !data.contact_consent) {
      toast.error("Please agree to both consent statements to proceed.");
      return;
    }

    setSubmitting(true);
    try {
      const socialLinks = {
        instagram: data.instagram || "",
        facebook: data.facebook || "",
        youtube: data.youtube || "",
        linkedin: data.linkedin || "",
      };

      let uploadedLogoUrl = null;
      if (logoFile) {
        if (isCloudinaryConfigured().configured) {
          const uploadRes = await uploadImage(logoFile, { folder: "nvcyclothon/partners" });
          uploadedLogoUrl = uploadRes.secureUrl;
        }
      }

      let result;
      // If Cloudinary uploaded or no logo file, send pure JSON without file to backend:
      if (uploadedLogoUrl || !logoFile) {
        const payload = {
          ...data,
          logo_url: uploadedLogoUrl,
          social_links: socialLinks,
          activation_options: data.activation_options || [],
          visibility_interests: data.visibility_interests || [],
        };
        result = await submitPartnerApplication(payload);
      } else {
        // Fallback to legacy FormData if Cloudinary is not configured
        const formData = new FormData();
        Object.entries(data).forEach(([key, val]) => {
          if (key === "activation_options" || key === "visibility_interests") {
            formData.append(key, JSON.stringify(val || []));
          } else if (["instagram", "facebook", "youtube", "linkedin"].includes(key)) {
            // Handled via social_links
          } else if (val !== null && val !== undefined) {
            formData.append(key, String(val));
          }
        });
        formData.append("social_links", JSON.stringify(socialLinks));
        formData.append("logo", logoFile);
        result = await submitPartnerApplication(formData);
      }

      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setSuccessData({
        referenceNumber: result.reference_number || result.application?.application_number,
        companyName: data.company_name,
        contactName: data.contact_name,
        packageName: data.selected_package,
      });
      toast.success("Partnership application submitted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to submit partner application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="relative mx-auto max-w-2xl rounded-2xl border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 text-center text-white sm:p-12">
        <Confetti numberOfPieces={200} recycle={false} />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9ff38] text-[#071313]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="mt-6 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
          YOU&apos;RE IN THE RIDE.
        </h3>

        <p className="mt-4 text-base leading-relaxed text-white/80">
          Thank you for your interest in partnering with NV Cyclothon 2026. Our partnership team will review your application and contact you regarding availability and next steps.
        </p>

        <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-6">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">Official Reference Number</span>
          <p className="mt-2 font-display text-2xl font-black text-[#d9ff38] sm:text-3xl">
            {successData.referenceNumber}
          </p>
          <p className="mt-2 text-xs text-white/60">
            Please preserve this reference for all future communication regarding your sponsorship.
          </p>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/60">
          Direct Liaison: <span className="text-white font-medium">{CONTACT_INFO.lead}</span>, {CONTACT_INFO.designation} <br />
          Phone: {CONTACT_INFO.phone} | Email: {CONTACT_INFO.email}
        </div>
      </div>
    );
  }

  return (
    <div id="partner-application" className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-white/[0.02] p-6 text-white sm:p-10 backdrop-blur-md">
      {/* Multi-step progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between overflow-x-auto pb-3 gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider transition ${
                step === s.id
                  ? "text-[#ff5f3d]"
                  : step > s.id
                  ? "text-[#d9ff38]"
                  : "text-white/40"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                  step === s.id
                    ? "bg-[#ff5f3d] text-[#071313]"
                    : step > s.id
                    ? "bg-[#d9ff38] text-[#071313]"
                    : "border border-white/20 text-white/50"
                }`}
              >
                {step > s.id ? "✓" : s.id}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-gradient-to-r from-[#ff5f3d] to-[#d9ff38] transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1: COMPANY */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                COMPANY INFORMATION
              </h3>
              <p className="mt-1 text-xs text-white/60">
                Primary corporate details and authorized contact person.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Company / Brand Name *
                </label>
                <input
                  type="text"
                  {...register("company_name", { required: "Company name is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="e.g. Vindhya Ventures Pvt. Ltd."
                />
                {errors.company_name && (
                  <p className="mt-1 text-xs text-[#ff5f3d]">{errors.company_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Business Type *
                </label>
                <select
                  {...register("business_type", { required: "Business type is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#071313] px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                >
                  <option value="Corporate">Corporate / Enterprise</option>
                  <option value="SME">SME / Regional Business</option>
                  <option value="Startup">Startup</option>
                  <option value="Healthcare / Fitness">Healthcare / Fitness Brand</option>
                  <option value="Financial Institution">Banking / Finance</option>
                  <option value="Educational Institution">Educational Institution</option>
                  <option value="Other">Other Organization</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Contact Person *
                </label>
                <input
                  type="text"
                  {...register("contact_name", { required: "Contact person is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="Full name"
                />
                {errors.contact_name && (
                  <p className="mt-1 text-xs text-[#ff5f3d]">{errors.contact_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Designation *
                </label>
                <input
                  type="text"
                  {...register("designation", { required: "Designation is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="e.g. Director, Marketing Head"
                />
                {errors.designation && (
                  <p className="mt-1 text-xs text-[#ff5f3d]">{errors.designation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  {...register("phone", {
                    required: "Mobile number is required",
                    pattern: {
                      value: /^(?:\+91[ -]?)?[6-9]\d{9}$/,
                      message: "Enter a valid 10-digit Indian phone number",
                    },
                  })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
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
                      message: "Enter a valid email address",
                    },
                  })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="director@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#ff5f3d]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Website
                </label>
                <input
                  type="url"
                  {...register("website")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="https://company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  GST Number
                </label>
                <input
                  type="text"
                  {...register("gst_number")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="23AAAAA0000A1Z5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  PAN
                </label>
                <input
                  type="text"
                  {...register("pan_number")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Business Address *
                </label>
                <textarea
                  rows={2}
                  {...register("address", { required: "Business address is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="Registered office address"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-[#ff5f3d]">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  City *
                </label>
                <input
                  type="text"
                  {...register("city", { required: "City is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="e.g. Rewa"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-[#ff5f3d]">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  State *
                </label>
                <input
                  type="text"
                  {...register("state", { required: "State is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="Madhya Pradesh"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Pincode *
                </label>
                <input
                  type="text"
                  {...register("pincode", { required: "Pincode is required" })}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="486001"
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs text-[#ff5f3d]">{errors.pincode.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PARTNERSHIP */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                PARTNERSHIP SELECTION
              </h3>
              <p className="mt-1 text-xs text-white/60">
                Choose from the official 6 packages or propose a tailored collaboration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Selected Partnership *
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {SPONSORSHIP_PACKAGES.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      watch("selected_package") === pkg.name
                        ? "border-[#ff5f3d] bg-white/[0.08]"
                        : "border-white/15 bg-white/[0.02] hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      value={pkg.name}
                      {...register("selected_package")}
                      onChange={() => {
                        setValue("selected_package", pkg.name);
                        setValue("sponsorship_tier_id", pkg.id);
                      }}
                      className="mt-1 text-[#ff5f3d] focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{pkg.name}</div>
                      <div className="text-xs font-black text-[#d9ff38] mt-0.5">{pkg.price}</div>
                      <div className="text-[11px] text-white/60 mt-1">{pkg.availability}</div>
                    </div>
                  </label>
                ))}

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    isCustomPackage
                      ? "border-[#ff5f3d] bg-white/[0.08]"
                      : "border-white/15 bg-white/[0.02] hover:border-white/30"
                  }`}
                >
                  <input
                    type="radio"
                    value="Custom Partnership"
                    {...register("selected_package")}
                    onChange={() => {
                      setValue("selected_package", "Custom Partnership");
                      setValue("sponsorship_tier_id", null);
                    }}
                    className="mt-1 text-[#ff5f3d] focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">Custom Partnership</div>
                    <div className="text-xs font-black text-[#d9ff38] mt-0.5">Flexible Terms</div>
                    <div className="text-[11px] text-white/60 mt-1">In-kind, hybrid or multi-year</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Partnership Type *
              </label>
              <select
                {...register("partnership_type")}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#071313] px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
              >
                {PARTNERSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {isCustomPackage && (
              <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    Proposed Partnership Concept
                  </label>
                  <input
                    type="text"
                    {...register("proposed_value")}
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                    placeholder="e.g. In-kind energy drinks supply + ₹50,000 cash"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={3}
                    {...register("custom_description")}
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                    placeholder="Detail your proposed partnership and deliverables"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: BRAND */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                BRAND INFORMATION & ASSETS
              </h3>
              <p className="mt-1 text-xs text-white/60">
                Provide brand copy and upload vector or high-resolution logo artwork.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Brand Name
                </label>
                <input
                  type="text"
                  {...register("brand_name")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="e.g. Vindhya Cycles"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  {...register("brand_tagline")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="e.g. Fueling Champions"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Brand Description
                </label>
                <textarea
                  rows={2}
                  {...register("brand_description")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="Short summary of what your brand does"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  {...register("industry")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="e.g. Sports Goods, Real Estate, Banking"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Instagram Handle / URL
                </label>
                <input
                  type="text"
                  {...register("instagram")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="@yourbrand or URL"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Facebook Page
                </label>
                <input
                  type="text"
                  {...register("facebook")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="facebook.com/yourbrand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  {...register("linkedin")}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                  placeholder="linkedin.com/company/yourbrand"
                />
              </div>
            </div>

            {/* Logo Upload Box */}
            <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d9ff38]">
                LOGO UPLOAD (SVG, PNG, JPG/JPEG)
              </label>
              <p className="mt-1 text-xs text-white/60">
                Prefer transparent background and high-resolution vector artwork. Max size: 5MB.
              </p>

              <input
                type="file"
                accept=".svg,.png,.jpg,.jpeg,.webp"
                onChange={handleLogoChange}
                className="mt-4 block w-full text-xs text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-[#ff5f3d] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-[#071313] hover:file:bg-[#ff5f3d]/90 cursor-pointer"
              />

              {logoPreview && (
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-white/60 mb-2">Logo Preview</span>
                  <div className="rounded-lg border border-white/20 bg-black/50 p-4">
                    <img src={logoPreview} alt="Logo preview" className="max-h-20 w-auto object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: ACTIVATION */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                BRAND ACTIVATION & VISIBILITY
              </h3>
              <p className="mt-1 text-xs text-white/60">
                Select your intended on-ground activations and preferred physical touchpoints.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                How would you like to activate your brand?
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {ACTIVATION_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 transition hover:border-white/30"
                  >
                    <input
                      type="checkbox"
                      value={opt}
                      {...register("activation_options")}
                      className="rounded text-[#ff5f3d] focus:ring-0"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Activation Description
              </label>
              <textarea
                rows={3}
                {...register("activation_description")}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#ff5f3d] focus:outline-none"
                placeholder="Share specific ideas for participant engagement, contests, or sampling."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                Visibility Touchpoints Interest
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {VISIBILITY_OPTIONS.map((touchpoint) => (
                  <label
                    key={touchpoint}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 transition hover:border-white/30"
                  >
                    <input
                      type="checkbox"
                      value={touchpoint}
                      {...register("visibility_interests")}
                      className="rounded text-[#d9ff38] focus:ring-0"
                    />
                    <span>{touchpoint}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                REVIEW & SUBMIT
              </h3>
              <p className="mt-1 text-xs text-white/60">
                Please verify your partnership application summary before submitting.
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-white/50 uppercase font-bold">Company / Brand</span>
                  <p className="font-bold text-white text-sm mt-0.5">{getValues("company_name") || "—"}</p>
                </div>
                <div>
                  <span className="text-white/50 uppercase font-bold">Contact Person</span>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {getValues("contact_name")} ({getValues("designation") || "N/A"})
                  </p>
                </div>
                <div>
                  <span className="text-white/50 uppercase font-bold">Phone & Email</span>
                  <p className="font-bold text-white mt-0.5">{getValues("phone")} | {getValues("email")}</p>
                </div>
                <div>
                  <span className="text-white/50 uppercase font-bold">Selected Package</span>
                  <p className="font-bold text-[#d9ff38] text-sm mt-0.5">{getValues("selected_package")}</p>
                </div>
              </div>

              <div>
                <span className="text-white/50 uppercase font-bold">Partnership Model</span>
                <p className="font-medium text-white mt-0.5">{getValues("partnership_type")}</p>
              </div>

              {logoFile && (
                <div>
                  <span className="text-white/50 uppercase font-bold">Uploaded Logo Artwork</span>
                  <p className="text-white mt-0.5">{logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)</p>
                </div>
              )}
            </div>

            {/* Consents */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("accurate_info_consent", { required: true })}
                  className="mt-0.5 rounded text-[#ff5f3d] focus:ring-0"
                />
                <span>I confirm that the information provided is accurate.</span>
              </label>

              <label className="flex items-start gap-3 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("contact_consent", { required: true })}
                  className="mt-0.5 rounded text-[#ff5f3d] focus:ring-0"
                />
                <span>
                  I agree to be contacted by the NV Cyclothon / RDCA team regarding sponsorship and partnership opportunities.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10"
            >
              &larr; BACK
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-[#ff5f3d] px-8 py-3 text-xs font-black uppercase tracking-wider text-[#071313] transition hover:bg-[#ff5f3d]/90 active:scale-95"
            >
              NEXT STEP &rarr;
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#d9ff38] px-8 py-3.5 text-xs font-black uppercase tracking-wider text-[#071313] transition hover:bg-[#d9ff38]/90 active:scale-95 disabled:opacity-50"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT PARTNERSHIP REQUEST"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
