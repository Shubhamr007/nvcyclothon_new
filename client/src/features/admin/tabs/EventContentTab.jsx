import React, { useState } from "react";
import { uploadAdminProfileImage } from "../../../api/http";
import { uploadImage, isCloudinaryConfigured } from "../../../services/cloudinary";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Edit2, Trash2, Plus, Upload, Sparkles, Award, UsersRound, Tag, Flag } from "lucide-react";

function toEditableForm(fields, item) {
  const next = { ...fields };
  for (const key of Object.keys(fields)) {
    if (item[key] !== undefined && item[key] !== null) {
      next[key] = item[key];
    }
  }
  return next;
}

export function ManagePanel({
  title,
  fields,
  items = [],
  onSave,
  onRemove,
  render,
  adminKey,
  icon: Icon = Sparkles,
  description,
}) {
  const [form, setForm] = useState(fields);
  const [editing, setEditing] = useState(null);

  const reset = () => {
    setForm(fields);
    setEditing(null);
  };

  const submit = (event) => {
    event.preventDefault();
    const normalized = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        key === "member_count" || key === "display_order"
          ? Number(value)
          : value,
      ])
    );
    onSave(normalized, reset, editing);
  };

  const beginEdit = (item) => {
    setEditing(item.id);
    setForm(toEditableForm(fields, item));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-[#ff5f3d]" />
            <h2 className="text-xl font-black text-[#071313]">{title}</h2>
          </div>
          {description && (
            <p className="text-xs text-[#071313]/60 mt-0.5">{description}</p>
          )}
        </div>
        <Badge variant="accent" className="font-bold uppercase text-[11px] px-3 py-1">
          {items.length} Record{items.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* FORM */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h3 className="text-sm font-black uppercase text-[#071313]">
              {editing ? `Edit ${title}` : `Add New ${title}`}
            </h3>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(form).map(([name, value]) => (
              <div key={name}>
                <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1">
                  {name === "image_url" ? "Profile Photograph" : name.replaceAll("_", " ")}
                </label>

                {typeof value === "boolean" ? (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setForm({ ...form, [name]: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#071313]"
                    />
                    <span className="text-xs font-bold text-[#071313]">
                      Enable / Active on website
                    </span>
                  </label>
                ) : name === "notes" ||
                  name === "bio" ||
                  name === "description" ||
                  name === "message" ? (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    className="w-full rounded-xl border border-black/15 bg-white p-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                  />
                ) : name === "image_url" && adminKey ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                      className="h-9 w-full rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                      placeholder="Paste image URL or choose file below"
                    />
                    <label className="flex items-center gap-2 cursor-pointer w-fit rounded-lg border border-black/15 bg-[#fbf8ef] px-3 py-1.5 text-xs font-bold text-black/70 hover:bg-black/5">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            if (isCloudinaryConfigured().configured) {
                              const result = await uploadImage(file, { folder: "nvcyclothon/profiles" });
                              setForm((current) => ({ ...current, image_url: result.secureUrl }));
                            } else {
                              const result = await uploadAdminProfileImage(adminKey, file);
                              setForm((current) => ({ ...current, image_url: result.image_url }));
                            }
                          } catch (error) {
                            window.alert(error.message);
                          }
                        }}
                      />
                    </label>
                    {value && (
                      <img
                        src={value}
                        alt="Preview"
                        className="h-16 w-16 rounded-xl object-cover border border-black/10 mt-1"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    required={
                      !["contact_email", "contact_phone", "code", "image_url"].includes(name)
                    }
                    type={typeof value === "number" ? "number" : "text"}
                    value={value}
                    onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    className="h-9 w-full rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="submit" variant="default" className="w-full font-bold">
              {editing ? "Save Changes" : `Create ${title}`}
            </Button>
          </div>
        </form>

        {/* LIST VIEW */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#071313]/20 bg-white p-10 text-center text-xs text-black/50">
              No entries recorded in this list yet.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#071313]/10 bg-white p-4 shadow-sm hover:border-[#071313]/25 transition-colors"
              >
                <div className="flex items-center gap-3">{render(item)}</div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginEdit(item)}
                    className="h-8 px-2.5 text-xs font-bold"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemove(item.id)}
                    className="h-8 px-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
