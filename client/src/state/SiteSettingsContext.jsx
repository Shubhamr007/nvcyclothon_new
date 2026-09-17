import { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "../api/http";

const DEFAULT_SECTIONS = {
  editions: true,
  about: true,
  routes: true,
  updates: true,
  gallery: true,
  why_sport: true,
  contact: true,
  sponsors: true,
  community: true,
};

const DEFAULT_SETTINGS = {
  event_date: "2026-11-22",
  event_start_time: "5:30 AM",
  event_location: "Rewa, Madhya Pradesh",
  edition_label: "3rd Edition",
  registration_open: false,
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
  updated_at: null,
};

const SiteSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
});

export function SiteSettingsProvider({ children }) {
  const [state, setState] = useState({
    settings: DEFAULT_SETTINGS,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const loadSettings = () => getSiteSettings()
      .then((settings) => {
        if (cancelled) return;
        setState({
          settings: mergeWithDefaults(settings),
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState((current) => ({ ...current, loading: false, error }));
      });
    loadSettings();
    const refreshTimer = window.setInterval(loadSettings, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={state}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

function mergeWithDefaults(raw) {
  const sections = { ...DEFAULT_SECTIONS, ...(raw?.sections || {}) };
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
      hero_images: Array.isArray(raw?.hero_images) ? raw.hero_images : [],
      feature_section: { ...DEFAULT_SETTINGS.feature_section, ...(raw?.feature_section || {}) },
      prize_pool: { ...DEFAULT_SETTINGS.prize_pool, ...(raw?.prize_pool || {}) },
      participant_kit: { ...DEFAULT_SETTINGS.participant_kit, ...(raw?.participant_kit || {}) },
    sections,
    updated_at: raw?.updated_at || null,
  };
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
