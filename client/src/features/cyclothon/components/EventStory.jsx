import associationLogo from "../../../../assets/Rewa_District_Cycyling_Association.jpeg";
import rewaMap from "../../../../assets/rewa_map.png";
import detailedHeroImage from "../../../../assets/detailed_hero_image.png";
import nvCyclothonHero from "../../../assets/nv-cyclothon-hero.webp";
import { EDITIONS, EVENT } from "../constants";
import { Reveal } from "../../../components/Reveal";
import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { request, resolveApiAssetUrl } from "../../../api/http";
import { ChevronLeft, ChevronRight, Pause, Play, Maximize2, X, Camera } from "lucide-react";

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
      className="bg-[#071313] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 text-white overflow-hidden"
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
                      ? "border-[#d9ff38] bg-[#d9ff38] text-[#071313] shadow-[4px_4px_0_#ff5f3d] sm:shadow-[8px_8px_0_#ff5f3d]"
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

const FALLBACK_GALLERY = [
  {
    id: 1,
    title: "Vindhya Sunrise Flag-Off",
    category: "Organizers",
    caption: "Official race directors and organizing committee flagging off the inaugural peloton at sunrise.",
    image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    display_order: 1,
  },
  {
    id: 2,
    title: "Road Challenge Lead Pack",
    category: "Riders",
    caption: "60 Km Road Challenge cyclists pushing the pace across the scenic Vindhya highway.",
    image_url: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    display_order: 2,
  },
  {
    id: 3,
    title: "Official Hydration & Energy Station",
    category: "Partners",
    caption: "Our hydration and nutrition partners ensuring riders stay refueled and energized throughout the route.",
    image_url: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1200&q=80",
    display_order: 3,
  },
  {
    id: 4,
    title: "Vindhya Mountain Trail Breakers",
    category: "Riders",
    caption: "30 Km MTB Challenge riders tackling the rugged terrain and rolling hills of Rewa.",
    image_url: "https://images.unsplash.com/photo-1474962558142-9ca83af74bb7?auto=format&fit=crop&w=1200&q=80",
    display_order: 4,
  },
  {
    id: 5,
    title: "Community Green Ride & Families",
    category: "Highlights",
    caption: "10 Km Green Ride bringing families, students, and citizens together for cleaner, greener streets.",
    image_url: "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=1200&q=80",
    display_order: 5,
  },
  {
    id: 6,
    title: "Partner Expo & Brand Zone",
    category: "Partners",
    caption: "Title sponsors and wellness partners engaging with cycling enthusiasts at the race village.",
    image_url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1200&q=80",
    display_order: 6,
  },
  {
    id: 7,
    title: "Finish Line Glory & Medal Ceremony",
    category: "Organizers",
    caption: "Organizing committee presenting custom finisher medals and celebrating rider achievements.",
    image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    display_order: 7,
  },
  {
    id: 8,
    title: "Rewa Cycling Marshals on Course",
    category: "Organizers",
    caption: "Safety marshals and emergency pilot teams keeping the circuit secure and seamless.",
    image_url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80",
    display_order: 8,
  },
];

const CATEGORY_COLORS = {
  Organizers: "bg-[#d9ff38] text-[#071313]",
  Partners: "bg-[#ff5f3d] text-white",
  Riders: "bg-[#38bdf8] text-[#071313]",
  Highlights: "bg-white text-[#071313]",
  Event: "bg-[#f4f1e9] text-[#071313]",
};

function GalleryPhotoTile({ item, onClick }) {
  const badgeStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Event;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View photo: ${item.title || "NV Cyclothon moment"}`}
      className="group relative h-64 sm:h-72 lg:h-80 w-[300px] sm:w-[380px] lg:w-[440px] shrink-0 overflow-hidden rounded-3xl border-2 border-[#071313] bg-[#071313] shadow-[4px_4px_0_#071313] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0_#ff5f3d] select-none"
    >
      <img
        src={resolveApiAssetUrl(item.image_url)}
        alt={item.title || "NV Cyclothon moment"}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#071313] via-[#071313]/30 to-black/20 opacity-80 group-hover:opacity-95 transition-opacity" />

      {/* TOP BADGES */}
      <div className="absolute left-4 top-4 right-4 flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${badgeStyle}`}
        >
          {item.category || "Event"}
        </span>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#071313]/70 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 group-hover:bg-[#d9ff38] group-hover:text-[#071313]">
          <Maximize2 className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* BOTTOM INFO */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white group-hover:text-[#d9ff38] transition-colors line-clamp-1">
          {item.title || "NV Cyclothon Moment"}
        </h3>
        {item.caption && (
          <p className="mt-1 text-xs text-white/80 line-clamp-1">
            {item.caption}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2 text-[10px] font-bold text-white/60">
          <span>NV Cyclothon · Rewa</span>
          <span className="text-[#d9ff38] group-hover:translate-x-0.5 transition-transform">
            Tap to expand ↗
          </span>
        </div>
      </div>
    </div>
  );
}

export function Gallery() {
  const [items, setItems] = useState(FALLBACK_GALLERY);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState("left-to-right"); // 'left-to-right' | 'right-to-left'
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    request("/content/gallery")
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      })
      .catch(() => {
        // Keeps FALLBACK_GALLERY if offline or error
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = ["All", "Organizers", "Partners", "Riders", "Highlights", "Event"];

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter(
      (item) => (item.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [items, activeCategory]);

  // If there are many photos (>= 8), split into two floating tracks
  const isDualTrack = filteredItems.length >= 8;
  const track1Items = useMemo(() => {
    if (!isDualTrack) return filteredItems;
    return filteredItems.filter((_, idx) => idx % 2 === 0);
  }, [filteredItems, isDualTrack]);

  const track2Items = useMemo(() => {
    if (!isDualTrack) return [];
    return filteredItems.filter((_, idx) => idx % 2 !== 0);
  }, [filteredItems, isDualTrack]);

  // Helper to ensure loop has enough width to scroll continuously
  const buildLoop = (list) => {
    if (list.length === 0) return [];
    let looped = [...list];
    while (looped.length < 6) {
      looped = [...looped, ...list];
    }
    return [...looped, ...looped];
  };

  const loopTrack1 = useMemo(() => buildLoop(track1Items), [track1Items]);
  const loopTrack2 = useMemo(() => buildLoop(track2Items), [track2Items]);

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev <= 0 ? filteredItems.length - 1 : prev - 1
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev >= filteredItems.length - 1 ? 0 : prev + 1
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredItems.length]);

  const currentLightboxItem =
    lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="accessible-light-surface bg-[#f4f1e9] py-20 sm:py-28 text-[#071313] overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#071313]/15 bg-white/60 px-3 py-1 text-[11px] font-black tracking-[.2em] text-[#ff5f3d] uppercase backdrop-blur-sm">
                <Camera className="h-3.5 w-3.5" />
                <span>Official event gallery</span>
              </div>
              <h2
                id="gallery-heading"
                className="mt-4 text-5xl font-black leading-none tracking-[-.08em] uppercase md:text-7xl"
              >
                See the
                <br />
                <span className="text-[#ff5f3d]">ride.</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#071313]/70">
                Continuous auto-floating stream of race-day energy, route moments, organizers, and proud commercial partners.
              </p>
            </Reveal>
          </div>

          {/* STREAM CONTROLS */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? "Pause photo stream" : "Play photo stream"}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#071313] bg-white px-4 py-2.5 text-xs font-black uppercase text-[#071313] shadow-[3px_3px_0_#071313] transition hover:bg-[#d9ff38] active:translate-x-0.5 active:translate-y-0.5"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-[#ff5f3d]" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-[#071313]" />
                  <span>Auto-Float</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setDirection((prev) =>
                  prev === "left-to-right" ? "right-to-left" : "left-to-right"
                )
              }
              aria-label="Toggle float direction"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#071313] bg-white px-4 py-2.5 text-xs font-black uppercase text-[#071313] shadow-[3px_3px_0_#071313] transition hover:bg-[#d9ff38] active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>{direction === "left-to-right" ? "Float Left → Right" : "Float Right → Left"}</span>
            </button>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? items.length
                  : items.filter(
                      (x) => (x.category || "").toLowerCase() === cat.toLowerCase()
                    ).length;
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                    isSelected
                      ? "bg-[#071313] text-[#d9ff38] shadow-[3px_3px_0_#ff5f3d]"
                      : "bg-white text-[#071313]/70 hover:bg-[#071313]/5 hover:text-[#071313] border border-black/10"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-[#d9ff38]"
                        : "bg-black/5 text-black/60"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-bold text-black/50">
            {filteredItems.length} photos in view · Hover to pause
          </div>
        </div>
      </div>

      {/* AUTO-FLOATING STREAM CONTAINER (FULL WIDTH RIBBON) */}
      <div className="mt-8 w-full overflow-hidden gallery-stream-container">
        {filteredItems.length === 0 ? (
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="rounded-3xl border-2 border-dashed border-[#071313]/20 bg-white p-12 text-center text-sm font-bold text-black/50">
              No photographs in “{activeCategory}” yet.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TRACK 1 (FLOATS LEFT TO RIGHT BY DEFAULT) */}
            <div className="overflow-hidden py-2">
              <div
                className={`flex gap-6 ${
                  direction === "left-to-right"
                    ? "gallery-stream-l2r"
                    : "gallery-stream-r2l"
                } ${!isPlaying ? "gallery-stream-paused" : ""}`}
              >
                {loopTrack1.map((item, idx) => (
                  <GalleryPhotoTile
                    key={`t1-${item.id || idx}-${idx}`}
                    item={item}
                    onClick={() => {
                      const realIndex = filteredItems.findIndex(
                        (x) => x.id === item.id
                      );
                      setLightboxIndex(realIndex >= 0 ? realIndex : 0);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* TRACK 2 (IF DUAL TRACK: FLOATS IN COUNTER-DIRECTION FOR AMAZING DYNAMIC EFFECT) */}
            {isDualTrack && (
              <div className="overflow-hidden py-2">
                <div
                  className={`flex gap-6 ${
                    direction === "left-to-right"
                      ? "gallery-stream-r2l"
                      : "gallery-stream-l2r"
                  } ${!isPlaying ? "gallery-stream-paused" : ""}`}
                >
                  {loopTrack2.map((item, idx) => (
                    <GalleryPhotoTile
                      key={`t2-${item.id || idx}-${idx}`}
                      item={item}
                      onClick={() => {
                        const realIndex = filteredItems.findIndex(
                          (x) => x.id === item.id
                        );
                        setLightboxIndex(realIndex >= 0 ? realIndex : 0);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL WITH NAVIGATION */}
      <AnimatePresence>
        {currentLightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border-2 border-white/20 bg-[#071313] text-white shadow-2xl flex flex-col"
            >
              {/* CLOSE BUTTON */}
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close modal"
                className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-[#071313]/80 text-white backdrop-blur-md hover:bg-[#ff5f3d] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* IMAGE CONTAINER WITH PREV / NEXT CONTROLS */}
              <div className="relative aspect-[16/10] w-full bg-black overflow-hidden max-h-[66vh] flex items-center justify-center">
                <img
                  src={resolveApiAssetUrl(currentLightboxItem.image_url)}
                  alt={currentLightboxItem.title || "Gallery photograph"}
                  className="max-h-full max-w-full object-contain"
                />

                {filteredItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex((prev) =>
                          prev <= 0 ? filteredItems.length - 1 : prev - 1
                        );
                      }}
                      aria-label="Previous photograph"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 grid h-11 w-11 place-items-center rounded-full bg-[#071313]/80 text-white backdrop-blur-md border border-white/20 hover:bg-[#d9ff38] hover:text-[#071313] transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex((prev) =>
                          prev >= filteredItems.length - 1 ? 0 : prev + 1
                        );
                      }}
                      aria-label="Next photograph"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 grid h-11 w-11 place-items-center rounded-full bg-[#071313]/80 text-white backdrop-blur-md border border-white/20 hover:bg-[#d9ff38] hover:text-[#071313] transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* CAPTION & DETAILS */}
              <div className="p-6 bg-[#071313] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/10">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                        CATEGORY_COLORS[currentLightboxItem.category] ||
                        CATEGORY_COLORS.Event
                      }`}
                    >
                      {currentLightboxItem.category || "Event"}
                    </span>
                    <span className="text-xs text-white/50">
                      Photo {(lightboxIndex ?? 0) + 1} of {filteredItems.length}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                    {currentLightboxItem.title || "NV Cyclothon Moment"}
                  </h3>
                  {currentLightboxItem.caption && (
                    <p className="mt-1 text-xs sm:text-sm text-white/80">
                      {currentLightboxItem.caption}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-white/40 shrink-0">
                  <span>NV Cyclothon 2026 · Rewa</span>
                  <p className="text-[10px] mt-0.5">Use ← / → keys to flip</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
        <p className="h-fit w-fit max-w-full rounded-xl bg-[#f4f1e9]/90 px-4 py-3 text-xs font-black tracking-[.2em] shadow-[4px_4px_0_#071313] uppercase">
          Why we ride
        </p>
        <div>
          <h2 className="w-fit max-w-full rounded-2xl bg-[#f4f1e9]/90 p-4 text-3xl font-black leading-[.86] tracking-[-.08em] shadow-[4px_4px_0_#071313] sm:shadow-[6px_6px_0_#071313] uppercase sm:text-5xl md:text-7xl">
            Ride with
            <br />
            purpose.
            <br />
            <span className="text-[#ff5f3d]">Finish with pride.</span>
          </h2>
          <p className="mt-6 w-fit max-w-full rounded-lg bg-[#071313] px-4 py-3 text-base sm:text-xl font-black leading-7 uppercase text-[#d9ff38] shadow-[4px_4px_0_#ff5f3d]">Pedal with passion. Finish with pride.</p>
          <p className="mt-4 max-w-2xl rounded-xl bg-[#f4f1e9]/90 p-4 text-sm leading-6 text-[#071313] shadow-[4px_4px_0_#071313]">This is more than a race. It is a high-energy movement for a stronger Vindhya, safer streets and every rider ready to own their road.</p>
          <p className="mt-6 w-fit max-w-full rounded-lg bg-[#f4f1e9]/90 px-4 py-3 text-[10px] font-black tracking-[.12em] sm:tracking-[.2em] text-[#071313] shadow-[4px_4px_0_#071313] uppercase">Land of the white tiger · Rewa rides with a fierce heart</p>
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
      .then((data) => setMembers(Array.isArray(data) ? data : []))
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

  const safeMembers = Array.isArray(members) ? members : [];
  if (!safeMembers.length) return null;
  return (
    <section className="accessible-light-surface bg-[#f4f1e9] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 text-[#071313] overflow-hidden" aria-labelledby="members-heading">
      <div className="mx-auto max-w-[1400px]">
        <Reveal><p className="text-xs font-black tracking-[.2em] text-[#ff5f3d] uppercase">The people behind the ride</p><h2 id="members-heading" className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-[-.06em] uppercase md:text-6xl">Built by people<br /><span className="text-[#ff5f3d]">who show up.</span></h2><p className="mt-5 max-w-xl text-sm leading-6 text-[#071313]/70">Meet the people bringing NV Cyclothon to life.</p></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {safeMembers.map((member, index) => (
            <Reveal key={member.id} delay={index * 0.06}>
              <article className="member-profile-card group relative h-full overflow-hidden rounded-3xl bg-[#071313] shadow-[6px_6px_0_#d9ff38]">
                {member.image_url ? (
                  <img src={resolveApiAssetUrl(member.image_url)} alt={`Portrait of ${member.name}`} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
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
              {member.image_url ? <img src={resolveApiAssetUrl(member.image_url)} alt={`Portrait of ${member.name}`} className="h-64 w-full object-cover md:h-full" /> : <div className="grid min-h-64 place-items-center bg-[#071313] text-5xl font-black text-[#d9ff38]" aria-hidden="true">{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>}
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
      className="bg-[#071313] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 text-white overflow-hidden"
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
