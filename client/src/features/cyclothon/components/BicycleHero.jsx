import { EVENT } from "../constants";
import detailedHeroImage from "../../../../assets/detailed_hero_image.png";
import nvCyclothonHero from "../../../assets/nv-cyclothon-hero.webp";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "framer-motion";
import { HeroParticles } from "../../../components/HeroParticles";
import { Typewriter } from "../../../components/Typewriter";
import { formatEventDate, useSiteSettings } from "../../../state/SiteSettingsContext";

const HERO_SLIDES = [
  { src: nvCyclothonHero, alt: "NV Cyclothon riders on the streets of Rewa" },
  { src: detailedHeroImage, alt: "Cyclists representing the spirit of NV Cyclothon" },
];
const SLIDE_INTERVAL_MS = 6000;

export function BicycleHero() {
  const heading = useRef(null);
  const reduceMotion = useReducedMotion();
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { settings } = useSiteSettings();
  const eventDateLabel = formatEventDate(settings.event_date) || EVENT.date;
  const editionLabel = settings.edition_label || EVENT.editionLabel;
  const heroSlides = settings.hero_images?.length
    ? settings.hero_images.map((src, index) => ({ src, alt: `NV Cyclothon event image ${index + 1}` }))
    : HERO_SLIDES;

  useEffect(() => {
    setSlideIndex((current) => (current < heroSlides.length ? current : 0));
  }, [heroSlides.length]);

  useLayoutEffect(() => {
    if (reduceMotion) return undefined;
    const animation = gsap.fromTo(
      heading.current,
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" },
    );
    return () => animation.kill();
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || isPaused || heroSlides.length < 2) return undefined;
    const timer = setInterval(
      () => setSlideIndex((i) => (i + 1) % heroSlides.length),
      SLIDE_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [reduceMotion, isPaused, heroSlides.length]);

  return (
    <section className="hero-section relative min-h-screen overflow-hidden bg-[#071313] text-white">
      <div
        className="hero-carousel absolute inset-0"
        role="region"
        aria-roledescription="carousel"
        aria-label="NV Cyclothon hero images"
      >
        {heroSlides.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={i === slideIndex ? slide.alt : ""}
            aria-hidden={i !== slideIndex}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-[1200ms] ease-in-out ${i === slideIndex ? "opacity-100" : "opacity-0"}`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
      <div className="hero-overlay" />
      <div className="hero-radial" />
      <div className="noise" />
      <HeroParticles />
      <div className="relative z-10 mx-auto flex min-h-screen w-[min(1240px,calc(100%-40px))] items-center pt-20">
        <div ref={heading} className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9ff38]/45 bg-[#d9ff38]/10 px-3 py-1.5 text-[10px] font-black tracking-[.28em] text-[#d9ff38] uppercase backdrop-blur">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#d9ff38] opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-[#d9ff38]" />
            </span>
            {editionLabel} · Rewa’s flagship ride
          </div>
          <p className="mb-6 text-xs font-bold tracking-[.3em] text-[#d9ff38] uppercase">
            Sunday · {eventDateLabel} · Rewa
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
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setSlideIndex(i)}
            aria-label={`Show slide ${i + 1} of ${heroSlides.length}`}
            aria-current={i === slideIndex}
            className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#d9ff38] ${i === slideIndex ? "w-8 bg-[#d9ff38]" : "w-2 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
        {!reduceMotion && (
          <button
            type="button"
            onClick={() => setIsPaused((current) => !current)}
            className="ml-2 rounded-full border border-white/40 px-3 py-1 text-[10px] font-black tracking-[.12em] text-white uppercase focus:outline-none focus:ring-2 focus:ring-[#d9ff38]"
          >
            {isPaused ? "Play" : "Pause"}
          </button>
        )}
      </div>
      <a href="#routes" className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[.25em] text-white/70 uppercase transition hover:text-[#d9ff38] focus-visible:text-[#d9ff38]">
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
