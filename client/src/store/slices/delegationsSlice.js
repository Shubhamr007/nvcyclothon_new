import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminRequest, bulkDeleteAdminRecords } from "../../api/http";

// --- Async Thunks ---

export const fetchDelegations = createAsyncThunk(
  "delegations/fetchDelegations",
  async (accessToken, { rejectWithValue }) => {
    try {
      const data = await adminRequest("/delegations", accessToken);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch delegations.");
    }
  }
);

export const saveDelegation = createAsyncThunk(
  "delegations/saveDelegation",
  async ({ accessToken, delegationData, id }, { rejectWithValue }) => {
    try {
      const path = id ? `/delegations/${id}` : "/delegations";
      const method = id ? "PUT" : "POST";
      const result = await adminRequest(path, accessToken, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delegationData),
      });
      return { result, isEdit: Boolean(id) };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save delegation.");
    }
  }
);

export const deleteSelectedDelegations = createAsyncThunk(
  "delegations/deleteSelectedDelegations",
  async ({ accessToken, ids }, { rejectWithValue }) => {
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "delegation", ids);
      return { result, deletedIds: ids };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete delegations.");
    }
  }
);

// --- Initial State ---

const initialState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,

  // Filters
  searchQuery: "",
  filterType: "all", // "all" | "chief_guests" | "delegations"
  filterStatus: "all", // "all" | "confirmed" | "invited" | "attended" | "declined"

  // Selection
  selectedIds: [],

  // Drawer
  isDrawerOpen: false,
  drawerMode: "add", // "add" | "edit"
  activeDelegation: null,
  isSaving: false,

  // Delete modal
  isDeleteDialogOpen: false,
  targetDeleteIds: [],
  isDeleting: false,
};

export const delegationsSlice = createSlice({
  name: "delegations",
  initialState,
  reducers: {
    setInitialDelegations: (state, action) => {
      if (Array.isArray(action.payload) && state.items.length === 0) {
        state.items = action.payload;
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilterType: (state, action) => {
      state.filterType = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    toggleSelectId: (state, action) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((item) => item !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    setSelectedIds: (state, action) => {
      state.selectedIds = action.payload;
    },
    clearSelection: (state) => {
      state.selectedIds = [];
    },
    openAddDrawer: (state) => {
      state.drawerMode = "add";
      state.activeDelegation = null;
      state.isDrawerOpen = true;
    },
    openEditDrawer: (state, action) => {
      state.drawerMode = "edit";
      state.activeDelegation = action.payload;
      state.isDrawerOpen = true;
    },
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
      state.activeDelegation = null;
    },
    openDeleteDialog: (state, action) => {
      state.targetDeleteIds = action.payload || state.selectedIds;
      state.isDeleteDialogOpen = true;
    },
    closeDeleteDialog: (state) => {
      state.isDeleteDialogOpen = false;
      state.targetDeleteIds = [];
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchDelegations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDelegations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDelegations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Save
    builder
      .addCase(saveDelegation.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveDelegation.fulfilled, (state, action) => {
        state.isSaving = false;
        state.isDrawerOpen = false;
        state.activeDelegation = null;
        state.successMessage = action.payload.isEdit
          ? "VIP / Delegation updated successfully."
          : "VIP / Delegation added successfully.";
      })
      .addCase(saveDelegation.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteSelectedDelegations.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteSelectedDelegations.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.isDeleteDialogOpen = false;
        state.items = state.items.filter(
          (d) => !action.payload.deletedIds.includes(d.id)
        );
        state.selectedIds = state.selectedIds.filter(
          (id) => !action.payload.deletedIds.includes(id)
        );
        state.targetDeleteIds = [];
        state.successMessage = `${action.payload.result.deleted || action.payload.deletedIds.length} VIP/Delegation record(s) removed successfully.`;
      })
      .addCase(deleteSelectedDelegations.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  setInitialDelegations,
  setSearchQuery,
  setFilterType,
  setFilterStatus,
  toggleSelectId,
  setSelectedIds,
  clearSelection,
  openAddDrawer,
  openEditDrawer,
  closeDrawer,
  openDeleteDialog,
  closeDeleteDialog,
  clearMessages,
} = delegationsSlice.actions;

export default delegationsSlice.reducer;
