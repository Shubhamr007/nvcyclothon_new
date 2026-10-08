import { RegistrationForm } from "../features/cyclothon/components/RegistrationForm";
import { EVENT, RIDE_OPTIONS } from "../features/cyclothon/constants";
import { formatEventDate, useSiteSettings } from "../state/SiteSettingsContext";
import cyclothonHero from "../assets/nv-cyclothon-hero.webp";

export function RegisterPage() {
  const { settings } = useSiteSettings();
  const route = new URLSearchParams(window.location.search).get("route");
  const initialRoute = RIDE_OPTIONS.some((option) => option.distance === route)
    ? route
    : "60 Km Road Challenge";
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#071313] px-3 pb-8 pt-[5.25rem] text-white sm:px-6 sm:pb-20 sm:pt-32 lg:px-8">
      <img
        src={cyclothonHero}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(7,19,19,.98)_0%,rgba(7,19,19,.92)_42%,rgba(7,19,19,.72)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(217,255,56,.18),transparent_25%),radial-gradient(circle_at_90%_75%,rgba(255,95,61,.2),transparent_30%)]" />

      <div className="mx-auto grid max-w-[1300px] gap-5 sm:gap-7 lg:grid-cols-[.78fr_1.22fr] lg:gap-12">
        <aside className="self-start rounded-2xl border border-white/10 bg-[#071313]/35 p-4 backdrop-blur-[2px] sm:border-0 sm:bg-transparent sm:p-2 lg:sticky lg:top-28">
          <p className="text-[11px] font-black tracking-[.22em] text-[#d9ff38] uppercase">
            Your next finish line
          </p>
          <h1 className="mt-3 text-[2.55rem] font-black leading-[.86] tracking-[-.06em] uppercase sm:mt-4 sm:text-6xl">
            Get <span className="text-white/65">in</span>
            <br />
            the <span className="text-[#ff5f3d]">ride.</span>
          </h1>
          <p className="mt-4 max-w-sm text-[13px] leading-5 text-white/75 sm:mt-7 sm:text-sm sm:leading-6">
            Challenge riders receive a jersey, medal, bib, e-certificate, hydration,
            medical support and photography. Every route has its own event kit.
          </p>
          <div className="mt-5 border-l-2 border-[#d9ff38] pl-3 text-[13px] leading-5 sm:mt-8 sm:pl-4 sm:text-sm sm:leading-normal">
            <b>{formatEventDate(settings.event_date) || EVENT.date}</b>
            <br />
            <span className="text-white/70">
              {settings.event_location || EVENT.location} · {settings.event_start_time || EVENT.startTime}
            </span>
          </div>
        </aside>
        <section
          aria-labelledby="registration-heading"
          className="rounded-2xl border border-white/15 bg-[#f4f1e9]/[.98] p-3.5 text-[#071313] shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6 md:p-9"
        >
          <RegistrationForm initialRoute={initialRoute} />
        </section>
      </div>
    </main>
  );
}
