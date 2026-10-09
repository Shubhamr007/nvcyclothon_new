const crypto = require("crypto");
const { ApiError } = require("../errors");

const API_VERSION = "2025-01-01";

function createCashfreeService(config) {
  const baseUrl = config.cashfreeEnvironment === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

  function headers(extra = {}) {
    return {
      "x-client-id": config.cashfreeClientId,
      "x-client-secret": config.cashfreeClientSecret,
      "x-api-version": API_VERSION,
      Accept: "application/json",
      ...extra,
    };
  }

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, options);
    } catch (networkError) {
      throw new ApiError(503, `Unable to reach Cashfree: ${networkError.message}`);
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || String(body?.message || "").toLowerCase().includes("authentication")) {
        throw new ApiError(
          503,
          "Cashfree authentication failed. Please check that CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET in backend/.env match your Cashfree dashboard credentials."
        );
      }
      throw new ApiError(503, body?.message || "Unable to start secure payment. Please try again.");
    }
    return body;
  }

  return {
    async createOrder({ orderId, amountPaise, customer, returnUrl, notifyUrl, expiresAt }) {
      if (!config.cashfreeEnabled) {
        throw new ApiError(503, "Payments are not configured");
      }
      if (!config.cashfreeClientId || !config.cashfreeClientSecret) {
        throw new ApiError(
          503,
          "Cashfree API credentials are missing. Please add your CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET to backend/.env."
        );
      }
      const phone = String(customer.phone || "").replace(/\D/g, "").slice(-10);
      // Cashfree strictly requires expiry time to be > 15 minutes and < 30 days from now.
      const safeExpiry = (!expiresAt || expiresAt.getTime() - Date.now() < 20 * 60 * 1000)
        ? new Date(Date.now() + 30 * 60 * 1000)
        : expiresAt;

      const order = await request("/pg/orders", {
        method: "POST",
        headers: headers({ "Content-Type": "application/json", "x-idempotency-key": orderId }),
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amountPaise / 100,
          order_currency: "INR",
          customer_details: {
            customer_id: `rider_${customer.id}`,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: phone,
          },
          order_meta: { return_url: returnUrl, notify_url: notifyUrl },
          order_expiry_time: safeExpiry.toISOString(),
          order_note: "NV Cyclothon 2026 registration",
        }),
      });
      if (!order?.order_id || !order?.payment_session_id) {
        throw new ApiError(503, "Cashfree did not return a valid payment session. Please try again.");
      }
      return {
        id: order.order_id,
        payment_session_id: order.payment_session_id,
        mode: config.cashfreeEnvironment,
      };
    },

    async getPaymentStatus(orderId) {
      const payments = await request(`/pg/orders/${encodeURIComponent(orderId)}/payments`, {
        headers: headers(),
      });
      const entries = Array.isArray(payments) ? payments : [];
      const success = entries.find((payment) => payment.payment_status === "SUCCESS");
      if (success) return { state: "paid", paymentId: String(success.cf_payment_id) };
      if (entries.some((payment) => payment.payment_status === "PENDING")) return { state: "pending" };
      return { state: "failed" };
    },

    verifyWebhook({ signature, timestamp, rawBody }) {
      if (!signature || !timestamp) return false;

      // Validate timestamp freshness (max 5 minutes age, max 1 minute clock drift)
      let timestampMs = Number(timestamp);
      if (!Number.isFinite(timestampMs)) {
        timestampMs = Date.parse(timestamp);
      }
      if (!Number.isFinite(timestampMs)) return false;
      if (timestampMs < 1e11) {
        timestampMs *= 1000;
      }

      const now = Date.now();
      const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
      const MAX_SKEW_MS = 60 * 1000;    // 1 minute

      if (now - timestampMs > MAX_AGE_MS || timestampMs - now > MAX_SKEW_MS) {
        return false;
      }

      const expected = crypto
        .createHmac("sha256", config.cashfreeClientSecret)
        .update(`${timestamp}${rawBody}`)
        .digest("base64");
      const actual = Buffer.from(String(signature || ""));
      const expectedBuffer = Buffer.from(expected);
      return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
    },
  };
}

module.exports = { createCashfreeService };
