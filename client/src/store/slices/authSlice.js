import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: "",
  refreshToken: "",
  accessTokenExpiresAt: 0,
  message: "",
  loading: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload || "";
    },
    setAdminSession: (state, action) => {
      const session = action.payload || {};
      state.accessToken = session.access_token || "";
      state.refreshToken = session.refresh_token || "";
      state.accessTokenExpiresAt = Date.now() + Math.max(0, Number(session.expires_in || 0) * 1000);
    },
    clearAccessToken: (state) => {
      state.accessToken = "";
      state.refreshToken = "";
      state.accessTokenExpiresAt = 0;
      state.message = "";
    },
    setFeedbackMessage: (state, action) => {
      state.message = action.payload || "";
    },
    clearFeedbackMessage: (state) => {
      state.message = "";
    },
    setAuthLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
  },
});

export const {
  setAccessToken,
  setAdminSession,
  clearAccessToken,
  setFeedbackMessage,
  clearFeedbackMessage,
  setAuthLoading,
} = authSlice.actions;

export default authSlice.reducer;
