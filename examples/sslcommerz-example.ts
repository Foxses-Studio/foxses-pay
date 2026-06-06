import { PaymentGateway } from "../src/index.js";
import "../src/providers/sslcommerz/index.js";

const gateway = new PaymentGateway();

gateway.use("sslcommerz", {
  storeId: "YOUR_STORE_ID",
  storePassword: "YOUR_STORE_PASSWORD",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  cancelUrl: "https://yoursite.com/payment/cancel",
  callbackUrl: "https://yoursite.com/payment/ipn", // IPN URL
  sandbox: true,
} as any);

// Step 1: Create payment session → redirect user to checkoutUrl
const payment = await gateway.createPayment("sslcommerz", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "01700000000",
  metadata: {
    productName: "T-Shirt",
    productCategory: "clothing",
    productProfile: "physical-goods",
  },
});

console.log("Redirect user to:", payment.checkoutUrl);
console.log("Session key:", payment.transactionId);

// Step 2: SSLCommerz redirects to success_url with val_id in query params
// e.g. https://yoursite.com/payment/success?val_id=XXX&tran_id=ORDER-001&...
// Then verify using val_id:
const verified = await gateway.verifyPayment("sslcommerz", {
  transactionId: "VAL_ID_FROM_CALLBACK",
  amount: 500, // validates amount matches — prevents tampering
});

console.log("Status:", verified.status);        // "completed"
console.log("Bank TrxID:", verified.transactionId);

// Step 3: Check status by your tran_id anytime
const status = await gateway.getPaymentStatus("sslcommerz", "ORDER-001");
console.log("Status:", status.status);

// Step 4: Refund using bank_tran_id
const refund = await gateway.refundPayment("sslcommerz", {
  transactionId: "BANK_TRAN_ID",
  amount: 500,
  reason: "Customer request",
});
console.log("Refund ID:", refund.refundId);
