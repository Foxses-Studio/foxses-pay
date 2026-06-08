# @foxses/pay-paypal

PayPal payment provider for [foxses-pay](https://paydoc.foxses.com).

Accept card payments and PayPal wallet payments globally.

## Install

```bash
npm install @foxses/pay-core @foxses/pay-paypal
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-paypal";

const gateway = new PaymentGateway();

gateway.use("paypal", {
  clientId: "YOUR_PAYPAL_CLIENT_ID",
  clientSecret: "YOUR_PAYPAL_CLIENT_SECRET",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  sandbox: true, // false for production
});

// Step 1: Create order
const payment = await gateway.createPayment("paypal", {
  amount: 29.99,
  currency: "USD",
  orderId: "ORDER-001",
});

// Redirect user to:
console.log(payment.checkoutUrl); // PayPal checkout page

// Step 2: Verify after PayPal redirects back with ?token=ORDER_ID
const result = await gateway.verifyPayment("paypal", {
  transactionId: orderId, // from query param or stored value
});

console.log(result.status); // "completed"

// Step 3: Refund (uses capture ID)
const refund = await gateway.refundPayment("paypal", {
  transactionId: "CAPTURE_ID",
  amount: 29.99,
});
```

## Getting Credentials

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. **Apps & Credentials → Create App**
3. Copy **Client ID** and **Client Secret**

Sandbox: use sandbox credentials with `sandbox: true`

## Documentation

[paydoc.foxses.com/docs/providers/paypal](https://paydoc.foxses.com/docs/providers/paypal)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
