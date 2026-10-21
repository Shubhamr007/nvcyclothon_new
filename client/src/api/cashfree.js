let checkoutScript;

function loadCheckout() {
  if (window.Cashfree) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        resolve();
      } else {
        reject(new Error("Cashfree SDK failed to initialize."));
      }
    };
    script.onerror = () =>
      reject(new Error("Unable to load secure Cashfree checkout. Please check your network and try again."));
    document.head.appendChild(script);
  });
  return checkoutScript;
}

async function verifyWithRetry(verifyPayment, maxAttempts = 4, delayMs = 1500) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await verifyPayment();
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || "").toLowerCase();
      const isPending =
        msg.includes("still being confirmed") ||
        msg.includes("wait a moment") ||
        msg.includes("pending");

      if (attempt < maxAttempts && isPending) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function openCashfreeCheckout({ checkout, verifyPayment }) {
  await loadCheckout();
  const cashfree = window.Cashfree({ mode: checkout.mode || "sandbox" });
  const result = await cashfree.checkout({
    paymentSessionId: checkout.payment_session_id,
    redirectTarget: "_modal",
  });

  if (result?.error) {
    // If modal was dismissed or errored, verify with backend first in case payment completed
    try {
      return await verifyWithRetry(verifyPayment, 3, 1000);
    } catch {
      throw new Error("Payment was not completed. No registration has been confirmed.");
    }
  }

  return verifyWithRetry(verifyPayment, 4, 1500);
}

