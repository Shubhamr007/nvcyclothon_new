import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  listAdminCommunityPosts,
  moderateCommunityPost,
  bulkDeleteAdminRecords,
} from "../../api/http";

export const fetchCommunityPosts = createAsyncThunk(
  "community/fetchCommunityPosts",
  async ({ accessToken, statusFilter }, { rejectWithValue }) => {
    try {
      const data = await listAdminCommunityPosts(
        accessToken,
        statusFilter === "all" ? undefined : statusFilter
      );
      return data.items || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load community posts");
    }
  }
);

export const moderatePost = createAsyncThunk(
  "community/moderatePost",
  async ({ accessToken, id, nextStatus }, { rejectWithValue, dispatch, getState }) => {
    try {
      await moderateCommunityPost(accessToken, id, nextStatus);
      const state = getState().community;
      dispatch(fetchCommunityPosts({ accessToken, statusFilter: state.statusFilter }));
      return { id, nextStatus };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to moderate post");
    }
  }
);

export const deleteCommunityPosts = createAsyncThunk(
  "community/deleteCommunityPosts",
  async ({ accessToken, ids }, { rejectWithValue, dispatch, getState }) => {
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "community", ids);
      const state = getState().community;
      dispatch(fetchCommunityPosts({ accessToken, statusFilter: state.statusFilter }));
      return result;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete community posts");
    }
  }
);

const initialState = {
  items: [],
  statusFilter: "pending",
  loading: false,
  error: null,
  workingId: null,
  selectedIds: [],
};

export const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    toggleSelectedId: (state, action) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((x) => x !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    setSelectedIds: (state, action) => {
      state.selectedIds = action.payload;
    },
    clearSelectedIds: (state) => {
      state.selectedIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchCommunityPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommunityPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCommunityPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load community posts";
      })
      // Moderate post
      .addCase(moderatePost.pending, (state, action) => {
        state.workingId = action.meta.arg.id;
      })
      .addCase(moderatePost.fulfilled, (state) => {
        state.workingId = null;
      })
      .addCase(moderatePost.rejected, (state, action) => {
        state.workingId = null;
        state.error = action.payload || "Moderation action failed";
      })
      // Delete posts
      .addCase(deleteCommunityPosts.pending, (state) => {
        state.workingId = "bulk";
      })
      .addCase(deleteCommunityPosts.fulfilled, (state) => {
        state.workingId = null;
        state.selectedIds = [];
      })
      .addCase(deleteCommunityPosts.rejected, (state, action) => {
        state.workingId = null;
        state.error = action.payload || "Deletion failed";
      });
  },
});

export const {
  setStatusFilter,
  toggleSelectedId,
  setSelectedIds,
  clearSelectedIds,
} = communitySlice.actions;

export default communitySlice.reducer;
