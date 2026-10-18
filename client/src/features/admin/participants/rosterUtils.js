import { adminRequest } from "../../../api/http";
import { AGE_BRACKETS } from "./EventDayRaceRoster";

/**
 * Pure filter function for race roster riders.
 */
export function filterRosterRiders(riders, {
  rosterRoute = "all",
  rosterBatch = "all",
  rosterAgeBracket = "all",
  rosterMinAge = "",
  rosterMaxAge = "",
  rosterGender = "all",
  rosterStatus = "all",
  searchText = "",
}) {
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
    if (searchText) {
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
        String(val || "").toLowerCase().includes(searchText)
      );
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Assigns or splits batches for target riders.
 */
export async function executeRosterBatchAssignment({
  mode,
  targetRiders,
  batchSize,
  batchPrefix,
  startNumber,
  batchName,
  adminKey,
}) {
  try {
    if (!targetRiders || targetRiders.length === 0) return { updatedCount: 0, totalWaves: 0 };

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

      return { updatedCount, totalWaves, mode: "auto_split" };
    } else {
      const targetIds = targetRiders.map((r) => r.id);
      const res = await adminRequest("/registrations/bulk-batch", adminKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_ids: targetIds,
          batch_name: batchName,
        }),
      });

      return {
        updatedCount: res.updated || targetIds.length,
        mode: "custom",
        batchName,
      };
    }
  } catch (error) {
    console.error("executeRosterBatchAssignment error:", error);
    throw error;
  }
}
