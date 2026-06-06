# SSLCommerz Provider

SSLCommerz Payment Gateway API v4 integration.

## How It Works

SSLCommerz uses a session-based redirect flow:

1. **Init Session** — POST credentials + order info → get `GatewayPageURL`
2. **Redirect** user to `GatewayPageURL` to choose payment method and pay
3. **Callback** — SSLCommerz redirects to `success_url` / `fail_url` / `cancel_url` with `val_id`
4. **Validate** — GET request with `val_id` to confirm payment is genuine
5. **IPN** — Server-to-server notification to `ipn_url` (optional but recommended)

## Configuration

```ts
gateway.use("sslcommerz", {
  storeId: "YOUR_STORE_ID",                 // required
  storePassword: "YOUR_STORE_PASSWORD",     // required
  successUrl: "https://yoursite.com/payment/success", // required
  failureUrl: "https://yoursite.com/payment/failure", // required
  cancelUrl: "https://yoursite.com/payment/cancel",   // required
  callbackUrl: "https://yoursite.com/payment/ipn",    // optional — IPN URL
  sandbox: true,                             // optional, default: true
});
```

| Field | Type | Description |
|-------|------|-------------|
| `storeId` | string | SSLCommerz store ID |
| `storePassword` | string | SSLCommerz store password |
| `successUrl` | string | Redirect URL on successful payment |
| `failureUrl` | string | Redirect URL on failed payment |
| `cancelUrl` | string | Redirect URL when user cancels |
| `callbackUrl` | string | IPN URL for server-to-server notification |
| `sandbox` | boolean | Use sandbox environment |

## Create Payment

```ts
const payment = await gateway.createPayment("sslcommerz", {
  amount: 500,                          // required
  currency: "BDT",                      // required — BDT, USD, EUR, etc.
  orderId: "ORDER-001",                 // required — unique (30 chars max)
  customerName: "John Doe",            // optional
  customerEmail: "john@example.com",   // optional
  customerPhone: "01700000000",         // optional
  metadata: {
    productName: "T-Shirt",            // optional
    productCategory: "clothing",       // optional
    productProfile: "physical-goods",  // optional
    value_a: "custom-data-1",          // optional — echoed back in callback
    value_b: "custom-data-2",          // optional
  },
});
```

**Product Profile options:** `general`, `physical-goods`, `non-physical-goods`, `airline`, `travel-vertical`, `telecom-vertical`

**Response:**
```ts
{
  transactionId: "SESSION_KEY",           // SSLCommerz session key
  provider: "sslcommerz",
  amount: 500,
  currency: "BDT",
  status: "pending",
  checkoutUrl: "https://sandbox.sslcommerz.com/EasyCheckOut/...", // redirect here
}
```

## Verify Payment

Call after SSLCommerz redirects to your `successUrl` with `val_id` in query params.

Always pass `amount` to detect response tampering.

```ts
const verified = await gateway.verifyPayment("sslcommerz", {
  transactionId: val_id, // from query param: ?val_id=XXX
  amount: 500,           // recommended — validates amount matches
});
```

> **Security:** SSLCommerz docs strongly recommend verifying the `amount` server-side. foxses-pay throws a `ProviderError` if amounts don't match.

**Response:**
```ts
{
  transactionId: "BANK_TRX_ID",  // bank_tran_id — save this for refunds
  provider: "sslcommerz",
  amount: 500,
  currency: "BDT",
  status: "completed",
}
```

## Get Payment Status

Query status using your own `orderId` (tran_id):

```ts
const status = await gateway.getPaymentStatus("sslcommerz", "ORDER-001");
```

## Refund Payment

Requires `bank_tran_id` from the `verifyPayment` response:

```ts
const refund = await gateway.refundPayment("sslcommerz", {
  transactionId: bank_tran_id, // from verifyPayment response
  amount: 500,                 // full or partial amount
  reason: "Customer request",
});
```

**Response:**
```ts
{
  refundId: "REFUND_REF_ID",
  transactionId: "BANK_TRX_ID",
  amount: 500,
  status: "refunded",
}
```

## Callback Handling

### Success URL

SSLCommerz redirects to your `successUrl` with query params:

```
GET /payment/success?val_id=XXX&tran_id=ORDER-001&status=VALID&...
```

```ts
app.get("/payment/success", async (req, res) => {
  const { val_id, tran_id, amount } = req.query;

  const verified = await gateway.verifyPayment("sslcommerz", {
    transactionId: val_id as string,
    amount: parseFloat(amount as string),
  });

  if (verified.status === "completed") {
    // update DB using tran_id
    res.redirect("/order/confirmed");
  }
});
```

### IPN (Server-to-Server)

SSLCommerz also POSTs to your `ipn_url`:

```ts
app.post("/payment/ipn", async (req, res) => {
  const { val_id, status, tran_id } = req.body;

  if (status === "VALID" || status === "VALIDATED") {
    const verified = await gateway.verifyPayment("sslcommerz", {
      transactionId: val_id,
    });
    // update DB
  }

  res.sendStatus(200);
});
```

## Sandbox Test Cards

| Card Type | Number | Expiry | CVV |
|-----------|--------|--------|-----|
| VISA | 4111111111111111 | 12/26 | 111 |
| Mastercard | 5111111111111111 | 12/26 | 111 |
| Amex | 371111111111111 | 12/26 | 111 |

Mobile Banking OTP: `111111` or `123456`

## Whitelisted IPs (Production)

Add these IPs to your server firewall:

```
103.26.139.81
103.26.139.148
103.132.153.81
103.132.153.148
```

## Production Endpoints

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://sandbox.sslcommerz.com` |
| Production | `https://securepay.sslcommerz.com` |

## Credentials

Get from [SSLCommerz Developer Portal](https://developer.sslcommerz.com)
