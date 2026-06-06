# @foxses/pay-sslcommerz

SSLCommerz payment provider for [foxses-pay](https://paydoc.foxses.com).

## Install

```bash
npm install @foxses/pay-core @foxses/pay-sslcommerz
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-sslcommerz";

const gateway = new PaymentGateway();

gateway.use("sslcommerz", {
  storeId: "YOUR_STORE_ID",
  storePassword: "YOUR_STORE_PASSWORD",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/failure",
  cancelUrl: "https://yoursite.com/cancel",
  callbackUrl: "https://yoursite.com/ipn",
  sandbox: true,
});

// Step 1: Create payment session
const payment = await gateway.createPayment("sslcommerz", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "01700000000",
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify after SSLCommerz redirects to successUrl with ?val_id=xxx
const result = await gateway.verifyPayment("sslcommerz", {
  transactionId: val_id,
  amount: 500, // validates amount — prevents tampering
});

console.log(result.status); // "completed"

// Step 3: Refund
const refund = await gateway.refundPayment("sslcommerz", {
  transactionId: result.transactionId, // bank_tran_id
  amount: 500,
});
```

## Documentation

[paydoc.foxses.com/docs/providers/sslcommerz](https://paydoc.foxses.com/docs/providers/sslcommerz)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
