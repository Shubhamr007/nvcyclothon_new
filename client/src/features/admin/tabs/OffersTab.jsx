import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tag } from "lucide-react";
import { adminRequest, bulkDeleteAdminRecords } from "../../../api/http";
import { ManagePanel } from "./EventContentTab";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setFeedbackMessage } from "../../../store/slices/authSlice";

const emptyOffer = { title: "", description: "", code: "", active: true };

export function OffersTab({
  offers: propOffers,
  accessToken: propAccessToken,
  onFeedback,
  refresh: propRefresh,
}) {
  const dispatch = useAppDispatch();
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;
  const hasFetchedRef = useRef(false);

  const [offers, setOffers] = useState(propOffers || []);

  const handleFeedback = useCallback(
    (msg) => {
      if (onFeedback) {
        onFeedback(msg);
      } else {
        dispatch(setFeedbackMessage(msg));
      }
    },
    [onFeedback, dispatch]
  );

  const fetchOffers = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminRequest("/offers", accessToken);
      setOffers(data);
    } catch (err) {
      handleFeedback(err.message);
    }
  }, [accessToken, handleFeedback]);

  useEffect(() => {
    if (propOffers && propOffers.length > 0) {
      setOffers(propOffers);
    } else if (accessToken && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchOffers();
    }
  }, [propOffers, accessToken, fetchOffers]);

  const save = useCallback(
    async (path, payload, reset, method = "POST") => {
      try {
        await adminRequest(path, accessToken, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        reset?.();
        if (propRefresh) {
          await propRefresh();
        } else {
          await fetchOffers();
        }
        handleFeedback("Saved successfully.");
      } catch (error) {
        handleFeedback(error.message);
      }
    },
    [accessToken, propRefresh, fetchOffers, handleFeedback]
  );

  const removeSelected = useCallback(
    async (ids) => {
      try {
        const result = await bulkDeleteAdminRecords(accessToken, "offer", ids);
        if (propRefresh) {
          await propRefresh();
        } else {
          await fetchOffers();
        }
        handleFeedback(
          `${result.deleted} record(s) deleted${result.skipped ? `; ${result.skipped} protected or missing record(s) were kept` : ""}.`
        );
      } catch (error) {
        handleFeedback(error.message || "Unable to delete selected records.");
      }
    },
    [accessToken, propRefresh, fetchOffers, handleFeedback]
  );

  return (
    <ManagePanel
      title="Promo Offer"
      onBulkRemove={removeSelected}
      icon={Tag}
      description="Configure coupon codes, discount campaigns, and promotional tiers"
      fields={emptyOffer}
      items={offers}
      adminKey={accessToken}
      onSave={(value, reset, id) =>
        save(id ? `/offers/${id}` : "/offers", value, reset, id ? "PUT" : "POST")
      }
      render={(item) => (
        <div>
          <p className="font-bold text-sm text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500 font-mono">
            {item.code ? `CODE: ${item.code}` : "NO CODE"} •{" "}
            {item.active ? "ACTIVE" : "PAUSED"}
          </p>
        </div>
      )}
    />
  );
}

export default OffersTab;
