# @foxses/pay-nowpayments

NOWPayments crypto payment provider for [foxses-pay](https://paydoc.foxses.com).

Supports 150+ cryptocurrencies including BTC, ETH, USDT, BNB, and more.

## Install

```bash
npm install @foxses/pay-core @foxses/pay-nowpayments
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-nowpayments";

const gateway = new PaymentGateway();

gateway.use("nowpayments", {
  apiKey: "YOUR_NOWPAYMENTS_API_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  ipnSecretKey: "YOUR_IPN_SECRET", // optional, for webhook verification
  sandbox: true, // use sandbox for testing
});

// Step 1: Create invoice
const payment = await gateway.createPayment("nowpayments", {
  amount: 100,
  currency: "USD",
  orderId: "ORDER-001",
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify after payment
const result = await gateway.verifyPayment("nowpayments", {
  transactionId: paymentId,
});

console.log(result.status); // "completed" | "pending" | "failed"
```

## Getting API Key

1. Go to [nowpayments.io](https://nowpayments.io)
2. Dashboard → Store Settings → API Keys

Sandbox: [sandbox.nowpayments.io](https://sandbox.nowpayments.io)

## Documentation

[paydoc.foxses.com/docs/providers/nowpayments](https://paydoc.foxses.com/docs/providers/nowpayments)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
