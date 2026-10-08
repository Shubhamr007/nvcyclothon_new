import { forwardRef, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Confetti from "react-confetti";
import { useReducedMotion } from "framer-motion";
import { request } from "../../../api/http";
import { openCashfreeCheckout } from "../../../api/cashfree";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { EVENT, RIDE_OPTIONS } from "../constants";
import { useSiteSettings } from "../../../state/SiteSettingsContext";
import { PolicyModal } from "../../../components/PolicyModal";
import { ErrorAlert } from "../../../components/ErrorAlert";
import { normalizeError } from "../../../utils/errorHandler";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91", name: "India" },
  { code: "+1", label: "🇺🇸 +1", name: "USA / Canada" },
  { code: "+44", label: "🇬🇧 +44", name: "United Kingdom" },
  { code: "+971", label: "🇦🇪 +971", name: "UAE" },
  { code: "+65", label: "🇸🇬 +65", name: "Singapore" },
  { code: "+61", label: "🇦🇺 +61", name: "Australia" },
  { code: "+49", label: "🇩🇪 +49", name: "Germany" },
  { code: "+33", label: "🇫🇷 +33", name: "France" },
  { code: "+81", label: "🇯🇵 +81", name: "Japan" },
  { code: "+966", label: "🇸🇦 +966", name: "Saudi Arabia" },
  { code: "+977", label: "🇳🇵 +977", name: "Nepal" },
];

const initialValues = (route) => ({
  full_name: "",
  email: "",
  phone_raw: "",
  age: "",
  city: "",
  gender: "",
  ride_category: route,
  organization_type: "Individual",
  organization_name: "",
  t_shirt_size: "M",
  waiver_accepted: false,
  privacy_accepted: false,
});

const AFFILIATION_OPTIONS = [
  { value: "Individual", label: "Independent", description: "I am registering on my own" },
  { value: "School/College", label: "School / College", description: "Student or institution team" },
  { value: "Corporate", label: "Corporate", description: "Company or workplace team" },
  { value: "Cycling Club", label: "Cycling club", description: "Club or sports group" },
];

export function RegistrationForm({ initialRoute }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: initialValues(initialRoute) });

  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");

  const reduceMotion = useReducedMotion();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [status, setStatus] = useState({ state: "idle", message: "", error: null });
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const selectedRoute = watch("ride_category");
  const selectedRide =
    RIDE_OPTIONS.find((route) => route.distance === selectedRoute) || RIDE_OPTIONS[0];
  const requiresSafetyEquipment = ["60 Km Road Challenge", "30 Km MTB Challenge"].includes(selectedRoute);
  const orgType = watch("organization_type");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentMode = params.get("payment");
    const returnOrderId = params.get("order_id");

    if (paymentMode === "return" && returnOrderId) {
      setStatus({ state: "loading", message: "Verifying your payment with Cashfree…", error: null });
      request("/cyclothon/registrations/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: returnOrderId }),
      })
        .then((completedRegistration) => {
          setStatus({
            state: "success",
            message: `You are registered! Your rider ID is #${completedRegistration.id}.`,
            error: null,
          });
          toast.success("Payment verified and registration confirmed!");
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        })
        .catch((err) => {
          const normalized = normalizeError(err);
          setStatus({
            state: "error",
            error: normalized,
            message: normalized.message,
          });
          toast.error(normalized.message);
        });
    }
  }, []);

  const submit = async (form) => {
    let createdPendingRegistration = null;
    const ageNum = Number(form.age);
    const cleanPhone = String(form.phone_raw || "").trim().replace(/\D+/g, "");
    const fullPhone = `${phoneCountryCode}${cleanPhone}`;

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: fullPhone,
      // The API retains this as a safe fallback for existing event operations.
      // A separate emergency number is intentionally no longer required at signup.
      emergency_contact: fullPhone,
      age: ageNum,
      city: form.city,
      gender: form.gender,
      ride_category: form.ride_category,
      organization_type: form.organization_type || "Individual",
      organization_name:
        form.organization_type === "Individual" ? null : form.organization_name?.trim() || null,
      t_shirt_size: form.t_shirt_size || "N/A",
      waiver_accepted: Boolean(form.waiver_accepted),
      privacy_accepted: Boolean(form.privacy_accepted),
    };

    setStatus({ state: "loading", message: "Securing your place…" });
    try {
      const registration = await request("/cyclothon/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (registration.checkout) {
        createdPendingRegistration = { ...registration, payload };
        setPendingRegistration(createdPendingRegistration);
        const completedRegistration = await openCashfreeCheckout({
          checkout: registration.checkout,
          verifyPayment: () =>
            request(`/cyclothon/registrations/${registration.id}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_id: registration.checkout.order_id }),
            }),
        });
        setPendingRegistration(null);
        setStatus({
          state: "success",
          message: `You are registered. Your rider ID is #${completedRegistration.id}.`,
        });
      } else {
        setPendingRegistration(null);
        setStatus({
          state: "success",
          message: `You are registered. Your rider ID is #${registration.id}.`,
        });
      }
      toast.success("Registration confirmed — see you on the road!");
    } catch (error) {
      const normalized = normalizeError(error);
      if (createdPendingRegistration?.checkout) {
        setStatus({
          state: "error",
          error: normalized,
          message: "Payment was not completed. No registration has been confirmed. You can retry payment below.",
        });
      } else {
        setStatus({
          state: "error",
          error: normalized,
          message: normalized.message,
        });
      }
      toast.error(normalized.message);
    }
  };

  if (status.state === "success")
    return (
      <>
        {!reduceMotion && (
          <Confetti
            aria-hidden="true"
            recycle={false}
            numberOfPieces={220}
            colors={["#d9ff38", "#ff5f3d", "#071313"]}
          />
        )}
        <Success message={status.message} />
      </>
    );

  const [policyModal, setPolicyModal] = useState({ isOpen: false, tab: "refund" });

  if (settingsLoading || !settings.registration_open) {
    const tentativeDate =
      settings?.registration_tentative_date || "Upcoming Monday at 10:00 AM";
    return (
      <section
        data-theme="dark"
        className="rounded-3xl border border-white/10 bg-[#071313] p-8 text-white shadow-[10px_10px_0_#ff5f3d] sm:p-10"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#d9ff38] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#071313]">
            Next Slot Opening Soon
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/80">
            {EVENT.edition} · 22 Nov 2026
          </span>
        </div>

        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl uppercase">
          Registrations Opening Soon
        </h2>

        <div className="mt-5 rounded-2xl border border-[#ff5f3d]/30 bg-[#ff5f3d]/10 p-5">
          <p className="text-xs font-black tracking-wider uppercase text-[#ff5f3d]">
            Tentative Registration Window
          </p>
          <p className="mt-1 text-xl font-black text-white">
            📅 {tentativeDate}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/80">
            Wave 1 registrations and category allocations are currently in preparation. The next registration window for all ride categories (60K, 30K, 10K, and Kid-o-thon) will open at the tentative time above.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/#routes"
            className="flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-xs font-black tracking-wider uppercase text-white transition hover:bg-white/20 text-center"
          >
            Explore Routes & Categories →
          </a>
          <a
            href="/"
            className="flex items-center justify-center rounded-xl bg-[#d9ff38] px-5 py-3 text-xs font-black tracking-wider uppercase text-[#071313] transition hover:bg-[#c8ee27] text-center"
          >
            Back to Event Home
          </a>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">
          For emergency or group inquiries:{" "}
          <span className="font-bold text-white">Aman Mishra (Joint Secretary, RDCA)</span> — +91 88395 03099 | nvcyclothon@gmail.com
        </div>
      </section>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[.16em] text-[#ff5f3d] uppercase">
            {EVENT.name} 2026
          </p>
          <h2
            id="registration-heading"
            className="mt-1.5 text-3xl font-black tracking-[-.07em] uppercase sm:mt-2 sm:text-4xl"
          >
            Registration
          </h2>
        </div>
        <span className="mb-0.5 shrink-0 rounded-full border border-[#071313]/15 bg-white/60 px-2.5 py-1 text-[10px] font-black tracking-wider">01 / 01</span>
      </div>

      {/* Rider Personal Information */}
      <div className="mt-6 grid gap-x-4 gap-y-5 sm:mt-8 sm:grid-cols-2">
        <Field
          label="Full name"
          name="full_name"
          {...register("full_name", {
            required: "Enter your full name",
            minLength: { value: 2, message: "Name must be at least 2 characters" },
          })}
          error={errors.full_name}
          minLength="2"
          maxLength="160"
          autoComplete="name"
          placeholder="e.g. Rajesh Kumar"
        />

        <Field
          label="Email address"
          type="email"
          name="email"
          {...register("email", {
            required: "Enter your email",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Enter a valid email address (e.g. name@domain.com)",
            },
            validate: {
              noDisposable: (v) => {
                const domain = v.split("@")[1]?.toLowerCase();
                const blocked = [
                  "tempmail.com", "throwaway.email", "guerrillamail.com",
                  "mailinator.com", "yopmail.com", "trashmail.com",
                  "10minutemail.com", "fakeinbox.com", "sharklasers.com",
                  "guerrillamailblock.com", "grr.la", "dispostable.com",
                  "temp-mail.org", "tempail.com", "mohmal.com",
                ];
                return !blocked.includes(domain) || "Please use a permanent email address";
              },
            },
          })}
          error={errors.email}
          maxLength="255"
          autoComplete="email"
          placeholder="rajesh@example.com"
        />

        <PhoneField
          id="field-phone_raw"
          label="Phone number"
          countryCode={phoneCountryCode}
          onCountryCodeChange={setPhoneCountryCode}
          {...register("phone_raw", {
            required: "Enter your phone number",
            validate: (value) => {
              const clean = String(value).trim().replace(/\D+/g, "");
              if (phoneCountryCode === "+91") {
                if (!/^[6-9]\d{9}$/.test(clean))
                  return "Enter a valid 10-digit Indian mobile number starting with 6-9";
              } else {
                if (clean.length < 7 || clean.length > 14)
                  return "Enter a valid phone number (7–14 digits)";
              }
              return true;
            },
          })}
          error={errors.phone_raw}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={phoneCountryCode === "+91" ? "98765 43210" : "Phone number"}
        />

        <Field
          label="Age"
          type="number"
          min="10"
          max="100"
          name="age"
          {...register("age", {
            required: "Enter your age",
            valueAsNumber: true,
            min: { value: 10, message: "You must be at least 10 years old" },
            max: { value: 100, message: "Enter an age of 100 or below" },
            validate: (value) => {
              if (selectedRide.minAge && value < selectedRide.minAge) {
                return `${selectedRide.title} is open to riders aged ${selectedRide.minAge} and above`;
              }
              if (selectedRide.maxAge && value > selectedRide.maxAge) {
                return `${selectedRide.title} is for riders aged ${selectedRide.minAge}–${selectedRide.maxAge}`;
              }
              return true;
            },
          })}
          error={errors.age}
          autoComplete="off"
          placeholder="e.g. 28"
        />

        <Field
          label="City"
          {...register("city", {
            required: "Enter your city",
            minLength: { value: 2, message: "City must be at least 2 characters" },
          })}
          error={errors.city}
          minLength="2"
          maxLength="100"
          autoComplete="address-level2"
          placeholder="e.g. Rewa"
        />

        <label className="text-xs font-black tracking-[.1em] uppercase">
          Gender
          <select
            {...register("gender", { required: "Choose a gender category" })}
            aria-invalid={Boolean(errors.gender)}
            className={`mt-2 w-full border-b-2 bg-transparent py-3 text-base font-medium normal-case outline-none transition focus:border-[#ff5f3d] ${errors.gender ? "border-red-600" : "border-[#071313]/25"}`}
          >
            <option value="" disabled>
              Select gender
            </option>
            <option>Female</option>
            <option>Male</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
          </select>
          {errors.gender && <FieldError id="field-gender-error" message={errors.gender.message} />}
        </label>

      </div>

      {/* Organization / Affiliation Section */}
      <fieldset className="mt-7 rounded-2xl border border-[#071313]/15 bg-white/55 p-3.5 shadow-sm sm:mt-8 sm:p-5">
        <legend className="sr-only">Affiliation and representation</legend>
        <p className="text-xs font-black tracking-[.15em] text-[#ff5f3d] uppercase">
          Ride together, if you want
        </p>
        <h3 className="mt-1 text-base font-black tracking-tight sm:text-lg">
          Are you representing a group?
        </h3>
        <p className="mt-1 text-xs leading-5 text-[#071313]/70">
          This is optional. Pick Independent if you are not riding for a school, company, or club.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AFFILIATION_OPTIONS.map((option) => {
            const selected = orgType === option.value;
            return (
              <label
                key={option.value}
                className={`min-h-[6.5rem] cursor-pointer rounded-xl border p-2.5 text-left transition focus-within:ring-2 focus-within:ring-[#ff5f3d] sm:min-h-0 sm:p-3 ${
                  selected
                    ? "border-[#071313] bg-[#d9ff38] shadow-[2px_2px_0_#071313]"
                    : "border-[#071313]/15 bg-white hover:border-[#071313]/45"
                }`}
              >
                <input className="sr-only" type="radio" value={option.value} {...register("organization_type")} />
                <span className="block text-xs font-black leading-4">{option.label}</span>
                <span className="mt-1 block text-[10px] leading-4 text-[#071313]/65">{option.description}</span>
              </label>
            );
          })}
        </div>

        {orgType !== "Individual" && (
          <Field
            label="Organization / Institute name"
            name="organization_name"
            wrapperClassName="mt-4"
            placeholder={
              orgType === "School/College"
                ? "e.g. Rewa Engineering College / Model Science College"
                : orgType === "Corporate"
                  ? "e.g. Tata Consultancy Services / UltraTech"
                  : orgType === "Cycling Club"
                    ? "e.g. Vindhya Riders Club / Rewa Pedalers"
                    : "Optional: Team or club name"
            }
            {...register("organization_name", {
              required:
                orgType && orgType !== "Individual"
                  ? "Enter your organization or institute name"
                  : false,
              maxLength: { value: 200, message: "Maximum 200 characters" },
            })}
            error={errors.organization_name}
            maxLength="200"
            autoComplete="organization"
          />
        )}
      </fieldset>

      {/* Race Category Selection */}
      <fieldset
        id="ride-category"
        className="mt-7 sm:mt-8"
        aria-invalid={Boolean(errors.ride_category)}
        aria-describedby={errors.ride_category ? "ride-category-error" : undefined}
      >
        <legend className="mb-3 text-xs font-black tracking-[.15em] uppercase">
          Choose your race category
        </legend>
        <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 lg:grid-cols-3">
          {RIDE_OPTIONS.map((route) => {
            const isSelected = selectedRoute === route.distance;
            const ageRequirement = route.maxAge
              ? `Ages ${route.minAge}–${route.maxAge}`
              : route.minAge
                ? `Age ${route.minAge}+`
                : null;
            return (
              <label
                key={route.distance}
                className={`min-h-[7.5rem] cursor-pointer rounded-xl border-2 p-3.5 text-center transition sm:min-h-0 ${
                  errors.ride_category
                    ? "border-red-600"
                    : isSelected
                      ? "border-[#071313] bg-[#d9ff38] shadow-[3px_3px_0_#071313]"
                      : "border-[#071313]/15 hover:border-[#071313]/40 bg-white/40"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="ride_category"
                  value={route.distance}
                  {...register("ride_category", { required: "Choose a bicycle route" })}
                />
                <b className="block text-sm font-black">{route.title}</b>
                <span className="mt-0.5 block text-xs font-bold text-[#071313]/85">{route.length} · {route.fee}</span>
                <span className="block text-[10px] text-[#071313]/60">{route.capacity} spots</span>
                {ageRequirement && (
                  <span className="mt-1 inline-block rounded bg-[#ff5f3d]/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#9f3126]">
                    {ageRequirement}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {errors.ride_category && (
          <FieldError id="ride-category-error" message={errors.ride_category.message} />
        )}
      </fieldset>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#071313]/15 bg-white/60 p-3.5 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div>
          <b className="block">
            {selectedRide.title}: {selectedRide.fee}
          </b>
          <span className="block text-xs text-[#071313]/65">
            {selectedRide.pricing}. Final fee is confirmed at secure checkout.
          </span>
        </div>
        <span className="self-start rounded-full bg-[#071313] px-3 py-1 text-[10px] font-black tracking-wider text-[#d9ff38] uppercase sm:self-auto">
          Secured by Cashfree Payments
        </span>
      </div>

      {requiresSafetyEquipment && (
        <aside
          className="mt-4 rounded-2xl border-2 border-[#ff5f3d]/55 bg-[#ff5f3d]/10 p-4 shadow-sm sm:p-5"
          aria-label="Mandatory safety equipment notice"
        >
          <p className="text-xs font-black tracking-[.12em] text-[#9f3126] uppercase">
            ⚠ Mandatory safety equipment
          </p>
          <p className="mt-2 text-sm font-bold leading-5 text-[#071313]">
            {selectedRide.title} riders must arrive with a certified cycling helmet and all event-required safety equipment. Riders without the required equipment will not be permitted to start.
          </p>
          <p className="mt-2 text-xs leading-5 text-[#071313]/75">
            Please review the rider waiver and safety rules before continuing. The event team’s safety decision is final.
          </p>
        </aside>
      )}

      {selectedRoute === "Kid-o-thon" && (
        <aside
          className="mt-4 rounded-2xl border border-sky-300 bg-sky-50 p-4 text-[#071313] shadow-sm sm:p-5"
          aria-label="Kid-o-thon supervision notice"
        >
          <p className="text-xs font-black tracking-[.12em] text-sky-800 uppercase">
            Kid-o-thon: closed and monitored area
          </p>
          <p className="mt-2 text-sm font-bold leading-5">
            Kid-o-thon is for riders aged 10–13 and takes place in a closed, monitored riding area. A parent or legal guardian must accompany each child.
          </p>
        </aside>
      )}

      {selectedRide.jersey ? (
        <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
          <label htmlFor="t-shirt" className="text-sm font-bold">
            Challenge jersey size
          </label>
          <select
            id="t-shirt"
            name="t_shirt_size"
            {...register("t_shirt_size")}
            className="min-h-11 border-b-2 border-[#071313] bg-transparent px-2 py-2 font-bold"
          >
            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" value="N/A" {...register("t_shirt_size")} />
      )}

      <ConsentCheckbox
        name="waiver_accepted"
        {...register("waiver_accepted", { required: "Accept the rider waiver to continue" })}
        error={errors.waiver_accepted}
      >
        I understand bicycle riding carries inherent risk and agree to the{" "}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setPolicyModal({ isOpen: true, tab: "waiver" });
          }}
          className="font-bold underline text-[#ff5f3d] hover:text-[#d9492c]"
        >
          NV Cyclothon rider waiver
        </button>{" "}
        and safety rules (helmets compulsory).
      </ConsentCheckbox>

      {/* Strict Cancellation & No-Refund Policy Notice */}
      <div className="rounded-2xl border border-[#ff5f3d]/30 bg-[#ff5f3d]/10 p-3.5 text-xs text-[#071313] shadow-sm dark:text-white/90 sm:p-4">
        <p className="font-bold uppercase tracking-wider text-[#ff5f3d] text-[11px]">
          ⚠️ Strict Cancellation & Non-Refundable Policy
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-black/75 dark:text-white/75">
          Registration fees are <strong>strictly non-refundable and non-transferable</strong> under all circumstances, including absence/no-show on event day or event postponement. Read our{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setPolicyModal({ isOpen: true, tab: "refund" });
            }}
            className="font-bold underline text-[#ff5f3d] hover:text-[#d9492c]"
          >
            Cancellation & Refund Policy
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setPolicyModal({ isOpen: true, tab: "terms" });
            }}
            className="font-bold underline text-[#ff5f3d] hover:text-[#d9492c]"
          >
            Terms & Conditions
          </button>.
        </p>
      </div>

      <ConsentCheckbox
        name="privacy_accepted"
        {...register("privacy_accepted", { required: "Accept the privacy notice to continue" })}
        error={errors.privacy_accepted}
      >
        I have read the{" "}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setPolicyModal({ isOpen: true, tab: "privacy" });
          }}
          className="font-bold underline text-[#ff5f3d] hover:text-[#d9492c]"
        >
          privacy notice
        </button>{" "}
        and agree that NV Cyclothon may use my information only to manage this event and send essential rider updates.
      </ConsentCheckbox>

      <Button
        type="submit"
        size="lg"
        disabled={status.state === "loading"}
        className="mt-6 w-full disabled:cursor-wait sm:mt-7"
      >
        {status.state === "loading" ? (
          <LoadingIndicator label="OPENING PAYMENT…" className="text-white" />
        ) : (
          "CONTINUE TO SECURE PAYMENT →"
        )}
      </Button>

      {/* Sanitized User-Friendly Error Alert with Standard Error Code */}
      {status.state === "error" && (
        <ErrorAlert
          error={
            status.error || {
              code: "ERR_REGISTRATION_FAILED",
              title: "Registration Unsuccessful",
              message: status.message,
            }
          }
          onRetry={pendingRegistration?.checkout ? undefined : () => handleSubmit(submit)()}
          onDismiss={() => setStatus({ state: "idle", message: "", error: null })}
        />
      )}

      {status.state === "error" && pendingRegistration?.checkout && (
        <Button
          type="button"
          size="lg"
          className="mt-3 w-full border-2 border-[#ff5f3d] bg-transparent text-[#ff5f3d] hover:bg-[#ff5f3d] hover:text-white"
          onClick={async () => {
            setStatus({ state: "loading", message: "Reopening payment…", error: null });
            try {
              const completedRegistration = await openCashfreeCheckout({
                checkout: pendingRegistration.checkout,
                verifyPayment: () =>
                  request(`/cyclothon/registrations/${pendingRegistration.id}/payment/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order_id: pendingRegistration.checkout.order_id }),
                  }),
              });
              setPendingRegistration(null);
              setStatus({
                state: "success",
                message: `You are registered. Your rider ID is #${completedRegistration.id}.`,
                error: null,
              });
              toast.success("Registration confirmed — see you on the road!");
            } catch (error) {
              const normalized = normalizeError(error);
              setStatus({
                state: "error",
                error: normalized,
                message: "Payment was not completed. No registration has been confirmed. You can retry payment below.",
              });
              toast.error(normalized.message);
            }
          }}
        >
          RETRY PAYMENT →
        </Button>
      )}

      {status.state === "loading" && (
        <p aria-live="polite" className="mt-4 text-center text-xs text-[#071313]/65">
          {status.message}
        </p>
      )}
      <ErrorSummary errors={errors} />

      <PolicyModal
        isOpen={policyModal.isOpen}
        onClose={() => setPolicyModal({ isOpen: false, tab: "refund" })}
        initialTab={policyModal.tab}
      />
    </form>
  );
}

const PhoneField = forwardRef(function PhoneField(
  { label, countryCode, onCountryCodeChange, error, id, ...props },
  ref
) {
  return (
    <label htmlFor={id} className="text-xs font-black tracking-[.1em] uppercase">
      {label}
      <div
        className={`mt-2 flex items-center border-b-2 bg-transparent transition focus-within:border-[#ff5f3d] ${
          error ? "border-red-600" : "border-[#071313]/25"
        }`}
      >
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          aria-label="Country calling code"
          className="w-[4.75rem] shrink-0 cursor-pointer truncate bg-transparent py-3 pr-1 text-sm font-bold text-[#071313] outline-none sm:w-24"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code} className="bg-white py-1 text-[#071313]">
              {c.label} ({c.name})
            </option>
          ))}
        </select>
        <span className="mr-2 text-[#071313]/30">|</span>
        <input
          id={id}
          ref={ref}
          {...props}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full bg-transparent py-3 text-base font-medium normal-case outline-none"
        />
      </div>
      {error && <FieldError id={`${id}-error`} message={error.message} />}
    </label>
  );
});

const Field = forwardRef(function Field({ label, error, wrapperClassName = "", ...props }, ref) {
  const id = `field-${props.name}`;
  return (
    <label htmlFor={id} className={`block text-xs font-black tracking-[.1em] uppercase ${wrapperClassName}`}>
      {label}
      <Input
        id={id}
        ref={ref}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={error ? "border-red-600" : undefined}
      />
      {error && <FieldError id={`${id}-error`} message={error.message} />}
    </label>
  );
});

const ConsentCheckbox = forwardRef(function ConsentCheckbox(
  { name, error, children, ...props },
  ref
) {
  const id = `field-${name}`;
  return (
    <div className="mt-4">
      <label className="flex items-start gap-3 text-[13px] leading-5 sm:text-sm" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          name={name}
          ref={ref}
          {...props}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`mt-0.5 h-5 w-5 shrink-0 accent-[#ff5f3d] ${
            error ? "outline outline-2 outline-red-600" : ""
          }`}
        />
        <span className="min-w-0 flex-1">
          {children}
        </span>
      </label>
      {error && <FieldError id={`${id}-error`} message={error.message} />}
    </div>
  );
});

function FieldError({ id, message }) {
  return (
    <span id={id} role="alert" className="mt-1 block text-xs font-medium normal-case tracking-normal text-red-700">
      {message}
    </span>
  );
}

function ErrorSummary({ errors }) {
  const fields = Object.entries(errors);
  if (!fields.length) return null;
  const labels = {
    full_name: "Full name",
    email: "Email address",
    phone_raw: "Phone number",
    age: "Age",
    city: "City",
    gender: "Gender",
    ride_category: "Bicycle route",
    organization_name: "Organization / Institute name",
    waiver_accepted: "Rider waiver",
    privacy_accepted: "Privacy notice",
  };
  const targets = {
    ride_category: "ride-category",
    phone_raw: "field-phone_raw",
    waiver_accepted: "field-waiver_accepted",
    privacy_accepted: "field-privacy_accepted",
  };
  return (
    <section
      role="alert"
      aria-labelledby="form-error-summary"
      className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
    >
      <h3 id="form-error-summary" className="font-bold">
        Please correct the following:
      </h3>
      <ul className="mt-2 list-disc pl-5">
        {fields.map(([name, error]) => (
          <li key={name}>
            <a className="underline" href={`#${targets[name] || `field-${name}`}`}>
              {labels[name] || name}: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Success({ message }) {
  return (
    <div className="grid min-h-[480px] place-items-center text-center">
      <div>
        <span className="inline-grid h-16 w-16 place-items-center rounded-full bg-[#d9ff38] text-3xl">
          ✓
        </span>
        <h2 className="mt-6 text-5xl font-black leading-none tracking-[-.08em] uppercase">
          You're
          <br />
          on the list.
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-6">
          {message} Look out for a confirmation email with your rider guide.
        </p>
        <a
          className="mt-8 inline-block rounded-full bg-[#071313] px-6 py-3 text-xs font-black text-white"
          href="/"
        >
          Back to the ride
        </a>
      </div>
    </div>
  );
}
