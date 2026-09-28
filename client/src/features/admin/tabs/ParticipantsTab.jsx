import React, { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Search,
  CheckCircle2,
  FileText,
  Award,
  Eye,
  Send,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Users,
  QrCode,
  X,
  AlertCircle,
  Copy,
  Check,
  UserCheck,
  Clock,
  Mail,
  Phone,
  Shirt,
  Building,
  MapPin,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { adminRequest, adminDownload } from "../../../api/http";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

function formatStatus(status) {
  return String(status || "").replaceAll("_", " ");
}

export function ParticipantsTab({ riders = [], adminKey, refresh }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [certificateFile, setCertificateFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [certificateFilter, setCertificateFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [qrModalRider, setQrModalRider] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const debouncedSearchText = useDebouncedValue(searchText.trim().toLowerCase(), 250);

  // Delivery Counts
  const certificateCounts = useMemo(() => {
    return riders.reduce(
      (counts, rider) => {
        const status = rider.certificate_delivery_status || "not_sent";
        counts[status] = (counts[status] || 0) + 1;
        counts.all += 1;
        return counts;
      },
      { all: 0, sent: 0, failed: 0, disabled: 0, not_sent: 0 }
    );
  }, [riders]);

  // Unique Routes
  const uniqueRoutes = useMemo(() => {
    const set = new Set();
    riders.forEach((r) => {
      if (r.ride_category) set.add(r.ride_category);
    });
    return Array.from(set);
  }, [riders]);

  // Filtering
  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      // Certificate filter
      if (certificateFilter !== "all") {
        const status = rider.certificate_delivery_status || "not_sent";
        if (status !== certificateFilter) return false;
      }

      // Route filter
      if (routeFilter !== "all" && rider.ride_category !== routeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && rider.status !== statusFilter) {
        return false;
      }

      // Search text
      if (debouncedSearchText) {
        const match = [
          rider.id,
          rider.full_name,
          rider.email,
          rider.phone,
          rider.ride_category,
          rider.city,
          rider.status,
          rider.checked_in_by,
        ].some((val) =>
          String(val || "").toLowerCase().includes(debouncedSearchText)
        );
        if (!match) return false;
      }

      return true;
    });
  }, [riders, certificateFilter, routeFilter, statusFilter, debouncedSearchText]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRiders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRiders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRiders.slice(start, start + pageSize);
  }, [filteredRiders, currentPage, pageSize]);

  // Selection
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
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

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectPage = () => {
    if (allVisibleSelected) {
      const pageIds = new Set(paginatedRiders.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginatedRiders.map((r) => r.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // Expand / Collapse Row Handlers
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAllVisible = () => {
    setExpandedIds(new Set(paginatedRiders.map((r) => r.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Actions
  const changeStatus = async (id, status) => {
    try {
      await adminRequest(`/registrations/${id}`, adminKey, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (error) {
      setActionMessage(error.message);
    }
  };

  const bulkSetStatus = async (status) => {
    if (!selectedIds.length) return;
    setBusy(true);
    setActionMessage("");
    try {
      const result = await adminRequest("/registrations/bulk-status", adminKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_ids: selectedIds, status }),
      });
      setActionMessage(
        `${result.updated} participant${result.updated === 1 ? "" : "s"} marked ${formatStatus(status)}.`
      );
      setSelectedIds([]);
      await refresh();
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const generateRiderPasses = async (targetIds = null) => {
    const idsToProcess = Array.isArray(targetIds)
      ? targetIds
      : riderPassSelected.map((r) => r.id);
    if (!idsToProcess.length) return;

    setBusy(true);
    setActionMessage("");
    const totalCount = idsToProcess.length;
    const batchSize = 10;
    let totalQueued = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    try {
      const totalBatches = Math.ceil(totalCount / batchSize);
      for (let i = 0; i < totalCount; i += batchSize) {
        const batchIds = idsToProcess.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const currentProcessed = Math.min(i + batchSize, totalCount);
        const percent = Math.round((currentProcessed / totalCount) * 100);

        setBatchProgress({
          current: currentProcessed,
          total: totalCount,
          percent,
          label:
            totalBatches > 1
              ? `Generating passes: batch ${batchNumber}/${totalBatches} (${currentProcessed}/${totalCount})...`
              : `Generating & emailing ${totalCount} rider pass${totalCount === 1 ? "" : "es"}...`,
        });

        const result = await adminRequest("/registrations/rider-passes/generate", adminKey, {
          method: "POST",
          timeoutMs: 120000,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchIds),
        });

        totalQueued += result.queued || 0;
        totalSent += result.sent_ids?.length || 0;
        totalFailed += result.failed_ids?.length || 0;
        totalSkipped += (result.skipped || 0) + (result.missing_ids?.length || 0);
      }

      setActionMessage(
        `Done: ${totalQueued} rider pass${totalQueued === 1 ? "" : "es"} generated. ${totalSent} email${totalSent === 1 ? "" : "s"} sent, ${totalFailed} failed, ${totalSkipped} skipped.`
      );
      if (!targetIds) {
        setSelectedIds([]);
      }
      await refresh();
    } catch (error) {
      setActionMessage(
        totalQueued > 0
          ? `Partially completed (${totalQueued}/${totalCount} passes processed): ${error.message}`
          : error.message
      );
      await refresh();
    } finally {
      setBatchProgress(null);
      setBusy(false);
    }
  };

  const previewRiderPass = async (riderId) => {
    const targetId = riderId || (riderPassSelected.length === 1 ? riderPassSelected[0].id : null);
    if (!targetId) return;
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setActionMessage("Allow pop-ups to preview the rider pass.");
      return;
    }
    previewWindow.document.title = "Loading rider pass preview...";
    try {
      const riderPass = await adminDownload(
        `/registrations/${targetId}/rider-pass-preview`,
        adminKey
      );
      const url = URL.createObjectURL(riderPass);
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      previewWindow.close();
      setActionMessage(error.message);
    }
  };

  const generateCertificates = async (targetIds = null) => {
    const idsToProcess = Array.isArray(targetIds)
      ? targetIds
      : checkedInSelected.map((r) => r.id);
    if (!idsToProcess.length) return;

    setBusy(true);
    setActionMessage("");
    const totalCount = idsToProcess.length;
    const batchSize = 10;
    let totalQueued = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    try {
      const totalBatches = Math.ceil(totalCount / batchSize);
      for (let i = 0; i < totalCount; i += batchSize) {
        const batchIds = idsToProcess.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const currentProcessed = Math.min(i + batchSize, totalCount);
        const percent = Math.round((currentProcessed / totalCount) * 100);

        setBatchProgress({
          current: currentProcessed,
          total: totalCount,
          percent,
          label:
            totalBatches > 1
              ? `Generating certificates: batch ${batchNumber}/${totalBatches} (${currentProcessed}/${totalCount})...`
              : `Generating & emailing ${totalCount} certificate${totalCount === 1 ? "" : "s"}...`,
        });

        const result = await adminRequest("/registrations/certificates/generate", adminKey, {
          method: "POST",
          timeoutMs: 120000,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchIds),
        });

        totalQueued += result.queued || 0;
        totalSent += result.sent_ids?.length || 0;
        totalFailed += result.failed_ids?.length || 0;
        totalSkipped += (result.skipped || 0) + (result.missing_ids?.length || 0);
      }

      setActionMessage(
        `Done: ${totalQueued} certificate${totalQueued === 1 ? "" : "s"} generated. ${totalSent} sent, ${totalFailed} failed, ${totalSkipped} skipped.`
      );
      if (!targetIds) {
        setSelectedIds([]);
      }
      await refresh();
    } catch (error) {
      setActionMessage(
        totalQueued > 0
          ? `Partially completed (${totalQueued}/${totalCount} certificates processed): ${error.message}`
          : error.message
      );
      await refresh();
    } finally {
      setBatchProgress(null);
      setBusy(false);
    }
  };

  const previewCertificate = async (riderId) => {
    const targetId = riderId || (checkedInSelected.length === 1 ? checkedInSelected[0].id : null);
    if (!targetId) return;
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setActionMessage("Allow pop-ups to preview the certificate.");
      return;
    }
    previewWindow.document.title = "Loading certificate preview...";
    try {
      const cert = await adminDownload(
        `/registrations/${targetId}/certificate-preview`,
        adminKey
      );
      const url = URL.createObjectURL(cert);
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      previewWindow.close();
      setActionMessage(error.message);
    }
  };

  const sendUploadedCertificates = async () => {
    if (!certificateFile || !checkedInSelected.length) return;
    setBusy(true);
    setActionMessage("");
    try {
      const body = new FormData();
      body.append(
        "registration_ids",
        JSON.stringify(checkedInSelected.map((r) => r.id))
      );
      body.append("certificate_file", certificateFile);

      const result = await adminRequest("/registrations/certificates", adminKey, {
        method: "POST",
        body,
      });
      const skipped = result.skipped + result.missing_ids.length;
      setActionMessage(
        `${result.queued} certificate${result.queued === 1 ? "" : "s"} queued. ${skipped} skipped.`
      );
      setCertificateFile(null);
      setSelectedIds([]);
      const fileInput = document.getElementById("p-cert-file");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ACTION MESSAGE NOTIFICATION */}
      {actionMessage && (
        <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs text-[#071313]">
            <AlertCircle className="h-4 w-4 text-[#ff5f3d] shrink-0" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="text-black/40 hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR CARD */}
      <div className="rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#071313]">Participant Directory</h2>
            <p className="text-xs text-[#071313]/60">
              Compact overview of all riders. Click any row or the chevron to expand full logistics & QR details.
            </p>
          </div>

          {/* HIGH-CONTRAST TOTAL SUMMARY BADGES */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg bg-[#071313] text-white px-3 py-1 font-mono font-bold">
              Total: {riders.length}
            </span>
            <span className="rounded-lg bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1 font-bold">
              Approved: {riders.filter((r) => r.status === "approved").length}
            </span>
            {/* HUMAN-READABLE CHECKED IN PILL */}
            <span className="rounded-lg bg-emerald-600 text-white shadow-sm px-3 py-1 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Checked In: {riders.filter((r) => r.status === "checked_in").length}
            </span>
          </div>
        </div>

        {/* CONTROLS ROW */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, ID, phone, city..."
              className="h-10 w-full rounded-xl border border-black/15 bg-white pl-9 pr-8 text-xs text-[#071313] placeholder:text-black/40 focus:border-[#071313] focus:outline-none"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* ROUTE FILTER */}
          <select
            value={routeFilter}
            onChange={(e) => {
              setRouteFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
          >
            <option value="all">All Routes</option>
            {uniqueRoutes.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* CERTIFICATE FILTER */}
          <select
            value={certificateFilter}
            onChange={(e) => {
              setCertificateFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
          >
            <option value="all">Certificate: All ({certificateCounts.all})</option>
            <option value="sent">Certificate: Sent ({certificateCounts.sent})</option>
            <option value="failed">Certificate: Failed ({certificateCounts.failed})</option>
            <option value="not_sent">Certificate: Not Sent ({certificateCounts.not_sent})</option>
          </select>
        </div>

        {/* EXPAND ALL / COLLAPSE ALL TOGGLES */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs text-black/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAllVisible}
              className="font-bold text-[#071313] hover:text-[#ff5f3d] flex items-center gap-1"
            >
              <ChevronDown className="h-3.5 w-3.5" /> Expand All on Page
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="font-bold text-[#071313] hover:text-[#ff5f3d] flex items-center gap-1"
            >
              <ChevronUp className="h-3.5 w-3.5" /> Collapse All
            </button>
          </div>
          <span className="font-mono text-[11px] text-black/40">
            {expandedIds.size} of {paginatedRiders.length} expanded
          </span>
        </div>
      </div>

      {/* FLOATING CONTEXTUAL BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#071313] p-4 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d9ff38] text-xs font-black text-[#071313]">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold tracking-wide">
              participant{selectedIds.length === 1 ? "" : "s"} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-white/50 hover:text-white underline underline-offset-2 ml-2"
            >
              Clear selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* APPROVE BUTTON */}
            <Button
              size="sm"
              variant="accent"
              onClick={() => bulkSetStatus("approved")}
              disabled={busy}
              className="h-8 text-xs font-bold px-3"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Approve ({selectedIds.length})
            </Button>

            {/* RIDER PASS BUTTONS */}
            {riderPassSelected.length === 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => previewRiderPass()}
                disabled={busy}
                className="h-8 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10 px-2.5"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Pass Preview
              </Button>
            )}

            {riderPassSelected.length > 0 && (
              <Button
                size="sm"
                onClick={() => generateRiderPasses()}
                disabled={busy}
                className="h-8 bg-[#ff5f3d] text-white hover:bg-[#e04f2f] text-xs px-3 font-bold"
              >
                {busy && batchProgress ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                {busy && batchProgress
                  ? `Passes (${batchProgress.current}/${batchProgress.total})`
                  : `Send Pass (${riderPassSelected.length})`}
              </Button>
            )}

            {/* CERTIFICATE BUTTONS */}
            {checkedInSelected.length === 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => previewCertificate()}
                disabled={busy}
                className="h-8 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10 px-2.5"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Cert Preview
              </Button>
            )}

            {checkedInSelected.length > 0 && (
              <>
                <Button
                  size="sm"
                  onClick={() => generateCertificates()}
                  disabled={busy}
                  className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3 font-bold"
                >
                  {busy && batchProgress ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Award className="h-3.5 w-3.5 mr-1" />
                  )}
                  {busy && batchProgress
                    ? `Certs (${batchProgress.current}/${batchProgress.total})`
                    : `Generate Certs (${checkedInSelected.length})`}
                </Button>

                <label
                  htmlFor="p-cert-file"
                  className="cursor-pointer inline-flex items-center h-8 rounded-full border border-white/20 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  {certificateFile ? certificateFile.name.slice(0, 12) + "…" : "Upload PDF"}
                </label>
                <input
                  id="p-cert-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                />

                {certificateFile && (
                  <Button
                    size="sm"
                    onClick={sendUploadedCertificates}
                    disabled={busy}
                    className="h-8 bg-[#ff5f3d] text-white text-xs px-3 font-bold"
                  >
                    Send Uploaded
                  </Button>
                )}
              </>
            )}
          </div>

          {/* REAL-TIME BATCH PROGRESS BAR */}
          {batchProgress && (
            <div className="w-full mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#d9ff38]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d9ff38]" />
                  {batchProgress.label}
                </span>
                <span className="font-bold">{batchProgress.percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-[#d9ff38] transition-all duration-300 rounded-full"
                  style={{ width: `${batchProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* PARTICIPANTS DATA TABLE WITH EXPANDABLE ROWS */}
      <div className="overflow-hidden rounded-2xl border border-[#071313]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/10 bg-[#fbf8ef] text-[#071313] font-mono">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectPage}
                    className="accent-[#071313] h-4 w-4 rounded"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="p-4 w-10 text-center">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="p-4 uppercase tracking-wider font-bold">Rider ID & Name</th>
                <th className="p-4 uppercase tracking-wider font-bold">Contact</th>
                <th className="p-4 uppercase tracking-wider font-bold">Route & Payment</th>
                <th className="p-4 uppercase tracking-wider font-bold">Status / Check-in</th>
                <th className="p-4 uppercase tracking-wider font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#071313]/5">
              {paginatedRiders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-black/50">
                    No participants matched the active search or filters.
                  </td>
                </tr>
              ) : (
                paginatedRiders.map((rider) => {
                  const isChecked = selectedSet.has(rider.id);
                  const isExpanded = expandedIds.has(rider.id);
                  const isCheckedIn = rider.status === "checked_in";

                  return (
                    <React.Fragment key={rider.id}>
                      {/* COMPACT MAIN ROW */}
                      <tr
                        className={`transition-colors cursor-pointer hover:bg-black/[0.02] ${
                          isChecked ? "bg-[#d9ff38]/10" : isExpanded ? "bg-[#fbf8ef]/50" : ""
                        }`}
                        onClick={(e) => {
                          // Prevent toggling expand when clicking checkbox or select dropdown
                          if (
                            e.target.tagName === "INPUT" ||
                            e.target.tagName === "SELECT" ||
                            e.target.tagName === "BUTTON" ||
                            e.target.closest("button")
                          ) {
                            return;
                          }
                          toggleExpand(rider.id);
                        }}
                      >
                        {/* 1. Selection Checkbox */}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(rider.id)}
                            className="accent-[#071313] h-4 w-4 rounded"
                            aria-label={`Select rider ${rider.full_name}`}
                          />
                        </td>

                        {/* 2. Expand Toggle Button */}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleExpand(rider.id)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white text-black/60 transition-all hover:bg-black/5 ${
                              isExpanded ? "rotate-90 bg-black/5 text-[#071313]" : ""
                            }`}
                            aria-label={isExpanded ? "Collapse row" : "Expand row"}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>

                        {/* 3. Rider ID & Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#071313]/50 text-[11px]">
                              #{rider.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(rider.id, `id-${rider.id}`);
                              }}
                              title="Copy ID"
                              className="text-black/30 hover:text-black"
                            >
                              {copiedId === `id-${rider.id}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <p className="font-black text-sm text-[#071313]">{rider.full_name}</p>
                          <span className="text-[10px] text-[#071313]/50 capitalize">
                            {rider.gender || "Gender unstated"} • {rider.city || "Rewa"}
                          </span>
                        </td>

                        {/* 4. Contact */}
                        <td className="p-4 text-xs font-mono">
                          <p className="text-[#071313] font-medium">{rider.phone || "—"}</p>
                          <p className="text-[#071313]/60 text-[11px] truncate max-w-[200px]">
                            {rider.email || "—"}
                          </p>
                        </td>

                        {/* 5. Route Category & Payment */}
                        <td className="p-4">
                          <span className="font-bold text-[#071313] block">
                            {rider.ride_category}
                          </span>
                          {rider.payment_status === "paid" ? (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              ✓ PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                              UNPAID
                            </span>
                          )}
                        </td>

                        {/* 6. Status & High-Contrast Check-in Badge */}
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          {isCheckedIn ? (
                            /* HIGH CONTRAST, HUMAN READABLE CHECKED IN BADGE */
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase text-white shadow-sm">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                              <span>Checked In</span>
                            </div>
                          ) : (
                            <select
                              value={rider.status}
                              onChange={(e) => changeStatus(rider.id, e.target.value)}
                              className="h-8 rounded-lg border border-black/20 bg-white px-2 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}
                        </td>

                        {/* 7. Action Button */}
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleExpand(rider.id)}
                            className="h-8 text-xs font-bold px-3 gap-1"
                          >
                            <span>{isExpanded ? "Hide" : "Details"}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </td>
                      </tr>

                      {/* EXPANDED DETAIL DRAWER ROW */}
                      {isExpanded && (
                        <tr className="bg-[#fbf8ef] border-b border-black/10">
                          <td colSpan={7} className="p-0">
                            <div className="p-6 border-l-4 border-l-[#071313] space-y-6">
                              {/* 3-COLUMN LOGISTICS GRID */}
                              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {/* CARD 1: CHECK-IN & QR TOKEN */}
                                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between border-b border-black/10 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-black/50 font-mono flex items-center gap-1.5">
                                      <UserCheck className="h-3.5 w-3.5 text-[#071313]" />
                                      Race-Day Check-in
                                    </span>
                                    {isCheckedIn ? (
                                      <span className="rounded-md bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black uppercase">
                                        Verified
                                      </span>
                                    ) : (
                                      <span className="rounded-md bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                                        Not Checked In
                                      </span>
                                    )}
                                  </div>

                                  {isCheckedIn ? (
                                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-950 text-xs space-y-1">
                                      <p className="font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                                        Checked in on{" "}
                                        {new Date(rider.checked_in_at).toLocaleString()}
                                      </p>
                                      {rider.checked_in_by && (
                                        <p className="text-[11px] text-emerald-900/80">
                                          Station / Staff: <strong>{rider.checked_in_by}</strong>
                                        </p>
                                      )}
                                      <p className="text-[11px] text-emerald-900/80">
                                        Method:{" "}
                                        <span className="uppercase font-mono">
                                          {rider.checkin_method || "manual"}
                                        </span>
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl bg-black/5 p-3 text-xs text-black/60">
                                      Pending race-day arrival. Volunteer will scan this rider's QR pass or look up by ID.
                                    </div>
                                  )}

                                  {/* QR Code Pass Preview */}
                                  <div className="pt-2 flex items-center gap-4">
                                    {rider.checkin_token ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => setQrModalRider(rider)}
                                          className="p-1.5 rounded-xl border border-black/15 bg-white shadow-sm hover:scale-105 transition-transform"
                                          title="Click to enlarge QR pass"
                                        >
                                          <QRCodeSVG
                                            value={`nvcyclothon-checkin:${rider.checkin_token}`}
                                            size={64}
                                            level="M"
                                          />
                                        </button>
                                        <div className="text-xs space-y-1">
                                          <span className="font-bold text-[#071313] block">
                                            Rider QR Pass
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setQrModalRider(rider)}
                                            className="text-[11px] font-bold text-[#ff5f3d] hover:underline flex items-center gap-1"
                                          >
                                            <Eye className="h-3 w-3" /> View full screen
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyToClipboard(
                                                rider.checkin_token,
                                                `token-${rider.id}`
                                              )
                                            }
                                            className="text-[10px] font-mono text-black/50 hover:text-black flex items-center gap-1"
                                          >
                                            <Copy className="h-2.5 w-2.5" />
                                            {copiedId === `token-${rider.id}`
                                              ? "Copied!"
                                              : "Copy Token"}
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-xs text-black/40">No QR token issued</p>
                                    )}
                                  </div>
                                </div>

                                {/* CARD 2: RIDER APPAREL & PROFILE */}
                                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm space-y-3">
                                  <div className="border-b border-black/10 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-black/50 font-mono flex items-center gap-1.5">
                                      <Shirt className="h-3.5 w-3.5 text-[#071313]" />
                                      Apparel & Profile
                                    </span>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-black/5">
                                      <span className="text-black/50">T-Shirt Size</span>
                                      <span className="font-mono font-bold text-[#071313] bg-[#fbf8ef] px-2 py-0.5 rounded border border-black/10">
                                        {rider.t_shirt_size || "Not specified"}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between py-1 border-b border-black/5">
                                      <span className="text-black/50">City / Location</span>
                                      <span className="font-bold text-[#071313]">
                                        {rider.city || "Rewa (M.P.)"}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between py-1 border-b border-black/5">
                                      <span className="text-black/50">Gender</span>
                                      <span className="font-bold text-[#071313] capitalize">
                                        {rider.gender || "Unspecified"}
                                      </span>
                                    </div>

                                    {rider.organization_name && (
                                      <div className="pt-1">
                                        <span className="text-[10px] text-black/50 uppercase font-mono block">
                                          Delegation / Club
                                        </span>
                                        <p className="font-bold text-[#071313] text-xs">
                                          🏛️ {rider.organization_name} (
                                          {rider.organization_type || "Club"})
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* CARD 3: DOCUMENT & EMAIL DELIVERY LOG */}
                                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm space-y-3">
                                  <div className="border-b border-black/10 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-black/50 font-mono flex items-center gap-1.5">
                                      <Mail className="h-3.5 w-3.5 text-[#071313]" />
                                      Email & Document Logs
                                    </span>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-black/5">
                                      <span className="text-black/50">Registration Email</span>
                                      <span className="font-bold text-[#071313]">
                                        {rider.registration_email_status || "not sent"}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between py-1 border-b border-black/5">
                                      <span className="text-black/50">Official Rider Pass</span>
                                      <span className="font-bold text-[#071313]">
                                        {rider.rider_pass_status || "not sent"}
                                      </span>
                                    </div>

                                    <div className="py-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-black/50">Finisher Certificate</span>
                                        <span className="font-bold text-[#071313]">
                                          {rider.certificate_delivery_status ||
                                            rider.certificate_status ||
                                            "not sent"}
                                        </span>
                                      </div>
                                      {rider.certificate_sent_at && (
                                        <p className="text-[10px] text-black/40 font-mono mt-0.5">
                                          Sent {new Date(rider.certificate_sent_at).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick Actions for this single rider */}
                                  <div className="pt-2 flex flex-wrap gap-2 border-t border-black/5">
                                    {rider.payment_status === "paid" &&
                                      rider.status !== "cancelled" && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => previewRiderPass(rider.id)}
                                            className="h-7 text-[11px] px-2.5"
                                          >
                                            <FileText className="h-3 w-3 mr-1" /> Pass Preview
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => generateRiderPasses([rider.id])}
                                            disabled={busy}
                                            className="h-7 text-[11px] px-2.5 bg-[#ff5f3d] text-white hover:bg-[#e04f2f] font-bold"
                                          >
                                            <Send className="h-3 w-3 mr-1" />
                                            {rider.rider_pass_status === "sent" ? "Re-send Pass" : "Send Pass"}
                                          </Button>
                                        </>
                                      )}

                                    {isCheckedIn && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => previewCertificate(rider.id)}
                                          className="h-7 text-[11px] px-2.5 text-emerald-800 border-emerald-300 bg-emerald-50"
                                        >
                                          <Award className="h-3 w-3 mr-1" /> Cert Preview
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => generateCertificates([rider.id])}
                                          disabled={busy}
                                          className="h-7 text-[11px] px-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                                        >
                                          <Send className="h-3 w-3 mr-1" />
                                          {rider.certificate_delivery_status === "sent" ? "Re-send Cert" : "Send Cert"}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/10 bg-[#fbf8ef] p-4 text-xs">
          <div className="flex items-center gap-2 text-black/60">
            <span>
              Showing {filteredRiders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredRiders.length)} of {filteredRiders.length}{" "}
              participants
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded border border-black/15 bg-white px-1.5 text-xs text-[#071313]"
            >
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-0.5" /> Prev
            </Button>
            <span className="font-mono font-bold text-xs px-2 text-[#071313]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 px-2.5 text-xs"
            >
              Next <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* QR CODE MODAL LIGHTBOX */}
      {qrModalRider && (
        <div
          onClick={() => setQrModalRider(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl text-[#071313]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <span className="text-xs font-mono font-bold text-black/50">
                #{qrModalRider.id} CHECK-IN PASS
              </span>
              <button
                type="button"
                onClick={() => setQrModalRider(null)}
                className="text-black/40 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-6 flex justify-center">
              <div className="p-4 rounded-2xl border-2 border-[#071313] bg-white shadow-inner">
                <QRCodeSVG
                  value={`nvcyclothon-checkin:${qrModalRider.checkin_token}`}
                  size={190}
                  level="H"
                />
              </div>
            </div>

            <h3 className="text-base font-black">{qrModalRider.full_name}</h3>
            <p className="text-xs text-black/60 font-semibold">{qrModalRider.ride_category}</p>
            <p className="mt-1 text-[11px] font-mono text-black/40">
              Token: {qrModalRider.checkin_token?.slice(0, 16)}…
            </p>

            <Button
              onClick={() => setQrModalRider(null)}
              className="mt-6 w-full"
              variant="default"
            >
              Close Pass
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
