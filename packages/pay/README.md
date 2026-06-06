# @foxses/pay

One API for Stripe, bKash, Nagad, SSLCommerz and more.

[![npm version](https://img.shields.io/npm/v/@foxses/pay)](https://www.npmjs.com/package/@foxses/pay)
[![npm downloads](https://img.shields.io/npm/dm/@foxses/pay)](https://www.npmjs.com/package/@foxses/pay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @foxses/pay
```

## Quick Start

```ts
import { configure, createPayment, verifyPayment, refund } from "@foxses/pay";

// Configure once
configure({
  bkash: {
    appKey: process.env.BKASH_APP_KEY,
    secretKey: process.env.BKASH_APP_SECRET,
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    callbackUrl: "https://yoursite.com/bkash/callback",
    successUrl: "https://yoursite.com/success",
    failureUrl: "https://yoursite.com/failure",
    sandbox: true,
  },
  stripe: {
    apiKey: process.env.STRIPE_SECRET_KEY,
    successUrl: "https://yoursite.com/success",
    failureUrl: "https://yoursite.com/cancel",
  },
});

// Create a payment
const payment = await createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Verify after callback
const result = await verifyPayment("bkash", {
  transactionId: paymentID,
});

console.log(result.status); // "completed"

// Refund
const refunded = await refund("bkash", {
  transactionId: result.transactionId,
  amount: 500,
});
```

## Supported Providers

| Provider | Region | Status |
|----------|--------|--------|
| bKash | 🇧🇩 Bangladesh | ✅ Stable |
| Nagad | 🇧🇩 Bangladesh | ✅ Stable |
| SSLCommerz | 🇧🇩 Bangladesh | ✅ Stable |
| Stripe | 🌍 Global | ✅ Stable |

## Individual Provider Packages

Install only what you need:

```bash
npm install @foxses/pay-core @foxses/pay-bkash
npm install @foxses/pay-core @foxses/pay-nagad
npm install @foxses/pay-core @foxses/pay-sslcommerz
npm install @foxses/pay-core @foxses/pay-stripe
```

## API

| Function | Description |
|----------|-------------|
| `configure(providers)` | Set up provider credentials |
| `createPayment(provider, params)` | Create payment → get `checkoutUrl` |
| `verifyPayment(provider, params)` | Verify after user pays |
| `getPaymentStatus(provider, id)` | Check status anytime |
| `refund(provider, params)` | Issue a refund |

## Error Handling

```ts
import { AuthenticationError, ValidationError, NetworkError, ProviderError } from "@foxses/pay";

try {
  const payment = await createPayment("bkash", params);
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Wrong credentials
  } else if (err instanceof ValidationError) {
    // Missing or invalid params
  } else if (err instanceof NetworkError) {
    // Network failure — safe to retry
  } else if (err instanceof ProviderError) {
    // Provider returned an error
  }
}
```

## Documentation

**[paydoc.foxses.com](https://paydoc.foxses.com)**

- [Getting Started](https://paydoc.foxses.com/docs/getting-started)
- [API Reference](https://paydoc.foxses.com/docs/api-reference)
- [Error Handling](https://paydoc.foxses.com/docs/error-handling)
- [bKash Provider](https://paydoc.foxses.com/docs/providers/bkash)
- [Nagad Provider](https://paydoc.foxses.com/docs/providers/nagad)
- [SSLCommerz Provider](https://paydoc.foxses.com/docs/providers/sslcommerz)
- [Stripe Provider](https://paydoc.foxses.com/docs/providers/stripe)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
