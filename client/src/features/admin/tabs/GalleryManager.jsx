import React, { useState, useMemo } from "react";
import {
  resolveApiAssetUrl,
  uploadAdminProfileImage,
  createGalleryBatch,
  adminRequest,
} from "../../../api/http";
import { uploadImage, isCloudinaryConfigured } from "../../../services/cloudinary";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Camera,
  Upload,
  Plus,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Sparkles,
  X,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";

const CATEGORIES = [
  "All",
  "Organizers",
  "Partners",
  "Riders",
  "Highlights",
  "Event",
];

const CATEGORY_STYLES = {
  Organizers: "bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30",
  Partners: "bg-[#06b6d4]/15 text-[#0e7490] border-[#06b6d4]/30",
  Riders: "bg-[#10b981]/15 text-[#047857] border-[#10b981]/30",
  Highlights: "bg-[#f43f5e]/15 text-[#be123c] border-[#f43f5e]/30",
  Event: "bg-[#6366f1]/15 text-[#4338ca] border-[#6366f1]/30",
};

export function GalleryManager({
  items = [],
  accessToken,
  onRefresh,
  onBulkRemove,
  onFeedback,
}) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Batch upload state
  const [batchCategory, setBatchCategory] = useState("Highlights");
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchBaseTitle, setBatchBaseTitle] = useState("");
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Single edit / add state
  const [singleForm, setSingleForm] = useState({
    title: "",
    caption: "",
    category: "Highlights",
    image_url: "",
    display_order: 0,
    featured: true,
  });
  const [singleUploading, setSingleUploading] = useState(false);

  const filteredItems = useMemo(() => {
    if (activeTab === "All") return items;
    return items.filter(
      (item) => (item.category || "").toLowerCase() === activeTab.toLowerCase()
    );
  }, [items, activeTab]);

  const handleSelectAll = () => {
    const visibleIds = filteredItems.map((item) => item.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSingleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await adminRequest(`/gallery/${editingItem.id}`, accessToken, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(singleForm),
        });
        onFeedback?.("Photograph updated successfully.");
      } else {
        await adminRequest("/gallery", accessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(singleForm),
        });
        onFeedback?.("Photograph added successfully.");
      }
      setIsSingleModalOpen(false);
      setEditingItem(null);
      setSingleForm({
        title: "",
        caption: "",
        category: "Highlights",
        image_url: "",
        display_order: 0,
        featured: true,
      });
      onRefresh?.();
    } catch (err) {
      onFeedback?.(err.message || "Failed to save photograph.");
    }
  };

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (batchFiles.length === 0) return;
    setBatchUploading(true);
    setBatchProgress({ current: 0, total: batchFiles.length });

    const createdItems = [];
    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        setBatchProgress({ current: i + 1, total: batchFiles.length });

        let imageUrl = "";
        if (isCloudinaryConfigured()) {
          const uploaded = await uploadImage(file, { folder: "gallery" });
          imageUrl = uploaded.secure_url;
        } else {
          const uploaded = await uploadAdminProfileImage(accessToken, file);
          imageUrl = uploaded.image_url;
        }

        const fileNameClean = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .trim();
        const title = batchBaseTitle
          ? batchFiles.length > 1
            ? `${batchBaseTitle} #${i + 1}`
            : batchBaseTitle
          : fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1);

        createdItems.push({
          title,
          caption: `${batchCategory} moment from NV Cyclothon 2026.`,
          category: batchCategory,
          image_url: imageUrl,
          display_order: items.length + i,
          featured: true,
        });
      }

      await createGalleryBatch(accessToken, createdItems);
      onFeedback?.(`Uploaded ${createdItems.length} photographs successfully!`);
      setIsBatchModalOpen(false);
      setBatchFiles([]);
      setBatchBaseTitle("");
      onRefresh?.();
    } catch (err) {
      onFeedback?.(err.message || "Batch upload failed.");
    } finally {
      setBatchUploading(false);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setSingleForm({
      title: item.title || "",
      caption: item.caption || "",
      category: item.category || "Highlights",
      image_url: item.image_url || "",
      display_order: item.display_order || 0,
      featured: item.featured !== false,
    });
    setIsSingleModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      await adminRequest(`/gallery/${id}`, accessToken, { method: "DELETE" });
      onFeedback?.("Photograph deleted.");
      onRefresh?.();
    } catch (err) {
      onFeedback?.(err.message || "Failed to delete photograph.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#ff5f3d]" />
            <h2 className="text-xl font-black text-[#071313]">Photo Gallery Management</h2>
          </div>
          <p className="text-xs text-[#071313]/60 mt-0.5">
            Upload multiple photos by category tabs. All uploaded photos automatically float in the public website stream.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 bg-[#071313] hover:bg-[#ff5f3d] text-white font-black text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4 text-[#d9ff38]" />
            <span>Upload Multiple Photos</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditingItem(null);
              setSingleForm({
                title: "",
                caption: "",
                category: activeTab === "All" ? "Highlights" : activeTab,
                image_url: "",
                display_order: items.length,
                featured: true,
              });
              setIsSingleModalOpen(true);
            }}
            className="flex items-center gap-2 border-black/15 text-xs font-bold px-3 py-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            <span>Add Single Photo</span>
          </Button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count =
              cat === "All"
                ? items.length
                : items.filter((x) => (x.category || "").toLowerCase() === cat.toLowerCase()).length;
            const isSelected = activeTab === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveTab(cat)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                  isSelected
                    ? "bg-[#071313] text-[#d9ff38] shadow-[2px_2px_0_#ff5f3d]"
                    : "bg-white text-[#071313]/70 hover:bg-black/5 border border-black/10"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-[#d9ff38]" : "bg-black/5 text-black/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredItems.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black/60 hover:text-black transition-colors"
          >
            {filteredItems.every((item) => selectedIds.includes(item.id)) ? (
              <>
                <CheckSquare className="h-4 w-4 text-[#071313]" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="h-4 w-4 text-black/40" />
                <span>Select All ({filteredItems.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* BULK DELETE ACTION BAR */}
      <SelectedDeleteAction
        count={selectedIds.length}
        label="photograph"
        onDelete={async () => {
          await onBulkRemove?.(selectedIds);
          setSelectedIds([]);
        }}
      />

      {/* PHOTO TILES STREAM / GRID */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#071313]/15 bg-white p-12 text-center">
          <Camera className="mx-auto h-10 w-10 text-black/30" />
          <h3 className="mt-3 text-sm font-black uppercase text-[#071313]">
            No photographs in “{activeTab}”
          </h3>
          <p className="mt-1 text-xs text-black/50">
            Click “Upload Multiple Photos” above to batch upload images for this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const categoryBadgeStyle =
              CATEGORY_STYLES[item.category] || "bg-black/10 text-black border-black/20";

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  isSelected ? "border-[#ff5f3d] ring-2 ring-[#ff5f3d]" : "border-black/10"
                }`}
              >
                {/* PHOTO THUMBNAIL */}
                <div className="relative aspect-[4/3] w-full bg-[#071313] overflow-hidden">
                  <img
                    src={resolveApiAssetUrl(item.image_url)}
                    alt={item.title || "Photo"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* CHECKBOX */}
                  <label
                    className="absolute left-2.5 top-2.5 z-10 grid h-6 w-6 place-items-center rounded-md bg-white/90 shadow-sm cursor-pointer hover:bg-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id]
                        )
                      }
                      className="h-3.5 w-3.5 rounded accent-[#071313]"
                    />
                  </label>

                  {/* CATEGORY BADGE */}
                  <span
                    className={`absolute right-2.5 top-2.5 rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-sm ${categoryBadgeStyle}`}
                  >
                    {item.category || "Event"}
                  </span>
                </div>

                {/* DETAILS & ACTIONS */}
                <div className="p-3">
                  <h4 className="text-xs font-black text-[#071313] line-clamp-1">
                    {item.title || "Untitled Photograph"}
                  </h4>
                  {item.caption && (
                    <p className="mt-0.5 text-[11px] text-black/50 line-clamp-1">
                      {item.caption}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-black/70 hover:text-[#071313]"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BATCH UPLOAD MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#ff5f3d]" />
                <h3 className="text-base font-black text-[#071313]">
                  Upload Multiple Photographs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !batchUploading && setIsBatchModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBatchUpload} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-black/70 mb-1">
                  Assign Category Tab:
                </label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  disabled={batchUploading}
                  className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
                >
                  <option value="Organizers">Organizers & Race Directors</option>
                  <option value="Partners">Official Partners & Sponsors</option>
                  <option value="Riders">Riders & Peloton Moments</option>
                  <option value="Highlights">Route & Event Highlights</option>
                  <option value="Event">General Event Photography</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 mb-1">
                  Common Title Prefix (optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rewa Route Highlights"
                  value={batchBaseTitle}
                  onChange={(e) => setBatchBaseTitle(e.target.value)}
                  disabled={batchUploading}
                  className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
                <p className="text-[10px] text-black/50 mt-1">
                  Leave blank to auto-generate titles from each photo's file name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 mb-1">
                  Select Photos (Multiple Files Allowed):
                </label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#071313]/25 bg-[#fbf8ef] p-6 text-center cursor-pointer hover:border-[#ff5f3d] transition-colors">
                  <ImageIcon className="h-8 w-8 text-[#ff5f3d]" />
                  <span className="text-xs font-bold text-[#071313]">
                    {batchFiles.length > 0
                      ? `${batchFiles.length} photos selected`
                      : "Click to select or drag and drop multiple pictures"}
                  </span>
                  <span className="text-[10px] text-black/50">
                    PNG, JPG, WebP supported
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    disabled={batchUploading}
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        setBatchFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>
              </div>

              {batchUploading && (
                <div className="space-y-1.5 rounded-xl bg-black/5 p-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Uploading photos…</span>
                    <span>
                      {batchProgress.current} / {batchProgress.total}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full bg-[#ff5f3d] transition-all"
                      style={{
                        width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
                <Button
                  type="button"
                  variant="outline"
                  disabled={batchUploading}
                  onClick={() => setIsBatchModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={batchUploading || batchFiles.length === 0}
                  className="bg-[#071313] hover:bg-[#ff5f3d] text-white font-bold"
                >
                  {batchUploading
                    ? `Uploading (${batchProgress.current}/${batchProgress.total})…`
                    : `Upload ${batchFiles.length} Photos`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE PHOTO ADD / EDIT MODAL */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-base font-black text-[#071313]">
                {editingItem ? "Edit Photograph" : "Add Photograph"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSingleModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSingleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-black/70 mb-1">
                  Title:
                </label>
                <input
                  type="text"
                  required
                  value={singleForm.title}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 mb-1">
                  Category Tab:
                </label>
                <select
                  value={singleForm.category}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
                >
                  <option value="Organizers">Organizers & Race Directors</option>
                  <option value="Partners">Official Partners & Sponsors</option>
                  <option value="Riders">Riders & Peloton Moments</option>
                  <option value="Highlights">Route & Event Highlights</option>
                  <option value="Event">General Event Photography</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 mb-1">
                  Caption / Description:
                </label>
                <textarea
                  rows={2}
                  value={singleForm.caption}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, caption: e.target.value })
                  }
                  className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 mb-1">
                  Photo File / Image URL:
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="https://... or upload below"
                    value={singleForm.image_url}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, image_url: e.target.value })
                    }
                    className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                  />
                  <label className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-[#fbf8ef] px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-black/5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>
                      {singleUploading ? "Uploading…" : "Upload from Device"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={singleUploading}
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSingleUploading(true);
                        try {
                          let url = "";
                          if (isCloudinaryConfigured()) {
                            const res = await uploadImage(file, { folder: "gallery" });
                            url = res.secure_url;
                          } else {
                            const res = await uploadAdminProfileImage(accessToken, file);
                            url = res.image_url;
                          }
                          setSingleForm((prev) => ({ ...prev, image_url: url }));
                        } catch (err) {
                          onFeedback?.(err.message || "Failed to upload photo.");
                        } finally {
                          setSingleUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSingleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={singleUploading || !singleForm.image_url}
                  className="bg-[#071313] hover:bg-[#ff5f3d] text-white font-bold"
                >
                  {editingItem ? "Save Changes" : "Add Photograph"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
