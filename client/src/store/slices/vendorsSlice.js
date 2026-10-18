import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  listAdminVendorApplications,
  reviewVendorApplication,
  bulkDeleteAdminRecords,
} from "../../api/http";

// --- Async Thunks ---

export const fetchVendors = createAsyncThunk(
  "vendors/fetchVendors",
  async ({ accessToken, status, search }, { rejectWithValue }) => {
    try {
      const data = await listAdminVendorApplications(accessToken, {
        status: status === "all" ? null : status,
        search,
      });
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch vendor applications.");
    }
  }
);

export const reviewVendor = createAsyncThunk(
  "vendors/reviewVendor",
  async ({ accessToken, id, status, notes }, { rejectWithValue }) => {
    try {
      await reviewVendorApplication(accessToken, id, { status, notes });
      return { id, status, notes };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update vendor application.");
    }
  }
);

export const deleteSelectedVendors = createAsyncThunk(
  "vendors/deleteSelectedVendors",
  async ({ accessToken, ids }, { rejectWithValue }) => {
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "vendor", ids);
      return { result, deletedIds: ids };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete vendor applications.");
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
  subTab: "applications", // "applications" | "allocations"
  filter: "all",
  search: "",

  // Selection
  selectedIds: [],
  deleting: false,

  // Modals & Active Records
  selectedApp: null,
  reviewModal: null,
};

export const vendorsSlice = createSlice({
  name: "vendors",
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
      // Fetch Vendors
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Review Vendor
      .addCase(reviewVendor.fulfilled, (state, action) => {
        const { id, status, notes } = action.payload;
        state.items = state.items.map((app) =>
          app.id === id ? { ...app, status, review_notes: notes } : app
        );
        if (state.selectedApp && state.selectedApp.id === id) {
          state.selectedApp = { ...state.selectedApp, status, review_notes: notes };
        }
        state.reviewModal = null;
        state.successMessage = `Vendor application marked as ${status}`;
      })
      .addCase(reviewVendor.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Bulk Delete
      .addCase(deleteSelectedVendors.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSelectedVendors.fulfilled, (state, action) => {
        state.deleting = false;
        const { result, deletedIds } = action.payload;
        state.items = state.items.filter((app) => !deletedIds.includes(app.id));
        state.selectedIds = [];
        state.successMessage = `${result.deleted} vendor application(s) deleted${
          result.skipped ? `; ${result.skipped} paid, reviewed, or approved record(s) were kept` : ""
        }.`;
      })
      .addCase(deleteSelectedVendors.rejected, (state, action) => {
        state.deleting = false;
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
  setReviewModal,
  updateReviewModalField,
  clearFeedback,
} = vendorsSlice.actions;

export default vendorsSlice.reducer;
