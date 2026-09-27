import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaCheck, FaXmark } from "react-icons/fa6";
import { RIDE_OPTIONS } from "../constants";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export function RideCards() {
  const [selectedRide, setSelectedRide] = useState(null);
  return (
    <section id="routes" className="bg-[#071313] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 text-white overflow-hidden">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[.2em] text-[#d9ff38] uppercase">Pick your pace</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-.07em] uppercase sm:text-6xl md:text-7xl">
              Five ways<br />to fly.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/85">
              The first 50 registrations across all categories receive the early-bird rate. Each category has a limited number of places.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-end">
            <button
              id="ride-card-prev"
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:border-[#d9ff38] hover:bg-[#d9ff38] hover:text-[#071313] focus:outline-none focus:ring-2 focus:ring-[#d9ff38] disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Previous ride category"
            >
              <FaArrowLeft aria-hidden="true" />
            </button>
            <button
              id="ride-card-next"
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:border-[#d9ff38] hover:bg-[#d9ff38] hover:text-[#071313] focus:outline-none focus:ring-2 focus:ring-[#d9ff38] disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Next ride category"
            >
              <FaArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <Swiper
          modules={[Pagination, Navigation, A11y]}
          spaceBetween={16}
          slidesPerView={1}
          grabCursor={true}
          navigation={{
            prevEl: "#ride-card-prev",
            nextEl: "#ride-card-next",
          }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 1.5, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
            1280: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="ride-swiper mt-10 sm:mt-14 w-full !pb-14"
        >
          {RIDE_OPTIONS.map((route, index) => (
            <SwiperSlide key={route.distance} className="!h-auto w-full">
              <article
                className={`route-card route-${route.color} group relative flex min-h-[24rem] sm:min-h-[26rem] h-full w-full flex-col overflow-hidden rounded-2xl p-6 sm:p-7 md:p-8 text-[#071313] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black tracking-[.18em] uppercase">Category 0{index + 1}</p>
                  {route.minAge && (
                    <span className="rounded-full bg-[#071313] px-2 py-0.5 text-[9px] font-black uppercase text-[#facc15]">
                      Age 50+
                    </span>
                  )}
                </div>
                <p className="mt-8 text-sm font-black tracking-[.16em] text-[#071313]">
                  {route.length} · {route.capacity} spots
                </p>
                <h3 className="mt-3 min-h-[3.5rem] sm:min-h-[4rem] text-3xl sm:text-4xl font-black leading-none tracking-[-.07em] uppercase">
                  {route.title}
                </h3>
                <p className="mt-4 max-w-sm text-sm font-medium leading-6">{route.description}</p>
                <div className="mt-auto border-t border-black/15 pt-4">
                  <span className="block text-sm font-black">{route.fee}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRide(route)}
                    className="cta-secondary mt-4 inline-flex items-center gap-2 px-5 py-3 text-xs font-black transition group-hover:translate-x-1"
                  >
                    Explore category <FaArrowRight aria-hidden="true" />
                  </button>
                </div>
                <i className="route-wheel" />
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <RideDetailDialog ride={selectedRide} onClose={() => setSelectedRide(null)} />
    </section>
  );
}

function RideDetailDialog({ ride, onClose }) {
  useEffect(() => {
    if (!ride) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ride, onClose]);

  return (
    <AnimatePresence>
      {ride && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#071313]/75 px-5 py-8 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="ride-dialog-title" data-theme="dark" className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/30 bg-white/10 p-6 shadow-[0_28px_100px_rgba(0,0,0,.5)] backdrop-blur-2xl md:p-10" initial={{ opacity: 0, rotateX: -12, y: 36, scale: 0.94 }} animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }} exit={{ opacity: 0, rotateX: 8, y: 24, scale: 0.96 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} style={{ transformPerspective: 1200 }}>
            <div className={`absolute -right-24 -top-28 h-64 w-64 rounded-full route-${ride.color} opacity-45 blur-3xl`} aria-hidden="true" />
            <div className="relative">
              <button type="button" onClick={onClose} className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-[#d9ff38]" aria-label="Close category details"><FaXmark /></button>
              <p className="text-xs font-black tracking-[.2em] text-[#d9ff38] uppercase">{ride.length} · {ride.capacity} places</p>
              <h3 id="ride-dialog-title" className="mt-4 max-w-md text-5xl font-black leading-[.86] tracking-[-.08em] text-white uppercase md:text-6xl">{ride.title}</h3>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/75">{ride.description}</p>
              <div className="mt-7 grid gap-4 border-y border-white/15 py-5 sm:grid-cols-2">
                <div><p className="text-[10px] font-black tracking-[.16em] text-white/55 uppercase">Entry fee</p><p className="mt-1 text-lg font-black text-white">{ride.fee}</p><p className="mt-1 text-xs leading-5 text-white/60">{ride.pricing}</p></div>
                <div><p className="text-[10px] font-black tracking-[.16em] text-white/55 uppercase">Your event kit</p><ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-white/85">{ride.kit.map((item) => <li key={item} className="flex items-center gap-1.5"><FaCheck className="text-[#d9ff38]" aria-hidden="true" />{item}</li>)}</ul></div>
              </div>
              <a href={`/register?route=${encodeURIComponent(ride.distance)}`} className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#d9ff38] px-6 py-4 text-xs font-black tracking-wider text-[#071313] transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-white">Register for {ride.title} <FaArrowRight aria-hidden="true" /></a>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
