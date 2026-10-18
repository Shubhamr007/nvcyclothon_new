import React, { useEffect, useCallback } from "react";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Button } from "../../../components/ui/button";
import { Save, CheckCircle2 } from "lucide-react";

import {
  SettingsNavTabs,
  LogisticsSection,
  RaceCategoriesSection,
  PrizesAndKitSection,
  VisualsSection,
  SocialLinksSection,
  SectionsVisibilitySection,
} from "../settings";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchAdminSettings,
  saveAdminSettings,
  setActiveSectionTab,
  updateField as updateFieldAction,
  updateRaceCategory as updateRaceCategoryAction,
  toggleSection as toggleSectionAction,
  updateSocialLink as updateSocialLinkAction,
} from "../../../store/slices/settingsSlice";

export function SettingsTab({ accessToken: propAccessToken, onFeedback }) {
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;

  const {
    data: settings,
    activeSectionTab,
    loading,
    saving,
    feedback,
    error,
  } = useAppSelector((state) => state.settings);

  useEffect(() => {
    dispatch(fetchAdminSettings(accessToken));
  }, [dispatch, accessToken]);

  const updateField = useCallback(
    (key, value) => {
      dispatch(updateFieldAction({ key, value }));
    },
    [dispatch]
  );

  const updateRaceCategory = useCallback(
    (categoryName, field, value) => {
      dispatch(updateRaceCategoryAction({ categoryName, field, value }));
    },
    [dispatch]
  );

  const toggleSection = useCallback(
    (key) => {
      dispatch(toggleSectionAction(key));
    },
    [dispatch]
  );

  const updateSocialLink = useCallback(
    (platform, url) => {
      dispatch(updateSocialLinkAction({ platform, url }));
    },
    [dispatch]
  );

  const handleSelectTab = useCallback(
    (tabId) => {
      dispatch(setActiveSectionTab(tabId));
    },
    [dispatch]
  );

  const submit = useCallback(
    async (event) => {
      if (event?.preventDefault) event.preventDefault();
      try {
        const updated = await dispatch(
          saveAdminSettings({ accessToken, settings })
        ).unwrap();
        onFeedback?.("Site settings updated.");

        try {
          localStorage.setItem("nv_site_settings_updated", String(Date.now()));
          window.dispatchEvent(new CustomEvent("nv:settings-updated", { detail: updated }));
        } catch {}
      } catch (err) {
        onFeedback?.(err || "Failed to save settings.");
      }
    },
    [dispatch, accessToken, settings, onFeedback]
  );

  if (loading || !settings) {
    return (
      <div className="py-20 flex justify-center rounded-2xl bg-white shadow-sm border border-black/10">
        <LoadingIndicator label="Loading site settings…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Public Site Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control live event information, registration status, prize pools, and visible website sections.
          </p>
        </div>

        <Button
          onClick={submit}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold h-9 rounded-xl shadow-sm transition"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving…" : "Publish Changes"}
        </Button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-xs font-semibold ${
            feedback.includes("Failed") || feedback.includes("Could not")
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* INTERNAL SETTINGS TABS */}
      <SettingsNavTabs
        activeTab={activeSectionTab}
        onSelectTab={handleSelectTab}
      />

      {/* TAB CONTENT CARDS */}
      <form onSubmit={submit} className="space-y-6">
        {activeSectionTab === "logistics" && (
          <LogisticsSection
            settings={settings}
            updateField={updateField}
          />
        )}

        {activeSectionTab === "categories" && (
          <RaceCategoriesSection
            settings={settings}
            updateField={updateField}
            updateRaceCategory={updateRaceCategory}
          />
        )}

        {activeSectionTab === "prizes" && (
          <PrizesAndKitSection
            settings={settings}
            updateField={updateField}
          />
        )}

        {activeSectionTab === "visuals" && (
          <VisualsSection
            settings={settings}
            updateField={updateField}
          />
        )}

        {activeSectionTab === "social" && (
          <SocialLinksSection
            settings={settings}
            updateSocialLink={updateSocialLink}
          />
        )}

        {activeSectionTab === "visibility" && (
          <SectionsVisibilitySection
            settings={settings}
            toggleSection={toggleSection}
          />
        )}
      </form>
    </div>
  );
}

export default SettingsTab;
