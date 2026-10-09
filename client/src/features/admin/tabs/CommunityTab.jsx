import React, { useState, useEffect } from "react";
import { MessageSquare, Check, X, AlertCircle, Image as ImageIcon } from "lucide-react";
import {
  listAdminCommunityPosts,
  moderateCommunityPost,
  bulkDeleteAdminRecords,
  getAdminCommunityMedia,
} from "../../../api/http";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";

function CommunityModerationItem({ item, accessToken, working, selected, onSelect, onModerate }) {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let revoked = false;
    let objectUrl = "";
    const key = item.image_url?.split("/").pop();
    if (!key) return undefined;
    getAdminCommunityMedia(accessToken, key)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .catch(() => setImageUrl(""));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, item.image_url]);

  const statusVariant =
    item.status === "approved"
      ? "bg-green-100 text-green-800 border-green-200"
      : item.status === "rejected"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <article className="grid gap-4 rounded-2xl border border-black/10 bg-white p-5 md:grid-cols-[28px_160px_1fr_auto] hover:border-black/20 transition-colors shadow-sm">
      <div className="pt-1">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Select community post by ${item.name || "user"}`} />
      </div>
      <div className="min-h-28 rounded-xl bg-[#fbf8ef] flex items-center justify-center overflow-hidden border border-black/5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Submitted community content"
            className="h-36 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-black/30 p-4 text-center">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px]">No photo</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-black text-sm text-[#071313]">{item.name}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusVariant}`}>
            {item.status || "pending"}
          </span>
        </div>
        <p className="text-xs leading-5 text-black/75 font-normal pt-1">{item.message}</p>
        {item.moderation_reason && (
          <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg mt-1 font-mono">
            Reason: {item.moderation_reason}
          </p>
        )}
        <p className="text-[10px] text-black/45 pt-2 font-mono">
          Submitted {new Date(item.created_at).toLocaleString()}
        </p>
      </div>

      <div className="flex md:flex-col gap-2 justify-start shrink-0">
        {item.status !== "approved" && (
          <Button
            size="sm"
            variant="accent"
            disabled={working}
            onClick={() => onModerate(item.id, "approved")}
            className="h-8 text-xs font-bold px-3"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Approve
          </Button>
        )}
        {item.status !== "rejected" && (
          <Button
            size="sm"
            variant="destructive"
            disabled={working}
            onClick={() => onModerate(item.id, "rejected")}
            className="h-8 text-xs font-bold px-3 bg-red-600 hover:bg-red-700 text-white"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        )}
      </div>
    </article>
  );
}

export function CommunityTab({ accessToken, onFeedback }) {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [state, setState] = useState({ loading: true, error: "" });
  const [workingId, setWorkingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async () => {
    setState({ loading: true, error: "" });
    try {
      const response = await listAdminCommunityPosts(accessToken, statusFilter);
      setItems(response.items || []);
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({ loading: false, error: error.message || "Unable to load submissions." });
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken, statusFilter]);

  const moderate = async (id, status) => {
    const reason =
      status === "rejected"
        ? window.prompt("Optional private moderation reason:", "") || ""
        : "";
    setWorkingId(id);
    try {
      await moderateCommunityPost(accessToken, id, { status, reason });
      setItems((current) => current.filter((item) => item.id !== id));
      onFeedback?.(`Community post ${status}.`);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message || "Unable to save moderation.",
      }));
    } finally {
      setWorkingId(null);
    }
  };

  const removeSelected = async () => {
    setWorkingId("bulk");
    try {
      const result = await bulkDeleteAdminRecords(accessToken, "community", selectedIds);
      setSelectedIds([]);
      setItems((current) => current.filter((item) => !result.deleted_ids.includes(item.id)));
      onFeedback?.(`${result.deleted} community post(s) permanently deleted.`);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message || "Unable to delete submission.",
      }));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#071313]">Community Wall Moderation</h2>
          <p className="text-xs text-[#071313]/60">
            Review user-submitted cheers, rider stories, and photos. Approve for the wall or permanently delete spam.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-black/60 uppercase font-mono">Queue:</span>
          <div className="flex rounded-xl bg-[#fbf8ef] p-1 border border-black/10">
            {["pending", "approved", "rejected", "all"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition-all ${
                  statusFilter === status
                    ? "bg-[#071313] text-[#d9ff38] shadow-sm"
                    : "text-black/60 hover:text-black"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>


      {state.error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
          <button type="button" onClick={() => void load()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      <SelectedDeleteAction count={selectedIds.length} label="community post" busy={workingId === "bulk"} onDelete={removeSelected} />

      {state.loading ? (
        <div className="py-16 flex justify-center">
          <LoadingIndicator label="Loading moderation queue…" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white p-12 text-center text-xs text-black/50">
          No {statusFilter} submissions in this queue.
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <CommunityModerationItem
              key={item.id}
              item={item}
              accessToken={accessToken}
              working={workingId === item.id}
              selected={selectedIds.includes(item.id)}
              onSelect={() => setSelectedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
              onModerate={moderate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
