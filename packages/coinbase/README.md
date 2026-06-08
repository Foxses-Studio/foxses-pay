# @foxses/pay-coinbase

Coinbase Commerce crypto payment provider for [foxses-pay](https://paydoc.foxses.com).

Accepts BTC, ETH, USDC, LTC and 10+ cryptocurrencies.

## Install

```bash
npm install @foxses/pay-core @foxses/pay-coinbase
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-coinbase";

const gateway = new PaymentGateway();

gateway.use("coinbase", {
  apiKey: "YOUR_COINBASE_COMMERCE_API_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  webhookSecret: "YOUR_WEBHOOK_SECRET", // optional
});

// Step 1: Create a crypto charge
const payment = await gateway.createPayment("coinbase", {
  amount: 29.99,
  currency: "USD",
  orderId: "ORDER-001",
  customerEmail: "user@example.com",
});

// Redirect user to:
console.log(payment.checkoutUrl); // Coinbase hosted checkout page

// Step 2: Verify after payment
const result = await gateway.verifyPayment("coinbase", {
  transactionId: chargeCode, // e.g. "ABCD1234"
});

console.log(result.status); // "completed" | "pending" | "failed" | "cancelled"
```

## Getting API Key

1. Go to [commerce.coinbase.com](https://commerce.coinbase.com)
2. Settings → API keys → Create an API key

## Documentation

[paydoc.foxses.com/docs/providers/coinbase](https://paydoc.foxses.com/docs/providers/coinbase)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
