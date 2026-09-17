import { FaCheck, FaTrophy } from "react-icons/fa6";
import { useSiteSettings } from "../../../state/SiteSettingsContext";

export function RiderBenefits() {
  const { settings } = useSiteSettings();
  const prizePool = settings.prize_pool;
  const kit = settings.participant_kit;
  const showPrizes = prizePool?.enabled && (prizePool.total || prizePool.body || prizePool.prizes?.length);
  const showKit = kit?.enabled && (kit.body || kit.items?.length || kit.note);

  if (!showPrizes && !showKit) return null;

  return (
    <section aria-labelledby="rider-benefits-heading" className="bg-[#f4f1e9] px-5 py-24 text-[#071313]">
      <div className="mx-auto max-w-[1240px]">
        <h2 id="rider-benefits-heading" className="sr-only">Rider benefits</h2>
        <div className={`grid gap-6 ${showPrizes && showKit ? "lg:grid-cols-2" : "max-w-2xl"}`}>
          {showPrizes && <PrizePool prizePool={prizePool} />}
          {showKit && <ParticipantKit kit={kit} />}
        </div>
      </div>
    </section>
  );
}

function PrizePool({ prizePool }) {
  return (
    <article className="rounded-3xl bg-[#071313] p-7 text-white shadow-[8px_8px_0_#d9ff38] md:p-9">
      <p className="text-xs font-black tracking-[.18em] text-[#d9ff38] uppercase">{prizePool.eyebrow}</p>
      <div className="mt-5 flex items-start justify-between gap-5">
        <div>
          <h3 className="text-4xl font-black leading-none tracking-[-.06em] md:text-5xl">{prizePool.title}</h3>
          {prizePool.body && <p className="mt-4 max-w-lg text-sm leading-6 text-white/85">{prizePool.body}</p>}
        </div>
        <FaTrophy className="shrink-0 text-3xl text-[#d9ff38]" aria-hidden="true" />
      </div>
      {prizePool.total && <p className="mt-7 text-sm font-bold text-white/75">Total prize pool <span className="ml-2 text-2xl font-black text-[#d9ff38]">{prizePool.total}</span></p>}
      {prizePool.prizes?.length > 0 && (
        <dl className="mt-7 divide-y divide-white/15 border-y border-white/15">
          {prizePool.prizes.map((prize, index) => (
            <div key={`${prize.label}-${index}`} className="grid grid-cols-[1fr_auto] gap-x-4 py-4">
              <dt className="font-black">{prize.label}</dt>
              <dd className="font-black text-[#d9ff38]">{prize.amount}</dd>
              {prize.detail && <dd className="col-span-2 mt-1 text-sm text-white/75">{prize.detail}</dd>}
            </div>
          ))}
        </dl>
      )}
      {prizePool.terms && <p className="mt-5 text-xs leading-5 text-white/75">{prizePool.terms}</p>}
    </article>
  );
}

function ParticipantKit({ kit }) {
  return (
    <article className="rounded-3xl border-2 border-[#071313] bg-white p-7 shadow-[8px_8px_0_#ff5f3d] md:p-9">
      <p className="text-xs font-black tracking-[.18em] text-[#9f3126] uppercase">{kit.eyebrow}</p>
      <h3 className="mt-5 text-4xl font-black leading-none tracking-[-.06em] md:text-5xl">{kit.title}</h3>
      {kit.body && <p className="mt-4 max-w-lg text-sm leading-6 text-[#071313]/80">{kit.body}</p>}
      {kit.items?.length > 0 && (
        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {kit.items.map((item, index) => <li key={`${item}-${index}`} className="flex items-center gap-3 text-sm font-bold"><FaCheck className="shrink-0 text-[#9f3126]" aria-hidden="true" />{item}</li>)}
        </ul>
      )}
      {kit.note && <p className="mt-7 border-t border-[#071313]/15 pt-4 text-xs font-bold text-[#071313]/75">{kit.note}</p>}
    </article>
  );
}
