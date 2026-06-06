# @foxses/pay

One API for Stripe, bKash, Nagad, SSLCommerz and more.

[![npm version](https://img.shields.io/npm/v/@foxses/pay)](https://www.npmjs.com/package/@foxses/pay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@foxses/pay`](#foxsespay) | All-in-one — includes all providers | `npm i @foxses/pay` |
| [`@foxses/pay-core`](#foxsespay-core) | Core engine — types, errors, gateway | `npm i @foxses/pay-core` |
| [`@foxses/pay-bkash`](#provider-packages) | bKash provider | `npm i @foxses/pay-bkash` |
| [`@foxses/pay-nagad`](#provider-packages) | Nagad provider | `npm i @foxses/pay-nagad` |
| [`@foxses/pay-sslcommerz`](#provider-packages) | SSLCommerz provider | `npm i @foxses/pay-sslcommerz` |
| [`@foxses/pay-stripe`](#provider-packages) | Stripe provider | `npm i @foxses/pay-stripe` |

## Supported Providers

| Provider | Region | Create | Verify | Status | Refund |
|----------|--------|--------|--------|--------|--------|
| bKash | Bangladesh | ✅ | ✅ | ✅ | ✅ |
| Nagad | Bangladesh | ✅ | ✅ | ✅ | 🔜 |
| SSLCommerz | Bangladesh | ✅ | ✅ | ✅ | ✅ |
| Stripe | Global | ✅ | ✅ | ✅ | ✅ |

---

## @foxses/pay

The simplest way to get started — includes all providers, zero extra imports.

```bash
npm install @foxses/pay
```

### Simple API

```ts
import { configure, createPayment, verifyPayment, refund } from "@foxses/pay";

// Step 1 — configure your providers once
configure({
  bkash: {
    appKey: process.env.BKASH_APP_KEY,
    secretKey: process.env.BKASH_APP_SECRET,
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    callbackUrl: "https://yoursite.com/bkash/callback",
    successUrl: "https://yoursite.com/payment/success",
    failureUrl: "https://yoursite.com/payment/failure",
    sandbox: true,
  },
  stripe: {
    apiKey: process.env.STRIPE_SECRET_KEY,
    successUrl: "https://yoursite.com/payment/success",
    failureUrl: "https://yoursite.com/payment/cancel",
  },
});

// Step 2 — create a payment
const payment = await createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});

console.log(payment.checkoutUrl); // redirect user here

// Step 3 — verify after callback
const result = await verifyPayment("bkash", {
  transactionId: paymentID,
});

console.log(result.status); // "completed"

// Step 4 — refund
const refunded = await refund("bkash", {
  transactionId: result.transactionId,
  amount: 500,
});
```

### API

| Function | Description |
|----------|-------------|
| `configure(providers)` | Set up provider credentials once |
| `createPayment(provider, params)` | Create payment → get `checkoutUrl` |
| `verifyPayment(provider, params)` | Verify after user pays |
| `getPaymentStatus(provider, id)` | Check status anytime |
| `refund(provider, params)` | Issue a refund |

---

## Provider Packages

Install only the providers you need — lighter bundle.

```bash
npm install @foxses/pay-core @foxses/pay-bkash
```

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-bkash"; // registers bKash

const gateway = new PaymentGateway();

gateway.use("bkash", {
  appKey: "...",
  secretKey: "...",
  username: "...",
  password: "...",
  callbackUrl: "https://yoursite.com/bkash/callback",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  sandbox: true,
});

const payment = await gateway.createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});

// Redirect user to:
console.log(payment.checkoutUrl);
```

---

## @foxses/pay-core

Advanced users who build custom providers or need multiple gateway instances.

```bash
npm install @foxses/pay-core
```

```ts
import { PaymentGateway, BaseProvider } from "@foxses/pay-core";
import type { CreatePaymentParams, PaymentResponse, PaymentConfig } from "@foxses/pay-core";

// Build your own provider
class MyProvider extends BaseProvider {
  readonly name = "myprovider" as any;

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    // your implementation
  }

  async verifyPayment(params): Promise<PaymentResponse> { ... }
  async getPaymentStatus(id: string): Promise<PaymentResponse> { ... }
}

PaymentGateway.registerProvider("myprovider" as any, MyProvider as any);
```

---

## Providers

### bKash

```bash
npm install @foxses/pay-core @foxses/pay-bkash
```

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
```

[Full bKash docs →](docs/providers/bkash.md)

---

### Nagad

```bash
npm install @foxses/pay-core @foxses/pay-nagad
```

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-nagad";

const gateway = new PaymentGateway();
gateway.use("nagad", {
  merchantId: "YOUR_MERCHANT_ID",
  merchantNumber: "01XXXXXXXXX",
  privateKey: "YOUR_RSA_PRIVATE_KEY",
  nagadPublicKey: "NAGAD_PUBLIC_KEY",
  callbackUrl: "https://yoursite.com/nagad/callback",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/failure",
  sandbox: true,
});
```

[Full Nagad docs →](docs/providers/nagad.md)

---

### SSLCommerz

```bash
npm install @foxses/pay-core @foxses/pay-sslcommerz
```

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
```

[Full SSLCommerz docs →](docs/providers/sslcommerz.md)

---

### Stripe

```bash
npm install @foxses/pay-core @foxses/pay-stripe
```

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-stripe";

const gateway = new PaymentGateway();
gateway.use("stripe", {
  apiKey: "sk_test_YOUR_SECRET_KEY",
  webhookSecret: "whsec_YOUR_WEBHOOK_SECRET",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  sandbox: true,
});
```

[Full Stripe docs →](docs/providers/stripe.md)

---

## Response Format

All providers return the same structure:

```ts
{
  transactionId: string;   // provider's transaction ID
  provider: string;        // "bkash" | "nagad" | "sslcommerz" | "stripe"
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  checkoutUrl?: string;    // redirect user here (from createPayment)
  raw?: unknown;           // full raw API response
}
```

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
    // HTTP/network failure — safe to retry
  } else if (err instanceof ProviderError) {
    // Provider returned an error
  }
}
```

## Framework Examples

### Express.js

```ts
import express from "express";
import { configure, createPayment, verifyPayment } from "@foxses/pay";

configure({
  bkash: { /* ... */ },
});

const app = express();

app.post("/checkout", async (req, res) => {
  const payment = await createPayment("bkash", {
    amount: req.body.amount,
    currency: "BDT",
    orderId: req.body.orderId,
    customerPhone: req.body.phone,
  });
  res.json({ checkoutUrl: payment.checkoutUrl });
});

app.get("/bkash/callback", async (req, res) => {
  const { paymentID, status } = req.query;
  if (status !== "success") return res.redirect("/failed");

  const result = await verifyPayment("bkash", {
    transactionId: paymentID as string,
  });

  if (result.status === "completed") {
    res.redirect("/success");
  }
});
```

### Next.js

```ts
// app/api/checkout/route.ts
import { configure, createPayment } from "@foxses/pay";

configure({ stripe: { apiKey: process.env.STRIPE_KEY!, successUrl: "...", failureUrl: "..." } });

export async function POST(req: Request) {
  const { amount, orderId } = await req.json();
  const payment = await createPayment("stripe", { amount, currency: "USD", orderId });
  return Response.json({ checkoutUrl: payment.checkoutUrl });
}
```

## Docs

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Error Handling](docs/error-handling.md)
- [bKash Provider](docs/providers/bkash.md)
- [Nagad Provider](docs/providers/nagad.md)
- [SSLCommerz Provider](docs/providers/sslcommerz.md)
- [Stripe Provider](docs/providers/stripe.md)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
