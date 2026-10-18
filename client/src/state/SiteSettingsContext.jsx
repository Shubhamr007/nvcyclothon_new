import { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "../api/http";

export const DEFAULT_SECTIONS = {
  experience: true,
  editions: true,
  about: true,
  members: true,
  routes: true,
  updates: true,
  gallery: true,
  why_sport: true,
  faq: true,
  contact: true,
  sponsors: true,
  community: true,
};

import { RIDE_OPTIONS } from "../features/cyclothon/constants";

export const DEFAULT_RACE_CATEGORIES = {
  "60 Km Road Challenge": {
    capacity: 100,
    min_age: 18,
    max_age: null,
    early_bird: 89_900,
    regular: 109_900,
    last_week: 129_900,
  },
  "30 Km MTB Challenge": {
    capacity: 150,
    min_age: 16,
    max_age: null,
    early_bird: 79_900,
    regular: 99_900,
    last_week: 119_900,
  },
  "10 Km Green Ride": {
    capacity: 200,
    min_age: 10,
    max_age: null,
    early_bird: 39_900,
    regular: 49_900,
    last_week: 59_900,
  },
  "Kid-o-thon": {
    capacity: 50,
    min_age: 10,
    max_age: 13,
    early_bird: 29_900,
    regular: 29_900,
    last_week: 29_900,
  },
};

const DEFAULT_SETTINGS = {
  event_date: "2026-11-22",
  event_start_time: "5:30 AM",
  event_location: "Rewa, Madhya Pradesh",
  edition_label: "3rd Edition",
  registration_open: true,
  registration_tentative_date: "Upcoming Monday at 10:00 AM",
  partner_applications_open: true,
  vendor_applications_open: true,
  early_bird_limit: 50,
  race_categories: DEFAULT_RACE_CATEGORIES,
  hero_images: [],
  feature_section: { enabled: false, eyebrow: "", title: "", body: "", image_url: "" },
  prize_pool: { enabled: false, eyebrow: "Prize pool", title: "Ride for the podium.", body: "", total: "", prizes: [], terms: "" },
  participant_kit: {
    enabled: true,
    eyebrow: "Every rider receives",
    title: "Your ride-day kit.",
    body: "Every registered participant receives these essentials on race day.",
    items: ["Event jersey", "Rider bib", "Finisher medal", "E-certificate", "Hydration support"],
    note: "Included with every registered category.",
  },
  sections: DEFAULT_SECTIONS,
  social_links: {
    instagram: "https://www.instagram.com/nvcyclothon",
    youtube: "https://www.youtube.com/@nvcyclothon",
    facebook: "https://www.facebook.com/nvcyclothon",
    linkedin: "https://www.linkedin.com/company/nvcyclothon",
  },
  updated_at: null,
};

const SiteSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
  refreshSettings: () => Promise.resolve(),
});

export function SiteSettingsProvider({ children }) {
  const [state, setState] = useState({
    settings: DEFAULT_SETTINGS,
    loading: true,
    error: null,
  });

  const loadSettings = () => {
    return getSiteSettings()
      .then((settings) => {
        setState({
          settings: mergeWithDefaults(settings),
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        setState((current) => ({ ...current, loading: false, error }));
      });
  };

  useEffect(() => {
    loadSettings();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadSettings();
      }
    };

    const handleStorage = (e) => {
      if (e.key === "nv_site_settings_updated") {
        loadSettings();
      }
    };

    const handleCustomUpdate = (e) => {
      if (e.detail) {
        setState({
          settings: mergeWithDefaults(e.detail),
          loading: false,
          error: null,
        });
      } else {
        loadSettings();
      }
    };

    window.addEventListener("focus", loadSettings);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("nv:settings-updated", handleCustomUpdate);

    return () => {
      window.removeEventListener("focus", loadSettings);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("nv:settings-updated", handleCustomUpdate);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ ...state, refreshSettings: loadSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

function mergeWithDefaults(raw) {
  const rawSections = raw?.sections || {};
  const sections = {};
  for (const key of Object.keys(DEFAULT_SECTIONS)) {
    sections[key] = rawSections[key] !== undefined ? Boolean(rawSections[key]) : DEFAULT_SECTIONS[key];
  }
  return {
    event_date: raw?.event_date || DEFAULT_SETTINGS.event_date,
    event_start_time:
      raw?.event_start_time || DEFAULT_SETTINGS.event_start_time,
    event_location: raw?.event_location || DEFAULT_SETTINGS.event_location,
    edition_label: raw?.edition_label || DEFAULT_SETTINGS.edition_label,
    registration_open:
      typeof raw?.registration_open === "boolean"
        ? raw.registration_open
        : DEFAULT_SETTINGS.registration_open,
    registration_tentative_date:
      raw?.registration_tentative_date ||
      DEFAULT_SETTINGS.registration_tentative_date,
    partner_applications_open:
      typeof raw?.partner_applications_open === "boolean"
        ? raw.partner_applications_open
        : DEFAULT_SETTINGS.partner_applications_open,
    vendor_applications_open:
      typeof raw?.vendor_applications_open === "boolean"
        ? raw.vendor_applications_open
        : DEFAULT_SETTINGS.vendor_applications_open,
      hero_images: Array.isArray(raw?.hero_images) ? raw.hero_images : [],
      feature_section: { ...DEFAULT_SETTINGS.feature_section, ...(raw?.feature_section || {}) },
      prize_pool: { ...DEFAULT_SETTINGS.prize_pool, ...(raw?.prize_pool || {}) },
      participant_kit: { ...DEFAULT_SETTINGS.participant_kit, ...(raw?.participant_kit || {}) },
    early_bird_limit:
      typeof raw?.early_bird_limit === "number"
        ? raw.early_bird_limit
        : DEFAULT_SETTINGS.early_bird_limit,
    race_categories: {
      ...DEFAULT_RACE_CATEGORIES,
      ...(raw?.race_categories || {}),
    },
    sections,
    social_links: {
      ...DEFAULT_SETTINGS.social_links,
      ...(raw?.social_links || {}),
    },
    updated_at: raw?.updated_at || null,
  };
}

export function getMergedRideOptions(customCategories) {
  return RIDE_OPTIONS.map((staticOption) => {
    const custom = customCategories?.[staticOption.distance];
    if (!custom) return staticOption;

    const minAge =
      custom.min_age !== undefined && custom.min_age !== null && custom.min_age !== ""
        ? Number(custom.min_age)
        : null;
    const maxAge =
      custom.max_age !== undefined && custom.max_age !== null && custom.max_age !== ""
        ? Number(custom.max_age)
        : null;
    const capacity = custom.capacity ? Number(custom.capacity) : staticOption.capacity;

    const defaultEb =
      staticOption.distance === "60 Km Road Challenge"
        ? 89900
        : staticOption.distance === "30 Km MTB Challenge"
          ? 79900
          : staticOption.distance === "10 Km Green Ride"
            ? 39900
            : 29900;
    const defaultReg =
      staticOption.distance === "60 Km Road Challenge"
        ? 109900
        : staticOption.distance === "30 Km MTB Challenge"
          ? 99900
          : staticOption.distance === "10 Km Green Ride"
            ? 49900
            : 29900;
    const defaultLw =
      staticOption.distance === "60 Km Road Challenge"
        ? 129900
        : staticOption.distance === "30 Km MTB Challenge"
          ? 119900
          : staticOption.distance === "10 Km Green Ride"
            ? 59900
            : 29900;

    const earlyBirdPaise = custom.early_bird !== undefined ? Number(custom.early_bird) : defaultEb;
    const regularPaise = custom.regular !== undefined ? Number(custom.regular) : defaultReg;
    const lastWeekPaise = custom.last_week !== undefined ? Number(custom.last_week) : defaultLw;

    const ebRupees = Math.round(earlyBirdPaise / 100);
    const regRupees = Math.round(regularPaise / 100);
    const lwRupees = Math.round(lastWeekPaise / 100);

    const isKidOThon = staticOption.distance === "Kid-o-thon";
    const fee = isKidOThon ? `₹${regRupees} fixed` : `₹${ebRupees} early bird`;
    const pricing = isKidOThon
      ? `₹${regRupees} fixed fee`
      : `₹${ebRupees} early bird · ₹${regRupees} regular · ₹${lwRupees} last week`;

    let description = staticOption.description;
    if (staticOption.distance === "60 Km Road Challenge" && minAge) {
      description = `A 60 km road test for determined riders aged ${minAge} and above.`;
    } else if (staticOption.distance === "30 Km MTB Challenge" && minAge) {
      description = `A 30 km mountain-bike challenge for riders aged ${minAge} and above.`;
    } else if (staticOption.distance === "Kid-o-thon" && minAge && maxAge) {
      description = `A joyful, family-friendly ride for ages ${minAge}–${maxAge} in a closed, monitored area.`;
    }

    return {
      ...staticOption,
      minAge,
      maxAge,
      capacity,
      fee,
      pricing,
      description,
      early_bird: earlyBirdPaise,
      regular: regularPaise,
      last_week: lastWeekPaise,
    };
  });
}

export function formatEventDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = String(isoDate).split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
