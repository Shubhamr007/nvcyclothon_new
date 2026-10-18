import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  listVolunteers,
  createVolunteer as apiCreateVolunteer,
  updateVolunteer as apiUpdateVolunteer,
  downloadVolunteerTemplate as apiDownloadVolunteerTemplate,
  bulkUploadVolunteers as apiBulkUploadVolunteers,
  sendVolunteerCredentials as apiSendVolunteerCredentials,
  sendVolunteerCertificate as apiSendVolunteerCertificate,
  bulkDeleteAdminRecords,
} from "../../api/http";

export const ROLE_OPTIONS = [
  "Check-in Desk",
  "Bib Distribution",
  "Route Marshal",
  "Hydration Station",
  "Medical Support",
  "Finish Line & Medals",
  "Lead Vehicle Escort",
  "VIP & Stage Management",
  "General Operations Crew",
];

// --- Async Thunks ---

export const fetchVolunteers = createAsyncThunk(
  "volunteers/fetchVolunteers",
  async (accessToken, { rejectWithValue }) => {
    try {
      const data = await listVolunteers(accessToken);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch volunteers.");
    }
  }
);

export const createVolunteerRecord = createAsyncThunk(
  "volunteers/createVolunteerRecord",
  async ({ accessToken, volunteerData }, { rejectWithValue }) => {
    try {
      const result = await apiCreateVolunteer(accessToken, volunteerData);
      return result;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create volunteer.");
    }
  }
);

export const toggleVolunteerActive = createAsyncThunk(
  "volunteers/toggleVolunteerActive",
  async ({ accessToken, volunteer }, { rejectWithValue }) => {
    try {
      const newActive = !volunteer.active;
      await apiUpdateVolunteer(accessToken, volunteer.id, { active: newActive });
      return { id: volunteer.id, active: newActive, name: volunteer.display_name };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update volunteer status.");
    }
  }
);

export const deleteSelectedVolunteers = createAsyncThunk(
  "volunteers/deleteSelectedVolunteers",
  async ({ accessToken, ids }, { rejectWithValue }) => {
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "volunteer", ids);
      return { result, deletedIds: ids };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete volunteers.");
    }
  }
);

export const sendCredentials = createAsyncThunk(
  "volunteers/sendCredentials",
  async ({ accessToken, volunteer }, { rejectWithValue }) => {
    try {
      const result = await apiSendVolunteerCredentials(accessToken, volunteer.id);
      return { id: volunteer.id, result, email: volunteer.email, volunteer_id: volunteer.volunteer_id };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to dispatch credentials.");
    }
  }
);

export const dispatchCertificate = createAsyncThunk(
  "volunteers/dispatchCertificate",
  async ({ accessToken, volunteer }, { rejectWithValue }) => {
    try {
      await apiSendVolunteerCertificate(accessToken, volunteer.id);
      return { id: volunteer.id, email: volunteer.email };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to send volunteer certificate.");
    }
  }
);

export const bulkImportVolunteers = createAsyncThunk(
  "volunteers/bulkImportVolunteers",
  async ({ accessToken, formData }, { rejectWithValue }) => {
    try {
      const result = await apiBulkUploadVolunteers(accessToken, formData);
      return result;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to bulk import volunteers.");
    }
  }
);

export const downloadTemplate = createAsyncThunk(
  "volunteers/downloadTemplate",
  async (accessToken, { rejectWithValue }) => {
    try {
      await apiDownloadVolunteerTemplate(accessToken);
      return true;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to download template.");
    }
  }
);

// --- Initial State ---

const initialState = {
  items: [],
  loading: false,
  busy: false,
  error: null,
  successMessage: null,

  // Filters & Search
  searchQuery: "",
  roleFilter: "all",
  statusFilter: "all", // "all" | "active" | "disabled"

  // Selection
  selectedIds: [],

  // Drawer
  drawerMode: null, // "add" | "bulk" | null
  activeVolunteer: null,
  recentImports: null,

  // Delete modal
  isDeleteDialogOpen: false,
  targetDeleteIds: [],
  isDeleting: false,

  // Quick feedback
  copiedKey: null,
  downloadingTemplate: false,
};

export const volunteersSlice = createSlice({
  name: "volunteers",
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setRoleFilter: (state, action) => {
      state.roleFilter = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
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
      state.activeVolunteer = null;
    },
    openBulkDrawer: (state) => {
      state.drawerMode = "bulk";
      state.recentImports = null;
    },
    closeDrawer: (state) => {
      state.drawerMode = null;
      state.activeVolunteer = null;
    },
    openDeleteDialog: (state, action) => {
      state.targetDeleteIds = action.payload || state.selectedIds;
      state.isDeleteDialogOpen = true;
    },
    closeDeleteDialog: (state) => {
      state.isDeleteDialogOpen = false;
      state.targetDeleteIds = [];
    },
    setCopiedKey: (state, action) => {
      state.copiedKey = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchVolunteers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVolunteers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVolunteers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create
    builder
      .addCase(createVolunteerRecord.pending, (state) => {
        state.busy = true;
        state.error = null;
      })
      .addCase(createVolunteerRecord.fulfilled, (state, action) => {
        state.busy = false;
        state.drawerMode = null;
        state.successMessage = action.payload.email_sent
          ? `Volunteer created and credentials emailed to ${action.payload.email}.`
          : `Volunteer account created. ID: ${action.payload.volunteer_id}`;
      })
      .addCase(createVolunteerRecord.rejected, (state, action) => {
        state.busy = false;
        state.error = action.payload;
      });

    // Toggle active
    builder.addCase(toggleVolunteerActive.fulfilled, (state, action) => {
      const vol = state.items.find((v) => v.id === action.payload.id);
      if (vol) {
        vol.active = action.payload.active;
      }
      state.successMessage = `Volunteer ${action.payload.name} is now ${action.payload.active ? "active" : "disabled"}.`;
    });

    // Delete
    builder
      .addCase(deleteSelectedVolunteers.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteSelectedVolunteers.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.isDeleteDialogOpen = false;
        state.items = state.items.filter((v) => !action.payload.deletedIds.includes(v.id));
        state.selectedIds = state.selectedIds.filter((id) => !action.payload.deletedIds.includes(id));
        state.targetDeleteIds = [];
        state.successMessage = `${action.payload.result.deleted || action.payload.deletedIds.length} volunteer record(s) deleted.`;
      })
      .addCase(deleteSelectedVolunteers.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });

    // Send credentials
    builder
      .addCase(sendCredentials.pending, (state) => {
        state.busy = true;
      })
      .addCase(sendCredentials.fulfilled, (state, action) => {
        state.busy = false;
        state.successMessage = action.payload.result.email_sent
          ? `Login credentials dispatched to ${action.payload.email}.`
          : `New password generated for ${action.payload.volunteer_id}: ${action.payload.result.generated_password}`;
      })
      .addCase(sendCredentials.rejected, (state, action) => {
        state.busy = false;
        state.error = action.payload;
      });

    // Send certificate
    builder
      .addCase(dispatchCertificate.pending, (state) => {
        state.busy = true;
      })
      .addCase(dispatchCertificate.fulfilled, (state, action) => {
        state.busy = false;
        state.successMessage = `Certificate of Volunteering emailed to ${action.payload.email}.`;
      })
      .addCase(dispatchCertificate.rejected, (state, action) => {
        state.busy = false;
        state.error = action.payload;
      });

    // Bulk Import
    builder
      .addCase(bulkImportVolunteers.pending, (state) => {
        state.busy = true;
        state.error = null;
      })
      .addCase(bulkImportVolunteers.fulfilled, (state, action) => {
        state.busy = false;
        state.recentImports = action.payload;
        state.successMessage = `Successfully imported ${action.payload.imported_count} volunteers (${action.payload.skipped_count} skipped).`;
      })
      .addCase(bulkImportVolunteers.rejected, (state, action) => {
        state.busy = false;
        state.error = action.payload;
      });

    // Download template
    builder
      .addCase(downloadTemplate.pending, (state) => {
        state.downloadingTemplate = true;
      })
      .addCase(downloadTemplate.fulfilled, (state) => {
        state.downloadingTemplate = false;
        state.successMessage = "Downloaded official volunteer Excel template.";
      })
      .addCase(downloadTemplate.rejected, (state, action) => {
        state.downloadingTemplate = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSearchQuery,
  setRoleFilter,
  setStatusFilter,
  toggleSelectId,
  setSelectedIds,
  clearSelection,
  openAddDrawer,
  openBulkDrawer,
  closeDrawer,
  openDeleteDialog,
  closeDeleteDialog,
  setCopiedKey,
  clearMessages,
} = volunteersSlice.actions;

export default volunteersSlice.reducer;
