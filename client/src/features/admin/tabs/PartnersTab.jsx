import React, { useState, useEffect, useCallback } from "react";
import {
  listAdminPartnerApplications,
  reviewPartnerApplication,
  getAdminPartnerLogo,
  getAdminPartnerDeliverables,
  updateAdminPartnerDeliverable,
  exportAdminPartnersCsv,
  bulkDeleteAdminRecords,
} from "../../../api/http";
import { useDebouncedValue } from "../../../components/useDebouncedValue";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";
import {
  Building2,
  Download,
  Search,
  CheckCircle2,
  Clock,
  X,
  FileCheck,
  ExternalLink,
  Eye,
} from "lucide-react";

export function PartnersTab({ accessToken, onFeedback }) {
  const [subTab, setSubTab] = useState("applications"); // applications, approved
  const [apps, setApps] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [deliverablesApp, setDeliverablesApp] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [updatingDeliverable, setUpdatingDeliverable] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchApps = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    listAdminPartnerApplications(accessToken, {
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
    return fetchApps();
  }, [fetchApps]);

  const handleUpdateStatus = async (id, status, notes) => {
    try {
      await reviewPartnerApplication(accessToken, id, { status, notes });
      onFeedback?.(`Partner application marked as ${status}`);
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
      const result = await bulkDeleteAdminRecords(accessToken, "partner", selectedIds);
      setSelectedIds([]);
      onFeedback?.(`${result.deleted} partner application(s) deleted${result.skipped ? `; ${result.skipped} paid, reviewed, or approved record(s) were kept` : ""}.`);
      fetchApps();
    } catch (error) {
      onFeedback?.(error.message || "Unable to delete selected partner applications.");
    } finally {
      setDeleting(false);
    }
  };

  const previewLogo = async (id) => {
    try {
      const blob = await getAdminPartnerLogo(accessToken, id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      onFeedback?.(error.message);
    }
  };

  const openDeliverables = async (app) => {
    setDeliverablesApp(app);
    try {
      const data = await getAdminPartnerDeliverables(accessToken, app.id);
      setDeliverables(data || []);
    } catch (error) {
      onFeedback?.(error.message);
    }
  };

  const toggleDeliverable = async (deliverableId, currentStatus) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    setUpdatingDeliverable(true);
    try {
      const updated = await updateAdminPartnerDeliverable(
        accessToken,
        deliverablesApp.id,
        deliverableId,
        { status: nextStatus }
      );
      setDeliverables((prev) =>
        prev.map((d) => (d.id === deliverableId ? updated : d))
      );
      onFeedback?.(`Deliverable marked as ${nextStatus}`);
    } catch (error) {
      onFeedback?.(error.message);
    } finally {
      setUpdatingDeliverable(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportAdminPartnersCsv(accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nv_cyclothon_partners.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      onFeedback?.("Exported partners CSV successfully");
    } catch (error) {
      onFeedback?.(error.message);
    }
  };

  const partnerStatuses = [
    "all",
    "SUBMITTED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "NEGOTIATION",
    "APPROVED",
    "PAYMENT_PENDING",
    "PAYMENT_VERIFIED",
    "ASSETS_PENDING",
    "ASSETS_APPROVED",
    "EVENT_READY",
    "COMPLETED",
    "REJECTED",
  ];

  const approvedList = apps.filter(
    (a) => a.status === "APPROVED" || a.status === "EVENT_READY" || a.status === "COMPLETED"
  );

  return (
    <div className="space-y-6">
      {/* HEADER & SUB-TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#071313]">Partner & Sponsor Applications</h2>
          <p className="text-xs text-[#071313]/60">
            Track commercial sponsors, contract deliverables, brand assets, and payment verification.
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
              onClick={() => setSubTab("approved")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                subTab === "approved"
                  ? "bg-[#071313] text-[#d9ff38] shadow-sm"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Approved Roster ({approvedList.length})
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
          <SelectedDeleteAction count={selectedIds.length} label="partner application" busy={deleting} onDelete={deleteSelected} />
          {/* SEARCH & STATUS PILLS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company, brand, contact, email..."
                className="h-10 w-full rounded-xl border border-black/15 bg-white pl-9 pr-4 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {partnerStatuses.map((st) => (
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

          {/* APPLICATIONS TABLE */}
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingIndicator label="Loading partner applications…" />
            </div>
          ) : apps.length === 0 ? (
            <p className="text-xs text-black/50 py-10 text-center">
              No partner applications found matching this criteria.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-black/10">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/10 bg-[#fbf8ef] font-mono text-[#071313]">
                  <tr>
                    <th className="p-3.5 text-center">
                      <input type="checkbox" aria-label="Select all visible partner applications" checked={apps.length > 0 && apps.every((app) => selectedIds.includes(app.id))} onChange={(event) => setSelectedIds(event.target.checked ? apps.map((app) => app.id) : [])} />
                    </th>
                    <th className="p-3.5 uppercase font-bold">Reference / Date</th>
                    <th className="p-3.5 uppercase font-bold">Company / Brand</th>
                    <th className="p-3.5 uppercase font-bold">Contact Person</th>
                    <th className="p-3.5 uppercase font-bold">Package & Type</th>
                    <th className="p-3.5 uppercase font-bold">Status</th>
                    <th className="p-3.5 uppercase font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-black/[0.01]">
                      <td className="p-3.5 text-center">
                        <input type="checkbox" aria-label={`Select partner application ${app.application_number || app.id}`} checked={selectedIds.includes(app.id)} onChange={() => setSelectedIds((current) => current.includes(app.id) ? current.filter((id) => id !== app.id) : [...current, app.id])} />
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#071313]">
                          {app.application_number || `NV-26-P-${app.id}`}
                        </span>
                        <div className="text-[10px] text-black/45">
                          {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-black text-sm text-[#071313] block">
                          {app.company_name}
                        </span>
                        {app.brand_name && app.brand_name !== app.company_name && (
                          <span className="text-[11px] text-black/60">Brand: {app.brand_name}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-[#071313]">{app.contact_name}</div>
                        <div className="text-[11px] text-black/55">{app.phone} • {app.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-[#ff5f3d]">
                          {app.package_name || app.tier_name || "Custom Tier"}
                        </div>
                        <div className="text-[10px] text-black/55">{app.partnership_type}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            app.status === "APPROVED" || app.status === "EVENT_READY" || app.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : app.status === "PAYMENT_VERIFIED"
                              ? "bg-blue-100 text-blue-800"
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
                          {app.logo_key && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => previewLogo(app.id)}
                              className="h-7 px-2 text-[11px]"
                            >
                              Logo
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeliverables(app)}
                            className="h-7 px-2 text-[11px]"
                          >
                            Deliverables
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
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

      {subTab === "approved" && (
        <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm">
          <h4 className="text-base font-black uppercase text-[#071313] mb-4">
            Approved Event Partners
          </h4>
          {approvedList.length === 0 ? (
            <p className="text-xs text-black/50 py-8 text-center">No approved partners yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {approvedList.map((p) => (
                <div key={p.id} className="rounded-2xl border border-black/10 bg-[#fbf8ef] p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase">
                      {p.status}
                    </span>
                    <span className="text-xs font-black text-[#ff5f3d]">
                      {p.package_name || p.tier_name || "Partner"}
                    </span>
                  </div>
                  <h5 className="mt-3 font-display font-bold text-base text-[#071313]">
                    {p.brand_name || p.company_name}
                  </h5>
                  <p className="text-xs text-black/60 mt-1">
                    Contact: {p.contact_name} ({p.phone})
                  </p>
                  <div className="mt-4 flex gap-2">
                    {p.logo_key && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => previewLogo(p.id)}
                        className="h-7 text-xs"
                      >
                        Logo
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => openDeliverables(p)}
                      className="h-7 text-xs bg-[#071313] text-[#d9ff38] font-bold"
                    >
                      Deliverables
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: APPLICATION DETAILS */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#ff5f3d]">
                  {selectedApp.application_number || `NV-26-P-${selectedApp.id}`}
                </span>
                <h4 className="font-display text-xl font-black text-[#071313]">
                  {selectedApp.company_name}
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
                  <span className="text-black/50 font-bold uppercase">Contact Person</span>
                  <p className="font-bold text-[#071313] text-sm mt-0.5">{selectedApp.contact_name}</p>
                  <p className="text-black/60">{selectedApp.designation || "N/A"}</p>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase">Phone & Email</span>
                  <p className="font-bold text-[#071313] mt-0.5">{selectedApp.phone}</p>
                  <p className="text-black/60">{selectedApp.email}</p>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase">Business Type</span>
                  <p className="font-bold text-[#071313] mt-0.5">{selectedApp.business_type || "Corporate"}</p>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase">Website</span>
                  <p className="font-bold text-[#071313] mt-0.5">{selectedApp.website || "—"}</p>
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
                    {selectedApp.city || "—"}, {selectedApp.state || "—"} ({selectedApp.pincode || "—"})
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-black/10 p-4">
                <span className="text-black/50 font-bold uppercase">Partnership Proposal</span>
                <p className="font-bold text-sm text-[#ff5f3d] mt-1">
                  {selectedApp.package_name || selectedApp.tier_name || "Custom"} ({selectedApp.partnership_type})
                </p>
                {selectedApp.proposed_value && (
                  <p className="mt-1 text-black/80 font-medium">Proposed Value: {selectedApp.proposed_value}</p>
                )}
                {selectedApp.custom_description && (
                  <p className="mt-1 text-black/70 italic">&ldquo;{selectedApp.custom_description}&rdquo;</p>
                )}
              </div>

              {selectedApp.activation_description && (
                <div className="rounded-xl border border-black/10 p-4">
                  <span className="text-black/50 font-bold uppercase">Activation Intent</span>
                  <p className="mt-1 text-black/80">{selectedApp.activation_description}</p>
                </div>
              )}

              {selectedApp.review_notes && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900">
                  <span className="font-bold uppercase text-[10px]">Reviewer Notes</span>
                  <p className="mt-1">{selectedApp.review_notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-black/10 pt-4">
              {selectedApp.logo_key && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => previewLogo(selectedApp.id)}
                >
                  Download Logo
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
                Change Status / Notes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELIVERABLES TRACKING */}
      {deliverablesApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <span className="text-xs font-bold text-[#ff5f3d]">Deliverable Tracking</span>
                <h4 className="font-display text-lg font-black text-[#071313]">
                  {deliverablesApp.company_name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDeliverablesApp(null)}
                className="h-8 w-8 rounded-full bg-black/5 font-bold text-black/60 hover:bg-black/10"
              >
                <X className="h-4 w-4 m-auto" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {deliverables.length === 0 ? (
                <p className="text-xs text-black/50 py-4 text-center">No specific deliverables logged yet.</p>
              ) : (
                deliverables.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-black/10 p-3.5"
                  >
                    <div>
                      <p className="font-bold text-xs text-[#071313]">{item.deliverable_type}</p>
                      {item.completed_at && (
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Completed on {new Date(item.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={item.status === "COMPLETED" ? "accent" : "outline"}
                      disabled={updatingDeliverable}
                      onClick={() => toggleDeliverable(item.id, item.status)}
                      className="h-7 text-xs font-bold"
                    >
                      {item.status === "COMPLETED" ? "✓ Done" : "Mark Done"}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 border-t border-black/10 pt-4 text-right">
              <Button
                size="sm"
                onClick={() => setDeliverablesApp(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE STATUS & REVIEW */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="font-display text-lg font-black text-[#071313]">
              Update Application Status
            </h4>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70">
                  Select Workflow Status
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
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PAYMENT_PENDING">PAYMENT PENDING</option>
                  <option value="PAYMENT_VERIFIED">PAYMENT VERIFIED</option>
                  <option value="ASSETS_PENDING">ASSETS PENDING</option>
                  <option value="ASSETS_APPROVED">ASSETS APPROVED</option>
                  <option value="EVENT_READY">EVENT READY</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70">
                  Internal Review Notes / Terms
                </label>
                <textarea
                  rows={3}
                  value={reviewModal.notes}
                  onChange={(e) =>
                    setReviewModal((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Record commercial discussion terms or feedback..."
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
                Save Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
