# @foxses/pay-bkash

bKash Tokenized Checkout provider for [foxses-pay](https://paydoc.foxses.com).

## Install

```bash
npm install @foxses/pay-core @foxses/pay-bkash
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-bkash";

const gateway = new PaymentGateway();

gateway.use("bkash", {
  appKey: "YOUR_APP_KEY",
  secretKey: "YOUR_APP_SECRET",   // bKash appSecret
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  callbackUrl: "https://yoursite.com/bkash/callback",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/failure",
  sandbox: true,
});

// Step 1: Create payment
const payment = await gateway.createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify after bKash calls callbackUrl with ?paymentID=xxx&status=success
const result = await gateway.verifyPayment("bkash", {
  transactionId: paymentID,
});

console.log(result.status); // "completed"

// Step 3: Refund
const refund = await gateway.refundPayment("bkash", {
  transactionId: result.transactionId,
  amount: 500,
});
```

## Documentation

[paydoc.foxses.com/docs/providers/bkash](https://paydoc.foxses.com/docs/providers/bkash)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
