import React from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AdminSlideOver } from "../components/AdminSlideOver";
import { AdminImageUploader } from "../components/AdminImageUploader";

export function GallerySingleDrawer({
  isOpen,
  onClose,
  editingItem,
  singleForm,
  setSingleForm,
  singleUploading,
  setSingleUploading,
  accessToken,
  onFeedback,
  onSubmit,
}) {
  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={() => !singleUploading && onClose()}
      side="right"
      title={editingItem ? "Edit Photograph Details" : "Add Photograph to Gallery"}
      subtitle={
        editingItem
          ? `Update details and category for photo #${editingItem.id}`
          : "Add a single picture to the cyclothon gallery"
      }
      icon={Camera}
      width="max-w-xl"
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={singleUploading}
            onClick={onClose}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={singleUploading || !singleForm.image_url}
            onClick={onSubmit}
            className="bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold text-xs px-4 shadow-xs"
          >
            {singleUploading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </span>
            ) : editingItem ? (
              "Save Changes"
            ) : (
              "Add Photograph"
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        {/* Prominent Image Preview with AdminImageUploader */}
        <AdminImageUploader
          imageUrl={singleForm.image_url}
          fallbackText={singleForm.title || "Photo"}
          onImageUploaded={(url) => {
            setSingleForm((prev) => ({ ...prev, image_url: url }));
            onFeedback?.("Photo uploaded successfully.");
          }}
          onImageRemoved={() => {
            setSingleForm((prev) => ({ ...prev, image_url: "" }));
          }}
          accessToken={accessToken}
          isUploading={singleUploading}
          setIsUploading={setSingleUploading}
          label="Gallery Photograph Preview"
          aspectRatioLabel="Landscape or 4:3 high-res recommended"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Direct Image URL (or paste external link)
          </label>
          <input
            type="text"
            required
            placeholder="https://..."
            value={singleForm.image_url}
            onChange={(e) =>
              setSingleForm({ ...singleForm, image_url: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:outline-none focus:ring-1 focus:ring-[#0078d4] font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Flag-off Ceremony at Rewa Stadium"
            value={singleForm.title}
            onChange={(e) =>
              setSingleForm({ ...singleForm, title: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Category Tab *
          </label>
          <select
            value={singleForm.category}
            onChange={(e) =>
              setSingleForm({ ...singleForm, category: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:border-[#0078d4] focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
          >
            <option value="Organizers">Organizers & Race Directors</option>
            <option value="Partners">Official Partners & Sponsors</option>
            <option value="Riders">Riders & Peloton Moments</option>
            <option value="Highlights">Route & Event Highlights</option>
            <option value="Event">General Event Photography</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Caption / Description
          </label>
          <textarea
            rows={3}
            placeholder="Optional context or photo caption"
            value={singleForm.caption}
            onChange={(e) =>
              setSingleForm({ ...singleForm, caption: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
          />
        </div>
      </form>
    </AdminSlideOver>
  );
}

export default GallerySingleDrawer;
