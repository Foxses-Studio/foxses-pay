# @foxses/pay-cryptomus

Cryptomus crypto payment provider for [foxses-pay](https://paydoc.foxses.com).

Accept 100+ cryptocurrencies with a simple hosted checkout page.

## Install

```bash
npm install @foxses/pay-core @foxses/pay-cryptomus
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-cryptomus";

const gateway = new PaymentGateway();

gateway.use("cryptomus", {
  merchantId: "YOUR_MERCHANT_UUID",
  apiKey: "YOUR_PAYMENT_API_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
});

// Step 1: Create invoice
const payment = await gateway.createPayment("cryptomus", {
  amount: 50,
  currency: "USD",
  orderId: "ORDER-001",
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify after payment
const result = await gateway.verifyPayment("cryptomus", {
  transactionId: payment.transactionId, // uuid
});

console.log(result.status); // "completed" | "pending" | "failed"
```

## Getting Credentials

1. Go to [cryptomus.com](https://cryptomus.com) → Dashboard
2. **Settings → API keys → Payment API key**
3. Copy your **Merchant UUID** and **Payment API key**

## Documentation

[paydoc.foxses.com/docs/providers/cryptomus](https://paydoc.foxses.com/docs/providers/cryptomus)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
