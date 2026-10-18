import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminRequest, bulkDeleteAdminRecords } from "../../api/http";

const initialSingleForm = {
  title: "",
  caption: "",
  category: "Highlights",
  image_url: "",
  display_order: 0,
  featured: true,
};

// --- Async Thunks ---

export const fetchGallery = createAsyncThunk(
  "gallery/fetchGallery",
  async (accessToken, { rejectWithValue }) => {
    try {
      const data = await adminRequest("/gallery", accessToken);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch gallery items.");
    }
  }
);

export const deleteGalleryItems = createAsyncThunk(
  "gallery/deleteGalleryItems",
  async ({ accessToken, ids }, { rejectWithValue }) => {
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "gallery", ids);
      return { result, deletedIds: ids };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete photographs.");
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  activeTab: "All",
  selectedIds: [],

  // Batch modal
  isBatchModalOpen: false,
  batchCategory: "Highlights",
  batchFiles: [],
  batchBaseTitle: "",
  batchUploading: false,
  batchProgress: { current: 0, total: 0 },

  // Single modal
  isSingleModalOpen: false,
  editingItem: null,
  singleForm: initialSingleForm,
  singleUploading: false,

  // Delete modal
  deleteTargetItem: null,
  isDeleting: false,

  // Feedback
  feedbackMessage: null,
};

export const gallerySlice = createSlice({
  name: "gallery",
  initialState,
  reducers: {
    setInitialGallery: (state, action) => {
      state.items = action.payload || [];
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSelectedIds: (state, action) => {
      state.selectedIds = action.payload;
    },
    toggleSelectId: (state, action) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((item) => item !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    selectAllIds: (state, action) => {
      state.selectedIds = action.payload;
    },
    clearSelectedIds: (state) => {
      state.selectedIds = [];
    },

    // Single Photo
    openAddSingleModal: (state, action) => {
      state.editingItem = null;
      state.singleForm = {
        ...initialSingleForm,
        category: action.payload && action.payload !== "All" ? action.payload : "Highlights",
      };
      state.isSingleModalOpen = true;
    },
    openEditSingleModal: (state, action) => {
      const item = action.payload;
      state.editingItem = item;
      state.singleForm = {
        title: item.title || "",
        caption: item.caption || "",
        category: item.category || "Highlights",
        image_url: item.image_url || "",
        display_order: item.display_order ?? 0,
        featured: Boolean(item.featured),
      };
      state.isSingleModalOpen = true;
    },
    closeSingleModal: (state) => {
      state.isSingleModalOpen = false;
      state.editingItem = null;
      state.singleForm = initialSingleForm;
      state.singleUploading = false;
    },
    setSingleFormField: (state, action) => {
      const { field, value } = action.payload;
      state.singleForm[field] = value;
    },
    setSingleForm: (state, action) => {
      state.singleForm = action.payload;
    },
    setSingleUploading: (state, action) => {
      state.singleUploading = Boolean(action.payload);
    },

    // Batch Modal
    openBatchModal: (state, action) => {
      state.isBatchModalOpen = true;
      if (action.payload && action.payload !== "All") {
        state.batchCategory = action.payload;
      }
    },
    closeBatchModal: (state) => {
      state.isBatchModalOpen = false;
      state.batchFiles = [];
      state.batchBaseTitle = "";
      state.batchUploading = false;
      state.batchProgress = { current: 0, total: 0 };
    },
    setBatchCategory: (state, action) => {
      state.batchCategory = action.payload;
    },
    setBatchFiles: (state, action) => {
      state.batchFiles = action.payload;
    },
    setBatchBaseTitle: (state, action) => {
      state.batchBaseTitle = action.payload;
    },
    setBatchUploading: (state, action) => {
      state.batchUploading = Boolean(action.payload);
    },
    setBatchProgress: (state, action) => {
      state.batchProgress = action.payload;
    },

    // Delete
    openDeleteDialog: (state, action) => {
      state.deleteTargetItem = action.payload;
    },
    closeDeleteDialog: (state) => {
      state.deleteTargetItem = null;
      state.isDeleting = false;
    },
    setIsDeleting: (state, action) => {
      state.isDeleting = Boolean(action.payload);
    },

    // Feedback
    setFeedbackMessage: (state, action) => {
      state.feedbackMessage = action.payload;
    },
    clearFeedbackMessage: (state) => {
      state.feedbackMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchGallery
      .addCase(fetchGallery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteGalleryItems
      .addCase(deleteGalleryItems.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteGalleryItems.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedIds = action.payload.deletedIds || [];
        state.items = state.items.filter((item) => !deletedIds.includes(item.id));
        state.selectedIds = state.selectedIds.filter((id) => !deletedIds.includes(id));
        state.deleteTargetItem = null;
        state.feedbackMessage = `${action.payload.result?.deleted || deletedIds.length} photo(s) deleted.`;
      })
      .addCase(deleteGalleryItems.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  setInitialGallery,
  setActiveTab,
  setSelectedIds,
  toggleSelectId,
  selectAllIds,
  clearSelectedIds,
  openAddSingleModal,
  openEditSingleModal,
  closeSingleModal,
  setSingleFormField,
  setSingleForm,
  setSingleUploading,
  openBatchModal,
  closeBatchModal,
  setBatchCategory,
  setBatchFiles,
  setBatchBaseTitle,
  setBatchUploading,
  setBatchProgress,
  openDeleteDialog,
  closeDeleteDialog,
  setIsDeleting,
  setFeedbackMessage,
  clearFeedbackMessage,
} = gallerySlice.actions;

export default gallerySlice.reducer;
