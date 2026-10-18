import React, { useMemo, useCallback } from "react";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { downloadCsvFile } from "../../../utils/csv";
import { EventDayRaceRoster } from "./EventDayRaceRoster";
import { BatchManagementModal } from "./BatchManagementModal";
import { ParticipantQrModal } from "./ParticipantQrModal";
import { filterRosterRiders, executeRosterBatchAssignment } from "./rosterUtils";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  setRosterSearchText,
  setRosterRoute,
  setRosterBatch,
  setRosterAgeBracket,
  setRosterMinAge,
  setRosterMaxAge,
  setRosterGender,
  setRosterStatus,
  setRosterPage,
  setRosterPageSize,
  setRosterSelectedIds,
  toggleRosterSelectId,
  setRosterBatchModalOpen,
  setRosterBatchSaving,
  setRosterQrModalRider,
} from "../../../store/slices/participantsSlice";

export function ParticipantRosterView({
  riders = [],
  adminKey: propAdminKey,
  refresh,
  onFeedback,
}) {
  const dispatch = useAppDispatch();
  const reduxKey = useAppSelector((state) => state.auth?.accessToken);
  const adminKey = propAdminKey || reduxKey;

  const {
    searchText,
    route: rosterRoute,
    batch: rosterBatch,
    selectedIds: selectedRosterIds,
    batchModalOpen,
    isBatchSaving,
    ageBracket: rosterAgeBracket,
    minAge: rosterMinAge,
    maxAge: rosterMaxAge,
    gender: rosterGender,
    status: rosterStatus,
    page: rosterPage,
    pageSize: rosterPageSize,
    qrModalRider,
  } = useAppSelector((state) => state.participants.roster);

  const debouncedSearchText = useDebouncedValue(searchText.trim().toLowerCase(), 250);

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

  // Roster filtering using isolated pure filter function
  const rosterFilteredRiders = useMemo(() => {
    return filterRosterRiders(riders, {
      rosterRoute,
      rosterBatch,
      rosterAgeBracket,
      rosterMinAge,
      rosterMaxAge,
      rosterGender,
      rosterStatus,
      searchText: debouncedSearchText,
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

  // Unified CSV Export
  const handleExportRosterCsv = useCallback(() => {
    if (rosterFilteredRiders.length === 0) {
      onFeedback?.("No riders found matching the selected filters to export.");
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
      `#${r.id}`,
      r.full_name || "",
      r.age !== null && r.age !== undefined ? r.age : "",
      r.gender || "",
      r.ride_category || "",
      r.batch_name || "Unassigned",
      r.t_shirt_size || "N/A",
      r.phone || "",
      r.emergency_contact || "",
      r.city || "",
      r.organization_name || r.organization_type || "",
      r.payment_status || "",
      r.status || "",
    ]);

    const safeRoute = (rosterRoute || "all_routes").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const safeBracket = (rosterAgeBracket || "all_ages").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const safeBatch = (rosterBatch || "all_batches").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const filename = `nv_cyclothon_race_roster_${safeRoute}_${safeBracket}_${safeBatch}.csv`;

    downloadCsvFile(filename, headers, rows);
    onFeedback?.(`Exported roster (${rosterFilteredRiders.length} riders) to CSV.`);
  }, [onFeedback, rosterAgeBracket, rosterBatch, rosterFilteredRiders, rosterRoute]);

  const toggleSelectRosterRider = useCallback(
    (id) => {
      dispatch(toggleRosterSelectId(id));
    },
    [dispatch]
  );

  const toggleSelectAllRoster = useCallback(() => {
    const visibleIds = rosterPaginatedRiders.map((r) => r.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedRosterIds.includes(id));
    if (allSelected) {
      dispatch(
        setRosterSelectedIds(selectedRosterIds.filter((id) => !visibleIds.includes(id)))
      );
    } else {
      dispatch(
        setRosterSelectedIds([...new Set([...selectedRosterIds, ...visibleIds])])
      );
    }
  }, [rosterPaginatedRiders, selectedRosterIds, dispatch]);

  const handleAssignBatch = useCallback(
    async (params) => {
      if (!params.targetRiders || params.targetRiders.length === 0) return;
      dispatch(setRosterBatchSaving(true));
      try {
        const res = await executeRosterBatchAssignment({ ...params, adminKey });
        if (res.mode === "auto_split") {
          onFeedback?.(
            `Successfully generated ${res.totalWaves} batches for ${res.updatedCount} riders.`
          );
        } else {
          onFeedback?.(
            res.batchName
              ? `Successfully assigned ${res.updatedCount} riders to "${res.batchName}".`
              : `Successfully cleared batch assignment for ${res.updatedCount} riders.`
          );
        }
        dispatch(setRosterBatchModalOpen(false));
        dispatch(setRosterSelectedIds([]));
        await refresh();
      } catch (err) {
        onFeedback?.(`Batch assignment error: ${err.message}`);
      } finally {
        dispatch(setRosterBatchSaving(false));
      }
    },
    [adminKey, onFeedback, refresh, dispatch]
  );

  return (
    <div className="space-y-4">
      <EventDayRaceRoster
        riders={rosterFilteredRiders}
        paginatedRiders={rosterPaginatedRiders}
        stats={rosterStats}
        routes={uniqueRoutes}
        batches={uniqueBatches}
        searchText={searchText}
        onSearchChange={(v) => dispatch(setRosterSearchText(v))}
        route={rosterRoute}
        onRouteChange={(v) => dispatch(setRosterRoute(v))}
        batch={rosterBatch}
        onBatchChange={(v) => dispatch(setRosterBatch(v))}
        ageBracket={rosterAgeBracket}
        onAgeBracketChange={(v) => dispatch(setRosterAgeBracket(v))}
        minAge={rosterMinAge}
        onMinAgeChange={(v) => dispatch(setRosterMinAge(v))}
        maxAge={rosterMaxAge}
        onMaxAgeChange={(v) => dispatch(setRosterMaxAge(v))}
        gender={rosterGender}
        onGenderChange={(v) => dispatch(setRosterGender(v))}
        status={rosterStatus}
        onStatusChange={(v) => dispatch(setRosterStatus(v))}
        selectedRosterIds={selectedRosterIds}
        onToggleSelectRider={toggleSelectRosterRider}
        onToggleSelectAll={toggleSelectAllRoster}
        onOpenBatchModal={() => dispatch(setRosterBatchModalOpen(true))}
        onExport={handleExportRosterCsv}
        onPrint={() => window.print()}
        onShowQr={(r) => dispatch(setRosterQrModalRider(r))}
        page={rosterCurrentPage}
        pageSize={rosterPageSize}
        totalPages={rosterTotalPages}
        onPageChange={(p) => dispatch(setRosterPage(p))}
      />

      {/* QR CODE MODAL LIGHTBOX */}
      <ParticipantQrModal
        rider={qrModalRider}
        onClose={() => dispatch(setRosterQrModalRider(null))}
      />

      {/* BATCH / WAVE MANAGEMENT MODAL */}
      {batchModalOpen && (
        <BatchManagementModal
          isOpen={batchModalOpen}
          onClose={() => dispatch(setRosterBatchModalOpen(false))}
          filteredRiders={rosterFilteredRiders}
          selectedRiders={rosterFilteredRiders.filter((r) => selectedRosterIds.includes(r.id))}
          existingBatches={uniqueBatches}
          onAssignBatch={handleAssignBatch}
          isSaving={isBatchSaving}
        />
      )}
    </div>
  );
}

export default ParticipantRosterView;
