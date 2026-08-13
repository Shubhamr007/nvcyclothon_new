import { useEffect, useState } from "react";
import { request } from "../../../api/http";

export function EventUpdates() {
  const [content, setContent] = useState({ offers: [], guests: [] });
  useEffect(() => {
    Promise.all([request("/content/offers"), request("/content/chief-guests")])
      .then(([offers, guests]) => setContent({ offers, guests }))
      .catch(() => {});
  }, []);
  if (!content.offers.length && !content.guests.length) return null;
  return (
    <section className="bg-[#071313] px-5 py-20 text-white">
      <div className="mx-auto max-w-[1240px]">
        {content.offers.length > 0 && (
          <div>
            <p className="text-xs font-black tracking-[.2em] text-[#d9ff38] uppercase">
              Event offers
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {content.offers.map((offer) => (
                <article
                  key={offer.id}
                  className="rounded-2xl bg-white p-6 text-[#071313]"
                >
                  <h2 className="text-2xl font-black">{offer.title}</h2>
                  {offer.description && (
                    <p className="mt-2 text-sm leading-6 text-black/65">
                      {offer.description}
                    </p>
                  )}
                  {offer.code && (
                    <p className="mt-5 inline-block rounded bg-[#d9ff38] px-3 py-2 text-xs font-black tracking-wider">
                      USE {offer.code}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
        {content.guests.length > 0 && (
          <div className={content.offers.length ? "mt-16" : ""}>
            <p className="text-xs font-black tracking-[.2em] text-[#ff9b57] uppercase">
              Chief guests
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {content.guests.map((guest) => (
                <article
                  key={guest.id}
                  className="rounded-2xl border border-white/15 p-6"
                >
                  <h2 className="text-2xl font-black">{guest.name}</h2>
                  <p className="mt-1 text-sm font-bold text-[#d9ff38]">
                    {guest.designation}
                  </p>
                  {guest.bio && (
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      {guest.bio}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
