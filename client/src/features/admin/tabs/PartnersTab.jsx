import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  createAdminPartnerApplication,
  getAdminPartnerLogo,
  exportAdminPartnersCsv,
} from "../../../api/http";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { downloadBlobFile } from "../../../utils/csv";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";
import { PartnerVendorCreateDrawer } from "../components/PartnerVendorCreateDrawer";
import {
  PartnerDetailModal,
  PartnerDeliverablesModal,
  PartnerReviewModal,
  PartnerHeaderBar,
  PartnerFilterToolbar,
  PartnerApplicationsTable,
  PartnerApprovedGrid,
  PARTNER_STATUSES,
  FilterPill,
} from "../partners";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchPartners,
  reviewPartner,
  deleteSelectedPartners,
  fetchPartnerDeliverables,
  updateDeliverableStatus,
  setSubTab,
  setFilter,
  setSearch,
  toggleSelectId,
  selectAllVisible,
  setSelectedApp,
  setDeliverablesApp,
  setReviewModal,
  updateReviewModalField,
  clearFeedback,
} from "../../../store/slices/partnersSlice";

export { PARTNER_STATUSES, FilterPill };

export function PartnersTab({ accessToken: propAccessToken, onFeedback }) {
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
    deliverablesApp,
    deliverables,
    updatingDeliverable,
    reviewModal,
  } = useAppSelector((state) => state.partners);

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

  // Load partner applications on query/filter changes
  useEffect(() => {
    if (accessToken) {
      dispatch(
        fetchPartners({
          accessToken,
          status: filter,
          search: debouncedSearch,
        })
      );
    }
  }, [accessToken, filter, debouncedSearch, dispatch]);

  const handleUpdateStatus = useCallback(
    (id, status, notes) => {
      dispatch(reviewPartner({ accessToken, id, status, notes }));
    },
    [accessToken, dispatch]
  );

  const deleteSelected = useCallback(() => {
    dispatch(deleteSelectedPartners({ accessToken, ids: selectedIds }));
  }, [accessToken, selectedIds, dispatch]);

  const previewLogo = useCallback(
    async (id) => {
      try {
        const blob = await getAdminPartnerLogo(accessToken, id);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (err) {
        onFeedback?.(err.message);
      }
    },
    [accessToken, onFeedback]
  );

  const openDeliverables = useCallback(
    (app) => {
      dispatch(setDeliverablesApp(app));
      dispatch(fetchPartnerDeliverables({ accessToken, partnerId: app.id }));
    },
    [accessToken, dispatch]
  );

  const toggleDeliverable = useCallback(
    (deliverableId, currentStatus) => {
      if (!deliverablesApp) return;
      const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
      dispatch(
        updateDeliverableStatus({
          accessToken,
          partnerId: deliverablesApp.id,
          deliverableId,
          nextStatus,
        })
      );
    },
    [accessToken, deliverablesApp, dispatch]
  );

  const handleExportCsv = useCallback(async () => {
    try {
      const blob = await exportAdminPartnersCsv(accessToken);
      downloadBlobFile(blob, "nv_cyclothon_partners.csv");
      onFeedback?.("Exported partners CSV successfully");
    } catch (err) {
      onFeedback?.(err.message);
    }
  }, [accessToken, onFeedback]);

  const handleCreate = useCallback(async (payload) => {
    setCreating(true);
    try {
      await createAdminPartnerApplication(accessToken, payload);
      await dispatch(fetchPartners({ accessToken, status: filter, search: debouncedSearch }));
      onFeedback?.("Partner added successfully");
    } finally {
      setCreating(false);
    }
  }, [accessToken, dispatch, filter, debouncedSearch, onFeedback]);

  const handleToggleSelectPartner = useCallback(
    (id) => {
      dispatch(toggleSelectId(id));
    },
    [dispatch]
  );

  const handleOpenReview = useCallback(
    (app) => {
      dispatch(
        setReviewModal({
          id: app.id,
          status: app.status,
          notes: app.review_notes || "",
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

  const approvedList = useMemo(() => {
    return apps.filter(
      (a) => a.status === "APPROVED" || a.status === "EVENT_READY" || a.status === "COMPLETED"
    );
  }, [apps]);

  return (
    <div className="space-y-6">
      {/* HEADER & SUB-TABS */}
      <PartnerHeaderBar
        subTab={subTab}
        applicationsCount={apps.length}
        approvedCount={approvedList.length}
        onSubTabChange={(tab) => dispatch(setSubTab(tab))}
        onExportCsv={handleExportCsv}
        onAdd={() => setCreateOpen(true)}
      />

      {subTab === "applications" && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
          <SelectedDeleteAction
            count={selectedIds.length}
            label="partner application"
            busy={deleting}
            onDelete={deleteSelected}
          />

          {/* SEARCH & STATUS PILLS */}
          <PartnerFilterToolbar
            search={search}
            onSearchChange={(val) => dispatch(setSearch(val))}
            filter={filter}
            onSelectFilter={handleSelectFilter}
            statuses={PARTNER_STATUSES}
          />

          {/* APPLICATIONS TABLE */}
          <PartnerApplicationsTable
            loading={loading}
            apps={apps}
            selectedIds={selectedIds}
            onSelectAll={(ids) => dispatch(selectAllVisible(ids))}
            onToggleSelect={handleToggleSelectPartner}
            onViewDetails={(a) => dispatch(setSelectedApp(a))}
            onPreviewLogo={previewLogo}
            onOpenDeliverables={openDeliverables}
            onOpenReview={handleOpenReview}
          />
        </div>
      )}

      {subTab === "approved" && (
        <PartnerApprovedGrid
          approvedList={approvedList}
          onPreviewLogo={previewLogo}
          onOpenDeliverables={openDeliverables}
        />
      )}

      {/* MODAL: APPLICATION DETAILS */}
      <PartnerDetailModal
        selectedApp={selectedApp}
        onClose={() => dispatch(setSelectedApp(null))}
        onPreviewLogo={previewLogo}
        onOpenReview={handleOpenReview}
      />

      {/* MODAL: DELIVERABLES TRACKING */}
      <PartnerDeliverablesModal
        deliverablesApp={deliverablesApp}
        onClose={() => dispatch(setDeliverablesApp(null))}
        deliverables={deliverables}
        updatingDeliverable={updatingDeliverable}
        onToggleDeliverable={toggleDeliverable}
      />

      {/* MODAL: UPDATE STATUS & REVIEW */}
      <PartnerReviewModal
        reviewModal={reviewModal}
        onClose={() => dispatch(setReviewModal(null))}
        onChangeStatusNotes={(field, value) =>
          dispatch(updateReviewModalField({ field, value }))
        }
        onSave={handleUpdateStatus}
      />
      <PartnerVendorCreateDrawer kind="partner" isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} busy={creating} />
    </div>
  );
}

export default PartnersTab;
