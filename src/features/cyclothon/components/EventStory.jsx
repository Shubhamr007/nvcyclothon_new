import associationLogo from "../../../../assets/Rewa_District_Cycyling_Association.jpeg";
import rewaMap from "../../../../assets/rewa_map.png";

const gallery = [
  [
    "https://images.unsplash.com/photo-1530137073520-75bd0e0f1d7b?auto=format&fit=crop&w=1000&q=85",
    "Cyclists riding together on an open road",
  ],
  [
    "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1000&q=85",
    "Bicycle rider on a city road",
  ],
  [
    "https://images.unsplash.com/photo-1517654443271-8c8eb2e1474c?auto=format&fit=crop&w=1000&q=85",
    "Cyclist with a bicycle at sunrise",
  ],
];
export function Gallery() {
  return (
    <section
      aria-labelledby="gallery-heading"
      className="bg-[#f4f1e9] px-5 py-28 text-[#071313]"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black tracking-[.2em] text-[#ff5f3d] uppercase">
              The ride in motion
            </p>
            <h2
              id="gallery-heading"
              className="mt-4 text-5xl font-black tracking-[-.08em] uppercase md:text-7xl"
            >
              Made for
              <br />
              moments.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#071313]/70">
            A little preview of the early starts, open roads and finish-line
            energy waiting for you.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-[1.2fr_.8fr_.8fr]">
          {gallery.map(([src, alt], index) => (
            <figure
              key={src}
              className={`overflow-hidden rounded-2xl ${index === 0 ? "md:row-span-2" : ""}`}
            >
              <img
                loading="lazy"
                className="h-72 w-full object-cover transition duration-700 hover:scale-105 md:h-full"
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
    <section className="relative isolate overflow-hidden bg-[#d9ff38] px-5 py-28 text-[#071313]">
      <img src={rewaMap} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-60" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#d9ff38]/20" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1240px] gap-14 md:grid-cols-[.7fr_1.3fr]">
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
const sponsorOpportunities = [
  ["Title partner", "Lead the ride"],
  ["Hydration partner", "Keep riders moving"],
  ["Mobility partner", "Power safer streets"],
  ["Wellness partner", "Champion healthy lives"],
  ["Community partner", "Bring riders together"],
  ["Media partner", "Share every finish"],
];

export function PeopleAndSponsors() {
  return (
    <section
      aria-labelledby="people-heading"
      className="bg-[#071313] px-5 py-28 text-white"
    >
      <div className="mx-auto max-w-[1240px]">
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
          <div className="rounded-3xl border border-[#d9ff38]/35 bg-gradient-to-br from-[#d9ff38]/15 to-transparent p-7 md:p-9">
            <p className="text-xs font-black tracking-[.18em] text-[#d9ff38] uppercase">Official cycling association</p>
            <div className="mt-5 flex items-center gap-4">
              <img src={associationLogo} alt="Rewa District Cycling Association logo" className="h-16 w-16 shrink-0 rounded-full bg-white object-cover" />
              <div><h2 className="text-2xl font-black uppercase">Rewa District<br />Cycling Association</h2><p className="mt-1 text-sm text-white/65">Supporting a safer, stronger cycling community.</p></div>
            </div>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/75">NV Cyclothon 2026 is proudly organised in association with the Rewa District Cycling Association, bringing local riders, clubs and advocates together for a memorable day on two wheels.</p>
          </div>
          <div id="sponsors" className="md:col-span-2">
            <h2 className="text-5xl font-black leading-[.86] tracking-[-.08em] uppercase md:text-6xl">
              Sponsor
              <br />
              the ride.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/65">Put your brand at the heart of Rewa’s cycling community. Partnership opportunities are open now.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sponsorOpportunities.map(([partner, promise]) => (
                <div
                  key={partner}
                  className="grid min-h-24 place-items-center rounded-xl border border-white/15 p-3 text-center text-xs font-black tracking-wider text-white/60 uppercase"
                >
                  {partner}
                  <br />
                  <span className="mt-1 block normal-case tracking-normal text-[#d9ff38]">{promise}</span>
                </div>
              ))}
            </div>
            <a href="mailto:partners@nvcyclothon.in?subject=NV%20Cyclothon%20partnership" className="mt-6 inline-flex rounded-full bg-[#d9ff38] px-5 py-3 text-xs font-black tracking-wider text-[#071313] transition hover:-translate-y-1">Become a partner →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
