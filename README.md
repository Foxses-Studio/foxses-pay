# @foxses/pay

One API for 11 payment providers — bKash, Nagad, SSLCommerz, Stripe, PayPal, Payeer, Coinbase, NOWPayments, CoinPayments, Cryptomus, Binance Pay and more.

[![npm version](https://img.shields.io/npm/v/@foxses/pay)](https://www.npmjs.com/package/@foxses/pay)
[![npm downloads](https://img.shields.io/npm/dm/@foxses/pay)](https://www.npmjs.com/package/@foxses/pay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@foxses/pay`](#foxsespay) | All-in-one — includes all providers | `npm i @foxses/pay` |
| [`@foxses/pay-core`](#foxsespay-core) | Core engine — types, errors, gateway | `npm i @foxses/pay-core` |
| [`@foxses/pay-bkash`](#bangladesh) | bKash Tokenized Checkout | `npm i @foxses/pay-bkash` |
| [`@foxses/pay-nagad`](#bangladesh) | Nagad Checkout | `npm i @foxses/pay-nagad` |
| [`@foxses/pay-sslcommerz`](#bangladesh) | SSLCommerz | `npm i @foxses/pay-sslcommerz` |
| [`@foxses/pay-stripe`](#global) | Stripe Checkout Session | `npm i @foxses/pay-stripe` |
| [`@foxses/pay-paypal`](#global) | PayPal Orders v2 | `npm i @foxses/pay-paypal` |
| [`@foxses/pay-payeer`](#global) | Payeer Merchant | `npm i @foxses/pay-payeer` |
| [`@foxses/pay-coinbase`](#crypto) | Coinbase Commerce | `npm i @foxses/pay-coinbase` |
| [`@foxses/pay-nowpayments`](#crypto) | NOWPayments | `npm i @foxses/pay-nowpayments` |
| [`@foxses/pay-coinpayments`](#crypto) | CoinPayments | `npm i @foxses/pay-coinpayments` |
| [`@foxses/pay-cryptomus`](#crypto) | Cryptomus | `npm i @foxses/pay-cryptomus` |
| [`@foxses/pay-binance`](#crypto) | Binance Pay | `npm i @foxses/pay-binance` |

## Supported Providers

### Bangladesh

| Provider | Create | Verify | Status | Refund |
|----------|--------|--------|--------|--------|
| bKash | ✅ | ✅ | ✅ | ✅ |
| Nagad | ✅ | ✅ | ✅ | 🔜 |
| SSLCommerz | ✅ | ✅ | ✅ | ✅ |

### Global

| Provider | Create | Verify | Status | Refund |
|----------|--------|--------|--------|--------|
| Stripe | ✅ | ✅ | ✅ | ✅ |
| PayPal | ✅ | ✅ | ✅ | ✅ |
| Payeer | ✅ | ✅ (IPN) | ✅ | ❌ |

### Crypto

| Provider | Coins | Create | Verify | Status | Refund |
|----------|-------|--------|--------|--------|--------|
| Coinbase Commerce | 10+ | ✅ | ✅ | ✅ | ❌ |
| NOWPayments | 150+ | ✅ | ✅ | ✅ | ❌ |
| CoinPayments | 700+ | ✅ | ✅ | ✅ | ❌ |
| Cryptomus | 100+ | ✅ | ✅ | ✅ | ❌ |
| Binance Pay | 70+ | ✅ | ✅ | ✅ | ❌ |

---

## @foxses/pay

The simplest way to get started — includes all providers, zero extra imports.

```bash
npm install @foxses/pay
```

> **Live on npm:** [@foxses/pay](https://www.npmjs.com/package/@foxses/pay)

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
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    successUrl: "https://yoursite.com/payment/success",
    failureUrl: "https://yoursite.com/payment/cancel",
    sandbox: true,
  },
  coinbase: {
    apiKey: process.env.COINBASE_API_KEY,
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
gateway.use("bkash", { ... });

const payment = await gateway.createPayment("bkash", { ... });
console.log(payment.checkoutUrl);
```

---

## Bangladesh

### bKash

```bash
npm install @foxses/pay-core @foxses/pay-bkash
```

```ts
gateway.use("bkash", {
  appKey: "YOUR_APP_KEY",
  secretKey: "YOUR_APP_SECRET",
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  callbackUrl: "https://yoursite.com/bkash/callback",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/failure",
  sandbox: true,
});
```

[Full bKash docs →](https://paydoc.foxses.com/docs/providers/bkash)

### Nagad

```bash
npm install @foxses/pay-core @foxses/pay-nagad
```

```ts
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

[Full Nagad docs →](https://paydoc.foxses.com/docs/providers/nagad)

### SSLCommerz

```bash
npm install @foxses/pay-core @foxses/pay-sslcommerz
```

```ts
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

[Full SSLCommerz docs →](https://paydoc.foxses.com/docs/providers/sslcommerz)

---

## Global

### Stripe

```bash
npm install @foxses/pay-core @foxses/pay-stripe
```

```ts
gateway.use("stripe", {
  apiKey: "sk_test_YOUR_SECRET_KEY",
  webhookSecret: "whsec_YOUR_WEBHOOK_SECRET",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
});
```

[Full Stripe docs →](https://paydoc.foxses.com/docs/providers/stripe)

### PayPal

```bash
npm install @foxses/pay-core @foxses/pay-paypal
```

```ts
gateway.use("paypal", {
  clientId: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  sandbox: true,
});
```

[Full PayPal docs →](https://paydoc.foxses.com/docs/providers/paypal)

### Payeer

```bash
npm install @foxses/pay-core @foxses/pay-payeer
```

```ts
gateway.use("payeer", {
  merchantId: "P1000000",
  secretKey: "YOUR_SECRET_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  statusUrl: "https://yoursite.com/payeer/ipn",
});
```

[Full Payeer docs →](https://paydoc.foxses.com/docs/providers/payeer)

---

## Crypto

### Coinbase Commerce

```bash
npm install @foxses/pay-core @foxses/pay-coinbase
```

```ts
gateway.use("coinbase", {
  apiKey: "YOUR_COINBASE_API_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
});
```

[Full Coinbase docs →](https://paydoc.foxses.com/docs/providers/coinbase)

### NOWPayments

```bash
npm install @foxses/pay-core @foxses/pay-nowpayments
```

```ts
gateway.use("nowpayments", {
  apiKey: "YOUR_NOWPAYMENTS_API_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  sandbox: true,
});
```

[Full NOWPayments docs →](https://paydoc.foxses.com/docs/providers/nowpayments)

### CoinPayments

```bash
npm install @foxses/pay-core @foxses/pay-coinpayments
```

```ts
gateway.use("coinpayments", {
  publicKey: "YOUR_PUBLIC_KEY",
  privateKey: "YOUR_PRIVATE_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
});
```

[Full CoinPayments docs →](https://paydoc.foxses.com/docs/providers/coinpayments)

### Cryptomus

```bash
npm install @foxses/pay-core @foxses/pay-cryptomus
```

```ts
gateway.use("cryptomus", {
  merchantId: "YOUR_MERCHANT_UUID",
  apiKey: "YOUR_PAYMENT_API_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
});
```

[Full Cryptomus docs →](https://paydoc.foxses.com/docs/providers/cryptomus)

### Binance Pay

```bash
npm install @foxses/pay-core @foxses/pay-binance
```

```ts
gateway.use("binance", {
  apiKey: "YOUR_CERTIFICATE_SN",
  secretKey: "YOUR_SECRET_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
});
```

[Full Binance Pay docs →](https://paydoc.foxses.com/docs/providers/binance)

---

## @foxses/pay-core

Advanced users who build custom providers or need multiple gateway instances.

```bash
npm install @foxses/pay-core
```

```ts
import { PaymentGateway, BaseProvider } from "@foxses/pay-core";
import type { CreatePaymentParams, PaymentResponse, PaymentConfig } from "@foxses/pay-core";

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

## Response Format

All providers return the same structure:

```ts
{
  transactionId: string;
  provider: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  checkoutUrl?: string;  // redirect user here
  raw?: unknown;         // full raw API response
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

configure({ bkash: { /* ... */ } });

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

  if (result.status === "completed") res.redirect("/success");
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

**[paydoc.foxses.com](https://paydoc.foxses.com)**

- [Getting Started](https://paydoc.foxses.com/docs/getting-started)
- [API Reference](https://paydoc.foxses.com/docs/api-reference)
- [Error Handling](https://paydoc.foxses.com/docs/error-handling)
- [bKash](https://paydoc.foxses.com/docs/providers/bkash) · [Nagad](https://paydoc.foxses.com/docs/providers/nagad) · [SSLCommerz](https://paydoc.foxses.com/docs/providers/sslcommerz)
- [Stripe](https://paydoc.foxses.com/docs/providers/stripe) · [PayPal](https://paydoc.foxses.com/docs/providers/paypal) · [Payeer](https://paydoc.foxses.com/docs/providers/payeer)
- [Coinbase](https://paydoc.foxses.com/docs/providers/coinbase) · [NOWPayments](https://paydoc.foxses.com/docs/providers/nowpayments) · [CoinPayments](https://paydoc.foxses.com/docs/providers/coinpayments) · [Cryptomus](https://paydoc.foxses.com/docs/providers/cryptomus) · [Binance Pay](https://paydoc.foxses.com/docs/providers/binance)

## Changelog

### v1.0.5
- ✅ `@foxses/pay-paypal` — PayPal Orders API v2, OAuth token auto-refresh, refund support
- ✅ `@foxses/pay-payeer` — Payeer merchant gateway, SHA256 IPN verification

### v1.0.4
- ✅ `@foxses/pay-binance` — Binance Pay HMAC-SHA512 signed API

### v1.0.3
- ✅ `@foxses/pay-cryptomus` — Cryptomus MD5 signed API, 100+ coins

### v1.0.2
- ✅ `@foxses/pay-coinbase` — Coinbase Commerce, 10+ coins
- ✅ `@foxses/pay-nowpayments` — NOWPayments, 150+ coins, sandbox support
- ✅ `@foxses/pay-coinpayments` — CoinPayments, 700+ coins, HMAC-SHA512

### v1.0.1
- ✅ README added to all packages

### v1.0.0
- ✅ `@foxses/pay` — main package with simple API
- ✅ `@foxses/pay-bkash` — bKash Tokenized Checkout v1.2.0
- ✅ `@foxses/pay-nagad` — Nagad Checkout v0.2.0 with RSA encryption
- ✅ `@foxses/pay-sslcommerz` — SSLCommerz API v4
- ✅ `@foxses/pay-stripe` — Stripe Checkout Session
- ✅ `@foxses/pay-core` — core engine for custom providers

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
