import { PaymentGateway } from "../src/index.js";
import "../src/providers/nagad/index.js"; // registers Nagad provider

const gateway = new PaymentGateway();

gateway.use("nagad", {
  merchantId: "YOUR_MERCHANT_ID",
  merchantNumber: "01XXXXXXXXX",
  privateKey: "YOUR_RSA_PRIVATE_KEY_BASE64",   // merchant private key
  nagadPublicKey: "NAGAD_RSA_PUBLIC_KEY_BASE64", // Nagad's public key from portal
  callbackUrl: "https://yoursite.com/payment/nagad/callback",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  apiVersion: "v-0.2.0",
  sandbox: true,
} as any);

// Step 1: Create payment — initializes + completes in one call, returns checkoutUrl
const payment = await gateway.createPayment("nagad", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  metadata: { ip: "103.100.200.100" }, // client IP (required by Nagad)
});

console.log("Redirect user to:", payment.checkoutUrl);
console.log("Save paymentReferenceId:", payment.transactionId);

// Step 2: Nagad calls your callbackUrl with ?payment_ref_id=xxx&order_id=xxx&status=Success
// Then verify:
const verified = await gateway.verifyPayment("nagad", {
  transactionId: "PAYMENT_REF_ID_FROM_CALLBACK",
});

console.log("Status:", verified.status);       // "completed"
console.log("Nagad TrxID:", verified.transactionId);

// Step 3: Check status anytime
const status = await gateway.getPaymentStatus("nagad", payment.transactionId);
console.log("Status:", status.status);
