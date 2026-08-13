import { BicycleHero } from "../features/cyclothon/components/BicycleHero";
import { RideCards } from "../features/cyclothon/components/RideCards";
import {
  Gallery,
  PeopleAndSponsors,
  WhySport,
} from "../features/cyclothon/components/EventStory";
import { SocialProofAndExperience } from "../features/cyclothon/components/EventExperience";
import { EventUpdates } from "../features/cyclothon/components/EventUpdates";

export function HomePage() {
  return (
    <>
      <BicycleHero />
      <SocialProofAndExperience />
      <section id="about" className="bg-[#f4f1e9] px-5 py-28 text-[#071313]">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-10 md:grid-cols-[.6fr_1.4fr]">
            <div>
              <p className="text-xs font-black tracking-[.2em] text-[#ff5f3d] uppercase">What we believe</p>
              <p className="mt-5 max-w-xs text-2xl font-black leading-[.95] tracking-[-.05em] uppercase">This is Rewa’s movement on two wheels.</p>
            </div>
            <div>
            <h2 className="max-w-2xl text-5xl font-black leading-[.88] tracking-[-.08em] uppercase md:text-7xl">
              More than
              <br />
              a race.
              <br />
              <span className="text-[#ff5f3d]">A reason to ride.</span>
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#071313]/75">
              NV Cyclothon brings Vindhya together to ride for healthier lives, greener streets and a more confident cycling culture. We believe a bicycle can build fitness, freedom and connection—one pedal stroke at a time.
            </p>
            </div>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-[#071313] p-7 text-white shadow-[7px_7px_0_#ff5f3d]">
              <p className="text-[10px] font-black tracking-[.2em] text-[#d9ff38] uppercase">Our ambition</p>
              <h3 className="mt-5 text-3xl font-black leading-none tracking-[-.06em] uppercase">A cycling culture that moves Vindhya forward.</h3>
            </article>
            <article className="rounded-2xl border-2 border-[#071313] bg-[#d9ff38] p-7 shadow-[7px_7px_0_#071313]">
              <p className="text-[10px] font-black tracking-[.2em] text-[#071313]/65 uppercase">Our promise</p>
              <h3 className="mt-5 text-3xl font-black leading-none tracking-[-.06em] uppercase">Every rider belongs—from first pedal to finish line.</h3>
            </article>
            <article className="rounded-2xl border-2 border-[#071313] bg-white p-7 shadow-[7px_7px_0_#ff5f3d]">
              <p className="text-[10px] font-black tracking-[.2em] text-[#ff5f3d] uppercase">Our energy</p>
              <h3 className="mt-5 text-3xl font-black leading-none tracking-[-.06em] uppercase">Pedal with passion. Finish with pride.</h3>
            </article>
          </div>
          <div className="mt-14 flex flex-col justify-between gap-6 border-t-2 border-[#071313] pt-7 md:flex-row md:items-end">
            <p className="max-w-2xl text-sm leading-6 text-[#071313]/70">We ride to champion road safety, promote greenery, build fitness and health, and help more women feel powerful, visible and free on the road.</p>
            <a href="#routes" className="inline-flex shrink-0 rounded-full bg-[#ff5f3d] px-6 py-4 text-xs font-black tracking-wider text-white transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#071313]">Find your ride →</a>
          </div>
        </div>
      </section>
      <RideCards />
      <EventUpdates />
      <Gallery />
      <WhySport />
      <PeopleAndSponsors />
    </>
  );
}
