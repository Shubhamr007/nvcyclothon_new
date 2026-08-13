import { RegistrationForm } from "../features/cyclothon/components/RegistrationForm";
import { EVENT, RIDE_OPTIONS } from "../features/cyclothon/constants";

export function RegisterPage() {
  const route = new URLSearchParams(window.location.search).get("route");
  const initialRoute = RIDE_OPTIONS.some((option) => option.distance === route)
    ? route
    : "60 Km Road Challenge";
  return (
    <main className="min-h-screen bg-[#071313] px-5 pb-20 pt-36 text-white">
      <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <aside>
          <p className="text-xs font-black tracking-[.2em] text-[#d9ff38] uppercase">
            Your next finish line
          </p>
          <h1 className="mt-5 text-6xl font-black leading-[.82] tracking-[-.1em] uppercase">
            Get
            <br />
            in the
            <br />
            <span className="text-[#ff5f3d]">ride.</span>
          </h1>
          <p className="mt-8 max-w-xs text-sm leading-6 text-white/65">
            Challenge riders receive a jersey, medal, bib, e-certificate,
            hydration, medical support and photography. Green Ride and Kid-o-thon
            each have their own event kit.
          </p>
          <div className="mt-9 border-l-2 border-[#d9ff38] pl-4 text-sm">
            <b>{EVENT.date}</b>
            <br />
            <span className="text-white/65">
              {EVENT.location} · {EVENT.startTime}
            </span>
          </div>
        </aside>
        <section
          aria-labelledby="registration-heading"
          className="rounded-2xl bg-[#f4f1e9] p-6 text-[#071313] md:p-10"
        >
          <RegistrationForm initialRoute={initialRoute} />
        </section>
      </div>
    </main>
  );
}
