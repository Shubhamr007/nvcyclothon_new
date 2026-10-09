import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Award,
  AlertCircle,
  X,
} from "lucide-react";
import { adminRequest, adminDownload } from "../../../api/http";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { Button } from "../../../components/ui/button";
import { bulkDeleteAdminRecords } from "../../../api/http";

import { ParticipantQrModal } from "../participants/ParticipantQrModal";
import { BatchManagementModal } from "../participants/BatchManagementModal";
import { EventDayRaceRoster, AGE_BRACKETS } from "../participants/EventDayRaceRoster";
import { ParticipantDirectoryToolbar } from "../participants/ParticipantDirectoryToolbar";
import { ParticipantBulkActionBar } from "../participants/ParticipantBulkActionBar";
import { ParticipantDirectoryRow } from "../participants/ParticipantDirectoryRow";
import { TablePagination } from "../components/TablePagination";

function formatStatus(status) {
  return String(status || "").replaceAll("_", " ");
}

export function ParticipantsTab({ riders = [], adminKey, refresh }) {
  const [viewMode, setViewMode] = useState("directory"); // "directory" | "roster"
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

  // Roster-specific state
  const [rosterRoute, setRosterRoute] = useState("all");
  const [rosterBatch, setRosterBatch] = useState("all");
  const [selectedRosterIds, setSelectedRosterIds] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [rosterAgeBracket, setRosterAgeBracket] = useState("all");
  const [rosterMinAge, setRosterMinAge] = useState("");
  const [rosterMaxAge, setRosterMaxAge] = useState("");
  const [rosterGender, setRosterGender] = useState("all");
  const [rosterStatus, setRosterStatus] = useState("all");
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(25);

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

  // Unique Batches
  const uniqueBatches = useMemo(() => {
    const set = new Set();
    riders.forEach((r) => {
      if (r.batch_name && String(r.batch_name).trim()) {
        set.add(String(r.batch_name).trim());
      }
    });
    return Array.from(set).sort();
  }, [riders]);

  // Unique Routes
  const uniqueRoutes = useMemo(() => {
    const set = new Set();
    riders.forEach((r) => {
      if (r.ride_category) set.add(r.ride_category);
    });
    return Array.from(set);
  }, [riders]);

  // Filtering Directory
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

  // Pagination Directory
  const totalPages = Math.max(1, Math.ceil(filteredRiders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRiders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRiders.slice(start, start + pageSize);
  }, [filteredRiders, currentPage, pageSize]);

  // Roster filtering (Ultra-optimized in-memory filter)
  const rosterFilteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      // 1. Route / Category
      if (rosterRoute !== "all" && rider.ride_category !== rosterRoute) {
        return false;
      }

      // 1b. Batch / Wave
      if (rosterBatch !== "all") {
        if (rosterBatch === "unassigned") {
          if (rider.batch_name && String(rider.batch_name).trim()) return false;
        } else {
          if (rider.batch_name !== rosterBatch) return false;
        }
      }

      // 2. Age Bracket / Range
      const age =
        rider.age !== null && rider.age !== undefined && rider.age !== ""
          ? Number(rider.age)
          : null;

      if (rosterAgeBracket !== "all") {
        if (rosterAgeBracket === "custom") {
          const min = rosterMinAge !== "" ? Number(rosterMinAge) : null;
          const max = rosterMaxAge !== "" ? Number(rosterMaxAge) : null;
          if (min !== null && !isNaN(min) && (age === null || isNaN(age) || age < min)) return false;
          if (max !== null && !isNaN(max) && (age === null || isNaN(age) || age > max)) return false;
        } else {
          const bracket = AGE_BRACKETS.find((b) => b.id === rosterAgeBracket);
          if (bracket) {
            if (bracket.min !== null && (age === null || isNaN(age) || age < bracket.min)) return false;
            if (bracket.max !== null && (age === null || isNaN(age) || age > bracket.max)) return false;
          }
        }
      }

      // 3. Gender
      if (rosterGender !== "all") {
        const g = String(rider.gender || "").toLowerCase();
        if (rosterGender === "male" && g !== "male" && g !== "m") return false;
        if (rosterGender === "female" && g !== "female" && g !== "f") return false;
        if (rosterGender === "other" && g !== "other") return false;
      }

      // 4. Check-in status
      if (rosterStatus !== "all") {
        if (rosterStatus === "checked_in" && rider.status !== "checked_in") return false;
        if (rosterStatus === "pending_checkin" && rider.status === "checked_in") return false;
      }

      // 5. Search
      if (debouncedSearchText) {
        const match = [
          rider.id,
          rider.full_name,
          rider.email,
          rider.phone,
          rider.ride_category,
          rider.batch_name,
          rider.city,
          rider.t_shirt_size,
          rider.organization_name,
          rider.emergency_contact,
        ].some((val) =>
          String(val || "").toLowerCase().includes(debouncedSearchText)
        );
        if (!match) return false;
      }

      return true;
    });
  }, [
    riders,
    rosterRoute,
    rosterBatch,
    rosterAgeBracket,
    rosterMinAge,
    rosterMaxAge,
    rosterGender,
    rosterStatus,
    debouncedSearchText,
  ]);

  // Roster pagination
  const rosterTotalPages = Math.max(1, Math.ceil(rosterFilteredRiders.length / rosterPageSize));
  const rosterCurrentPage = Math.min(rosterPage, rosterTotalPages);
  const rosterPaginatedRiders = useMemo(() => {
    const start = (rosterCurrentPage - 1) * rosterPageSize;
    return rosterFilteredRiders.slice(start, start + rosterPageSize);
  }, [rosterFilteredRiders, rosterCurrentPage, rosterPageSize]);

  // Roster summary stats
  const rosterStats = useMemo(() => {
    const total = rosterFilteredRiders.length;
    const checkedIn = rosterFilteredRiders.filter((r) => r.status === "checked_in").length;
    const pending = total - checkedIn;
    const batched = rosterFilteredRiders.filter(
      (r) => r.batch_name && String(r.batch_name).trim()
    ).length;
    const unbatched = total - batched;
    const male = rosterFilteredRiders.filter((r) =>
      String(r.gender || "").toLowerCase().startsWith("m")
    ).length;
    const female = rosterFilteredRiders.filter((r) =>
      String(r.gender || "").toLowerCase().startsWith("f")
    ).length;
    return { total, checkedIn, pending, batched, unbatched, male, female };
  }, [rosterFilteredRiders]);

  // In-browser instant clean CSV export
  const handleExportRosterCsv = () => {
    if (rosterFilteredRiders.length === 0) {
      alert("No riders found matching the selected filters to export.");
      return;
    }
    const headers = [
      "Rider ID",
      "Full Name",
      "Age",
      "Gender",
      "Ride Category",
      "Batch / Wave",
      "T-Shirt / Jersey Size",
      "Phone",
      "Emergency Contact",
      "City",
      "Organization / Team",
      "Payment Status",
      "Check-in Status",
    ];

    const rows = rosterFilteredRiders.map((r) => [
      `"#${r.id}"`,
      `"${(r.full_name || "").replace(/"/g, '""')}"`,
      r.age !== null && r.age !== undefined ? r.age : "",
      `"${(r.gender || "").replace(/"/g, '""')}"`,
      `"${(r.ride_category || "").replace(/"/g, '""')}"`,
      `"${(r.batch_name || "Unassigned").replace(/"/g, '""')}"`,
      `"${(r.t_shirt_size || "N/A").replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      `"${(r.emergency_contact || "").replace(/"/g, '""')}"`,
      `"${(r.city || "").replace(/"/g, '""')}"`,
      `"${(r.organization_name || r.organization_type || "").replace(/"/g, '""')}"`,
      `"${(r.payment_status || "").replace(/"/g, '""')}"`,
      `"${(r.status || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeRoute = (rosterRoute || "all_routes").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const safeBracket = (rosterAgeBracket || "all_ages").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const safeBatch = (rosterBatch || "all_batches").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    a.download = `nv_cyclothon_race_roster_${safeRoute}_${safeBracket}_${safeBatch}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const deleteSelected = async () => {
    setBusy(true);
    setActionMessage("");
    try {
      const result = await bulkDeleteAdminRecords(adminKey, "registration", selectedIds);
      setActionMessage(
        `${result.deleted} unpaid participant${result.deleted === 1 ? "" : "s"} deleted${result.skipped ? `; ${result.skipped} protected or missing record(s) were kept` : ""}.`
      );
      setSelectedIds([]);
      await refresh();
    } catch (error) {
      setActionMessage(error.message || "Unable to delete selected participants.");
    } finally {
      setBusy(false);
    }
  };

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

  // Status updates
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

  const toggleSelectRosterRider = (id) => {
    setSelectedRosterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllRoster = () => {
    const visibleIds = rosterPaginatedRiders.map((r) => r.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRosterIds.includes(id));
    if (allSelected) {
      setSelectedRosterIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedRosterIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleAssignBatch = async ({
    mode,
    targetRiders,
    batchSize,
    batchPrefix,
    startNumber,
    batchName,
  }) => {
    if (!targetRiders || targetRiders.length === 0) return;
    setIsBatchSaving(true);
    setActionMessage("");
    try {
      if (mode === "auto_split") {
        const total = targetRiders.length;
        let riderIdx = 0;
        let bNum = startNumber;
        let updatedCount = 0;
        const totalWaves = Math.ceil(total / batchSize);

        while (riderIdx < total) {
          const chunk = targetRiders.slice(riderIdx, riderIdx + batchSize);
          const chunkIds = chunk.map((r) => r.id);
          const currentBatchName = `${batchPrefix} ${bNum}`;

          setBatchProgress({
            current: Math.min(riderIdx + batchSize, total),
            total,
            percent: Math.round(((riderIdx + chunk.length) / total) * 100),
            label: `Assigning Wave ${bNum - startNumber + 1}/${totalWaves} (${currentBatchName})...`,
          });

          const res = await adminRequest("/registrations/bulk-batch", adminKey, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              registration_ids: chunkIds,
              batch_name: currentBatchName,
            }),
          });
          updatedCount += res.updated || chunkIds.length;
          riderIdx += batchSize;
          bNum += 1;
        }

        setActionMessage(
          `Successfully generated ${totalWaves} batches for ${updatedCount} riders.`
        );
      } else {
        // Single batch name or clear
        const targetIds = targetRiders.map((r) => r.id);
        const res = await adminRequest("/registrations/bulk-batch", adminKey, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_ids: targetIds,
            batch_name: batchName,
          }),
        });

        setActionMessage(
          batchName
            ? `Successfully assigned ${res.updated || targetIds.length} riders to "${batchName}".`
            : `Successfully cleared batch assignment for ${res.updated || targetIds.length} riders.`
        );
      }

      setBatchModalOpen(false);
      setSelectedRosterIds([]);
      await refresh();
    } catch (err) {
      setActionMessage(`Batch assignment error: ${err.message}`);
    } finally {
      setIsBatchSaving(false);
      setBatchProgress(null);
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

      {/* VIEW MODE SELECTOR (FULL DIRECTORY VS EVENT-DAY RACE ROSTER) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4 print:hidden">
        <div className="flex items-center gap-1.5 rounded-2xl bg-black/5 p-1">
          <button
            type="button"
            onClick={() => setViewMode("directory")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
              viewMode === "directory"
                ? "bg-[#071313] text-white shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            <Users className="h-4 w-4" />
            Full Directory ({riders.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("roster")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
              viewMode === "roster"
                ? "bg-[#d9ff38] text-[#071313] shadow-sm border border-black/20"
                : "text-black/60 hover:text-black"
            }`}
          >
            <Award className="h-4 w-4 text-[#ff5f3d]" />
            Event-Day Race Roster
          </button>
        </div>
      </div>

      {viewMode === "roster" ? (
        <EventDayRaceRoster
          riders={rosterFilteredRiders}
          paginatedRiders={rosterPaginatedRiders}
          stats={rosterStats}
          routes={uniqueRoutes}
          batches={uniqueBatches}
          searchText={searchText}
          onSearchChange={(v) => {
            setSearchText(v);
            setRosterPage(1);
          }}
          route={rosterRoute}
          onRouteChange={(v) => {
            setRosterRoute(v);
            setRosterPage(1);
          }}
          batch={rosterBatch}
          onBatchChange={(v) => {
            setRosterBatch(v);
            setRosterPage(1);
          }}
          ageBracket={rosterAgeBracket}
          onAgeBracketChange={(v) => {
            setRosterAgeBracket(v);
            setRosterPage(1);
          }}
          minAge={rosterMinAge}
          onMinAgeChange={(v) => {
            setRosterMinAge(v);
            setRosterPage(1);
          }}
          maxAge={rosterMaxAge}
          onMaxAgeChange={(v) => {
            setRosterMaxAge(v);
            setRosterPage(1);
          }}
          gender={rosterGender}
          onGenderChange={(v) => {
            setRosterGender(v);
            setRosterPage(1);
          }}
          status={rosterStatus}
          onStatusChange={(v) => {
            setRosterStatus(v);
            setRosterPage(1);
          }}
          selectedRosterIds={selectedRosterIds}
          onToggleSelectRider={toggleSelectRosterRider}
          onToggleSelectAll={toggleSelectAllRoster}
          onOpenBatchModal={() => setBatchModalOpen(true)}
          onExport={handleExportRosterCsv}
          onPrint={() => window.print()}
          onShowQr={setQrModalRider}
          page={rosterCurrentPage}
          pageSize={rosterPageSize}
          totalPages={rosterTotalPages}
          onPageChange={setRosterPage}
        />
      ) : (
        <>
          {/* FILTER & SEARCH TOOLBAR CARD */}
          <ParticipantDirectoryToolbar
            totalCount={riders.length}
            approvedCount={riders.filter((r) => r.status === "approved").length}
            checkedInCount={riders.filter((r) => r.status === "checked_in").length}
            searchText={searchText}
            onSearchTextChange={(v) => {
              setSearchText(v);
              setPage(1);
            }}
            routeFilter={routeFilter}
            onRouteChange={(v) => {
              setRouteFilter(v);
              setPage(1);
            }}
            uniqueRoutes={uniqueRoutes}
            statusFilter={statusFilter}
            onStatusChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            certificateFilter={certificateFilter}
            onCertificateChange={(v) => {
              setCertificateFilter(v);
              setPage(1);
            }}
            certificateCounts={certificateCounts}
            selectedCount={selectedIds.length}
            busy={busy}
            onDeleteSelected={deleteSelected}
            onExpandAll={expandAllVisible}
            onCollapseAll={collapseAll}
            expandedCount={expandedIds.size}
            visibleCount={paginatedRiders.length}
          />

          {/* FLOATING CONTEXTUAL BULK ACTIONS BAR */}
          <ParticipantBulkActionBar
            selectedCount={selectedIds.length}
            busy={busy}
            batchProgress={batchProgress}
            riderPassSelectedCount={riderPassSelected.length}
            checkedInSelectedCount={checkedInSelected.length}
            certificateFile={certificateFile}
            onClearSelection={clearSelection}
            onBulkSetStatus={bulkSetStatus}
            onPreviewRiderPass={previewRiderPass}
            onGenerateRiderPasses={generateRiderPasses}
            onPreviewCertificate={previewCertificate}
            onGenerateCertificates={generateCertificates}
            onCertificateFileChange={setCertificateFile}
            onSendUploadedCertificates={sendUploadedCertificates}
          />

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
                    paginatedRiders.map((rider) => (
                      <ParticipantDirectoryRow
                        key={rider.id}
                        rider={rider}
                        isChecked={selectedSet.has(rider.id)}
                        isExpanded={expandedIds.has(rider.id)}
                        copiedId={copiedId}
                        busy={busy}
                        onToggleSelect={toggleSelect}
                        onToggleExpand={toggleExpand}
                        onCopyId={copyToClipboard}
                        onChangeStatus={changeStatus}
                        onShowQr={setQrModalRider}
                        previewRiderPass={previewRiderPass}
                        generateRiderPasses={generateRiderPasses}
                        previewCertificate={previewCertificate}
                        generateCertificates={generateCertificates}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredRiders.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="participants"
            />
          </div>
        </>
      )}

      {/* QR CODE MODAL LIGHTBOX */}
      <ParticipantQrModal
        rider={qrModalRider}
        onClose={() => setQrModalRider(null)}
      />

      {/* BATCH / WAVE MANAGEMENT MODAL */}
      <BatchManagementModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        filteredRiders={rosterFilteredRiders}
        selectedRiders={rosterFilteredRiders.filter((r) => selectedRosterIds.includes(r.id))}
        existingBatches={uniqueBatches}
        onAssignBatch={handleAssignBatch}
        isSaving={isBatchSaving}
      />
    </div>
  );
}
