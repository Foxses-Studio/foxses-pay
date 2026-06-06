# Getting Started

## Installation

```bash
npm install foxses-pay
```

## Setup

### Step 1 — Import the gateway

```ts
import { PaymentGateway } from "foxses-pay";
```

### Step 2 — Import provider(s) you need

Each provider must be imported so it registers itself. Do this once at your app entry point.

```ts
import "foxses-pay/providers/bkash";
import "foxses-pay/providers/nagad";
import "foxses-pay/providers/sslcommerz";
```

### Step 3 — Create the gateway and configure providers

```ts
const gateway = new PaymentGateway();

gateway.use("bkash", {
  appKey: process.env.BKASH_APP_KEY!,
  secretKey: process.env.BKASH_APP_SECRET!,
  username: process.env.BKASH_USERNAME!,
  password: process.env.BKASH_PASSWORD!,
  callbackUrl: "https://yoursite.com/bkash/callback",
  successUrl: "https://yoursite.com/payment/success",
  failureUrl: "https://yoursite.com/payment/failure",
  sandbox: true,
});
```

### Step 4 — Create a payment

```ts
const payment = await gateway.createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  customerPhone: "01700000000",
});

// Redirect user to payment page
console.log(payment.checkoutUrl);
```

### Step 5 — Verify payment

After the user pays, your callback URL receives a request. Verify the payment:

```ts
const verified = await gateway.verifyPayment("bkash", {
  transactionId: paymentId,
});

if (verified.status === "completed") {
  // payment successful — update your database
}
```

## Environment Variables

Store credentials in environment variables, never hardcode them.

```env
# bKash
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password

# Nagad
NAGAD_MERCHANT_ID=your_merchant_id
NAGAD_MERCHANT_NUMBER=01XXXXXXXXX
NAGAD_PRIVATE_KEY=your_rsa_private_key
NAGAD_PUBLIC_KEY=nagad_rsa_public_key

# SSLCommerz
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
```

## Sandbox vs Production

All providers default to `sandbox: true`. Switch to production:

```ts
gateway.use("bkash", {
  ...config,
  sandbox: false, // ← production
});
```

| Provider | Sandbox Base URL |
|----------|-----------------|
| bKash | `https://tokenized.sandbox.bka.sh` |
| Nagad | `http://sandbox.mynagad.com:10080` |
| SSLCommerz | `https://sandbox.sslcommerz.com` |
