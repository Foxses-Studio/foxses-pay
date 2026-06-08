# @foxses/pay-coinpayments

CoinPayments crypto payment provider for [foxses-pay](https://paydoc.foxses.com).

Supports 700+ cryptocurrencies.

## Install

```bash
npm install @foxses/pay-core @foxses/pay-coinpayments
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-coinpayments";

const gateway = new PaymentGateway();

gateway.use("coinpayments", {
  publicKey: "YOUR_PUBLIC_KEY",
  privateKey: "YOUR_PRIVATE_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  ipnUrl: "https://yoursite.com/ipn", // optional
});

// Step 1: Create transaction
const payment = await gateway.createPayment("coinpayments", {
  amount: 50,
  currency: "USD",
  orderId: "ORDER-001",
  customerEmail: "user@example.com",
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify transaction
const result = await gateway.verifyPayment("coinpayments", {
  transactionId: txnId,
});

console.log(result.status); // "completed" | "pending" | "failed"
```

## Getting API Keys

1. Go to [coinpayments.net](https://www.coinpayments.net)
2. Account → API Keys → Generate New Key

## Documentation

[paydoc.foxses.com/docs/providers/coinpayments](https://paydoc.foxses.com/docs/providers/coinpayments)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
