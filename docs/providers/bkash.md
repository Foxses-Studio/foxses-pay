# bKash Provider

bKash Tokenized Checkout API v1.2.0-beta integration.

## How It Works

bKash Tokenized Checkout uses a token-based system:

1. **Grant Token** — exchange app credentials for an `id_token` (auto-managed)
2. **Create Payment** — get a `bkashURL` and `paymentID`
3. **Redirect** user to `bkashURL` to pay on bKash
4. **Callback** — bKash calls your `callbackUrl` with `paymentID` and `status`
5. **Execute Payment** — confirm the payment using `paymentID`

## Configuration

```ts
gateway.use("bkash", {
  appKey: "YOUR_APP_KEY",       // required
  secretKey: "YOUR_APP_SECRET", // required (appSecret)
  username: "YOUR_USERNAME",    // required
  password: "YOUR_PASSWORD",    // required
  callbackUrl: "https://yoursite.com/bkash/callback", // required
  successUrl: "https://yoursite.com/payment/success", // required
  failureUrl: "https://yoursite.com/payment/failure", // required
  sandbox: true,                // optional, default: true
});
```

| Field | Type | Description |
|-------|------|-------------|
| `appKey` | string | bKash App Key from merchant dashboard |
| `secretKey` | string | bKash App Secret |
| `username` | string | Merchant username |
| `password` | string | Merchant password |
| `callbackUrl` | string | bKash calls this after payment |
| `successUrl` | string | Redirect on success |
| `failureUrl` | string | Redirect on failure |
| `sandbox` | boolean | Use sandbox environment |

## Token Management

Tokens are cached in memory and auto-refreshed 60 seconds before expiry (1 hour TTL). No manual token handling needed.

## Create Payment

```ts
const payment = await gateway.createPayment("bkash", {
  amount: 500,                  // required — BDT amount
  currency: "BDT",              // required
  orderId: "ORDER-001",         // required — unique order ID
  customerPhone: "01700000000", // optional — used as payerReference
});
```

**Response:**
```ts
{
  transactionId: "77MC3A1716018501178", // bKash paymentID
  provider: "bkash",
  amount: 500,
  currency: "BDT",
  status: "pending",
  checkoutUrl: "https://pay.bka.sh/...", // redirect user here
}
```

## Verify Payment (Execute)

Call this after bKash calls your `callbackUrl` with `?paymentID=xxx&status=success`.

```ts
const verified = await gateway.verifyPayment("bkash", {
  transactionId: paymentID, // paymentID from callback query param
});
```

**Response:**
```ts
{
  transactionId: "8XBT5A1716018523456", // bKash trxID (actual transaction)
  provider: "bkash",
  amount: 500,
  currency: "BDT",
  status: "completed",
}
```

## Get Payment Status

Query status anytime using `paymentID`.

```ts
const status = await gateway.getPaymentStatus("bkash", paymentID);
```

## Refund Payment

Requires the actual bKash `trxID` (from `verifyPayment` response), not the `paymentID`.

```ts
const refund = await gateway.refundPayment("bkash", {
  transactionId: trxID, // bKash trxID from verifyPayment
  amount: 500,          // required for bKash refund
  reason: "Customer request",
});
```

**Response:**
```ts
{
  refundId: "8XBT5A1716018599999",
  transactionId: "8XBT5A1716018523456",
  amount: 500,
  status: "refunded",
}
```

## Callback Handling

bKash sends a GET request to your `callbackUrl`:

```
GET /bkash/callback?paymentID=xxx&status=success&apiVersion=v1.2.0-beta
```

| Param | Value |
|-------|-------|
| `paymentID` | Use this in `verifyPayment` |
| `status` | `success` / `failure` / `cancel` |

```ts
// Express example
app.get("/bkash/callback", async (req, res) => {
  const { paymentID, status } = req.query;

  if (status !== "success") {
    return res.redirect("/payment/failed");
  }

  const verified = await gateway.verifyPayment("bkash", {
    transactionId: paymentID as string,
  });

  if (verified.status === "completed") {
    // update order in DB
    res.redirect("/payment/success");
  }
});
```

## Sandbox Credentials

Get sandbox credentials from [bKash Developer Portal](https://developer.bka.sh).

## Production Endpoints

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout` |
| Production | `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout` |
