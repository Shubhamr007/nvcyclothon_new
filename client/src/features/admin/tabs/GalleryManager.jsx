import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import {
  GalleryBatchDrawer,
  GallerySingleDrawer,
  GalleryHeaderBar,
  GalleryCategoryFilterBar,
  GalleryGrid,
  GALLERY_CATEGORIES,
  CategoryPill,
  useGalleryActions,
} from "../gallery";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  setActiveTab,
  toggleSelectId,
  selectAllIds,
  openAddSingleModal,
  openEditSingleModal,
  closeSingleModal,
  setSingleForm,
  setSingleUploading,
  openBatchModal,
  closeBatchModal,
  setBatchCategory,
  setBatchFiles,
  setBatchBaseTitle,
  openDeleteDialog,
  closeDeleteDialog,
  setInitialGallery,
  fetchGallery,
} from "../../../store/slices/gallerySlice";

const EMPTY_ARRAY = [];

export const CATEGORIES = GALLERY_CATEGORIES;
export { CategoryPill };

export function GalleryManager({
  items: propItems = EMPTY_ARRAY,
  accessToken: propAccessToken,
  onRefresh,
  onBulkRemove,
  onFeedback,
}) {
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;
  const hasFetchedRef = useRef(false);

  const {
    items: reduxItems = EMPTY_ARRAY,
    activeTab,
    selectedIds,
    isBatchModalOpen,
    batchCategory,
    batchFiles,
    batchBaseTitle,
    batchUploading,
    batchProgress,
    isSingleModalOpen,
    editingItem,
    singleForm,
    singleUploading,
    deleteTargetItem,
    isDeleting,
  } = useAppSelector((state) => state.gallery);

  const items = propItems && propItems.length > 0 ? propItems : reduxItems;

  useEffect(() => {
    if (propItems && propItems.length > 0) {
      dispatch(setInitialGallery(propItems));
    } else if (accessToken && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchGallery(accessToken));
    }
  }, [accessToken, propItems, dispatch]);

  const filteredItems = useMemo(() => {
    if (activeTab === "All") return items;
    return items.filter(
      (item) => (item.category || "").toLowerCase() === activeTab.toLowerCase()
    );
  }, [items, activeTab]);

  const categoryCounts = useMemo(() => {
    const counts = { All: items.length };
    GALLERY_CATEGORIES.forEach((cat) => {
      if (cat !== "All") counts[cat] = 0;
    });
    items.forEach((item) => {
      const cat = item.category || "Highlights";
      const matchingKey = GALLERY_CATEGORIES.find(
        (c) => c.toLowerCase() === cat.toLowerCase()
      );
      if (matchingKey && matchingKey !== "All") {
        counts[matchingKey] = (counts[matchingKey] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const handleSelectCategory = useCallback(
    (cat) => {
      dispatch(setActiveTab(cat));
    },
    [dispatch]
  );

  const isAllSelected = useMemo(() => {
    const visibleIds = filteredItems.map((item) => item.id);
    return visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  }, [filteredItems, selectedIds]);

  const handleToggleSelectAll = useCallback(() => {
    const visibleIds = filteredItems.map((item) => item.id);
    if (isAllSelected) {
      dispatch(selectAllIds(selectedIds.filter((id) => !visibleIds.includes(id))));
    } else {
      dispatch(selectAllIds(Array.from(new Set([...selectedIds, ...visibleIds]))));
    }
  }, [filteredItems, selectedIds, isAllSelected, dispatch]);

  const handleToggleSelect = useCallback(
    (id) => {
      dispatch(toggleSelectId(id));
    },
    [dispatch]
  );

  const handleOpenAddSingle = useCallback(() => {
    dispatch(openAddSingleModal(activeTab));
  }, [activeTab, dispatch]);

  const handleOpenEdit = useCallback(
    (item) => {
      dispatch(openEditSingleModal(item));
    },
    [dispatch]
  );

  const handleCloseSingleModal = useCallback(() => {
    dispatch(closeSingleModal());
  }, [dispatch]);

  const triggerRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else if (accessToken) {
      dispatch(fetchGallery(accessToken));
    }
  }, [onRefresh, accessToken, dispatch]);

  const handleOpenBatchModal = useCallback(() => {
    dispatch(openBatchModal(activeTab));
  }, [activeTab, dispatch]);

  const handleCloseBatchModal = useCallback(() => {
    dispatch(closeBatchModal());
  }, [dispatch]);

  const {
    handleSingleSave,
    handleBatchUpload,
    handleConfirmDeleteItem,
    handleBulkDelete,
  } = useGalleryActions({
    accessToken,
    singleForm,
    editingItem,
    batchFiles,
    batchBaseTitle,
    batchCategory,
    deleteTargetItem,
    selectedIds,
    onFeedback,
    triggerRefresh,
    onBulkRemove,
  });

  const handleOpenDelete = useCallback(
    (item) => {
      dispatch(openDeleteDialog(item));
    },
    [dispatch]
  );

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <GalleryHeaderBar
        totalCount={items.length}
        onOpenBatchUpload={handleOpenBatchModal}
        onOpenAddSingle={handleOpenAddSingle}
      />

      {/* CATEGORY TABS & SELECT ALL */}
      <GalleryCategoryFilterBar
        categories={GALLERY_CATEGORIES}
        categoryCounts={categoryCounts}
        activeTab={activeTab}
        onSelectCategory={handleSelectCategory}
        filteredCount={filteredItems.length}
        isAllSelected={isAllSelected}
        onToggleSelectAll={handleToggleSelectAll}
      />

      {/* BULK DELETE ACTION BAR */}
      <SelectedDeleteAction
        count={selectedIds.length}
        label="photograph"
        onDelete={handleBulkDelete}
      />

      {/* PHOTO TILES STREAM / GRID */}
      <GalleryGrid
        items={filteredItems}
        activeTab={activeTab}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* BATCH UPLOAD SLIDE-OVER DRAWER */}
      <GalleryBatchDrawer
        isOpen={isBatchModalOpen}
        onClose={handleCloseBatchModal}
        batchCategory={batchCategory}
        setBatchCategory={(val) => dispatch(setBatchCategory(val))}
        batchBaseTitle={batchBaseTitle}
        setBatchBaseTitle={(val) => dispatch(setBatchBaseTitle(val))}
        batchFiles={batchFiles}
        setBatchFiles={(val) => dispatch(setBatchFiles(val))}
        batchUploading={batchUploading}
        batchProgress={batchProgress}
        onSubmit={handleBatchUpload}
      />

      {/* SINGLE PHOTO ADD/EDIT SLIDE-OVER DRAWER */}
      <GallerySingleDrawer
        isOpen={isSingleModalOpen}
        onClose={handleCloseSingleModal}
        editingItem={editingItem}
        singleForm={singleForm}
        setSingleForm={(val) => dispatch(setSingleForm(val))}
        singleUploading={singleUploading}
        setSingleUploading={(val) => dispatch(setSingleUploading(val))}
        accessToken={accessToken}
        onFeedback={onFeedback}
        onSubmit={handleSingleSave}
      />

      {/* PHOTO DELETE CONFIRMATION DIALOG */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteTargetItem)}
        onClose={() => dispatch(closeDeleteDialog())}
        onConfirm={handleConfirmDeleteItem}
        title="Remove Photograph"
        description="Are you sure you want to remove this photograph? It will be immediately removed from the public website gallery."
        count={1}
        itemNames={deleteTargetItem ? [deleteTargetItem.title || "Photograph"] : []}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default GalleryManager;
