import associationLogo from "../../../../assets/Rewa_District_Cycyling_Association.jpeg";
import rewaMap from "../../../../assets/rewa_map.png";
import detailedHeroImage from "../../../../assets/detailed_hero_image.png";
import nvCyclothonHero from "../../../assets/nv-cyclothon-hero.webp";
import { EDITIONS, EVENT } from "../constants";
import { Reveal } from "../../../components/Reveal";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { request } from "../../../api/http";

const gallery = [
  [
    detailedHeroImage,
    "Cyclists riding together on an open road",
  ],
  [
    nvCyclothonHero,
    "Bicycle rider on a city road",
  ],
  [
    rewaMap,
    "Cyclist with a bicycle at sunrise",
  ],
];
export function Editions() {
  return (
    <section
      id="editions"
      aria-labelledby="editions-heading"
      className="bg-[#071313] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 text-white"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <p className="text-xs font-black tracking-[.28em] text-[#d9ff38] uppercase">
            {EVENT.editionLabel} · A tradition on two wheels
          </p>
          <h2
            id="editions-heading"
            className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-[-.06em] uppercase md:text-6xl"
          >
            Three years,<br />
            <span className="text-[#ff5f3d]">one movement.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-white/70">
            NV Cyclothon is not a one-off event. Every edition has grown the
            community, sharpened the routes, and put more riders on the road.
            2026 is our third edition — and the biggest yet.
          </p>
        </Reveal>
        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {EDITIONS.map((edition, index) => {
            const isCurrent = index === EDITIONS.length - 1;
            return (
              <Reveal key={edition.number} delay={index * 0.1} as="li">
                <article
                  className={`relative flex h-full flex-col rounded-3xl border p-7 transition ${
                    isCurrent
                      ? "border-[#d9ff38] bg-[#d9ff38] text-[#071313] shadow-[8px_8px_0_#ff5f3d]"
                      : "border-white/15 bg-white/[.03] text-white"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 right-6 rounded-full bg-[#ff5f3d] px-3 py-1 text-[10px] font-black tracking-[.18em] text-[#071313] uppercase">
                      You're in it
                    </span>
                  )}
                  <p
                    className={`text-[10px] font-black tracking-[.28em] uppercase ${
                      isCurrent ? "text-[#071313]/70" : "text-[#d9ff38]"
                    }`}
                  >
                    Edition {edition.number} · {edition.year}
                  </p>
                  <h3 className="mt-4 text-3xl font-black leading-[.95] tracking-[-.05em] uppercase">
                    {edition.tagline}
                  </h3>
                  <p
                    className={`mt-4 text-sm leading-6 ${
                      isCurrent ? "text-[#071313]/80" : "text-white/70"
                    }`}
                  >
                    {edition.caption}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function Gallery() {
  return (
    <section
      aria-labelledby="gallery-heading"
      className="accessible-light-surface bg-[#f4f1e9] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 text-[#071313]"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="max-w-2xl">
          <div>
            <p className="text-xs font-black tracking-[.2em] text-[#ff5f3d] uppercase">
              Official event gallery
            </p>
            <h2
              id="gallery-heading"
              className="mt-4 text-5xl font-black tracking-[-.08em] uppercase md:text-7xl"
            >
              See the
              <br />
              ride.
            </h2>
          </div>
          <p className="mt-6 max-w-sm text-sm leading-6 text-[#071313]/70">
            A preview of the routes, riders and race-day energy that make NV
            Cyclothon special.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:auto-rows-[16rem] md:grid-cols-[1.2fr_.8fr_.8fr]">
          {gallery.map(([src, alt], index) => (
            <figure
              key={src}
              className={`aspect-[4/3] overflow-hidden rounded-2xl bg-[#071313]/10 md:aspect-auto ${index === 0 ? "md:row-span-2" : ""}`}
            >
              <img
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
                src={src}
                alt={alt}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
export function WhySport() {
  const causes = [
    ["Ride for Vindhya", "Celebrate the strength, beauty and spirit of the Vindhya region."],
    ["Promote greenery", "Choose pedal power and help create cleaner, greener streets."],
    ["Health", "Make movement, confidence and wellbeing part of every day."],
    ["Women empowerment", "More women on two wheels. More freedom, confidence and power in every journey."],
    ["Road safety", "Build a culture where every rider and road user gets home safely."],
    ["Fitness", "Train with purpose, push your limits and enjoy the finish line."],
  ];
  return (
    <section className="accessible-light-surface relative isolate overflow-hidden bg-[#d9ff38] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 text-[#071313]">
      <img src={rewaMap} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-60" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#d9ff38]/20" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1400px] gap-14 md:grid-cols-[.7fr_1.3fr]">
        <p className="h-fit rounded-xl bg-[#f4f1e9]/90 px-4 py-3 text-xs font-black tracking-[.2em] shadow-[4px_4px_0_#071313] uppercase">
          Why we ride
        </p>
        <div>
          <h2 className="w-fit rounded-2xl bg-[#f4f1e9]/90 p-4 text-5xl font-black leading-[.86] tracking-[-.08em] shadow-[6px_6px_0_#071313] uppercase md:text-7xl">
            Ride with
            <br />
            purpose.
            <br />
            <span className="text-[#ff5f3d]">Finish with pride.</span>
          </h2>
          <p className="mt-6 w-fit rounded-lg bg-[#071313] px-4 py-3 text-xl font-black leading-7 uppercase text-[#d9ff38] shadow-[4px_4px_0_#ff5f3d]">Pedal with passion. Finish with pride.</p>
          <p className="mt-4 max-w-2xl rounded-xl bg-[#f4f1e9]/90 p-4 text-sm leading-6 text-[#071313] shadow-[4px_4px_0_#071313]">This is more than a race. It is a high-energy movement for a stronger Vindhya, safer streets and every rider ready to own their road.</p>
          <p className="mt-6 w-fit rounded-lg bg-[#f4f1e9]/90 px-4 py-3 text-[10px] font-black tracking-[.2em] text-[#071313] shadow-[4px_4px_0_#071313] uppercase">Land of the white tiger · Rewa rides with a fierce heart</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {causes.map(([title, copy], index) => (
              <article key={title} className="rounded-2xl border-2 border-[#071313] bg-[#f4f1e9]/90 p-5 shadow-[5px_5px_0_#071313] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#ff5f3d]">
                <span className="text-xs font-black tracking-[.18em] text-[#ff5f3d]">0{index + 1}</span>
                <h3 className="mt-4 text-xl font-black uppercase">{title}</h3>
                <p className="mt-3 text-sm leading-6">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function OrganizingMembers() {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const openerRef = useRef(null);

  useEffect(() => {
    request("/content/organizing-members")
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  useEffect(() => {
    if (!selectedMember) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeProfile();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedMember]);

  function openProfile(member, opener) {
    openerRef.current = opener;
    setSelectedMember(member);
  }

  function closeProfile() {
    setSelectedMember(null);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }

  if (!members.length) return null;
  return (
    <section className="accessible-light-surface bg-[#f4f1e9] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 text-[#071313]" aria-labelledby="members-heading">
      <div className="mx-auto max-w-[1400px]">
        <Reveal><p className="text-xs font-black tracking-[.2em] text-[#ff5f3d] uppercase">The people behind the ride</p><h2 id="members-heading" className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-[-.06em] uppercase md:text-6xl">Built by people<br /><span className="text-[#ff5f3d]">who show up.</span></h2><p className="mt-5 max-w-xl text-sm leading-6 text-[#071313]/70">Meet the people bringing NV Cyclothon to life.</p></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => (
            <Reveal key={member.id} delay={index * 0.06}>
              <article className="member-profile-card group relative h-full overflow-hidden rounded-3xl bg-[#071313] shadow-[6px_6px_0_#d9ff38]">
                {member.image_url ? (
                  <img src={member.image_url} alt={`Portrait of ${member.name}`} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="grid aspect-[4/5] w-full place-items-center bg-[#071313] text-5xl font-black text-[#d9ff38]" aria-label={`Profile image unavailable for ${member.name}`}>{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                )}
                <div className="member-profile-card__glass pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-2xl p-5 text-white">
                  <h3 className="text-2xl font-black leading-tight">{member.name}</h3>
                  <p className="mt-1 text-xs font-black tracking-[.12em] text-[#d9ff38] uppercase">{member.role}</p>
                  <span className="mt-4 inline-flex rounded-full border border-white/50 px-4 py-2 text-xs font-black">View profile</span>
                </div>
                <button type="button" onClick={(event) => openProfile(member, event.currentTarget)} className="absolute inset-0 z-20 rounded-3xl focus:outline-none focus:ring-4 focus:ring-[#d9ff38]" aria-label={`View profile for ${member.name}`} />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
      <MemberProfileDialog member={selectedMember} onClose={closeProfile} />
    </section>
  );
}

function MemberProfileDialog({ member, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [member]);

  return (
    <AnimatePresence>
      {member && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#071313]/75 px-5 py-8 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="member-profile-title" aria-describedby="member-profile-message" data-theme="dark" className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/30 bg-white/10 text-white shadow-[0_28px_100px_rgba(0,0,0,.5)] backdrop-blur-2xl" initial={{ opacity: 0, rotateX: -12, y: 36, scale: 0.94 }} animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }} exit={{ opacity: 0, rotateX: 8, y: 24, scale: 0.96 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} style={{ transformPerspective: 1200 }}>
            <div className="grid md:grid-cols-[.8fr_1.2fr]">
              {member.image_url ? <img src={member.image_url} alt={`Portrait of ${member.name}`} className="h-64 w-full object-cover md:h-full" /> : <div className="grid min-h-64 place-items-center bg-[#071313] text-5xl font-black text-[#d9ff38]" aria-hidden="true">{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>}
              <div className="relative p-7 md:p-9">
                <button ref={closeButtonRef} type="button" onClick={onClose} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/25 text-xl font-bold text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-[#d9ff38]" aria-label="Close profile">×</button>
                <p className="pr-12 text-xs font-black tracking-[.14em] text-[#d9ff38] uppercase">Organising team</p>
                <h3 id="member-profile-title" className="mt-4 text-4xl font-black leading-none tracking-[-.06em]">{member.name}</h3>
                <p className="mt-2 text-sm font-black tracking-[.1em] text-[#d9ff38] uppercase">{member.role}</p>
                <p id="member-profile-message" className="mt-7 text-base leading-7 text-white/80">{member.message}</p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


export function PeopleAndSponsors() {
  return (
    <section
      aria-labelledby="people-heading"
      className="bg-[#071313] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 text-white"
    >
      <div className="mx-auto max-w-[1400px]">
        <p className="text-xs font-black tracking-[.2em] text-[#d9ff38] uppercase">
          The people behind the peloton
        </p>
        <div className="mt-5 grid gap-12 md:grid-cols-2">
          <div>
            <h2
              id="people-heading"
              className="text-5xl font-black leading-[.86] tracking-[-.08em] uppercase md:text-6xl"
            >
              Meet our
              <br />
              chief guest.
            </h2>
            <div className="mt-8 flex items-center gap-5 rounded-2xl border border-white/15 p-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#ff5f3d] text-3xl font-black">
                NV
              </div>
              <div>
                <h3 className="text-xl font-black">To be announced</h3>
                <p className="mt-1 text-sm text-white/65">
                  A cycling and community leader will be revealed soon.
                </p>
              </div>
            </div>
          </div>
          <div data-theme="dark" className="rounded-3xl border border-[#d9ff38]/35 bg-[#0b2525] p-7 md:p-9">
            <p className="text-xs font-black tracking-[.18em] text-[#d9ff38] uppercase">Official cycling association</p>
            <div className="mt-5 flex items-center gap-4">
              <img src={associationLogo} alt="Rewa District Cycling Association logo" className="h-16 w-16 shrink-0 rounded-full bg-white object-cover" />
              <div><h2 className="text-2xl font-black uppercase">Rewa District<br />Cycling Association</h2><p className="mt-1 text-sm text-white">Supporting a safer, stronger cycling community.</p></div>
            </div>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white">NV Cyclothon 2026 is proudly organised in association with the Rewa District Cycling Association, bringing local riders, clubs and advocates together for a memorable day on two wheels.</p>
          </div>
          <div className="md:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[.22em] text-[#d9ff38]">
                Commercial Collaborations
              </span>
              <h3 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                Partner with NV Cyclothon
              </h3>
              <p className="text-sm leading-6 text-white/70">
                Put your brand at the heart of Central India's premier cycling event. Official sponsorship packages and commercial vendor stalls are now open for the 3rd Edition.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/partners"
                className="inline-flex items-center gap-2 rounded-full bg-[#d9ff38] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-[#071313] transition hover:scale-105"
              >
                Become a Partner →
              </a>
              <a
                href="/vendors"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10"
              >
                Vendor Expo Stalls →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
