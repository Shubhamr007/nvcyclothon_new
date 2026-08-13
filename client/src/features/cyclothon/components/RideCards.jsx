import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaArrowRight, FaCheck, FaXmark } from "react-icons/fa6";
import { RIDE_OPTIONS } from "../constants";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Tilt from "react-parallax-tilt";

export function RideCards() {
  const [selectedRide, setSelectedRide] = useState(null);
  return (
    <section id="routes" className="bg-[#071313] px-5 py-28 text-white">
      <div className="mx-auto max-w-[1240px]">
        <p className="text-xs font-black tracking-[.2em] text-[#d9ff38] uppercase">Pick your pace</p>
        <h2 className="mt-5 text-5xl font-black leading-none tracking-[-.08em] uppercase md:text-7xl">Four ways<br />to fly.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">The first 50 registrations across all categories receive the early-bird rate. Each category has a limited number of places.</p>
        <Swiper modules={[Pagination]} spaceBetween={16} pagination={{ clickable: true }} breakpoints={{ 768: { slidesPerView: 2 }, 1100: { slidesPerView: 4 } }} className="ride-swiper mt-14 !pb-12">
          {RIDE_OPTIONS.map((route, index) => (
            <SwiperSlide key={route.distance}>
              <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} glareEnable glareMaxOpacity={0.12} className="h-full">
                <article className={`route-card route-${route.color} group relative flex min-h-[25rem] flex-col overflow-hidden rounded-2xl p-7 text-[#071313]`}>
                  <p className="text-xs font-black tracking-[.18em] uppercase">Category 0{index + 1}</p>
                  <p className="mt-10 text-sm font-black tracking-[.16em] text-[#071313]/60">{route.length} · {route.capacity} spots</p>
                  <h3 className="mt-3 text-4xl font-black leading-none tracking-[-.07em] uppercase">{route.title}</h3>
                  <p className="mt-4 max-w-[15rem] text-sm font-medium leading-6">{route.description}</p>
                  <div className="mt-auto border-t border-black/15 pt-4">
                    <span className="block text-sm font-black">{route.fee}</span>
                    <button type="button" onClick={() => setSelectedRide(route)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#071313] px-4 py-2 text-xs font-black text-white transition focus:outline-none focus:ring-4 focus:ring-white group-hover:translate-x-1">
                      Explore category <FaArrowRight aria-hidden="true" />
                    </button>
                  </div>
                  <i className="route-wheel" />
                </article>
              </Tilt>
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
          <motion.section role="dialog" aria-modal="true" aria-labelledby="ride-dialog-title" className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/30 bg-white/10 p-6 shadow-[0_28px_100px_rgba(0,0,0,.5)] backdrop-blur-2xl md:p-10" initial={{ opacity: 0, rotateX: -12, y: 36, scale: 0.94 }} animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }} exit={{ opacity: 0, rotateX: 8, y: 24, scale: 0.96 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} style={{ transformPerspective: 1200 }}>
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
