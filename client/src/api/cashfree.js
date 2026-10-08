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

export async function openCashfreeCheckout({ checkout, verifyPayment }) {
  await loadCheckout();
  const cashfree = window.Cashfree({ mode: checkout.mode || "sandbox" });
  const result = await cashfree.checkout({
    paymentSessionId: checkout.payment_session_id,
    redirectTarget: "_modal",
  });

  if (result?.error) {
    // If the modal was dismissed or errored out, check with backend first
    // in case the transaction was actually debited and verified by Cashfree.
    try {
      return await verifyPayment();
    } catch {
      throw new Error("Payment was not completed. No registration has been confirmed.");
    }
  }

  return verifyPayment();
}
