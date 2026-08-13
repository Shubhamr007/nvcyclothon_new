let checkoutScript;

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load secure payment checkout. Please try again."));
    document.head.appendChild(script);
  });
  return checkoutScript;
}

export async function openRazorpayCheckout({ checkout, registration, verifyPayment }) {
  await loadCheckout();
  return new Promise((resolve, reject) => {
    const payment = new window.Razorpay({
      key: checkout.key_id,
      amount: checkout.amount_paise,
      currency: checkout.currency,
      name: "NV Cyclothon 2026",
      description: `${registration.ride_category} rider registration`,
      order_id: checkout.order_id,
      prefill: { name: registration.full_name, email: registration.email, contact: registration.phone },
      theme: { color: "#071313" },
      modal: { ondismiss: () => reject(new Error("Payment was cancelled. Your registration is pending payment.")) },
      handler: async (response) => {
        try { resolve(await verifyPayment(response)); }
        catch (error) { reject(error); }
      },
    });
    payment.open();
  });
}
