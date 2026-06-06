# Nagad Provider

Nagad Checkout API v0.2.0 integration with RSA encryption.

## How It Works

Nagad uses RSA encryption for all sensitive data exchange:

1. **Initialize** — encrypt merchant info with Nagad's public key → get `paymentReferenceId`
2. **Complete** — encrypt order details → get `callBackUrl` (checkout URL)
3. **Redirect** user to `callBackUrl` to pay on Nagad
4. **Callback** — Nagad calls your `callbackUrl` with `payment_ref_id`
5. **Verify** — GET request to confirm payment status

`createPayment()` handles steps 1 and 2 automatically.

## RSA Keys Setup

Nagad requires a pair of RSA keys:

| Key | Purpose | Who generates |
|-----|---------|---------------|
| Merchant Private Key | Sign & decrypt responses | You (merchant) |
| Merchant Public Key | Uploaded to Nagad portal | You (merchant) |
| Nagad Public Key | Encrypt sensitive data | Nagad (download from portal) |

**Generate key pair:**
```bash
# Generate private key
openssl genrsa -out merchant_private.pem 2048

# Extract public key
openssl rsa -in merchant_private.pem -pubout -out merchant_public.pem
```

Upload `merchant_public.pem` to Nagad merchant portal.
Download Nagad's public key from the portal.

## Configuration

```ts
gateway.use("nagad", {
  merchantId: "YOUR_MERCHANT_ID",            // required
  merchantNumber: "01XXXXXXXXX",             // required — Nagad merchant number
  privateKey: "YOUR_RSA_PRIVATE_KEY",        // required — base64 or PEM
  nagadPublicKey: "NAGAD_RSA_PUBLIC_KEY",    // required — base64 or PEM
  callbackUrl: "https://yoursite.com/nagad/callback", // required
  successUrl: "https://yoursite.com/payment/success", // required
  failureUrl: "https://yoursite.com/payment/failure", // required
  apiVersion: "v-0.2.0",                    // optional, default: "v-0.2.0"
  sandbox: true,                             // optional, default: true
});
```

Keys can be provided as:
- **Raw base64** string (without PEM headers)
- **Full PEM** string (with `-----BEGIN...-----` headers)

Both formats are supported automatically.

## Create Payment

```ts
const payment = await gateway.createPayment("nagad", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",          // must be unique
  metadata: {
    ip: "CLIENT_IP_ADDRESS",    // required — customer's IP address
  },
});
```

> **Important:** Nagad requires the client IP address. Pass it via `metadata.ip`. For local development, use `"103.100.200.100"` as fallback.

**Response:**
```ts
{
  transactionId: "NAG-REF-XXX", // paymentReferenceId — save this
  provider: "nagad",
  amount: 500,
  currency: "BDT",
  status: "pending",
  checkoutUrl: "http://sandbox.mynagad.com:10080/...", // redirect user here
}
```

## Verify Payment

Call after Nagad sends callback with `payment_ref_id`.

```ts
const verified = await gateway.verifyPayment("nagad", {
  transactionId: paymentRefId,
});
```

**Response:**
```ts
{
  transactionId: "NAG-TRX-XXX", // Nagad issuerPaymentRefNo
  provider: "nagad",
  amount: 500,
  currency: "BDT",
  status: "completed",
}
```

## Get Payment Status

```ts
const status = await gateway.getPaymentStatus("nagad", paymentRefId);
```

## Callback Handling

Nagad sends a GET request to your `callbackUrl`:

```
GET /nagad/callback?payment_ref_id=xxx&order_id=ORDER-001&status=Success
```

| Param | Value |
|-------|-------|
| `payment_ref_id` | Use this in `verifyPayment` |
| `status` | `Success` / `Fail` / `Cancel` |

```ts
app.get("/nagad/callback", async (req, res) => {
  const { payment_ref_id, status } = req.query;

  if (status !== "Success") {
    return res.redirect("/payment/failed");
  }

  const verified = await gateway.verifyPayment("nagad", {
    transactionId: payment_ref_id as string,
  });

  if (verified.status === "completed") {
    res.redirect("/payment/success");
  }
});
```

## Status Mapping

| Nagad Status | foxses-pay Status |
|-------------|-------------------|
| `Success` | `completed` |
| `PENDING` | `pending` |
| `ABORTED` | `cancelled` |
| `FAIL` | `failed` |

## Production Endpoints

| Environment | Base URL |
|-------------|----------|
| Sandbox | `http://sandbox.mynagad.com:10080` |
| Production | `https://api.mynagad.com` |

## Credentials

Get from [Nagad Merchant Portal](https://merchant.nagad.com)
