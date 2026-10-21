import React, { useState, useMemo, useCallback } from "react";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { ParticipantDirectoryToolbar } from "./ParticipantDirectoryToolbar";
import { ParticipantFinanceSummaryStrip } from "./ParticipantFinanceSummaryStrip";
import { ParticipantBulkActionBar } from "./ParticipantBulkActionBar";
import { ParticipantDirectoryTable } from "./ParticipantDirectoryTable";
import { ParticipantQrModal } from "./ParticipantQrModal";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  calculateCertificateCounts,
  extractUniqueRoutes,
  filterDirectoryRiders,
  paginateDirectoryRiders,
} from "./directoryUtils";
import {
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
  setDirectoryQrModalRider,
} from "../../../store/slices/participantsSlice";
import { useParticipantDirectoryActions } from "./useParticipantDirectoryActions";

export function ParticipantDirectoryView({
  riders = [],
  adminKey: propAdminKey,
  refresh,
  onFeedback,
}) {
  const dispatch = useAppDispatch();
  const reduxKey = useAppSelector((state) => state.auth?.accessToken);
  const adminKey = propAdminKey || reduxKey;

  const {
    selectedIds,
    expandedIds,
    busy,
    batchProgress,
    searchText,
    certificateFilter,
    routeFilter,
    statusFilter,
    page,
    pageSize,
    qrModalRider,
    copiedId,
  } = useAppSelector((state) => state.participants.directory);

  const [certificateFile, setCertificateFile] = useState(null);

  const debouncedSearchText = useDebouncedValue(searchText.trim().toLowerCase(), 250);

  // Delivery Counts
  const certificateCounts = useMemo(() => calculateCertificateCounts(riders), [riders]);

  // Unique Routes
  const uniqueRoutes = useMemo(() => extractUniqueRoutes(riders), [riders]);

  // Filtering Directory
  const filteredRiders = useMemo(() => {
    return filterDirectoryRiders(riders, {
      certificateFilter,
      routeFilter,
      statusFilter,
      searchText: debouncedSearchText,
    });
  }, [riders, certificateFilter, routeFilter, statusFilter, debouncedSearchText]);

  // Pagination
  const {
    paginated: paginatedRiders,
    totalPages,
    currentPage,
  } = useMemo(() => {
    return paginateDirectoryRiders(filteredRiders, page, pageSize);
  }, [filteredRiders, page, pageSize]);

  // Selection Sets
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const checkedInSelected = useMemo(
    () => riders.filter((r) => selectedSet.has(r.id) && r.status === "checked_in"),
    [riders, selectedSet]
  );
  const riderPassSelected = useMemo(
    () =>
      riders.filter(
        (r) =>
          selectedSet.has(r.id) &&
          r.payment_status === "paid" &&
          r.status !== "cancelled"
      ),
    [riders, selectedSet]
  );

  const allVisibleSelected =
    paginatedRiders.length > 0 &&
    paginatedRiders.every((r) => selectedSet.has(r.id));

  const toggleSelect = useCallback(
    (id) => {
      dispatch(toggleDirectorySelectId(id));
    },
    [dispatch]
  );

  const toggleSelectPage = useCallback(() => {
    const pageIds = paginatedRiders.map((r) => r.id);
    if (allVisibleSelected) {
      dispatch(
        setDirectorySelectedIds(selectedIds.filter((id) => !pageIds.includes(id)))
      );
    } else {
      dispatch(
        setDirectorySelectedIds(Array.from(new Set([...selectedIds, ...pageIds])))
      );
    }
  }, [allVisibleSelected, paginatedRiders, selectedIds, dispatch]);

  const clearSelection = useCallback(() => {
    dispatch(clearDirectorySelectedIds());
  }, [dispatch]);

  const toggleExpand = useCallback(
    (id) => {
      dispatch(toggleDirectoryExpandedId(id));
    },
    [dispatch]
  );

  const expandAllVisible = useCallback(() => {
    dispatch(expandAllDirectoryVisible(paginatedRiders.map((r) => r.id)));
  }, [paginatedRiders, dispatch]);

  const collapseAll = useCallback(() => {
    dispatch(collapseAllDirectory());
  }, [dispatch]);

  const {
    copyToClipboard,
    deleteSelected,
    changeStatus,
    bulkSetStatus,
    generateRiderPasses,
    previewRiderPass,
    generateCertificates,
    previewCertificate,
    sendUploadedCertificates,
  } = useParticipantDirectoryActions({
    adminKey,
    selectedIds,
    riderPassSelected,
    checkedInSelected,
    certificateFile,
    setCertificateFile,
    refresh,
    onFeedback,
  });

  return (
    <div className="space-y-5">
      {/* 1. TOP LIVE FINANCIAL & REVENUE SUMMARY STRIP */}
      <ParticipantFinanceSummaryStrip riders={riders} />

      {/* 2. FILTER & SEARCH TOOLBAR CARD */}
      <ParticipantDirectoryToolbar
        searchText={searchText}
        onSearchTextChange={(val) => dispatch(setDirectorySearchText(val))}
        onSearchChange={(val) => dispatch(setDirectorySearchText(val))}
        certificateFilter={certificateFilter}
        onCertificateChange={(val) => dispatch(setDirectoryCertificateFilter(val))}
        onCertificateFilterChange={(val) => dispatch(setDirectoryCertificateFilter(val))}
        certificateCounts={certificateCounts}
        routeFilter={routeFilter}
        onRouteChange={(val) => dispatch(setDirectoryRouteFilter(val))}
        routes={uniqueRoutes}
        uniqueRoutes={uniqueRoutes}
        statusFilter={statusFilter}
        onStatusChange={(val) => dispatch(setDirectoryStatusFilter(val))}
        totalCount={riders.length}
        approvedCount={riders.filter((r) => r.status === "approved").length}
        checkedInCount={riders.filter((r) => r.status === "checked_in").length}
        selectedCount={selectedIds.length}
        busy={busy}
        onDeleteSelected={deleteSelected}
        onExpandAll={expandAllVisible}
        onCollapseAll={collapseAll}
        expandedCount={expandedIds.length}
        visibleCount={paginatedRiders.length}
      />

      {/* BULK ACTION BAR */}
      <ParticipantBulkActionBar
        selectedCount={selectedIds.length}
        busy={busy}
        batchProgress={batchProgress}
        certificateFile={certificateFile}
        onCertificateFileChange={setCertificateFile}
        riderPassSelectedCount={riderPassSelected.length}
        checkedInSelectedCount={checkedInSelected.length}
        onBulkStatus={bulkSetStatus}
        onGeneratePasses={() => generateRiderPasses()}
        onPreviewPass={() => previewRiderPass()}
        onGenerateCertificates={() => generateCertificates()}
        onPreviewCertificate={() => previewCertificate()}
        onSendUploadedCertificates={sendUploadedCertificates}
        onDeleteSelected={deleteSelected}
        onClearSelection={clearSelection}
      />

      {/* DIRECTORY TABLE & PAGINATION */}
      <ParticipantDirectoryTable
        paginatedRiders={paginatedRiders}
        selectedSet={selectedSet}
        expandedIds={expandedSet}
        allVisibleSelected={allVisibleSelected}
        copiedId={copiedId}
        busy={busy}
        onToggleSelectPage={toggleSelectPage}
        onToggleSelect={toggleSelect}
        onToggleExpand={toggleExpand}
        onExpandAll={expandAllVisible}
        onCollapseAll={collapseAll}
        onCopyId={copyToClipboard}
        onShowQr={(r) => dispatch(setDirectoryQrModalRider(r))}
        onChangeStatus={changeStatus}
        generateRiderPasses={(ids) => generateRiderPasses(ids)}
        previewRiderPass={previewRiderPass}
        generateCertificates={(ids) => generateCertificates(ids)}
        previewCertificate={previewCertificate}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={filteredRiders.length}
        onPageChange={(p) => dispatch(setDirectoryPage(p))}
        onPageSizeChange={(sz) => dispatch(setDirectoryPageSize(sz))}
      />

      {/* QR MODAL LIGHTBOX */}
      <ParticipantQrModal
        rider={qrModalRider}
        onClose={() => dispatch(setDirectoryQrModalRider(null))}
      />
    </div>
  );
}

export default ParticipantDirectoryView;
