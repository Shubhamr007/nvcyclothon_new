import { BicycleHero } from "../features/cyclothon/components/BicycleHero";
import { RideCards } from "../features/cyclothon/components/RideCards";
import {
  Editions,
  Gallery,
  PeopleAndSponsors,
  WhySport,
} from "../features/cyclothon/components/EventStory";
import { SocialProofAndExperience } from "../features/cyclothon/components/EventExperience";
import { EventUpdates } from "../features/cyclothon/components/EventUpdates";
import { CommunityWall } from "../features/cyclothon/components/CommunityWall";
import { RouteNavigator } from "../features/cyclothon/components/RouteNavigator";
import { Reveal } from "../components/Reveal";
import { useSiteSettings } from "../state/SiteSettingsContext";

export function HomePage() {
  const { settings } = useSiteSettings();
  const sections = settings.sections || {};
  return (
    <>
      <BicycleHero />
      {settings.feature_section?.enabled && <ManagedFeatureSection feature={settings.feature_section} />}
      <SocialProofAndExperience />
      {sections.editions !== false && <Editions />}
      {sections.about !== false && (
      <section id="about" className="bg-[#f4f1e9] px-5 py-28 text-[#071313]">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-10 md:grid-cols-[.6fr_1.4fr]">
            <Reveal>
              <p className="text-xs font-black tracking-[.2em] text-[#ff5f3d] uppercase">What we believe</p>
              <p className="mt-5 max-w-xs text-2xl font-black leading-[.95] tracking-[-.05em] uppercase">This is Rewa’s movement on two wheels.</p>
            </Reveal>
            <Reveal delay={0.1}>
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
            </Reveal>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            <Reveal delay={0}>
              <article className="rounded-2xl bg-[#071313] p-7 text-white shadow-[7px_7px_0_#ff5f3d]">
                <p className="text-[10px] font-black tracking-[.2em] text-[#d9ff38] uppercase">Our ambition</p>
                <h3 className="mt-5 text-3xl font-black leading-none tracking-[-.06em] uppercase">A cycling culture that moves Vindhya forward.</h3>
              </article>
            </Reveal>
            <Reveal delay={0.1}>
              <article className="rounded-2xl border-2 border-[#071313] bg-[#d9ff38] p-7 shadow-[7px_7px_0_#071313]">
                <p className="text-[10px] font-black tracking-[.2em] text-[#071313]/65 uppercase">Our promise</p>
                <h3 className="mt-5 text-3xl font-black leading-none tracking-[-.06em] uppercase">Every rider belongs—from first pedal to finish line.</h3>
              </article>
            </Reveal>
            <Reveal delay={0.2}>
              <article className="rounded-2xl border-2 border-[#071313] bg-white p-7 shadow-[7px_7px_0_#ff5f3d]">
                <p className="text-[10px] font-black tracking-[.2em] text-[#ff5f3d] uppercase">Our energy</p>
                <h3 className="mt-5 text-3xl font-black leading-none tracking-[-.06em] uppercase">Pedal with passion. Finish with pride.</h3>
              </article>
            </Reveal>
          </div>
          <Reveal>
            <div className="mt-14 flex flex-col justify-between gap-6 border-t-2 border-[#071313] pt-7 md:flex-row md:items-end">
              <p className="max-w-2xl text-sm leading-6 text-[#071313]/70">We ride to champion road safety, promote greenery, build fitness and health, and help more women feel powerful, visible and free on the road.</p>
              <a href="#routes" className="inline-flex shrink-0 rounded-full bg-[#ff5f3d] px-6 py-4 text-xs font-black tracking-wider text-white transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#071313]">Find your ride →</a>
            </div>
          </Reveal>
        </div>
      </section>
      )}
      {sections.routes !== false && <RideCards />}
      {sections.routes !== false && <RouteNavigator />}
      {sections.updates !== false && <EventUpdates />}
      {sections.gallery !== false && <Gallery />}
      {sections.why_sport !== false && <WhySport />}
      {sections.community !== false && <CommunityWall />}
      {sections.contact !== false && (
      <section id="contact" className="bg-[#071313] px-5 py-28 text-white">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <p className="text-xs font-black tracking-[.2em] text-[#d9ff38] uppercase">Point of contact</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-.06em] uppercase md:text-5xl">
              Find us <span className="text-[#ff5f3d]">here.</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <Reveal delay={0.1}>
              <div className="space-y-4">
                <p className="text-lg leading-8 text-white/75">
                  NV Cyclothon Office<br />
                  Rewa, Madhya Pradesh, India
                </p>
                <p className="text-sm text-white/60">
                  For queries, partnerships, and volunteering — reach out to us at the address above or through our social channels.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="overflow-hidden rounded-2xl shadow-lg">
                <iframe
                  title="NV Cyclothon Office Location"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=81.28%2C24.52%2C81.33%2C24.56&layer=mapnik&marker=24.5373%2C81.3042"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      )}
      {sections.sponsors !== false && <PeopleAndSponsors />}
    </>
  );
}

function ManagedFeatureSection({ feature }) {
  return (
    <section className="bg-[#ff5f3d] px-5 py-20 text-white">
      <div className="mx-auto grid max-w-[1240px] gap-8 md:grid-cols-[1fr_.9fr] md:items-center">
        <Reveal>
          {feature.eyebrow && <p className="text-xs font-black tracking-[.22em] text-[#071313] uppercase">{feature.eyebrow}</p>}
          {feature.title && <h2 className="mt-4 text-4xl font-black leading-none tracking-[-.05em] uppercase md:text-6xl">{feature.title}</h2>}
          {feature.body && <p className="mt-6 max-w-2xl text-base leading-7 text-white/85">{feature.body}</p>}
        </Reveal>
        {feature.image_url && <Reveal delay={0.1}><img src={feature.image_url} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[8px_8px_0_#071313]" loading="lazy" /></Reveal>}
      </div>
    </section>
  );
}
