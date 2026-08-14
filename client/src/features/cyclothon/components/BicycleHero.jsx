import { EVENT } from "../constants";
import lightHeroImage from "../../../../assets/detailed_hero_image.png";
import darkHeroImage from "../../../../assets/detailed_hero_image.png";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "framer-motion";
import { HeroParticles } from "../../../components/HeroParticles";
import { Typewriter } from "../../../components/Typewriter";

export function BicycleHero() {
  const heading = useRef(null);
  const reduceMotion = useReducedMotion();
  useLayoutEffect(() => {
    if (reduceMotion) return undefined;
    const animation = gsap.fromTo(
      heading.current,
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 0.85, ease: "power3.out"  },
    );
    return () => animation.kill();
  }, [reduceMotion]);
  return (
    <section className="hero-section relative min-h-screen overflow-hidden bg-[#071313] text-white">
      <picture>
        <source media="(prefers-color-scheme: light)" srcSet={lightHeroImage} />
        <img data-rider src={darkHeroImage} alt="Cyclists representing Rewa district and the spirit of NV Cyclothon" className="hero-theme-image absolute inset-0 h-full w-full object-cover object-center" />
      </picture>
      <div className="hero-overlay" />
      <div className="hero-radial" />
      <div className="noise" />
      <HeroParticles />
      <div className="relative z-10 mx-auto flex min-h-screen w-[min(1240px,calc(100%-40px))] items-center pt-20">
        <div ref={heading} className="max-w-3xl">
          <p className="mb-6 text-xs font-bold tracking-[.3em] text-[#d9ff38] uppercase">
            Sunday · {EVENT.date} · Rewa
          </p>
          <h1 className="font-black text-[clamp(4.3rem,12vw,10.5rem)] leading-[.77] tracking-[-.11em] uppercase">
            Own
            <br />
            <span className="text-[#d9ff38]">the</span> road
            <span className="text-[#ff5f3d]">.</span>
          </h1>
          <p className="mt-9 max-w-md text-base leading-7 text-white/70">
            <Typewriter
              phrases={[
                "Ride together.",
                "Celebrate together.",
                "Create memories.",
              ]}
            />
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/register"
              className="rounded-full bg-[#d9ff38] px-7 py-4 text-sm font-black text-[#071313] transition focus:outline-none focus:ring-4 focus:ring-white hover:-translate-y-1"
            >
              Claim your bib →
            </a>
            <a
              href="#routes"
              className="rounded-full border border-white/40 px-7 py-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#d9ff38] hover:bg-white hover:text-[#071313]"
            >
              Explore routes
            </a>
          </div>
        </div>
        <BicycleArt />
      </div>
      <a href="#routes" className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[.25em] text-white/70 uppercase transition hover:text-[#d9ff38] focus-visible:text-[#d9ff38]">
        Explore routes ↓
      </a>
    </section>
  );
}

function BicycleArt() {
  return (
    <div aria-hidden="true" className="bicycle-art">
      <div className="bike-wheel wheel-back" />
      <div className="bike-wheel wheel-front" />
      <div className="bike-frame">
        <i className="frame-a" />
        <i className="frame-b" />
        <i className="frame-c" />
      </div>
      <div className="bike-fork" />
      <div className="bike-seat" />
      <div className="bike-handle" />
      <div className="bike-rider">
        <i className="rider-head" />
        <i className="rider-body" />
        <i className="rider-arm" />
        <i className="rider-leg" />
      </div>
    </div>
  );
}
