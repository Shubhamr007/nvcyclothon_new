import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  createAdminVendorApplication,
  getAdminVendorDocument,
  exportAdminVendorsCsv,
} from "../../../api/http";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { downloadBlobFile } from "../../../utils/csv";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";
import { PartnerVendorCreateDrawer } from "../components/PartnerVendorCreateDrawer";
import {
  VendorDetailModal,
  VendorReviewModal,
  VendorHeaderBar,
  VendorFilterToolbar,
  VendorApplicationsTable,
  VendorAllocationsGrid,
  VENDOR_STATUSES,
  FilterPill,
} from "../vendors";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchVendors,
  reviewVendor,
  deleteSelectedVendors,
  setSubTab,
  setFilter,
  setSearch,
  toggleSelectId,
  selectAllVisible,
  setSelectedApp,
  setReviewModal,
  updateReviewModalField,
  clearFeedback,
} from "../../../store/slices/vendorsSlice";

export { VENDOR_STATUSES, FilterPill };

export function VendorsTab({ accessToken: propAccessToken, onFeedback }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;
  const {
    items: apps,
    loading,
    error,
    successMessage,
    subTab,
    filter,
    search,
    selectedIds,
    deleting,
    selectedApp,
    reviewModal,
  } = useAppSelector((state) => state.vendors);

  const debouncedSearch = useDebouncedValue(search, 300);

  // Sync feedback notifications
  useEffect(() => {
    if (successMessage) {
      onFeedback?.(successMessage);
      dispatch(clearFeedback());
    }
    if (error) {
      onFeedback?.(error);
      dispatch(clearFeedback());
    }
  }, [successMessage, error, onFeedback, dispatch]);

  // Load vendors when query or filter changes
  useEffect(() => {
    if (accessToken) {
      dispatch(
        fetchVendors({
          accessToken,
          status: filter,
          search: debouncedSearch,
        })
      );
    }
  }, [accessToken, filter, debouncedSearch, dispatch]);

  const handleUpdateStatus = useCallback(
    (id, status, notes) => {
      dispatch(reviewVendor({ accessToken, id, status, notes }));
    },
    [accessToken, dispatch]
  );

  const deleteSelected = useCallback(() => {
    dispatch(deleteSelectedVendors({ accessToken, ids: selectedIds }));
  }, [accessToken, selectedIds, dispatch]);

  const previewDocument = useCallback(
    async (id) => {
      try {
        const blob = await getAdminVendorDocument(accessToken, id);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (err) {
        onFeedback?.(err.message);
      }
    },
    [accessToken, onFeedback]
  );

  const handleExportCsv = useCallback(async () => {
    try {
      const blob = await exportAdminVendorsCsv(accessToken);
      downloadBlobFile(blob, "nv_cyclothon_vendors.csv");
      onFeedback?.("Exported vendors CSV successfully");
    } catch (err) {
      onFeedback?.(err.message);
    }
  }, [accessToken, onFeedback]);

  const handleCreate = useCallback(async (payload) => {
    setCreating(true);
    try {
      await createAdminVendorApplication(accessToken, payload);
      await dispatch(fetchVendors({ accessToken, status: filter, search: debouncedSearch }));
      onFeedback?.("Vendor added successfully");
    } finally {
      setCreating(false);
    }
  }, [accessToken, dispatch, filter, debouncedSearch, onFeedback]);

  const handleToggleSelectVendor = useCallback(
    (id) => {
      dispatch(toggleSelectId(id));
    },
    [dispatch]
  );

  const handleOpenReview = useCallback(
    (v) => {
      dispatch(
        setReviewModal({
          id: v.id,
          status: v.status,
          notes: v.review_notes || "",
        })
      );
    },
    [dispatch]
  );

  const handleSelectFilter = useCallback(
    (st) => {
      dispatch(setFilter(st));
    },
    [dispatch]
  );

  const approvedVendors = useMemo(() => {
    return apps.filter(
      (a) => a.status === "APPROVED" || a.status === "EVENT_READY" || a.status === "COMPLETED"
    );
  }, [apps]);

  return (
    <div className="space-y-6">
      {/* HEADER & TABS */}
      <VendorHeaderBar
        subTab={subTab}
        applicationsCount={apps.length}
        allocationsCount={approvedVendors.length}
        onSubTabChange={(tab) => dispatch(setSubTab(tab))}
        onExportCsv={handleExportCsv}
        onAdd={() => setCreateOpen(true)}
      />

      {subTab === "applications" && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
          <SelectedDeleteAction
            count={selectedIds.length}
            label="vendor application"
            busy={deleting}
            onDelete={deleteSelected}
          />

          {/* SEARCH & FILTERS */}
          <VendorFilterToolbar
            search={search}
            onSearchChange={(val) => dispatch(setSearch(val))}
            filter={filter}
            onSelectFilter={handleSelectFilter}
            statuses={VENDOR_STATUSES}
          />

          {/* TABLE */}
          <VendorApplicationsTable
            loading={loading}
            apps={apps}
            selectedIds={selectedIds}
            onSelectAll={(ids) => dispatch(selectAllVisible(ids))}
            onToggleSelect={handleToggleSelectVendor}
            onViewDetails={(a) => dispatch(setSelectedApp(a))}
            onPreviewDocument={previewDocument}
            onOpenReview={handleOpenReview}
          />
        </div>
      )}

      {subTab === "allocations" && (
        <VendorAllocationsGrid approvedVendors={approvedVendors} />
      )}

      {/* DETAIL MODAL */}
      <VendorDetailModal
        selectedApp={selectedApp}
        onClose={() => dispatch(setSelectedApp(null))}
        onPreviewDocument={previewDocument}
        onOpenReview={handleOpenReview}
      />

      {/* REVIEW STATUS MODAL */}
      <VendorReviewModal
        reviewModal={reviewModal}
        onClose={() => dispatch(setReviewModal(null))}
        onChangeStatusNotes={(field, value) =>
          dispatch(updateReviewModalField({ field, value }))
        }
        onSave={handleUpdateStatus}
      />
      <PartnerVendorCreateDrawer kind="vendor" isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} busy={creating} />
    </div>
  );
}

export default VendorsTab;
