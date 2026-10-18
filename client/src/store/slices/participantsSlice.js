import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Directory state
  directory: {
    selectedIds: [],
    expandedIds: [],
    busy: false,
    batchProgress: null,
    searchText: "",
    certificateFilter: "all",
    routeFilter: "all",
    statusFilter: "all",
    page: 1,
    pageSize: 20,
    qrModalRider: null,
    copiedId: null,
  },

  // Roster state
  roster: {
    searchText: "",
    route: "all",
    batch: "all",
    selectedIds: [],
    batchModalOpen: false,
    isBatchSaving: false,
    ageBracket: "all",
    minAge: "",
    maxAge: "",
    gender: "all",
    status: "all",
    page: 1,
    pageSize: 25,
    qrModalRider: null,
  },
};

export const participantsSlice = createSlice({
  name: "participants",
  initialState,
  reducers: {
    // --- Directory Reducers ---
    setDirectorySearchText: (state, action) => {
      state.directory.searchText = action.payload;
      state.directory.page = 1;
    },
    setDirectoryCertificateFilter: (state, action) => {
      state.directory.certificateFilter = action.payload;
      state.directory.page = 1;
    },
    setDirectoryRouteFilter: (state, action) => {
      state.directory.routeFilter = action.payload;
      state.directory.page = 1;
    },
    setDirectoryStatusFilter: (state, action) => {
      state.directory.statusFilter = action.payload;
      state.directory.page = 1;
    },
    setDirectoryPage: (state, action) => {
      state.directory.page = action.payload;
    },
    setDirectoryPageSize: (state, action) => {
      state.directory.pageSize = action.payload;
      state.directory.page = 1;
    },
    setDirectorySelectedIds: (state, action) => {
      state.directory.selectedIds = action.payload;
    },
    toggleDirectorySelectId: (state, action) => {
      const id = action.payload;
      if (state.directory.selectedIds.includes(id)) {
        state.directory.selectedIds = state.directory.selectedIds.filter((item) => item !== id);
      } else {
        state.directory.selectedIds.push(id);
      }
    },
    clearDirectorySelectedIds: (state) => {
      state.directory.selectedIds = [];
    },
    toggleDirectoryExpandedId: (state, action) => {
      const id = action.payload;
      if (state.directory.expandedIds.includes(id)) {
        state.directory.expandedIds = state.directory.expandedIds.filter((item) => item !== id);
      } else {
        state.directory.expandedIds.push(id);
      }
    },
    expandAllDirectoryVisible: (state, action) => {
      state.directory.expandedIds = action.payload;
    },
    collapseAllDirectory: (state) => {
      state.directory.expandedIds = [];
    },
    setDirectoryBusy: (state, action) => {
      state.directory.busy = Boolean(action.payload);
    },
    setDirectoryBatchProgress: (state, action) => {
      state.directory.batchProgress = action.payload;
    },
    setDirectoryQrModalRider: (state, action) => {
      state.directory.qrModalRider = action.payload;
    },
    setDirectoryCopiedId: (state, action) => {
      state.directory.copiedId = action.payload;
    },

    // --- Roster Reducers ---
    setRosterSearchText: (state, action) => {
      state.roster.searchText = action.payload;
      state.roster.page = 1;
    },
    setRosterRoute: (state, action) => {
      state.roster.route = action.payload;
      state.roster.page = 1;
    },
    setRosterBatch: (state, action) => {
      state.roster.batch = action.payload;
      state.roster.page = 1;
    },
    setRosterAgeBracket: (state, action) => {
      state.roster.ageBracket = action.payload;
      state.roster.page = 1;
    },
    setRosterMinAge: (state, action) => {
      state.roster.minAge = action.payload;
      state.roster.page = 1;
    },
    setRosterMaxAge: (state, action) => {
      state.roster.maxAge = action.payload;
      state.roster.page = 1;
    },
    setRosterGender: (state, action) => {
      state.roster.gender = action.payload;
      state.roster.page = 1;
    },
    setRosterStatus: (state, action) => {
      state.roster.status = action.payload;
      state.roster.page = 1;
    },
    setRosterPage: (state, action) => {
      state.roster.page = action.payload;
    },
    setRosterPageSize: (state, action) => {
      state.roster.pageSize = action.payload;
      state.roster.page = 1;
    },
    setRosterSelectedIds: (state, action) => {
      state.roster.selectedIds = action.payload;
    },
    toggleRosterSelectId: (state, action) => {
      const id = action.payload;
      if (state.roster.selectedIds.includes(id)) {
        state.roster.selectedIds = state.roster.selectedIds.filter((item) => item !== id);
      } else {
        state.roster.selectedIds.push(id);
      }
    },
    setRosterBatchModalOpen: (state, action) => {
      state.roster.batchModalOpen = Boolean(action.payload);
    },
    setRosterBatchSaving: (state, action) => {
      state.roster.isBatchSaving = Boolean(action.payload);
    },
    setRosterQrModalRider: (state, action) => {
      state.roster.qrModalRider = action.payload;
    },
  },
});

export const {
  setDirectorySearchText,
  setDirectoryCertificateFilter,
  setDirectoryRouteFilter,
  setDirectoryStatusFilter,
  setDirectoryPage,
  setDirectoryPageSize,
  setDirectorySelectedIds,
  toggleDirectorySelectId,
  clearDirectorySelectedIds,
  toggleDirectoryExpandedId,
  expandAllDirectoryVisible,
  collapseAllDirectory,
  setDirectoryBusy,
  setDirectoryBatchProgress,
  setDirectoryQrModalRider,
  setDirectoryCopiedId,
  setRosterSearchText,
  setRosterRoute,
  setRosterBatch,
  setRosterAgeBracket,
  setRosterMinAge,
  setRosterMaxAge,
  setRosterGender,
  setRosterStatus,
  setRosterPage,
  setRosterPageSize,
  setRosterSelectedIds,
  toggleRosterSelectId,
  setRosterBatchModalOpen,
  setRosterBatchSaving,
  setRosterQrModalRider,
} = participantsSlice.actions;

export default participantsSlice.reducer;
