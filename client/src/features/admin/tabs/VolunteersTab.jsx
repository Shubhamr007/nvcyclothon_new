import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchVolunteers,
  createVolunteerRecord,
  toggleVolunteerActive,
  deleteSelectedVolunteers,
  sendCredentials,
  dispatchCertificate,
  bulkImportVolunteers,
  downloadTemplate,
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
} from "../../../store/slices/volunteersSlice";
import {
  VolunteerToolbar,
  VolunteerTable,
  VolunteerFormDrawer,
  VolunteerBulkImportDrawer,
} from "../volunteers";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { previewVolunteerCertificate } from "../../../api/http";

/**
 * Race Volunteer Directory & Credentials Management Tab.
 * Refactored from monolithic 1,310 lines into clean modular sub-components powered by Redux.
 */
export function VolunteersTab({ accessToken: propAccessToken, onFeedback }) {
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;
  const hasFetchedRef = useRef(false);
  const {
    items: volunteers,
    loading,
    busy,
    error,
    successMessage,
    searchQuery,
    roleFilter,
    statusFilter,
    selectedIds,
    drawerMode,
    recentImports,
    isDeleteDialogOpen,
    targetDeleteIds,
    isDeleting,
    copiedKey,
    downloadingTemplate,
  } = useAppSelector((state) => state.volunteers);

  // Initialize or fetch once on mount
  useEffect(() => {
    if (accessToken && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchVolunteers(accessToken));
    }
  }, [accessToken, dispatch]);

  // Toast / feedback message propagation
  useEffect(() => {
    if (successMessage) {
      onFeedback?.(successMessage);
      dispatch(clearMessages());
    }
    if (error) {
      onFeedback?.(error);
      dispatch(clearMessages());
    }
  }, [successMessage, error, onFeedback, dispatch]);

  // Filtered Volunteers list
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((vol) => {
      // Role filter
      if (roleFilter !== "all" && vol.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === "active" && !vol.active) return false;
      if (statusFilter === "disabled" && vol.active) return false;

      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (vol.display_name || "").toLowerCase().includes(query);
        const matchesId = (vol.volunteer_id || "").toLowerCase().includes(query);
        const matchesEmail = (vol.email || "").toLowerCase().includes(query);
        const matchesPhone = (vol.phone || "").toLowerCase().includes(query);
        const matchesOrg = (vol.organization || "").toLowerCase().includes(query);
        return matchesName || matchesId || matchesEmail || matchesPhone || matchesOrg;
      }

      return true;
    });
  }, [volunteers, roleFilter, statusFilter, searchQuery]);

  // Counts
  const activeCount = useMemo(() => volunteers.filter((v) => v.active).length, [volunteers]);
  const disabledCount = volunteers.length - activeCount;

  // Single or multiple records to delete
  const itemsToDelete = useMemo(() => {
    return volunteers.filter((v) => targetDeleteIds.includes(v.id));
  }, [volunteers, targetDeleteIds]);

  // Stable Callbacks (prevent re-renders)
  const handleToggleSelect = useCallback((id) => {
    dispatch(toggleSelectId(id));
  }, [dispatch]);

  const handleSelectAll = useCallback(() => {
    const allFilteredIds = filteredVolunteers.map((v) => v.id);
    const areAllSelected =
      allFilteredIds.length > 0 &&
      allFilteredIds.every((id) => selectedIds.includes(id));

    if (areAllSelected) {
      dispatch(setSelectedIds(selectedIds.filter((id) => !allFilteredIds.includes(id))));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...allFilteredIds]));
      dispatch(setSelectedIds(merged));
    }
  }, [filteredVolunteers, selectedIds, dispatch]);

  const handleToggleStatus = useCallback((vol) => {
    dispatch(toggleVolunteerActive({ accessToken, volunteer: vol }));
  }, [accessToken, dispatch]);

  const handleSendCredentials = useCallback((vol) => {
    dispatch(sendCredentials({ accessToken, volunteer: vol }));
  }, [accessToken, dispatch]);

  const handleSendCertificate = useCallback((vol) => {
    dispatch(dispatchCertificate({ accessToken, volunteer: vol }));
  }, [accessToken, dispatch]);

  const handlePreviewCertificate = useCallback(async (vol) => {
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      toast.warn("Please allow pop-ups to preview the volunteer certificate.");
      return;
    }
    try {
      const blob = await previewVolunteerCertificate(accessToken, vol.id);
      const blobUrl = URL.createObjectURL(blob);
      previewWindow.location.href = blobUrl;
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      previewWindow.close();
      toast.error(err.message || "Failed to preview certificate.");
    }
  }, [accessToken]);

  const handleCopy = useCallback(async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      dispatch(setCopiedKey(key));
      setTimeout(() => dispatch(setCopiedKey(null)), 2000);
    } catch (_) {
      // fallback
    }
  }, [dispatch]);

  const handleCreateVolunteer = (formData) => {
    dispatch(createVolunteerRecord({ accessToken, volunteerData: formData })).then(() => {
      dispatch(fetchVolunteers(accessToken));
    });
  };

  const handleBulkImport = (formData) => {
    dispatch(bulkImportVolunteers({ accessToken, formData })).then(() => {
      dispatch(fetchVolunteers(accessToken));
    });
  };

  const handleConfirmDelete = () => {
    dispatch(deleteSelectedVolunteers({ accessToken, ids: targetDeleteIds }));
  };

  if (loading && volunteers.length === 0) {
    return <LoadingIndicator label="Loading volunteers directory…" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <VolunteerToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => dispatch(setSearchQuery(q))}
        roleFilter={roleFilter}
        onRoleFilterChange={(r) => dispatch(setRoleFilter(r))}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => dispatch(setStatusFilter(s))}
        totalCount={volunteers.length}
        activeCount={activeCount}
        disabledCount={disabledCount}
        selectedCount={selectedIds.length}
        onAddClick={() => dispatch(openAddDrawer())}
        onBulkClick={() => dispatch(openBulkDrawer())}
        onDownloadTemplate={() => dispatch(downloadTemplate(accessToken))}
        downloadingTemplate={downloadingTemplate}
        onDeleteSelected={() => dispatch(openDeleteDialog())}
        onClearSelection={() => dispatch(clearSelection())}
      />

      {/* 2. Enterprise Data Grid Table */}
      <VolunteerTable
        volunteers={filteredVolunteers}
        selectedIds={selectedIds}
        copiedKey={copiedKey}
        busy={busy}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onToggleStatus={handleToggleStatus}
        onSendCredentials={handleSendCredentials}
        onPreviewCertificate={handlePreviewCertificate}
        onSendCertificate={handleSendCertificate}
        onCopy={handleCopy}
        onAddClick={() => dispatch(openAddDrawer())}
      />

      {/* 3. Add Volunteer SlideOver Drawer */}
      <VolunteerFormDrawer
        isOpen={drawerMode === "add"}
        onClose={() => dispatch(closeDrawer())}
        onSubmit={handleCreateVolunteer}
        busy={busy}
      />

      {/* 4. Bulk CSV Import SlideOver Drawer */}
      <VolunteerBulkImportDrawer
        isOpen={drawerMode === "bulk"}
        onClose={() => dispatch(closeDrawer())}
        onSubmit={handleBulkImport}
        onDownloadTemplate={() => dispatch(downloadTemplate(accessToken))}
        downloadingTemplate={downloadingTemplate}
        busy={busy}
        recentImports={recentImports}
      />

      {/* 5. Reusable Confirmation Dialog for Deletions */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => dispatch(closeDeleteDialog())}
        onConfirm={handleConfirmDelete}
        title={targetDeleteIds.length > 1 ? "Bulk Delete Volunteers" : "Delete Volunteer"}
        description={
          targetDeleteIds.length > 1
            ? "Are you sure you want to permanently delete the selected volunteer accounts?"
            : "Are you sure you want to permanently delete this volunteer account?"
        }
        count={targetDeleteIds.length}
        itemNames={itemsToDelete.map((v) => v.display_name)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default VolunteersTab;
