import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminRequest, bulkDeleteAdminRecords } from "../../api/http";

// --- Async Thunks ---

export const fetchMembers = createAsyncThunk(
  "members/fetchMembers",
  async (accessToken, { rejectWithValue }) => {
    try {
      const data = await adminRequest("/organizing-members", accessToken);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch organizing members.");
    }
  }
);

export const saveMember = createAsyncThunk(
  "members/saveMember",
  async ({ accessToken, memberData, id }, { rejectWithValue }) => {
    try {
      const path = id ? `/organizing-members/${id}` : "/organizing-members";
      const method = id ? "PUT" : "POST";
      const result = await adminRequest(path, accessToken, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });
      return { result, isEdit: Boolean(id) };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save member.");
    }
  }
);

export const deleteSelectedMembers = createAsyncThunk(
  "members/deleteSelectedMembers",
  async ({ accessToken, ids }, { rejectWithValue }) => {
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "member", ids);
      return { result, deletedIds: ids };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete members.");
    }
  }
);

export const toggleMemberVisibility = createAsyncThunk(
  "members/toggleMemberVisibility",
  async ({ accessToken, member }, { rejectWithValue }) => {
    try {
      const updatedPayload = {
        name: member.name,
        role: member.role,
        message: member.message,
        image_url: member.image_url,
        display_order: Number(member.display_order) || 0,
        visible: !member.visible,
      };
      await adminRequest(`/organizing-members/${member.id}`, accessToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });
      return { id: member.id, visible: !member.visible };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update member visibility.");
    }
  }
);

// --- Initial State ---

const initialState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,

  // Filters & Search
  searchQuery: "",
  visibilityFilter: "all", // "all" | "visible" | "hidden"

  // Selection
  selectedIds: [],

  // Drawer state
  isDrawerOpen: false,
  drawerMode: "add", // "add" | "edit"
  activeMember: null,
  isSaving: false,

  // Delete modal state
  isDeleteDialogOpen: false,
  targetDeleteIds: [],
  isDeleting: false,
};

// --- Slice Definition ---

export const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    setInitialMembers: (state, action) => {
      if (Array.isArray(action.payload) && state.items.length === 0) {
        state.items = action.payload;
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setVisibilityFilter: (state, action) => {
      state.visibilityFilter = action.payload;
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
      state.activeMember = null;
      state.isDrawerOpen = true;
    },
    openEditDrawer: (state, action) => {
      state.drawerMode = "edit";
      state.activeMember = action.payload;
      state.isDrawerOpen = true;
    },
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
      state.activeMember = null;
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
    // Fetch members
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Save member (add/edit)
    builder
      .addCase(saveMember.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveMember.fulfilled, (state, action) => {
        state.isSaving = false;
        state.isDrawerOpen = false;
        state.activeMember = null;
        state.successMessage = action.payload.isEdit
          ? "Member updated successfully."
          : "Member added successfully.";
      })
      .addCase(saveMember.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });

    // Delete members
    builder
      .addCase(deleteSelectedMembers.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteSelectedMembers.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.isDeleteDialogOpen = false;
        state.items = state.items.filter(
          (m) => !action.payload.deletedIds.includes(m.id)
        );
        state.selectedIds = state.selectedIds.filter(
          (id) => !action.payload.deletedIds.includes(id)
        );
        state.targetDeleteIds = [];
        state.successMessage = `${action.payload.result.deleted || action.payload.deletedIds.length} member(s) removed successfully.`;
      })
      .addCase(deleteSelectedMembers.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });

    // Toggle visibility
    builder.addCase(toggleMemberVisibility.fulfilled, (state, action) => {
      const member = state.items.find((m) => m.id === action.payload.id);
      if (member) {
        member.visible = action.payload.visible;
      }
    });
  },
});

export const {
  setInitialMembers,
  setSearchQuery,
  setVisibilityFilter,
  toggleSelectId,
  setSelectedIds,
  clearSelection,
  openAddDrawer,
  openEditDrawer,
  closeDrawer,
  openDeleteDialog,
  closeDeleteDialog,
  clearMessages,
} = membersSlice.actions;

export default membersSlice.reducer;
