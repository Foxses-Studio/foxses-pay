# @foxses/pay-stripe

Stripe Checkout Session provider for [foxses-pay](https://paydoc.foxses.com).

## Install

```bash
npm install @foxses/pay-core @foxses/pay-stripe
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-stripe";

const gateway = new PaymentGateway();

gateway.use("stripe", {
  apiKey: "sk_test_YOUR_SECRET_KEY",
  webhookSecret: "whsec_YOUR_WEBHOOK_SECRET", // optional
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  sandbox: true,
});

// Step 1: Create Checkout Session
const payment = await gateway.createPayment("stripe", {
  amount: 29.99,
  currency: "USD",
  orderId: "ORDER-001",
  customerEmail: "user@example.com",
  metadata: { productName: "Pro Plan" },
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify after Stripe redirects to successUrl with ?session_id=cs_xxx
const result = await gateway.verifyPayment("stripe", {
  transactionId: session_id,
  amount: 29.99,
});

console.log(result.status);        // "completed"
console.log(result.transactionId); // pi_xxx — Payment Intent ID

// Step 3: Refund (needs payment intent ID)
const refund = await gateway.refundPayment("stripe", {
  transactionId: "pi_PAYMENT_INTENT_ID",
  amount: 29.99,
});
```

## Test Cards

| Scenario | Card |
|----------|------|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 9995 |

Use any future expiry date and any 3-digit CVV.

## Documentation

[paydoc.foxses.com/docs/providers/stripe](https://paydoc.foxses.com/docs/providers/stripe)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
