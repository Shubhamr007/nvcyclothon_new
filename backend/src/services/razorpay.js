const Razorpay = require("razorpay");
const { ApiError } = require("../errors");

function createRazorpayService(config) {
  let client = null;

  function getClient() {
    if (!client) {
      client = new Razorpay({
        key_id: config.razorpayKeyId,
        key_secret: config.razorpayKeySecret,
      });
    }
    return client;
  }

  return {
    async createOrder({ amountPaise, receipt }) {
      if (!config.razorpayEnabled) {
        throw new ApiError(503, "Payments are not configured");
      }
      try {
        const order = await getClient().orders.create({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            event: "NV Cyclothon 2026",
          },
        });
        if (!order?.id || order.amount !== amountPaise || order.currency !== "INR") {
          throw new Error("Invalid payment order response");
        }
        return order;
      } catch {
        throw new ApiError(503, "Unable to start payment. Please try again.");
      }
    },
  };
}

module.exports = {
  createRazorpayService,
};
