import React from "react";
import { MessageSquare, ShieldCheck } from "lucide-react";

export const COUNTRY_CODES = [
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

export function WhatsAppPreferencesSection({
  register,
  watch,
  errors,
  whatsappCountryCode,
  setWhatsappCountryCode,
  primaryPhone = "",
}) {
  const usePrimary = watch("whatsapp_use_primary");
  const optIn = watch("whatsapp_opt_in");

  return (
    <div className="mt-7 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 p-4 shadow-sm sm:mt-8 sm:p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-950 sm:text-base">
            WhatsApp Event Updates & Notifications
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-700">
            NV Cyclothon uses WhatsApp to send real-time race-day schedules,
            bib allotment details, route advisories, and emergency updates.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4 pt-3 border-t border-emerald-500/20">
        {/* Opt-in Consent */}
        <label
          htmlFor="field-whatsapp_opt_in"
          className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm font-bold text-slate-900"
        >
          <input
            id="field-whatsapp_opt_in"
            type="checkbox"
            {...register("whatsapp_opt_in")}
            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600 cursor-pointer"
          />
          <div>
            <span>Receive official race-day updates and notifications on WhatsApp</span>
            <span className="block text-[11px] font-normal text-slate-600 mt-0.5">
              We respect your privacy and only send crucial event notifications.
            </span>
          </div>
        </label>

        {optIn && (
          <div className="pl-7 space-y-3 pt-1">
            {/* Use primary number checkbox */}
            <label
              htmlFor="field-whatsapp_use_primary"
              className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-800"
            >
              <input
                id="field-whatsapp_use_primary"
                type="checkbox"
                {...register("whatsapp_use_primary")}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600 cursor-pointer"
              />
              <div>
                <span>Use my primary mobile number for WhatsApp event updates</span>
                {usePrimary && primaryPhone && (
                  <span className="block text-[11px] font-mono text-emerald-800 mt-0.5">
                    Will send to: <strong>{primaryPhone}</strong>
                  </span>
                )}
              </div>
            </label>

            {/* Alternate number input */}
            {!usePrimary && (
              <div className="mt-2 rounded-xl bg-white p-3.5 border border-emerald-300 shadow-xs space-y-2 animate-in fade-in duration-200">
                <label
                  htmlFor="field-whatsapp_number"
                  className="block text-xs font-black tracking-wider text-slate-900 uppercase"
                >
                  Alternate WhatsApp Number
                </label>
                <div
                  className={`flex items-center border-b-2 bg-transparent transition focus-within:border-emerald-600 ${
                    errors.whatsapp_phone_raw
                      ? "border-red-600"
                      : "border-slate-300"
                  }`}
                >
                  <select
                    value={whatsappCountryCode}
                    onChange={(e) => setWhatsappCountryCode(e.target.value)}
                    aria-label="WhatsApp country code"
                    className="w-[4.75rem] shrink-0 cursor-pointer truncate bg-transparent py-2.5 pr-1 text-sm font-bold text-slate-900 outline-none sm:w-24"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label} ({c.name})
                      </option>
                    ))}
                  </select>
                  <span className="mr-2 text-slate-400">|</span>
                  <input
                    id="field-whatsapp_number"
                    type="tel"
                    inputMode="tel"
                    placeholder={
                      whatsappCountryCode === "+91"
                        ? "98765 43210"
                        : "WhatsApp phone number"
                    }
                    {...register("whatsapp_phone_raw", {
                      validate: (value) => {
                        if (usePrimary) return true;
                        const clean = String(value || "")
                          .trim()
                          .replace(/\D+/g, "");
                        if (!clean) return "Enter your alternate WhatsApp number";
                        if (whatsappCountryCode === "+91") {
                          if (!/^[6-9]\d{9}$/.test(clean)) {
                            return "Enter a valid 10-digit Indian mobile number starting with 6-9";
                          }
                        } else {
                          if (clean.length < 7 || clean.length > 14) {
                            return "Enter a valid mobile number (7–14 digits)";
                          }
                        }
                        return true;
                      },
                    })}
                    className="w-full bg-transparent py-2.5 text-sm font-medium text-slate-900 outline-none"
                  />
                </div>
                {errors.whatsapp_phone_raw && (
                  <span
                    role="alert"
                    className="block text-xs font-medium text-red-700"
                  >
                    {errors.whatsapp_phone_raw.message}
                  </span>
                )}
                <span className="block text-[11px] text-slate-500">
                  Provide the active WhatsApp mobile number you will have with you on race day.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-800/90 font-medium pt-2 border-t border-emerald-500/15">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
        <span>Consent is recorded securely and can be managed anytime.</span>
      </div>
    </div>
  );
}

export default WhatsAppPreferencesSection;
