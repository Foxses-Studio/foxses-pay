# foxses-pay

One API for Stripe, bKash, Nagad, SSLCommerz and more.

[![npm version](https://img.shields.io/npm/v/foxses-pay)](https://www.npmjs.com/package/foxses-pay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

**foxses-pay** is a unified payment gateway library for Node.js. Instead of learning different APIs for every payment provider, you use one consistent API across all supported gateways.

```ts
// Same API — any provider
const payment = await gateway.createPayment("bkash", { amount: 500, ... });
const payment = await gateway.createPayment("nagad", { amount: 500, ... });
const payment = await gateway.createPayment("sslcommerz", { amount: 500, ... });
```

## Supported Providers

| Provider | Region | Create | Verify | Status | Refund |
|----------|--------|--------|--------|--------|--------|
| bKash | Bangladesh | ✅ | ✅ | ✅ | ✅ |
| Nagad | Bangladesh | ✅ | ✅ | ✅ | 🔜 |
| SSLCommerz | Bangladesh | ✅ | ✅ | ✅ | ✅ |
| Stripe | Global | 🔜 | 🔜 | 🔜 | 🔜 |

## Installation

```bash
npm install foxses-pay
```

## Quick Start

```ts
import { PaymentGateway } from "foxses-pay";
import "foxses-pay/providers/bkash";      // registers bKash
import "foxses-pay/providers/nagad";      // registers Nagad
import "foxses-pay/providers/sslcommerz"; // registers SSLCommerz

const gateway = new PaymentGateway();

// Configure providers
gateway.use("bkash", {
  appKey: "YOUR_APP_KEY",
  secretKey: "YOUR_APP_SECRET",
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  callbackUrl: "https://yoursite.com/bkash/callback",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  sandbox: true,
});

// Create a payment
const payment = await gateway.createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});

console.log(payment.checkoutUrl); // redirect user here
```

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Providers](#providers)
  - [bKash](#bkash)
  - [Nagad](#nagad)
  - [SSLCommerz](#sslcommerz)
- [API Reference](#api-reference)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Payment Flow](#payment-flow)

---

## Core Concepts

### PaymentGateway

The central class. Register providers with `.use()`, then call methods on it.

```ts
import { PaymentGateway } from "foxses-pay";

const gateway = new PaymentGateway();
gateway.use("bkash", config);
```

### Provider Registration

Each provider must be imported to be registered. Import once at your app entry point.

```ts
import "foxses-pay/providers/bkash";
import "foxses-pay/providers/nagad";
import "foxses-pay/providers/sslcommerz";
```

### Sandbox Mode

All providers support `sandbox: true` for testing. Set to `false` for production.

---

## Providers

### bKash

bKash Tokenized Checkout API v1.2.0

**Configuration**

```ts
gateway.use("bkash", {
  appKey: "YOUR_APP_KEY",           // from bKash merchant dashboard
  secretKey: "YOUR_APP_SECRET",     // from bKash merchant dashboard
  username: "YOUR_USERNAME",        // bKash merchant username
  password: "YOUR_PASSWORD",        // bKash merchant password
  callbackUrl: "https://yoursite.com/bkash/callback",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  sandbox: true,
});
```

**Payment Flow**

```ts
// Step 1: Create payment → redirect user to bkashURL
const payment = await gateway.createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});
// payment.checkoutUrl → redirect user here

// Step 2: bKash calls callbackUrl with ?paymentID=xxx&status=success
// Execute payment to confirm:
const verified = await gateway.verifyPayment("bkash", {
  transactionId: paymentId, // paymentID from callback
});
// verified.status → "completed"
// verified.transactionId → bKash trxID

// Step 3: Check status anytime
const status = await gateway.getPaymentStatus("bkash", paymentId);

// Step 4: Refund
const refund = await gateway.refundPayment("bkash", {
  transactionId: trxId, // bKash trxID
  amount: 500,
  reason: "Customer request",
});
```

**Credentials:** Get from [bKash Merchant Dashboard](https://merchant.bkash.com)

---

### Nagad

Nagad Checkout API v0.2.0 — uses RSA encryption for all sensitive data.

**Configuration**

```ts
gateway.use("nagad", {
  merchantId: "YOUR_MERCHANT_ID",
  merchantNumber: "01XXXXXXXXX",
  privateKey: "YOUR_RSA_PRIVATE_KEY",    // base64 or PEM format
  nagadPublicKey: "NAGAD_PUBLIC_KEY",    // from Nagad merchant portal
  callbackUrl: "https://yoursite.com/nagad/callback",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  apiVersion: "v-0.2.0",
  sandbox: true,
});
```

**Payment Flow**

```ts
// Step 1: Create payment (initialize + complete in one call) → redirect user
const payment = await gateway.createPayment("nagad", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  metadata: { ip: "CLIENT_IP_ADDRESS" }, // required by Nagad
});
// payment.checkoutUrl → redirect user here
// payment.transactionId → paymentReferenceId (save this)

// Step 2: Nagad calls callbackUrl with ?payment_ref_id=xxx&status=Success
// Verify using payment_ref_id:
const verified = await gateway.verifyPayment("nagad", {
  transactionId: paymentRefId,
});
// verified.status → "completed"
// verified.transactionId → Nagad issuer trxID

// Step 3: Check status anytime
const status = await gateway.getPaymentStatus("nagad", paymentRefId);
```

**Keys Setup:**
- Generate RSA key pair from Nagad merchant portal
- Upload your public key to Nagad
- Download Nagad's public key from portal
- Keys can be raw base64 string or full PEM format — both supported

**Credentials:** Get from [Nagad Merchant Portal](https://merchant.nagad.com)

---

### SSLCommerz

SSLCommerz Payment Gateway API v4

**Configuration**

```ts
gateway.use("sslcommerz", {
  storeId: "YOUR_STORE_ID",
  storePassword: "YOUR_STORE_PASSWORD",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  cancelUrl: "https://yoursite.com/payment/cancel",
  callbackUrl: "https://yoursite.com/payment/ipn", // IPN URL
  sandbox: true,
});
```

**Payment Flow**

```ts
// Step 1: Create payment session → redirect user to GatewayPageURL
const payment = await gateway.createPayment("sslcommerz", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "01700000000",
  metadata: {
    productName: "T-Shirt",
    productCategory: "clothing",
    productProfile: "physical-goods",
  },
});
// payment.checkoutUrl → redirect user here

// Step 2: SSLCommerz redirects to success_url with val_id in query params
// Verify using val_id — also pass amount to detect tampering:
const verified = await gateway.verifyPayment("sslcommerz", {
  transactionId: val_id, // from query params
  amount: 500,           // must match — prevents amount tampering
});
// verified.status → "completed"
// verified.transactionId → bank_tran_id

// Step 3: Check status using your orderId (tran_id)
const status = await gateway.getPaymentStatus("sslcommerz", "ORDER-001");

// Step 4: Refund using bank_tran_id
const refund = await gateway.refundPayment("sslcommerz", {
  transactionId: bank_tran_id,
  amount: 500,
  reason: "Customer request",
});
```

**Sandbox Test Cards:**

| Card | Number | Expiry | CVV |
|------|--------|--------|-----|
| VISA | 4111111111111111 | 12/26 | 111 |
| Mastercard | 5111111111111111 | 12/26 | 111 |
| Amex | 371111111111111 | 12/26 | 111 |

Mobile OTP: `111111` or `123456`

**Credentials:** Get from [SSLCommerz Developer Portal](https://developer.sslcommerz.com)

---

## API Reference

### `gateway.use(provider, config)`

Register and configure a payment provider.

```ts
gateway.use("bkash", config);
```

### `gateway.createPayment(provider, params)`

Create a new payment session.

```ts
const payment = await gateway.createPayment("bkash", {
  amount: 500,            // required — number, greater than 0
  currency: "BDT",        // required
  orderId: "ORDER-001",   // required — unique per transaction
  customerName: "...",    // optional
  customerEmail: "...",   // optional
  customerPhone: "...",   // optional
  metadata: {},           // optional — provider-specific extra data
});
```

### `gateway.verifyPayment(provider, params)`

Verify and execute a payment after user completes checkout.

```ts
const result = await gateway.verifyPayment("bkash", {
  transactionId: "...", // required
  orderId: "...",       // optional
  amount: 500,          // optional — used for amount validation
});
```

### `gateway.getPaymentStatus(provider, transactionId)`

Query current payment status.

```ts
const status = await gateway.getPaymentStatus("bkash", "PAYMENT_ID");
```

### `gateway.refundPayment(provider, params)`

Issue a refund.

```ts
const refund = await gateway.refundPayment("bkash", {
  transactionId: "...", // required — provider trxID
  amount: 500,          // optional — partial refund amount
  reason: "...",        // optional
});
```

---

## Response Format

All providers return the same response structure.

### PaymentResponse

```ts
{
  transactionId: string;   // provider's transaction ID
  provider: string;        // "bkash" | "nagad" | "sslcommerz"
  amount: number;
  currency: string;
  status: PaymentStatus;   // see below
  checkoutUrl?: string;    // redirect URL (from createPayment)
  raw?: unknown;           // full raw response from provider
}
```

### PaymentStatus

```ts
"pending"   // payment initiated, waiting for user
"completed" // payment successful
"failed"    // payment failed
"cancelled" // user cancelled
"refunded"  // payment refunded
```

### RefundResponse

```ts
{
  refundId: string;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  raw?: unknown;
}
```

---

## Error Handling

foxses-pay throws typed errors. Catch them by type for precise handling.

```ts
import {
  PaymentError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  ProviderError,
} from "foxses-pay";

try {
  const payment = await gateway.createPayment("bkash", params);
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Wrong API key / credentials
    console.error("Auth failed:", err.message);
  } else if (err instanceof ValidationError) {
    // Missing or invalid params
    console.error("Validation:", err.message);
  } else if (err instanceof NetworkError) {
    // HTTP/network failure
    console.error("Network issue:", err.message);
  } else if (err instanceof ProviderError) {
    // Provider returned an error response
    console.error("Provider error:", err.message);
  }
}
```

All errors expose:
- `err.message` — human-readable message
- `err.code` — error code string
- `err.provider` — which provider threw the error

---

## Payment Flow

### Standard Flow (bKash / Nagad)

```
Your Server          User Browser         Payment Provider
     |                    |                      |
     |-- createPayment -->|                      |
     |<-- checkoutUrl ----|                      |
     |                    |-- redirect --------->|
     |                    |<-- user pays --------|
     |<-- callback -------|----------------------|
     |-- verifyPayment -->|                      |
     |<-- PaymentResponse-|                      |
     |-- update order ----|                      |
```

### SSLCommerz Flow

```
Your Server          User Browser         SSLCommerz
     |                    |                   |
     |-- createPayment -->|                   |
     |<-- GatewayPageURL--|                   |
     |                    |-- redirect ------>|
     |                    |<-- card payment --|
     |<-- success_url redirect with val_id ---|
     |-- verifyPayment(val_id) ------------->|
     |<-- VALID / INVALID -------------------|
     |-- update order ----|                   |
```

---

## Framework Examples

### Express.js

```ts
import express from "express";
import { PaymentGateway } from "foxses-pay";
import "foxses-pay/providers/bkash";

const app = express();
const gateway = new PaymentGateway();

gateway.use("bkash", { /* config */ });

app.post("/pay", async (req, res) => {
  const payment = await gateway.createPayment("bkash", {
    amount: req.body.amount,
    currency: "BDT",
    orderId: req.body.orderId,
    customerPhone: req.body.phone,
  });
  res.json({ checkoutUrl: payment.checkoutUrl });
});

app.post("/bkash/callback", async (req, res) => {
  const { paymentID, status } = req.query;
  if (status !== "success") return res.redirect("/payment/failed");

  const verified = await gateway.verifyPayment("bkash", {
    transactionId: paymentID as string,
  });

  if (verified.status === "completed") {
    // update your DB
    res.redirect("/payment/success");
  }
});
```

### Next.js

```ts
// app/api/pay/route.ts
import { PaymentGateway } from "foxses-pay";
import "foxses-pay/providers/bkash";

const gateway = new PaymentGateway();
gateway.use("bkash", { /* config */ });

export async function POST(req: Request) {
  const body = await req.json();

  const payment = await gateway.createPayment("bkash", {
    amount: body.amount,
    currency: "BDT",
    orderId: body.orderId,
    customerPhone: body.phone,
  });

  return Response.json({ checkoutUrl: payment.checkoutUrl });
}
```

---

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
