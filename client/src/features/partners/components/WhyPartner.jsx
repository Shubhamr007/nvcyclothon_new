import { Reveal } from "../../../components/Reveal";
import { WHY_PARTNER_CARDS } from "../constants";

export function WhyPartner() {
  return (
    <section className="relative border-b border-white/10 bg-[#071313] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[.25em] text-[#d9ff38]">
              VALUE PROPOSITION
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              WHY PARTNER WITH US
            </h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Partnering with NV Cyclothon connects your brand to an active, health-conscious audience and community leadership across Vindhya.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_PARTNER_CARDS.map((card) => (
              <div
                key={card.number}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:border-[#ff5f3d]/50 hover:bg-white/[0.06]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl font-black text-[#d9ff38]/60 group-hover:text-[#d9ff38]">
                      {card.number}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-white/20 transition group-hover:bg-[#ff5f3d]" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold uppercase leading-snug tracking-tight text-white">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    {card.subtitle}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-white/75">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
