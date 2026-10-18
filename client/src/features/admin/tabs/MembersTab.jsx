import React, { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";

const EMPTY_ARRAY = [];
import {
  fetchMembers,
  saveMember,
  deleteSelectedMembers,
  toggleMemberVisibility,
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
} from "../../../store/slices/membersSlice";
import { MemberToolbar, MemberTable, MemberFormDrawer } from "../members";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";

/**
 * Organizing Committee Members Management Tab.
 * Refactored from monolithic 1,092 lines into clean modular sub-components powered by Redux.
 */
export function MembersTab({
  members: propMembers = EMPTY_ARRAY,
  accessToken: propAccessToken,
  onFeedback,
}) {
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;
  const hasFetchedRef = useRef(false);
  const {
    items: members,
    loading,
    error,
    successMessage,
    searchQuery,
    visibilityFilter,
    selectedIds,
    isDrawerOpen,
    drawerMode,
    activeMember,
    isSaving,
    isDeleteDialogOpen,
    targetDeleteIds,
    isDeleting,
  } = useAppSelector((state) => state.members);

  // Initialize or fetch members once on mount
  useEffect(() => {
    if (propMembers && propMembers.length > 0) {
      dispatch(setInitialMembers(propMembers));
    } else if (accessToken && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchMembers(accessToken));
    }
  }, [accessToken, propMembers, dispatch]);

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

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members
      .filter((member) => {
        if (visibilityFilter === "visible" && !member.visible) return false;
        if (visibilityFilter === "hidden" && member.visible) return false;

        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const nameMatch = (member.name || "").toLowerCase().includes(query);
        const roleMatch = (member.role || "").toLowerCase().includes(query);
        const messageMatch = (member.message || "").toLowerCase().includes(query);
        return nameMatch || roleMatch || messageMatch;
      })
      .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
  }, [members, searchQuery, visibilityFilter]);

  const visibleCount = useMemo(
    () => members.filter((m) => m.visible).length,
    [members]
  );
  const hiddenCount = members.length - visibleCount;

  // Single or multiple members to delete
  const itemsToDelete = useMemo(() => {
    return members.filter((m) => targetDeleteIds.includes(m.id));
  }, [members, targetDeleteIds]);

  // Handlers
  const handleToggleSelect = (id) => {
    dispatch(toggleSelectId(id));
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredMembers.map((m) => m.id);
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

  const handleToggleVisibility = (member) => {
    dispatch(toggleMemberVisibility({ accessToken, member }));
  };

  const handleSaveMember = (formData, id) => {
    dispatch(saveMember({ accessToken, memberData: formData, id }));
  };

  const handleConfirmDelete = () => {
    dispatch(deleteSelectedMembers({ accessToken, ids: targetDeleteIds }));
  };

  const handleEditSelected = () => {
    if (selectedIds.length === 1) {
      const memberToEdit = members.find((m) => m.id === selectedIds[0]);
      if (memberToEdit) {
        dispatch(openEditDrawer(memberToEdit));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Search, Filters, and Action Buttons */}
      <MemberToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => dispatch(setSearchQuery(q))}
        visibilityFilter={visibilityFilter}
        onFilterChange={(f) => dispatch(setVisibilityFilter(f))}
        totalCount={members.length}
        visibleCount={visibleCount}
        hiddenCount={hiddenCount}
        selectedCount={selectedIds.length}
        onAddClick={() => dispatch(openAddDrawer())}
        onEditSelected={handleEditSelected}
        onDeleteSelected={() => dispatch(openDeleteDialog())}
        onClearSelection={() => dispatch(clearSelection())}
      />

      {/* 2. Enterprise Data Grid Table */}
      <MemberTable
        members={filteredMembers}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onToggleVisibility={handleToggleVisibility}
        onAddClick={() => dispatch(openAddDrawer())}
      />

      {/* 3. Right SlideOver Drawer Form (Add / Edit) */}
      <MemberFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => dispatch(closeDrawer())}
        mode={drawerMode}
        member={activeMember}
        accessToken={accessToken}
        onSave={handleSaveMember}
        isSaving={isSaving}
      />

      {/* 4. Reusable Confirmation Dialog for Deletions */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => dispatch(closeDeleteDialog())}
        onConfirm={handleConfirmDelete}
        title={targetDeleteIds.length > 1 ? "Bulk Delete Members" : "Delete Member"}
        description={
          targetDeleteIds.length > 1
            ? "Are you sure you want to permanently remove the selected committee members from the database?"
            : "Are you sure you want to permanently remove this committee member from the database?"
        }
        count={targetDeleteIds.length}
        itemNames={itemsToDelete.map((m) => m.name)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default MembersTab;
