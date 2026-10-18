import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  listAdminPartnerApplications,
  reviewPartnerApplication,
  getAdminPartnerDeliverables,
  updateAdminPartnerDeliverable,
  bulkDeleteAdminRecords,
} from "../../api/http";

// --- Async Thunks ---

export const fetchPartners = createAsyncThunk(
  "partners/fetchPartners",
  async ({ accessToken, status, search }, { rejectWithValue }) => {
    try {
      const data = await listAdminPartnerApplications(accessToken, {
        status: status === "all" ? null : status,
        search,
      });
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch partner applications.");
    }
  }
);

export const reviewPartner = createAsyncThunk(
  "partners/reviewPartner",
  async ({ accessToken, id, status, notes }, { rejectWithValue }) => {
    try {
      await reviewPartnerApplication(accessToken, id, { status, notes });
      return { id, status, notes };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update partner application.");
    }
  }
);

export const deleteSelectedPartners = createAsyncThunk(
  "partners/deleteSelectedPartners",
  async ({ accessToken, ids }, { rejectWithValue }) => {
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "partner", ids);
      return { result, deletedIds: ids };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete partner applications.");
    }
  }
);

export const fetchPartnerDeliverables = createAsyncThunk(
  "partners/fetchPartnerDeliverables",
  async ({ accessToken, partnerId }, { rejectWithValue }) => {
    try {
      const data = await getAdminPartnerDeliverables(accessToken, partnerId);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch partner deliverables.");
    }
  }
);

export const updateDeliverableStatus = createAsyncThunk(
  "partners/updateDeliverableStatus",
  async ({ accessToken, partnerId, deliverableId, nextStatus }, { rejectWithValue }) => {
    try {
      const updated = await updateAdminPartnerDeliverable(
        accessToken,
        partnerId,
        deliverableId,
        { status: nextStatus }
      );
      return { deliverableId, updated, nextStatus };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update deliverable status.");
    }
  }
);

// --- Initial State ---

const initialState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,

  // Filters & Tabs
  subTab: "applications", // "applications" | "approved"
  filter: "all",
  search: "",

  // Selection
  selectedIds: [],
  deleting: false,

  // Modals & Active Records
  selectedApp: null,
  deliverablesApp: null,
  deliverables: [],
  updatingDeliverable: false,
  reviewModal: null,
};

export const partnersSlice = createSlice({
  name: "partners",
  initialState,
  reducers: {
    setSubTab: (state, action) => {
      state.subTab = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    toggleSelectId: (state, action) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((item) => item !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    selectAllVisible: (state, action) => {
      const ids = action.payload;
      state.selectedIds = ids;
    },
    clearSelection: (state) => {
      state.selectedIds = [];
    },
    setSelectedApp: (state, action) => {
      state.selectedApp = action.payload;
    },
    setDeliverablesApp: (state, action) => {
      state.deliverablesApp = action.payload;
      if (!action.payload) {
        state.deliverables = [];
      }
    },
    setReviewModal: (state, action) => {
      state.reviewModal = action.payload;
    },
    updateReviewModalField: (state, action) => {
      const { field, value } = action.payload;
      if (state.reviewModal) {
        state.reviewModal[field] = value;
      }
    },
    clearFeedback: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Partners
      .addCase(fetchPartners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartners.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Review Partner
      .addCase(reviewPartner.fulfilled, (state, action) => {
        const { id, status, notes } = action.payload;
        state.items = state.items.map((app) =>
          app.id === id ? { ...app, status, review_notes: notes } : app
        );
        if (state.selectedApp && state.selectedApp.id === id) {
          state.selectedApp = { ...state.selectedApp, status, review_notes: notes };
        }
        state.reviewModal = null;
        state.successMessage = `Partner application marked as ${status}`;
      })
      .addCase(reviewPartner.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Bulk Delete
      .addCase(deleteSelectedPartners.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSelectedPartners.fulfilled, (state, action) => {
        state.deleting = false;
        const { result, deletedIds } = action.payload;
        state.items = state.items.filter((app) => !deletedIds.includes(app.id));
        state.selectedIds = [];
        state.successMessage = `${result.deleted} partner application(s) deleted${
          result.skipped ? `; ${result.skipped} paid, reviewed, or approved record(s) were kept` : ""
        }.`;
      })
      .addCase(deleteSelectedPartners.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })

      // Deliverables
      .addCase(fetchPartnerDeliverables.fulfilled, (state, action) => {
        state.deliverables = action.payload;
      })
      .addCase(fetchPartnerDeliverables.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateDeliverableStatus.pending, (state) => {
        state.updatingDeliverable = true;
      })
      .addCase(updateDeliverableStatus.fulfilled, (state, action) => {
        state.updatingDeliverable = false;
        const { deliverableId, updated, nextStatus } = action.payload;
        state.deliverables = state.deliverables.map((d) =>
          d.id === deliverableId ? updated : d
        );
        state.successMessage = `Deliverable marked as ${nextStatus}`;
      })
      .addCase(updateDeliverableStatus.rejected, (state, action) => {
        state.updatingDeliverable = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSubTab,
  setFilter,
  setSearch,
  toggleSelectId,
  selectAllVisible,
  clearSelection,
  setSelectedApp,
  setDeliverablesApp,
  setReviewModal,
  updateReviewModalField,
  clearFeedback,
} = partnersSlice.actions;

export default partnersSlice.reducer;
