import { useCallback } from "react";
import { adminRequest, bulkDeleteAdminRecords } from "../../../api/http";
import { useAppDispatch } from "../../../store/hooks";
import {
  setDirectorySelectedIds,
  clearDirectorySelectedIds,
  setDirectoryBusy,
  setDirectoryBatchProgress,
  setDirectoryCopiedId,
} from "../../../store/slices/participantsSlice";
import {
  executeBatchRiderPasses,
  executeBatchCertificates,
  fetchRiderPassBlob,
  fetchCertificateBlob,
  uploadCustomCertificates,
} from "./participantBatchActions";

export function formatStatus(status) {
  return String(status || "").replaceAll("_", " ");
}

export function useParticipantDirectoryActions({
  adminKey,
  selectedIds = [],
  riderPassSelected = [],
  checkedInSelected = [],
  certificateFile,
  setCertificateFile,
  refresh,
  onFeedback,
}) {
  const dispatch = useAppDispatch();

  const copyToClipboard = useCallback(
    (text, id) => {
      navigator.clipboard?.writeText(text);
      dispatch(setDirectoryCopiedId(id));
      setTimeout(() => dispatch(setDirectoryCopiedId(null)), 1500);
    },
    [dispatch]
  );

  const deleteSelected = useCallback(async () => {
    dispatch(setDirectoryBusy(true));
    try {
      const result = await bulkDeleteAdminRecords(adminKey, "registration", selectedIds);
      onFeedback?.(
        `${result.deleted} unpaid participant${result.deleted === 1 ? "" : "s"} deleted${result.skipped ? `; ${result.skipped} protected or missing record(s) were kept` : ""}.`
      );
      dispatch(clearDirectorySelectedIds());
      await refresh?.();
    } catch (error) {
      onFeedback?.(error.message || "Unable to delete selected participants.");
    } finally {
      dispatch(setDirectoryBusy(false));
    }
  }, [adminKey, onFeedback, refresh, selectedIds, dispatch]);

  const changeStatus = useCallback(
    async (id, status) => {
      try {
        await adminRequest(`/registrations/${id}`, adminKey, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        onFeedback?.(`Participant #${id} status updated to ${formatStatus(status)}.`);
        await refresh?.();
      } catch (error) {
        onFeedback?.(error.message);
      }
    },
    [adminKey, onFeedback, refresh]
  );

  const bulkSetStatus = useCallback(
    async (status) => {
      if (!selectedIds.length) return;
      dispatch(setDirectoryBusy(true));
      try {
        const result = await adminRequest("/registrations/bulk-status", adminKey, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registration_ids: selectedIds, status }),
        });
        onFeedback?.(
          `${result.updated} participant${result.updated === 1 ? "" : "s"} marked ${formatStatus(status)}.`
        );
        dispatch(clearDirectorySelectedIds());
        await refresh?.();
      } catch (error) {
        onFeedback?.(error.message);
      } finally {
        dispatch(setDirectoryBusy(false));
      }
    },
    [adminKey, onFeedback, refresh, selectedIds, dispatch]
  );

  const generateRiderPasses = useCallback(
    async (targetIds = null) => {
      const idsToProcess = Array.isArray(targetIds)
        ? targetIds
        : riderPassSelected.map((r) => r.id);
      if (!idsToProcess.length) return;

      dispatch(setDirectoryBusy(true));
      try {
        const res = await executeBatchRiderPasses({
          targetIds: idsToProcess,
          adminKey,
          onProgress: (prog) => dispatch(setDirectoryBatchProgress(prog)),
        });

        onFeedback?.(
          `Done: ${res.totalQueued} rider pass${res.totalQueued === 1 ? "" : "es"} generated. ${res.totalSent} email${res.totalSent === 1 ? "" : "s"} sent, ${res.totalFailed} failed, ${res.totalSkipped} skipped.`
        );
        if (!targetIds) {
          dispatch(clearDirectorySelectedIds());
        }
        await refresh?.();
      } catch (error) {
        onFeedback?.(error.message);
        try {
          await refresh?.();
        } catch {
          // Ignore secondary refresh failure
        }
      } finally {
        dispatch(setDirectoryBatchProgress(null));
        dispatch(setDirectoryBusy(false));
      }
    },
    [adminKey, onFeedback, refresh, riderPassSelected, dispatch]
  );

  const previewRiderPass = useCallback(
    async (riderId) => {
      const targetId = riderId || (riderPassSelected.length === 1 ? riderPassSelected[0].id : null);
      if (!targetId) return;
      const previewWindow = window.open("", "_blank");
      if (!previewWindow) {
        onFeedback?.("Allow pop-ups to preview the rider pass.");
        return;
      }
      previewWindow.document.title = "Loading rider pass preview...";
      try {
        const riderPass = await fetchRiderPassBlob(targetId, adminKey);
        const url = URL.createObjectURL(riderPass);
        previewWindow.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (error) {
        previewWindow.close();
        onFeedback?.(error.message);
      }
    },
    [adminKey, onFeedback, riderPassSelected]
  );

  const generateCertificates = useCallback(
    async (targetIds = null) => {
      const idsToProcess = Array.isArray(targetIds)
        ? targetIds
        : checkedInSelected.map((r) => r.id);
      if (!idsToProcess.length) return;

      dispatch(setDirectoryBusy(true));
      try {
        const res = await executeBatchCertificates({
          targetIds: idsToProcess,
          adminKey,
          onProgress: (prog) => dispatch(setDirectoryBatchProgress(prog)),
        });

        onFeedback?.(
          `Done: ${res.totalQueued} certificate${res.totalQueued === 1 ? "" : "s"} generated. ${res.totalSent} sent, ${res.totalFailed} failed, ${res.totalSkipped} skipped.`
        );
        if (!targetIds) {
          dispatch(clearDirectorySelectedIds());
        }
        await refresh?.();
      } catch (error) {
        onFeedback?.(error.message);
        try {
          await refresh?.();
        } catch {
          // Ignore secondary refresh failure
        }
      } finally {
        dispatch(setDirectoryBatchProgress(null));
        dispatch(setDirectoryBusy(false));
      }
    },
    [adminKey, checkedInSelected, onFeedback, refresh, dispatch]
  );

  const previewCertificate = useCallback(
    async (riderId) => {
      const targetId = riderId || (checkedInSelected.length === 1 ? checkedInSelected[0].id : null);
      if (!targetId) return;
      const previewWindow = window.open("", "_blank");
      if (!previewWindow) {
        onFeedback?.("Allow pop-ups to preview the certificate.");
        return;
      }
      previewWindow.document.title = "Loading certificate preview...";
      try {
        const cert = await fetchCertificateBlob(targetId, adminKey);
        const url = URL.createObjectURL(cert);
        previewWindow.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (error) {
        previewWindow.close();
        onFeedback?.(error.message);
      }
    },
    [adminKey, checkedInSelected, onFeedback]
  );

  const sendUploadedCertificates = useCallback(async () => {
    if (!certificateFile || !checkedInSelected.length) return;
    dispatch(setDirectoryBusy(true));
    try {
      const result = await uploadCustomCertificates({
        targetIds: checkedInSelected.map((r) => r.id),
        certificateFile,
        adminKey,
      });
      const skipped = result.skipped + result.missing_ids.length;
      onFeedback?.(
        `${result.queued} certificate${result.queued === 1 ? "" : "s"} queued. ${skipped} skipped.`
      );
      setCertificateFile?.(null);
      dispatch(clearDirectorySelectedIds());
      const fileInput = document.getElementById("p-cert-file");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      onFeedback?.(error.message);
    } finally {
      dispatch(setDirectoryBusy(false));
    }
  }, [adminKey, certificateFile, checkedInSelected, onFeedback, setCertificateFile, dispatch]);

  return {
    copyToClipboard,
    deleteSelected,
    changeStatus,
    bulkSetStatus,
    generateRiderPasses,
    previewRiderPass,
    generateCertificates,
    previewCertificate,
    sendUploadedCertificates,
  };
}
