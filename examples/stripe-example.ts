import { PaymentGateway, StripeProvider } from "../src/index.js";
import "../src/providers/stripe/index.js";

const gateway = new PaymentGateway();

gateway.use("stripe", {
  apiKey: "sk_test_YOUR_SECRET_KEY",           // Stripe secret key
  webhookSecret: "whsec_YOUR_WEBHOOK_SECRET",  // from Stripe dashboard
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/cancel",
  sandbox: true,
} as any);

// Step 1: Create Checkout Session → redirect user to Stripe hosted page
const payment = await gateway.createPayment("stripe", {
  amount: 29.99,
  currency: "USD",
  orderId: "ORDER-001",
  customerEmail: "customer@example.com",
  metadata: {
    productName: "Pro Plan",
    productDescription: "Monthly subscription",
  },
});

console.log("Redirect user to:", payment.checkoutUrl);
console.log("Session ID:", payment.transactionId); // cs_xxx

// Step 2: Stripe redirects to successUrl with ?session_id=cs_xxx
// Verify the session:
const verified = await gateway.verifyPayment("stripe", {
  transactionId: "cs_SESSION_ID_FROM_QUERY",
  amount: 29.99, // validates amount — prevents tampering
});

console.log("Status:", verified.status);           // "completed"
console.log("Payment Intent ID:", verified.transactionId); // pi_xxx

// Step 3: Check status using session ID or payment intent ID
const bySession = await gateway.getPaymentStatus("stripe", "cs_SESSION_ID");
const byIntent  = await gateway.getPaymentStatus("stripe", "pi_INTENT_ID");

// Step 4: Refund — needs payment intent ID (pi_xxx), NOT session ID
const refund = await gateway.refundPayment("stripe", {
  transactionId: "pi_PAYMENT_INTENT_ID",
  amount: 29.99,      // omit for full refund
  reason: "requested_by_customer",
});
console.log("Refund ID:", refund.refundId); // re_xxx

// Webhook verification (Express example)
// app.post("/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
//   const sig = req.headers["stripe-signature"] as string;
//   const stripeProvider = gateway["providers"].get("stripe") as StripeProvider;
//   const event = stripeProvider.verifyWebhook(req.body, sig);
//
//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object;
//     // fulfill order
//   }
//   res.sendStatus(200);
// });
