import React, { memo, useMemo } from "react";
import { ParticipantDirectoryRow } from "./ParticipantDirectoryRow";
import { TablePagination } from "../components/TablePagination";

export const ParticipantDirectoryTable = memo(function ParticipantDirectoryTable({
  paginatedRiders = [],
  allVisibleSelected = false,
  onToggleSelectPage,
  selectedSet,
  expandedIds,
  copiedId,
  busy = false,
  onToggleSelect,
  onToggleExpand,
  onCopyId,
  onCopyText,
  onChangeStatus,
  onShowQr,
  previewRiderPass,
  onPreviewPass,
  generateRiderPasses,
  onGeneratePass,
  previewCertificate,
  onPreviewCert,
  generateCertificates,
  onGenerateCert,
  currentPage,
  page,
  totalPages = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
}) {
  const activePage = currentPage || page || 1;
  const handleCopy = onCopyId || onCopyText;
  const handlePreviewPass = previewRiderPass || onPreviewPass;
  const handleGeneratePass = generateRiderPasses || onGeneratePass;
  const handlePreviewCert = previewCertificate || onPreviewCert;
  const handleGenerateCert = generateCertificates || onGenerateCert;

  const safeExpandedSet = useMemo(() => {
    if (!expandedIds) return new Set();
    return expandedIds instanceof Set ? expandedIds : new Set(expandedIds);
  }, [expandedIds]);

  const safeSelectedSet = useMemo(() => {
    if (!selectedSet) return new Set();
    return selectedSet instanceof Set ? selectedSet : new Set(selectedSet);
  }, [selectedSet]);

  return (
    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b-2 border-slate-300 bg-slate-100 text-slate-950 font-bold">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectPage}
                  className="accent-slate-950 h-4 w-4 rounded cursor-pointer"
                  aria-label="Select all on this page"
                />
              </th>
              <th className="p-3.5 w-10 text-center">
                <span className="sr-only">Expand</span>
              </th>
              <th className="p-3.5 font-bold text-slate-950 text-xs">Rider ID & Name</th>
              <th className="p-3.5 font-bold text-slate-950 text-xs">Contact</th>
              <th className="p-3.5 font-bold text-slate-950 text-xs">Route & Payment</th>
              <th className="p-3.5 font-bold text-slate-950 text-xs">Status / Check-in</th>
              <th className="p-3.5 font-bold text-slate-950 text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRiders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-xs text-black/50">
                  No participants matched the active search or filters.
                </td>
              </tr>
            ) : (
              paginatedRiders.map((rider) => (
                <ParticipantDirectoryRow
                  key={rider.id}
                  rider={rider}
                  isChecked={safeSelectedSet.has(rider.id)}
                  isExpanded={safeExpandedSet.has(rider.id)}
                  copiedId={copiedId}
                  busy={busy}
                  onToggleSelect={onToggleSelect}
                  onToggleExpand={onToggleExpand}
                  onCopyId={handleCopy}
                  onChangeStatus={onChangeStatus}
                  onShowQr={onShowQr}
                  previewRiderPass={handlePreviewPass}
                  generateRiderPasses={handleGeneratePass}
                  previewCertificate={handlePreviewCert}
                  generateCertificates={handleGenerateCert}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <TablePagination
        currentPage={activePage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel="participants"
      />
    </div>
  );
});

export default ParticipantDirectoryTable;
