import { configureStore } from "@reduxjs/toolkit";
import membersReducer from "./slices/membersSlice";
import delegationsReducer from "./slices/delegationsSlice";
import volunteersReducer from "./slices/volunteersSlice";
import partnersReducer from "./slices/partnersSlice";
import vendorsReducer from "./slices/vendorsSlice";
import authReducer from "./slices/authSlice";
import galleryReducer from "./slices/gallerySlice";
import participantsReducer from "./slices/participantsSlice";
import communityReducer from "./slices/communitySlice";
import settingsReducer from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    members: membersReducer,
    delegations: delegationsReducer,
    volunteers: volunteersReducer,
    partners: partnersReducer,
    vendors: vendorsReducer,
    gallery: galleryReducer,
    participants: participantsReducer,
    community: communityReducer,
    settings: settingsReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
