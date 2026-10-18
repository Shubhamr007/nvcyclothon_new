import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAdminSettings, updateSiteSettings } from "../../api/http";
import { DEFAULT_SECTIONS, DEFAULT_RACE_CATEGORIES } from "../../state/SiteSettingsContext";
import { DEFAULT_SOCIAL_LINKS } from "../../features/cyclothon/constants";

export const fetchAdminSettings = createAsyncThunk(
  "settings/fetchAdminSettings",
  async (accessToken, { rejectWithValue }) => {
    try {
      const data = await getAdminSettings(accessToken);
      const mergedSections = { ...DEFAULT_SECTIONS, ...(data?.sections || {}) };
      const mergedSocialLinks = { ...DEFAULT_SOCIAL_LINKS, ...(data?.social_links || {}) };
      const mergedCategories = { ...DEFAULT_RACE_CATEGORIES, ...(data?.race_categories || {}) };
      return {
        ...data,
        early_bird_limit: data?.early_bird_limit ?? 50,
        early_bird_enabled: data?.early_bird_enabled !== false,
        race_categories: mergedCategories,
        sections: mergedSections,
        social_links: mergedSocialLinks,
      };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load settings");
    }
  }
);

export const saveAdminSettings = createAsyncThunk(
  "settings/saveAdminSettings",
  async ({ accessToken, settings }, { rejectWithValue }) => {
    try {
      const payload = {
        ...settings,
        registration_open: Boolean(settings.registration_open),
        early_bird_limit: Number(settings.early_bird_limit) || 50,
        early_bird_enabled: Boolean(settings.early_bird_enabled !== false),
      };
      await updateSiteSettings(accessToken, payload);
      return payload;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save settings");
    }
  }
);

const initialState = {
  data: null,
  activeSectionTab: "logistics",
  loading: false,
  saving: false,
  error: null,
  feedback: "",
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setActiveSectionTab: (state, action) => {
      state.activeSectionTab = action.payload;
    },
    updateField: (state, action) => {
      const { key, value } = action.payload;
      if (state.data) {
        state.data[key] = value;
      }
    },
    updateRaceCategory: (state, action) => {
      const { categoryName, field, value } = action.payload;
      if (!state.data) return;
      if (!state.data.race_categories) {
        state.data.race_categories = { ...DEFAULT_RACE_CATEGORIES };
      }
      if (!state.data.race_categories[categoryName]) {
        state.data.race_categories[categoryName] = {
          ...(DEFAULT_RACE_CATEGORIES[categoryName] || {}),
        };
      }
      state.data.race_categories[categoryName][field] = value;
    },
    toggleSection: (state, action) => {
      const key = action.payload;
      if (!state.data) return;
      if (!state.data.sections) {
        state.data.sections = { ...DEFAULT_SECTIONS };
      }
      const isEnabled = state.data.sections[key] !== false;
      state.data.sections[key] = !isEnabled;
    },
    updateSocialLink: (state, action) => {
      const { platform, url } = action.payload;
      if (!state.data) return;
      if (!state.data.social_links) {
        state.data.social_links = { ...DEFAULT_SOCIAL_LINKS };
      }
      state.data.social_links[platform] = url;
    },
    clearFeedback: (state) => {
      state.feedback = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAdminSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAdminSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load settings";
      })
      // Save
      .addCase(saveAdminSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveAdminSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.data = { ...state.data, ...action.payload };
        state.feedback = "All settings saved successfully.";
      })
      .addCase(saveAdminSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save settings";
        state.feedback = action.payload || "Failed to save settings";
      });
  },
});

export const {
  setActiveSectionTab,
  updateField,
  updateRaceCategory,
  toggleSection,
  updateSocialLink,
  clearFeedback,
} = settingsSlice.actions;

export default settingsSlice.reducer;
