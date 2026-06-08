# @foxses/pay-binance

Binance Pay payment provider for [foxses-pay](https://paydoc.foxses.com).

Accept crypto payments via Binance Pay — BTC, ETH, BNB, USDT and 70+ cryptocurrencies.

## Install

```bash
npm install @foxses/pay-core @foxses/pay-binance
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-binance";

const gateway = new PaymentGateway();

gateway.use("binance", {
  apiKey: "YOUR_BINANCE_PAY_API_KEY",       // Certificate SN
  secretKey: "YOUR_BINANCE_PAY_SECRET_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
});

// Step 1: Create order
const payment = await gateway.createPayment("binance", {
  amount: 10,
  currency: "USDT",
  orderId: "ORDER001",
});

// Redirect user to:
console.log(payment.checkoutUrl); // Binance hosted checkout

// Step 2: Verify after payment
const result = await gateway.verifyPayment("binance", {
  transactionId: payment.transactionId, // prepayId
});

console.log(result.status); // "completed" | "pending" | "cancelled"
```

## Getting Credentials

1. Go to [merchant.binance.com](https://merchant.binance.com)
2. **API management → Create API**
3. Copy **Certificate SN** (apiKey) and **Secret Key**

## Documentation

[paydoc.foxses.com/docs/providers/binance](https://paydoc.foxses.com/docs/providers/binance)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
