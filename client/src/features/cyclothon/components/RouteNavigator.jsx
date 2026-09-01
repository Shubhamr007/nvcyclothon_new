import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import rewaMap from "../../../../assets/rewa_map.png";

const routeStops = [
  ["Start", "05:30", "20", "74"],
  ["Old city", "06:10", "42", "55"],
  ["Vindhya climb", "06:55", "64", "37"],
  ["Finish", "08:15", "83", "22"],
];

export function RouteNavigator() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const mapY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-7%", "7%"]);

  return (
    <section ref={sectionRef} className="route-navigator relative isolate overflow-hidden bg-[#071313] px-5 py-28 text-white">
      <motion.img
        src={rewaMap}
        alt=""
        aria-hidden="true"
        style={{ y: mapY }}
        className="route-navigator__map pointer-events-none absolute inset-x-0 -top-[10%] -z-10 h-[120%] w-full object-cover"
      />
      <div className="route-navigator__veil absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
        <div>
          <p className="text-xs font-black tracking-[.24em] text-[#d9ff38] uppercase">Route intelligence</p>
          <h2 className="mt-4 text-5xl font-black leading-[.85] tracking-[-.08em] uppercase md:text-7xl">
            Follow the
            <br />
            <span className="text-[#ff5f3d]">energy.</span>
          </h2>
          <p className="mt-7 max-w-md text-sm leading-7 text-white/70">
            A visual preview of race morning—from the first pedal at the start line to the final sweep through Rewa.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#d9ff38]/35 bg-[#d9ff38]/10 px-4 py-2 text-[10px] font-black tracking-[.16em] text-[#d9ff38] uppercase backdrop-blur">
            <FaLocationArrow aria-hidden="true" /> Live route preview
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, rotateX: 8, y: 32 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="route-navigator__panel relative aspect-[1.25/1] overflow-hidden rounded-[2rem] border border-white/20 bg-[#071313]/60 shadow-[0_30px_90px_rgba(0,0,0,.42)]"
          style={{ transformPerspective: 1200 }}
        >
          <div className="route-navigator__grid absolute inset-0" aria-hidden="true" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label="Illustrated route from start to finish">
            <defs>
              <linearGradient id="route-line" x1="0" x2="1">
                <stop stopColor="#d9ff38" />
                <stop offset=".55" stopColor="#ff5f3d" />
                <stop offset="1" stopColor="#d9ff38" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 18 77 C 25 66, 34 67, 42 55 S 57 45, 64 37 S 75 31, 83 22"
              fill="none"
              stroke="url(#route-line)"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={{ pathLength: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
            {!reduceMotion && <motion.circle r="2.2" fill="#f4f1e9" stroke="#071313" strokeWidth="1" animate={{ cx: [18, 29, 42, 53, 64, 73, 83], cy: [77, 67, 55, 47, 37, 31, 22] }} transition={{ duration: 5.8, repeat: Infinity, ease: "linear" }} />}
          </svg>
          {routeStops.map(([name, time, left, top], index) => (
            <motion.div
              key={name}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.75 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.15, type: "spring", stiffness: 260, damping: 20 }}
              style={{ left: `${left}%`, top: `${top}%` }}
              className="route-navigator__stop absolute"
            >
              <span className="route-navigator__pin" />
              <span className="route-navigator__label"><b>{name}</b><small>{time} AM</small></span>
            </motion.div>
          ))}
          <p className="absolute bottom-5 left-6 text-[10px] font-black tracking-[.18em] text-white/65 uppercase">Illustrative route view · Rewa</p>
        </motion.div>
      </div>
    </section>
  );
}
