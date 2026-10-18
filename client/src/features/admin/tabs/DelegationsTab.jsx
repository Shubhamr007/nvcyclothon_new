import React, { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";

const EMPTY_ARRAY = [];
import {
  fetchDelegations,
  saveDelegation,
  deleteSelectedDelegations,
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
} from "../../../store/slices/delegationsSlice";
import {
  DelegationToolbar,
  DelegationTable,
  DelegationFormDrawer,
  parseGuestDetails,
} from "../delegations";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";

/**
 * VIP Dignitaries & Delegations Management Tab.
 * Refactored from monolithic 1,128 lines into clean modular sub-components powered by Redux.
 */
export function DelegationsTab({
  delegations: propDelegations = EMPTY_ARRAY,
  accessToken: propAccessToken,
  onFeedback,
}) {
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;
  const hasFetchedRef = useRef(false);
  const {
    items: delegations,
    loading,
    error,
    successMessage,
    searchQuery,
    filterType,
    filterStatus,
    selectedIds,
    isDrawerOpen,
    drawerMode,
    activeDelegation,
    isSaving,
    isDeleteDialogOpen,
    targetDeleteIds,
    isDeleting,
  } = useAppSelector((state) => state.delegations);

  // Initialize or fetch delegations once on mount
  useEffect(() => {
    if (propDelegations && propDelegations.length > 0) {
      dispatch(setInitialDelegations(propDelegations));
    } else if (accessToken && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchDelegations(accessToken));
    }
  }, [accessToken, propDelegations, dispatch]);

  // Propagate messages to parent notification handler
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

  // Filtered list
  const filteredList = useMemo(() => {
    return delegations.filter((item) => {
      const guestInfo = parseGuestDetails(item.notes);

      // Type filter
      if (filterType === "chief_guests" && !guestInfo.is_chief_guest) return false;
      if (filterType === "delegations" && guestInfo.is_chief_guest) return false;

      // Status filter
      if (filterStatus !== "all" && item.status !== filterStatus) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOrg = (item.organization || "").toLowerCase().includes(query);
        const matchesName = (item.contact_name || "").toLowerCase().includes(query);
        const matchesDesignation = (guestInfo.designation || "").toLowerCase().includes(query);
        const matchesRole = (guestInfo.ceremony_role || "").toLowerCase().includes(query);
        const matchesNotes = (guestInfo.general_notes || "").toLowerCase().includes(query);
        return matchesOrg || matchesName || matchesDesignation || matchesRole || matchesNotes;
      }

      return true;
    });
  }, [delegations, filterType, filterStatus, searchQuery]);

  // Counts
  const chiefGuestCount = useMemo(() => {
    return delegations.filter((d) => parseGuestDetails(d.notes).is_chief_guest).length;
  }, [delegations]);
  const delegationCount = delegations.length - chiefGuestCount;

  // Single or multiple records to delete
  const itemsToDelete = useMemo(() => {
    return delegations.filter((d) => targetDeleteIds.includes(d.id));
  }, [delegations, targetDeleteIds]);

  // Handlers
  const handleToggleSelect = (id) => {
    dispatch(toggleSelectId(id));
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredList.map((d) => d.id);
    const areAllSelected =
      allFilteredIds.length > 0 &&
      allFilteredIds.every((id) => selectedIds.includes(id));

    if (areAllSelected) {
      dispatch(setSelectedIds(selectedIds.filter((id) => !allFilteredIds.includes(id))));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...allFilteredIds]));
      dispatch(setSelectedIds(merged));
    }
  };

  const handleSaveDelegation = (formData, id) => {
    dispatch(saveDelegation({ accessToken, delegationData: formData, id }));
  };

  const handleConfirmDelete = () => {
    dispatch(deleteSelectedDelegations({ accessToken, ids: targetDeleteIds }));
  };

  const handleEditSelected = () => {
    if (selectedIds.length === 1) {
      const itemToEdit = delegations.find((d) => d.id === selectedIds[0]);
      if (itemToEdit) {
        dispatch(openEditDrawer(itemToEdit));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Search, Filters, and Action Buttons */}
      <DelegationToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => dispatch(setSearchQuery(q))}
        filterType={filterType}
        onFilterTypeChange={(t) => dispatch(setFilterType(t))}
        filterStatus={filterStatus}
        onFilterStatusChange={(s) => dispatch(setFilterStatus(s))}
        totalCount={delegations.length}
        chiefGuestCount={chiefGuestCount}
        delegationCount={delegationCount}
        selectedCount={selectedIds.length}
        onAddClick={() => dispatch(openAddDrawer())}
        onEditSelected={handleEditSelected}
        onDeleteSelected={() => dispatch(openDeleteDialog())}
        onClearSelection={() => dispatch(clearSelection())}
      />

      {/* 2. Enterprise Data Grid Table */}
      <DelegationTable
        delegations={filteredList}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onAddClick={() => dispatch(openAddDrawer())}
      />

      {/* 3. Right SlideOver Drawer Form (Add / Edit) */}
      <DelegationFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => dispatch(closeDrawer())}
        mode={drawerMode}
        delegation={activeDelegation}
        accessToken={accessToken}
        onSave={handleSaveDelegation}
        isSaving={isSaving}
      />

      {/* 4. Reusable Confirmation Dialog for Deletions */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => dispatch(closeDeleteDialog())}
        onConfirm={handleConfirmDelete}
        title={targetDeleteIds.length > 1 ? "Bulk Delete Records" : "Delete Record"}
        description={
          targetDeleteIds.length > 1
            ? "Are you sure you want to permanently delete the selected VIP / Delegation records?"
            : "Are you sure you want to permanently delete this record?"
        }
        count={targetDeleteIds.length}
        itemNames={itemsToDelete.map((d) => d.contact_name || d.organization)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default DelegationsTab;
