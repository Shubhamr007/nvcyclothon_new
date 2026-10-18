/**
 * Helper utilities for participant directory filtering and metrics.
 */

export function calculateCertificateCounts(riders = []) {
  return riders.reduce(
    (counts, rider) => {
      const status = rider.certificate_delivery_status || "not_sent";
      counts[status] = (counts[status] || 0) + 1;
      counts.all += 1;
      return counts;
    },
    { all: 0, sent: 0, failed: 0, disabled: 0, not_sent: 0 }
  );
}

export function extractUniqueRoutes(riders = []) {
  const set = new Set();
  riders.forEach((r) => {
    if (r.ride_category) set.add(r.ride_category);
  });
  return Array.from(set);
}

export function filterDirectoryRiders(
  riders = [],
  { certificateFilter = "all", routeFilter = "all", statusFilter = "all", searchText = "" }
) {
  const query = searchText.trim().toLowerCase();
  return riders.filter((rider) => {
    if (certificateFilter !== "all") {
      const status = rider.certificate_delivery_status || "not_sent";
      if (status !== certificateFilter) return false;
    }
    if (routeFilter !== "all" && rider.ride_category !== routeFilter) {
      return false;
    }
    if (statusFilter !== "all" && rider.status !== statusFilter) {
      return false;
    }
    if (query) {
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
        String(val || "").toLowerCase().includes(query)
      );
      if (!match) return false;
    }
    return true;
  });
}

export function paginateDirectoryRiders(riders = [], page = 1, pageSize = 20) {
  const totalPages = Math.max(1, Math.ceil(riders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginated = riders.slice(start, start + pageSize);
  return { paginated, totalPages, currentPage };
}
