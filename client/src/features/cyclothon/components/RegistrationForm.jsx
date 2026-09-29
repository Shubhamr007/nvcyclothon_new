import { forwardRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Confetti from "react-confetti";
import { useReducedMotion } from "framer-motion";
import { request } from "../../../api/http";
import { openRazorpayCheckout } from "../../../api/razorpay";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { EVENT, RIDE_OPTIONS } from "../constants";
import { useSiteSettings } from "../../../state/SiteSettingsContext";

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
    setError,
    formState: { errors },
  } = useForm({ defaultValues: initialValues(initialRoute) });

  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");

  const reduceMotion = useReducedMotion();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const selectedRoute = watch("ride_category");
  const selectedRide =
    RIDE_OPTIONS.find((route) => route.distance === selectedRoute) || RIDE_OPTIONS[0];
  const enteredAge = Number(watch("age"));
  const isSeniorMasters = selectedRoute === "25 Km Senior Masters";
  const orgType = watch("organization_type");

  const submit = async (form) => {
    const ageNum = Number(form.age);
    if (form.ride_category === "25 Km Senior Masters" && ageNum < 50) {
      setError("age", {
        type: "manual",
        message: "Senior Masters Challenge is reserved for riders aged 50 and above.",
      });
      toast.error("Senior Masters Challenge is reserved for riders aged 50 and above.");
      return;
    }

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
        setPendingRegistration({ ...registration, payload });
        const completedRegistration = await openRazorpayCheckout({
          checkout: registration.checkout,
          registration: { ...registration, ...payload },
          verifyPayment: (payment) =>
            request(`/cyclothon/registrations/${registration.id}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payment),
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
      if (pendingRegistration?.checkout) {
        setStatus({
          state: "error",
          message: "Payment was not completed. You can retry payment below.",
        });
      } else {
        setStatus({ state: "error", message: error.message });
      }
      toast.error(error.message);
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

  if (settingsLoading || !settings.registration_open) {
    return (
      <section
        data-theme="dark"
        className="rounded-3xl bg-[#071313] p-8 text-white shadow-[10px_10px_0_#ff5f3d]"
        aria-live="polite"
      >
        <p className="text-xs font-black tracking-[.16em] text-[#d9ff38] uppercase">Registration</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">
          {settingsLoading ? "Checking availability…" : "Registration is closed."}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">
          {settingsLoading
            ? "Please wait while we confirm event availability."
            : "Thank you for your interest in NV Cyclothon. Please follow our official channels for the next opening."}
        </p>
      </section>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-black tracking-[.16em] text-[#ff5f3d] uppercase">
            {EVENT.name} 2026
          </p>
          <h2
            id="registration-heading"
            className="mt-2 text-4xl font-black tracking-[-.07em] uppercase"
          >
            Registration
          </h2>
        </div>
        <span className="text-xs font-bold">01 / 01</span>
      </div>

      {/* Rider Personal Information */}
      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
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
      <fieldset className="mt-7 rounded-2xl border border-[#071313]/15 bg-white/55 p-4 sm:mt-8 sm:p-5">
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
                className={`cursor-pointer rounded-xl border p-3 text-left transition focus-within:ring-2 focus-within:ring-[#ff5f3d] ${
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
        className="mt-8"
        aria-invalid={Boolean(errors.ride_category)}
        aria-describedby={errors.ride_category ? "ride-category-error" : undefined}
      >
        <legend className="mb-3 text-xs font-black tracking-[.15em] uppercase">
          Choose your race category
        </legend>
        <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 lg:grid-cols-3">
          {RIDE_OPTIONS.map((route) => {
            const isSelected = selectedRoute === route.distance;
            return (
              <label
                key={route.distance}
                className={`cursor-pointer rounded-xl border-2 p-3.5 text-center transition ${
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
                {route.minAge && (
                  <span className="mt-1 inline-block rounded bg-[#ff5f3d]/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#9f3126]">
                    Age 50+ only
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {errors.ride_category && (
          <FieldError id="ride-category-error" message={errors.ride_category.message} />
        )}
        {isSeniorMasters && enteredAge > 0 && enteredAge < 50 && (
          <p className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs font-bold text-red-800">
            ⚠️ Note: The Senior Masters category is reserved for riders aged 50 and above. Your entered age is {enteredAge}. Please select another category or update your age.
          </p>
        )}
      </fieldset>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#071313]/15 bg-white/60 p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <b className="block">
            {selectedRide.title}: {selectedRide.fee}
          </b>
          <span className="block text-xs text-[#071313]/65">
            {selectedRide.pricing}. Final fee is confirmed at secure checkout.
          </span>
        </div>
        <span className="self-start rounded-full bg-[#071313] px-3 py-1 text-[10px] font-black tracking-wider text-[#d9ff38] uppercase sm:self-auto">
          Razorpay
        </span>
      </div>

      {selectedRide.jersey ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label htmlFor="t-shirt" className="text-sm font-bold">
            Challenge jersey size
          </label>
          <select
            id="t-shirt"
            name="t_shirt_size"
            {...register("t_shirt_size")}
            className="border-b-2 border-[#071313] bg-transparent p-2 font-bold"
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
        I understand bicycle riding carries inherent risk and agree to the NV Cyclothon rider waiver.
      </ConsentCheckbox>

      <ConsentCheckbox
        name="privacy_accepted"
        {...register("privacy_accepted", { required: "Accept the privacy notice to continue" })}
        error={errors.privacy_accepted}
      >
        I have read the privacy notice and agree that NV Cyclothon may use my information only to
        manage this event and send essential rider updates.
      </ConsentCheckbox>

      <Button
        type="submit"
        size="lg"
        disabled={status.state === "loading"}
        className="mt-7 w-full disabled:cursor-wait"
      >
        {status.state === "loading" ? (
          <LoadingIndicator label="OPENING PAYMENT…" className="text-white" />
        ) : (
          "CONTINUE TO PAYMENT →"
        )}
      </Button>

      {status.state === "error" && pendingRegistration?.checkout && (
        <Button
          type="button"
          size="lg"
          className="mt-3 w-full border-2 border-[#ff5f3d] bg-transparent text-[#ff5f3d] hover:bg-[#ff5f3d] hover:text-white"
          onClick={async () => {
            setStatus({ state: "loading", message: "Reopening payment…" });
            try {
              const completedRegistration = await openRazorpayCheckout({
                checkout: pendingRegistration.checkout,
                registration: { ...pendingRegistration, ...pendingRegistration.payload },
                verifyPayment: (payment) =>
                  request(`/cyclothon/registrations/${pendingRegistration.id}/payment/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payment),
                  }),
              });
              setPendingRegistration(null);
              setStatus({
                state: "success",
                message: `You are registered. Your rider ID is #${completedRegistration.id}.`,
              });
              toast.success("Registration confirmed — see you on the road!");
            } catch (error) {
              setStatus({
                state: "error",
                message: "Payment was not completed. You can retry payment below.",
              });
              toast.error(error.message);
            }
          }}
        >
          RETRY PAYMENT →
        </Button>
      )}

      <p
        aria-live="polite"
        className={`mt-4 text-center text-xs ${status.state === "error" ? "text-red-700" : "text-[#071313]/65"}`}
      >
        {status.message}
      </p>
      <ErrorSummary errors={errors} />
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
          className="w-20 shrink-0 cursor-pointer truncate bg-transparent py-3 pr-1 text-sm font-bold text-[#071313] outline-none sm:w-24"
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
      <label className="flex gap-3 text-sm leading-5" htmlFor={id}>
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
        {children}
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
