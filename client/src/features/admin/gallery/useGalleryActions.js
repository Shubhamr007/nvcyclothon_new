import { useCallback } from "react";
import { useAppDispatch } from "../../../store/hooks";
import {
  closeSingleModal,
  closeBatchModal,
  setBatchUploading,
  setBatchProgress,
  setIsDeleting,
  closeDeleteDialog,
  clearSelectedIds,
  deleteGalleryItems,
} from "../../../store/slices/gallerySlice";
import {
  executeBatchPhotoUpload,
  saveSinglePhoto,
  deleteSinglePhoto,
} from "./galleryService";

export function useGalleryActions({
  accessToken,
  singleForm,
  editingItem,
  batchFiles = [],
  batchBaseTitle,
  batchCategory,
  deleteTargetItem,
  selectedIds = [],
  onFeedback,
  triggerRefresh,
  onBulkRemove,
}) {
  const dispatch = useAppDispatch();

  const handleSingleSave = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();
      try {
        await saveSinglePhoto(accessToken, {
          singleForm,
          editingId: editingItem?.id,
        });
        onFeedback?.(
          editingItem
            ? "Photograph updated successfully."
            : "Photograph added successfully."
        );
        dispatch(closeSingleModal());
        triggerRefresh?.();
      } catch (err) {
        onFeedback?.(err.message || "Failed to save photograph.");
      }
    },
    [accessToken, singleForm, editingItem, onFeedback, triggerRefresh, dispatch]
  );

  const handleBatchUpload = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();
      if (batchFiles.length === 0) return;

      dispatch(setBatchUploading(true));
      dispatch(setBatchProgress({ current: 0, total: batchFiles.length }));

      try {
        const createdItems = await executeBatchPhotoUpload(accessToken, {
          batchFiles,
          batchBaseTitle,
          batchCategory,
          onProgress: (prog) => dispatch(setBatchProgress(prog)),
        });
        onFeedback?.(`Successfully batch uploaded ${createdItems.length} photographs!`);
        dispatch(closeBatchModal());
        triggerRefresh?.();
      } catch (err) {
        onFeedback?.(err.message || "Batch upload failed partially or completely.");
        triggerRefresh?.();
      } finally {
        dispatch(setBatchUploading(false));
      }
    },
    [accessToken, batchFiles, batchBaseTitle, batchCategory, onFeedback, triggerRefresh, dispatch]
  );

  const handleConfirmDeleteItem = useCallback(async () => {
    if (!deleteTargetItem) return;
    dispatch(setIsDeleting(true));
    try {
      await deleteSinglePhoto(accessToken, deleteTargetItem.id);
      onFeedback?.("Photograph removed from gallery.");
      dispatch(closeDeleteDialog());
      triggerRefresh?.();
    } catch (err) {
      onFeedback?.(err.message || "Failed to delete photograph.");
      dispatch(setIsDeleting(false));
    }
  }, [accessToken, deleteTargetItem, onFeedback, triggerRefresh, dispatch]);

  const handleBulkDelete = useCallback(async () => {
    try {
      if (onBulkRemove) {
        await onBulkRemove(selectedIds);
      } else {
        await dispatch(deleteGalleryItems({ accessToken, ids: selectedIds })).unwrap();
      }
      dispatch(clearSelectedIds());
    } catch (err) {
      onFeedback?.(err.message || "Failed to delete photographs.");
    }
  }, [selectedIds, onBulkRemove, accessToken, onFeedback, dispatch]);

  return {
    handleSingleSave,
    handleBatchUpload,
    handleConfirmDeleteItem,
    handleBulkDelete,
  };
}
