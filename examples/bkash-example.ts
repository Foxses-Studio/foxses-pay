import { PaymentGateway } from "../src/index.js";
import "../src/providers/bkash/index.js"; // registers bKash provider

const gateway = new PaymentGateway();

gateway.use("bkash", {
  appKey: "YOUR_APP_KEY",
  secretKey: "YOUR_APP_SECRET",
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  callbackUrl: "https://yoursite.com/payment/callback",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  sandbox: true,
} as any);

// Step 1: Create payment — get bkashURL and redirect user there
const payment = await gateway.createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});

console.log("Redirect user to:", payment.checkoutUrl);
console.log("Save this paymentID:", payment.transactionId);

// Step 2: After user pays, bKash calls your callbackUrl with ?paymentID=xxx&status=success
// Then execute to confirm:
const verified = await gateway.verifyPayment("bkash", {
  transactionId: payment.transactionId,
});

console.log("Payment status:", verified.status); // "completed"
console.log("bKash trxID:", verified.transactionId);

// Step 3: Check status anytime
const status = await gateway.getPaymentStatus("bkash", payment.transactionId);
console.log("Status:", status.status);

// Step 4: Refund (optional)
const refund = await gateway.refundPayment("bkash", {
  transactionId: verified.transactionId,
  amount: 500,
  reason: "Customer request",
});
console.log("Refund ID:", refund.refundId);
