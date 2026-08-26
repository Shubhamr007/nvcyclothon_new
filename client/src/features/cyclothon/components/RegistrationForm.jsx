import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Confetti from "react-confetti";
import { useReducedMotion } from "framer-motion";
import { request } from "../../../api/http";
import { openRazorpayCheckout } from "../../../api/razorpay";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { EVENT, RIDE_OPTIONS } from "../constants";
import { useSiteSettings } from "../../../state/SiteSettingsContext";

const initialValues = (route) => ({
  full_name: "",
  email: "",
  phone: "",
  age: "",
  city: "",
  gender: "",
  ride_category: route,
  emergency_contact: "",
  t_shirt_size: "M",
  waiver_accepted: false,
  privacy_accepted: false,
});

export function RegistrationForm({ initialRoute }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: initialValues(initialRoute) });
  const reduceMotion = useReducedMotion();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const selectedRoute = watch("ride_category");
  const selectedRide = RIDE_OPTIONS.find((route) => route.distance === selectedRoute) || RIDE_OPTIONS[0];
  const submit = async (form) => {
    setStatus({ state: "loading", message: "Securing your place…" });
    try {
      const registration = await request("/cyclothon/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const completedRegistration = registration.checkout
        ? await openRazorpayCheckout({
            checkout: registration.checkout,
            registration: { ...registration, ...form },
            verifyPayment: (payment) => request(`/cyclothon/registrations/${registration.id}/payment/verify`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment),
            }),
          })
        : registration;
      setStatus({
        state: "success",
        message: `You are registered. Your rider ID is #${completedRegistration.id}.`,
      });
      toast.success("Registration confirmed — see you on the road!");
    } catch (error) {
      setStatus({ state: "error", message: error.message });
      toast.error(error.message);
    }
  };
  if (status.state === "success") return <>{!reduceMotion && <Confetti aria-hidden="true" recycle={false} numberOfPieces={220} colors={["#d9ff38", "#ff5f3d", "#071313"]} />}<Success message={status.message} /></>;
  if (settingsLoading || !settings.registration_open) {
    return (
      <section className="rounded-3xl bg-[#071313] p-8 text-white shadow-[10px_10px_0_#ff5f3d]" aria-live="polite">
        <p className="text-xs font-black tracking-[.16em] text-[#d9ff38] uppercase">Registration</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">{settingsLoading ? "Checking availability…" : "Registration is closed."}</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">
          {settingsLoading
            ? "Please wait while we confirm event availability."
            : "Thank you for your interest in NV Cyclothon. Please follow our official channels for the next opening."}
        </p>
      </section>
    );
  }
  return (
    <form noValidate onSubmit={handleSubmit(submit)}>
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
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          name="full_name"
          {...register("full_name", { required: "Enter your full name", minLength: { value: 2, message: "Name must be at least 2 characters" } })}
          error={errors.full_name}
          minLength="2"
          maxLength="160"
          autoComplete="name"
        />
        <Field
          label="Email address"
          type="email"
          name="email"
          {...register("email", { required: "Enter your email", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } })}
          error={errors.email}
          maxLength="255"
          autoComplete="email"
        />
        <Field
          label="Phone number"
          type="tel"
          name="phone"
          {...register("phone", { required: "Enter your phone number", pattern: { value: /^(?:\+91[ -]?)?[6-9]\d{9}$/, message: "Enter a valid Indian mobile number" } })}
          error={errors.phone}
          pattern="(?:\+91[ -]?)?[6-9][0-9]{9}"
          maxLength="14"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 9876543210"
        />
        <Field
          label="Age"
          type="number"
          min="10"
          max="100"
          name="age"
          {...register("age", { required: "Enter your age", valueAsNumber: true, min: { value: 10, message: "You must be at least 10 years old" }, max: { value: 100, message: "Enter an age of 100 or below" } })}
          error={errors.age}
          autoComplete="off"
        />
        <Field label="City" {...register("city", { required: "Enter your city", minLength: { value: 2, message: "City must be at least 2 characters" } })} error={errors.city} minLength="2" maxLength="100" autoComplete="address-level2" />
        <label className="text-xs font-black tracking-[.1em] uppercase">
          Gender
          <select {...register("gender", { required: "Choose a gender category" })} aria-invalid={Boolean(errors.gender)} className={`mt-2 w-full border-b-2 bg-transparent py-2 text-sm font-medium normal-case outline-none transition focus:border-[#ff5f3d] ${errors.gender ? "border-red-600" : "border-[#071313]/25"}`}>
            <option value="" disabled>Select gender</option>
            <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
          </select>
          {errors.gender && <FieldError id="field-gender-error" message={errors.gender.message} />}
        </label>
        <Field
          label="Emergency contact"
          name="emergency_contact"
          {...register("emergency_contact", { required: "Enter an emergency contact number", pattern: { value: /^(?:\+91[ -]?)?[6-9]\d{9}$/, message: "Enter a valid Indian mobile number" } })}
          error={errors.emergency_contact}
          pattern="(?:\+91[ -]?)?[6-9][0-9]{9}"
          maxLength="14"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="+91 9876543210"
        />
      </div>
      <fieldset id="ride-category" className="mt-6" aria-invalid={Boolean(errors.ride_category)} aria-describedby={errors.ride_category ? "ride-category-error" : undefined}>
        <legend className="mb-3 text-xs font-black tracking-[.15em] uppercase">
          Choose your race category
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {RIDE_OPTIONS.map((route) => (
            <label
              key={route.distance}
              className={`cursor-pointer rounded-xl border-2 p-3 text-center transition ${errors.ride_category ? "border-red-600" : selectedRoute === route.distance ? "border-[#071313] bg-[#d9ff38]" : "border-[#071313]/15"}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="ride_category"
                value={route.distance}
                {...register("ride_category", { required: "Choose a bicycle route" })}
              />
              <b className="block text-xs">{route.distance}</b>
              <span className="mt-1 block text-[10px]">{route.fee}</span>
              <span className="block text-[9px] text-[#071313]/60">{route.capacity} spots</span>
            </label>
          ))}
        </div>
        {errors.ride_category && <FieldError id="ride-category-error" message={errors.ride_category.message} />}
      </fieldset>
      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#071313]/15 bg-white/60 p-4 text-sm">
        <div><b className="block">Registration fee: {selectedRide.fee}</b><span className="block text-xs text-[#071313]/65">{selectedRide.pricing}. Final fee is confirmed at secure checkout.</span></div>
        <span className="rounded-full bg-[#071313] px-3 py-1 text-[10px] font-black tracking-wider text-[#d9ff38] uppercase">Razorpay</span>
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
      ) : <input type="hidden" value="N/A" {...register("t_shirt_size")} />}
      <ConsentCheckbox
        name="waiver_accepted"
        {...register("waiver_accepted", { required: "Accept the rider waiver to continue" })}
        error={errors.waiver_accepted}
      >
        I understand bicycle riding carries inherent risk and agree to the NV
        Cyclothon rider waiver.
      </ConsentCheckbox>
      <ConsentCheckbox
        name="privacy_accepted"
        {...register("privacy_accepted", { required: "Accept the privacy notice to continue" })}
        error={errors.privacy_accepted}
      >
        I have read the privacy notice and agree that NV Cyclothon may use my
        information only to manage this event and send essential rider updates.
      </ConsentCheckbox>
      <button
        disabled={status.state === "loading"}
        className="mt-7 w-full rounded-full bg-[#071313] px-5 py-4 text-sm font-black tracking-wider text-white transition focus:outline-none focus:ring-4 focus:ring-[#ff5f3d] hover:bg-[#ff5f3d] disabled:cursor-wait disabled:opacity-60"
      >
        {status.state === "loading" ? <LoadingIndicator label="OPENING PAYMENT…" className="text-white" /> : "CONTINUE TO PAYMENT →"}
      </button>
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
const Field = forwardRef(function Field({ label, error, ...props }, ref) {
  const id = `field-${props.name}`;
  return (
    <label
      htmlFor={id}
      className="text-xs font-black tracking-[.1em] uppercase"
    >
      {label}
      <input
        id={id}
        ref={ref}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 w-full border-b-2 bg-transparent py-2 text-sm font-medium normal-case outline-none transition focus:border-[#ff5f3d] ${error ? "border-red-600" : "border-[#071313]/25"}`}
      />
      {error && <FieldError id={`${id}-error`} message={error.message} />}
    </label>
  );
});
const ConsentCheckbox = forwardRef(function ConsentCheckbox({ name, error, children, ...props }, ref) {
  const id = `field-${name}`;
  return (
    <div className="mt-4">
    <label className="flex gap-3 text-xs leading-5" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        name={name}
        ref={ref}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1 h-4 w-4 shrink-0 accent-[#ff5f3d] ${error ? "outline outline-2 outline-red-600" : ""}`}
      />
      {children}
    </label>
    {error && <FieldError id={`${id}-error`} message={error.message} />}
    </div>
  );
});
function FieldError({ id, message }) { return <span id={id} role="alert" className="mt-1 block text-xs font-medium normal-case tracking-normal text-red-700">{message}</span>; }
function ErrorSummary({ errors }) {
  const fields = Object.entries(errors);
  if (!fields.length) return null;
  const labels = { full_name: "Full name", email: "Email address", phone: "Phone number", age: "Age", city: "City", gender: "Gender", emergency_contact: "Emergency contact", ride_category: "Bicycle route", waiver_accepted: "Rider waiver", privacy_accepted: "Privacy notice" };
  const targets = { ride_category: "ride-category", waiver_accepted: "field-waiver_accepted", privacy_accepted: "field-privacy_accepted" };
  return <section role="alert" aria-labelledby="form-error-summary" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"><h3 id="form-error-summary" className="font-bold">Please correct the following:</h3><ul className="mt-2 list-disc pl-5">{fields.map(([name, error]) => <li key={name}><a className="underline" href={`#${targets[name] || `field-${name}`}`}>{labels[name] || name}: {error.message}</a></li>)}</ul></section>;
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
