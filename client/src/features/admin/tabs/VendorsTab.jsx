import React, { useState, useEffect, useCallback } from "react";
import {
  listAdminVendorApplications,
  reviewVendorApplication,
  getAdminVendorDocument,
  exportAdminVendorsCsv,
  bulkDeleteAdminRecords,
} from "../../../api/http";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";
import {
  Store,
  Download,
  Search,
  CheckCircle2,
  X,
  FileText,
  Zap,
  Droplets,
  Armchair,
  Car,
} from "lucide-react";

export function VendorsTab({ accessToken, onFeedback }) {
  const [subTab, setSubTab] = useState("applications"); // applications, allocations
  const [apps, setApps] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchVendors = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    listAdminVendorApplications(accessToken, {
      status: filter === "all" ? null : filter,
      search: debouncedSearch,
    })
      .then((data) => {
        if (!cancelled) {
          setApps(data || []);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          onFeedback?.(error.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, filter, debouncedSearch, onFeedback]);

  useEffect(() => {
    return fetchVendors();
  }, [fetchVendors]);

  const handleUpdateStatus = async (id, status, notes) => {
    try {
      await reviewVendorApplication(accessToken, id, { status, notes });
      onFeedback?.(`Vendor application marked as ${status}`);
      setApps((current) =>
        current.map((app) => (app.id === id ? { ...app, status, review_notes: notes } : app))
      );
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev) => ({ ...prev, status, review_notes: notes }));
      }
      setReviewModal(null);
    } catch (error) {
      onFeedback?.(error.message);
    }
  };

  const deleteSelected = async () => {
    setDeleting(true);
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "vendor", selectedIds);
      setSelectedIds([]);
      onFeedback?.(`${result.deleted} vendor application(s) deleted${result.skipped ? `; ${result.skipped} paid, reviewed, or approved record(s) were kept` : ""}.`);
      fetchVendors();
    } catch (error) {
      onFeedback?.(error.message || "Unable to delete selected vendor applications.");
    } finally {
      setDeleting(false);
    }
  };

  const previewDocument = async (id) => {
    try {
      const blob = await getAdminVendorDocument(accessToken, id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      onFeedback?.(error.message);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportAdminVendorsCsv(accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nv_cyclothon_vendors.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      onFeedback?.("Exported vendors CSV successfully");
    } catch (error) {
      onFeedback?.(error.message);
    }
  };

  const vendorStatuses = ["all", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "EVENT_READY", "COMPLETED"];
  const approvedVendors = apps.filter(
    (a) => a.status === "APPROVED" || a.status === "EVENT_READY" || a.status === "COMPLETED"
  );

  return (
    <div className="space-y-6">
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#071313]">Vendor & Expo Stall Management</h2>
          <p className="text-xs text-[#071313]/60">
            Review food stalls, bicycle equipment, recovery gear, and utility allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-[#fbf8ef] p-1 border border-black/10">
            <button
              type="button"
              onClick={() => setSubTab("applications")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                subTab === "applications"
                  ? "bg-[#071313] text-[#d9ff38] shadow-sm"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Applications ({apps.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab("allocations")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                subTab === "allocations"
                  ? "bg-[#071313] text-[#d9ff38] shadow-sm"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Stall Allocations ({approvedVendors.length})
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            className="h-9 text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {subTab === "applications" && (
        <div className="rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm space-y-4">
          <SelectedDeleteAction count={selectedIds.length} label="vendor application" busy={deleting} onDelete={deleteSelected} />
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor name, category, or contact..."
                className="h-10 w-full rounded-xl border border-black/15 bg-white pl-9 pr-4 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {vendorStatuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase transition whitespace-nowrap ${
                    filter === st
                      ? "bg-[#071313] text-[#d9ff38]"
                      : "bg-[#fbf8ef] text-[#071313]/70 hover:bg-black/10"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingIndicator label="Loading applications..." />
            </div>
          ) : apps.length === 0 ? (
            <p className="text-xs text-black/50 py-10 text-center">No vendor applications found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-black/10">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/10 bg-[#fbf8ef] font-mono text-[#071313]">
                  <tr>
                    <th className="p-3.5 text-center">
                      <input type="checkbox" aria-label="Select all visible vendor applications" checked={apps.length > 0 && apps.every((app) => selectedIds.includes(app.id))} onChange={(event) => setSelectedIds(event.target.checked ? apps.map((app) => app.id) : [])} />
                    </th>
                    <th className="p-3.5 uppercase font-bold">Ref / Date</th>
                    <th className="p-3.5 uppercase font-bold">Business Name</th>
                    <th className="p-3.5 uppercase font-bold">Category</th>
                    <th className="p-3.5 uppercase font-bold">Representative</th>
                    <th className="p-3.5 uppercase font-bold">Utilities / Space</th>
                    <th className="p-3.5 uppercase font-bold">Status</th>
                    <th className="p-3.5 uppercase font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-black/[0.01]">
                      <td className="p-3.5 text-center">
                        <input type="checkbox" aria-label={`Select vendor application ${app.application_number || app.id}`} checked={selectedIds.includes(app.id)} onChange={() => setSelectedIds((current) => current.includes(app.id) ? current.filter((id) => id !== app.id) : [...current, app.id])} />
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#071313]">
                          {app.application_number || `NV-26-V-${app.id}`}
                        </span>
                        <div className="text-[10px] text-black/45">
                          {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-black text-sm text-[#071313] block">
                          {app.business_name}
                        </span>
                        <span className="text-[11px] text-black/60 truncate block max-w-xs">
                          {app.products_services}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-full bg-[#fbf8ef] text-[#071313] font-bold px-2 py-0.5 text-[11px] border border-black/10">
                          {app.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-[#071313]">
                          {app.representative_name || app.contact_name}
                        </div>
                        <div className="text-[11px] text-black/55">{app.phone}</div>
                      </td>
                      <td className="p-3.5 text-[11px]">
                        <div>Space: {app.space_requirement || "Standard"}</div>
                        <div className="text-black/50 text-[10px] mt-0.5">
                          {[
                            app.electricity_required && "⚡ Power",
                            app.water_required && "💧 Water",
                            app.furniture_required && "🪑 Furniture",
                          ]
                            .filter(Boolean)
                            .join(" • ") || "Basic setup"}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            app.status === "APPROVED" || app.status === "EVENT_READY" || app.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedApp(app)}
                            className="h-7 px-2 text-[11px]"
                          >
                            Details
                          </Button>
                          {app.document_key && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => previewDocument(app.id)}
                              className="h-7 px-2 text-[11px]"
                            >
                              Doc
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() =>
                              setReviewModal({
                                id: app.id,
                                status: app.status,
                                notes: app.review_notes || "",
                              })
                            }
                            className="h-7 px-2 text-[11px] bg-[#071313] text-[#d9ff38] font-bold"
                          >
                            Status
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === "allocations" && (
        <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm">
          <h4 className="text-base font-black uppercase text-[#071313] mb-4">
            Stall Allocations & On-Ground Operations
          </h4>
          {approvedVendors.length === 0 ? (
            <p className="text-xs text-black/50 py-8 text-center">No approved vendors to allocate stalls for.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {approvedVendors.map((v) => (
                <div key={v.id} className="rounded-2xl border border-black/10 bg-[#fbf8ef] p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#071313]">
                      {v.application_number || `NV-26-V-${v.id}`}
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase">
                      {v.status}
                    </span>
                  </div>
                  <h5 className="mt-2 font-display font-bold text-base text-[#071313]">
                    {v.business_name} ({v.category})
                  </h5>
                  <div className="mt-3 space-y-1 text-xs text-black/70">
                    <p><strong>Space:</strong> {v.space_requirement || "To be allocated"}</p>
                    <p><strong>Staff Count:</strong> {v.staff_count || 1} team members</p>
                    <p><strong>Support:</strong> {v.electricity_required ? "Electricity; " : ""}{v.water_required ? "Water; " : ""}</p>
                    {v.review_notes && (
                      <p className="mt-2 rounded-lg bg-white p-2 text-black/80 font-medium">
                        <strong>Allocation Notes:</strong> {v.review_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <span className="text-xs font-bold text-[#d9ff38] bg-[#071313] px-2.5 py-0.5 rounded-full uppercase">
                  {selectedApp.category}
                </span>
                <h4 className="font-display text-xl font-black text-[#071313] mt-2">
                  {selectedApp.business_name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="h-8 w-8 rounded-full bg-black/5 font-bold text-black/60 hover:bg-black/10"
              >
                <X className="h-4 w-4 m-auto" />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-black/5 p-4">
                <div>
                  <span className="text-black/50 font-bold uppercase">Representative</span>
                  <p className="font-bold text-[#071313] text-sm mt-0.5">
                    {selectedApp.representative_name || selectedApp.contact_name}
                  </p>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase">Phone & Email</span>
                  <p className="font-bold text-[#071313] mt-0.5">{selectedApp.phone}</p>
                  <p className="text-black/60">{selectedApp.email}</p>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase">GST / PAN</span>
                  <p className="font-bold text-[#071313] mt-0.5">
                    GST: {selectedApp.gst_number || "N/A"} | PAN: {selectedApp.pan_number || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase">Location</span>
                  <p className="font-bold text-[#071313] mt-0.5">
                    {selectedApp.address}, {selectedApp.city || "Rewa"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-black/10 p-4">
                <span className="text-black/50 font-bold uppercase">Products & Services</span>
                <p className="font-bold text-sm text-[#071313] mt-1">{selectedApp.products_services}</p>
                <p className="mt-1 text-black/70">{selectedApp.description}</p>
              </div>

              <div className="rounded-xl border border-black/10 p-4">
                <span className="text-black/50 font-bold uppercase">Requirements</span>
                <div className="mt-2 grid grid-cols-2 gap-2 text-black/80">
                  <p>Space: {selectedApp.space_requirement || "Standard"}</p>
                  <p>Staff: {selectedApp.staff_count || 1}</p>
                  <p>Electricity: {selectedApp.electricity_required ? "Yes" : "No"}</p>
                  <p>Water: {selectedApp.water_required ? "Yes" : "No"}</p>
                  <p>Furniture: {selectedApp.furniture_required ? "Yes" : "No"}</p>
                  <p>Vehicle Access: {selectedApp.vehicle_access_required ? "Yes" : "No"}</p>
                </div>
              </div>

              {selectedApp.review_notes && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900">
                  <span className="font-bold uppercase text-[10px]">Stall Allocation / Notes</span>
                  <p className="mt-1">{selectedApp.review_notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-black/10 pt-4">
              {selectedApp.document_key && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => previewDocument(selectedApp.id)}
                >
                  Download Document
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setReviewModal({
                    id: selectedApp.id,
                    status: selectedApp.status,
                    notes: selectedApp.review_notes || "",
                  });
                }}
                className="bg-[#071313] text-[#d9ff38] font-bold"
              >
                Change Status / Allocation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW STATUS MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="font-display text-lg font-black text-[#071313]">
              Update Vendor Status
            </h4>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70">
                  Status
                </label>
                <select
                  value={reviewModal.status}
                  onChange={(e) =>
                    setReviewModal((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="mt-1.5 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="EVENT_READY">EVENT READY</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70">
                  Allocation / Operations Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewModal.notes}
                  onChange={(e) =>
                    setReviewModal((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Record space allocation, power requirements, or review feedback..."
                  className="mt-1.5 w-full rounded-xl border border-black/20 bg-white p-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-black/10 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewModal(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleUpdateStatus(reviewModal.id, reviewModal.status, reviewModal.notes)
                }
                className="bg-[#071313] text-[#d9ff38] font-bold"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
