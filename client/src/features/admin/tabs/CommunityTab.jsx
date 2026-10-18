import React, { useState, useEffect, useCallback, memo } from "react";
import { MessageSquare, Check, X, AlertCircle, Image as ImageIcon } from "lucide-react";
import { getAdminCommunityMedia } from "../../../api/http";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Button } from "../../../components/ui/button";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";
import { StatusBadge } from "../components/StatusBadge";
import { AiModerationBadge } from "../ai/AiModerationBadge";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchCommunityPosts,
  moderatePost,
  deleteCommunityPosts,
  setStatusFilter,
  toggleSelectedId,
} from "../../../store/slices/communitySlice";

const STATUS_FILTERS = ["pending", "approved", "rejected", "all"];

const StatusFilterButton = memo(function StatusFilterButton({ status, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(status)}
      className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
        active
          ? "bg-white text-slate-900 shadow-xs"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {status}
    </button>
  );
});

const CommunityModerationItem = memo(function CommunityModerationItem({
  item,
  accessToken,
  working,
  selected,
  onSelect,
  onModerate,
}) {
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

  return (
    <article className="grid gap-4 rounded-xl border border-slate-200/90 bg-white p-5 md:grid-cols-[28px_160px_1fr_auto] hover:border-slate-300 transition-colors shadow-xs">
      <div className="pt-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.id)}
          aria-label={`Select community post by ${item.name || "user"}`}
          className="accent-slate-900 rounded"
        />
      </div>
      <div className="min-h-28 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Submitted community content"
            className="h-36 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px] font-medium">No Image</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold text-sm text-slate-900">{item.name || "Anonymous Rider"}</h4>
          {item.bib_number && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
              BIB #{item.bib_number}
            </span>
          )}
          <StatusBadge status={item.status} />
          {item.status === "pending" && (
            <AiModerationBadge
              item={item}
              accessToken={accessToken}
              onAutoApply={(status) => onModerate(item.id, status)}
            />
          )}
        </div>
        <p className="text-xs text-slate-700 leading-relaxed break-words bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          “{item.message}”
        </p>
        <div className="text-[11px] text-slate-400 flex items-center gap-3">
          <span>Submitted {item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}</span>
          {item.location && <span>• {item.location}</span>}
        </div>
      </div>
      <div className="flex flex-row md:flex-col items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
        {item.status !== "approved" && (
          <Button
            size="sm"
            disabled={working}
            onClick={() => onModerate(item.id, "approved")}
            className="h-8 text-xs font-bold px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
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
});

export function CommunityTab({ accessToken: propAccessToken, onFeedback }) {
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;

  const { items, statusFilter, loading, error, workingId, selectedIds } = useAppSelector(
    (state) => state.community
  );

  const load = useCallback(() => {
    dispatch(fetchCommunityPosts({ accessToken, statusFilter }));
  }, [dispatch, accessToken, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = useCallback(
    async (id, nextStatus) => {
      try {
        await dispatch(moderatePost({ accessToken, id, nextStatus })).unwrap();
        onFeedback?.(`Submission marked as ${nextStatus}`);
      } catch (err) {
        onFeedback?.(err || "Action failed.");
      }
    },
    [dispatch, accessToken, onFeedback]
  );

  const removeSelected = useCallback(async () => {
    try {
      const result = await dispatch(
        deleteCommunityPosts({ accessToken, ids: selectedIds })
      ).unwrap();
      onFeedback?.(
        `${result.deleted} community post(s) deleted${
          result.skipped ? `; ${result.skipped} protected or missing post(s) were kept` : ""
        }.`
      );
    } catch (err) {
      onFeedback?.(err || "Unable to delete selected community posts.");
    }
  }, [dispatch, accessToken, onFeedback, selectedIds]);

  const handleToggleSelect = useCallback(
    (id) => {
      dispatch(toggleSelectedId(id));
    },
    [dispatch]
  );

  const handleSelectFilter = useCallback(
    (filter) => {
      dispatch(setStatusFilter(filter));
    },
    [dispatch]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Community Wall Moderation</h2>
          <p className="text-xs text-slate-500">Review rider messages and finish line photos before public display</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Queue:</span>
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            {STATUS_FILTERS.map((status) => (
              <StatusFilterButton
                key={status}
                status={status}
                active={statusFilter === status}
                onSelect={handleSelectFilter}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={load} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      <SelectedDeleteAction
        count={selectedIds.length}
        label="community post"
        busy={workingId === "bulk"}
        onDelete={removeSelected}
      />

      {loading ? (
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
              onSelect={handleToggleSelect}
              onModerate={moderate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommunityTab;
