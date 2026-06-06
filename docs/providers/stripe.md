# Stripe Provider

Stripe Checkout Session integration — global card payments.

## How It Works

Stripe uses a hosted Checkout page:

1. **Create Session** — POST to Stripe API → get `url` (Stripe hosted checkout page)
2. **Redirect** user to the Stripe checkout URL
3. **User pays** with card on Stripe's hosted page
4. **Redirect back** — Stripe redirects to your `successUrl` with `?session_id=cs_xxx`
5. **Verify** — retrieve session from Stripe to confirm payment

## Configuration

```ts
gateway.use("stripe", {
  apiKey: "sk_test_YOUR_SECRET_KEY",          // required — Stripe secret key
  webhookSecret: "whsec_YOUR_WEBHOOK_SECRET", // optional — for webhook verification
  successUrl: "https://yoursite.com/payment/success", // required
  failureUrl: "https://yoursite.com/payment/cancel",  // required — cancel URL
  sandbox: true,                               // optional, default: true
});
```

| Field | Type | Description |
|-------|------|-------------|
| `apiKey` | string | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `webhookSecret` | string | Stripe webhook signing secret (`whsec_...`) |
| `successUrl` | string | Redirect after successful payment |
| `failureUrl` | string | Redirect when user cancels |
| `sandbox` | boolean | Use test keys (no effect on URLs, just informational) |

> **Note:** In Stripe, sandbox vs production is determined by the key itself (`sk_test_` = sandbox, `sk_live_` = production). The `sandbox` flag here is informational only.

## Create Payment

```ts
const payment = await gateway.createPayment("stripe", {
  amount: 29.99,                       // required — supports decimals (USD, EUR etc.)
  currency: "USD",                     // required — any Stripe-supported currency
  orderId: "ORDER-001",                // required — saved as client_reference_id
  customerEmail: "user@example.com",  // optional — pre-fills email on checkout
  metadata: {
    productName: "Pro Plan",          // optional — shown on checkout page
    productDescription: "Monthly",   // optional
  },
});
```

**Response:**
```ts
{
  transactionId: "cs_test_xxx",       // Stripe Checkout Session ID
  provider: "stripe",
  amount: 29.99,
  currency: "USD",
  status: "pending",
  checkoutUrl: "https://checkout.stripe.com/...", // redirect user here
}
```

## Verify Payment

Call after Stripe redirects to your `successUrl` with `?session_id=cs_xxx`.

```ts
const verified = await gateway.verifyPayment("stripe", {
  transactionId: sessionId, // from query: ?session_id=cs_xxx
  amount: 29.99,            // optional — validates amount to prevent tampering
});
```

**Response:**
```ts
{
  transactionId: "pi_xxx",  // Payment Intent ID — save for refunds
  provider: "stripe",
  amount: 29.99,
  currency: "USD",
  status: "completed",
}
```

## Get Payment Status

Accepts either a **Session ID** (`cs_xxx`) or **Payment Intent ID** (`pi_xxx`):

```ts
// By session ID
const status = await gateway.getPaymentStatus("stripe", "cs_SESSION_ID");

// By payment intent ID
const status = await gateway.getPaymentStatus("stripe", "pi_INTENT_ID");
```

## Refund Payment

**Requires Payment Intent ID** (`pi_xxx`) — from the `verifyPayment` response.

```ts
// Full refund
const refund = await gateway.refundPayment("stripe", {
  transactionId: "pi_PAYMENT_INTENT_ID",
});

// Partial refund
const refund = await gateway.refundPayment("stripe", {
  transactionId: "pi_PAYMENT_INTENT_ID",
  amount: 15.00,
  reason: "requested_by_customer",
});
```

**Valid reasons:** `"duplicate"` | `"fraudulent"` | `"requested_by_customer"`

**Response:**
```ts
{
  refundId: "re_xxx",
  transactionId: "pi_xxx",
  amount: 29.99,
  status: "refunded",
}
```

## Webhook Handling

Stripe sends server-to-server events to your webhook URL. This is more reliable than redirect-based verification.

### Setup

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yoursite.com/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret (`whsec_xxx`) to your config

### Handler

```ts
// Express — IMPORTANT: use raw body, not JSON-parsed body
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    // Get the StripeProvider instance to call verifyWebhook
    const stripeProvider = gateway["providers"].get("stripe") as StripeProvider;

    let event: any;
    try {
      event = stripeProvider.verifyWebhook(req.body, sig);
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.client_reference_id;
      const paymentIntentId = session.payment_intent;

      // Fulfill order in your DB
      await fulfillOrder(orderId, paymentIntentId);
    }

    res.sendStatus(200);
  }
);
```

### Callback Handling (Redirect-based)

```ts
// successUrl receives: /payment/success?session_id=cs_xxx
app.get("/payment/success", async (req, res) => {
  const { session_id } = req.query;

  const verified = await gateway.verifyPayment("stripe", {
    transactionId: session_id as string,
  });

  if (verified.status === "completed") {
    // update order
    res.redirect("/order/confirmed");
  }
});
```

## Amount Handling

Stripe uses **smallest currency unit** internally (cents for USD, paisa for BDT).

foxses-pay handles this conversion automatically:
- You pass `amount: 29.99` (in major unit)
- foxses-pay sends `2999` to Stripe
- Responses are converted back to major unit

## Supported Currencies

Stripe supports 135+ currencies. Common ones:

| Currency | Code |
|----------|------|
| US Dollar | USD |
| Euro | EUR |
| British Pound | GBP |
| Bangladeshi Taka | BDT |
| Indian Rupee | INR |

Full list: [stripe.com/docs/currencies](https://stripe.com/docs/currencies)

## Test Cards (Sandbox)

| Scenario | Card Number | Expiry | CVV |
|----------|-------------|--------|-----|
| Success | 4242 4242 4242 4242 | Any future | Any |
| Auth Required | 4000 0025 0000 3155 | Any future | Any |
| Decline | 4000 0000 0000 9995 | Any future | Any |

## Production Endpoints

| Environment | Key Prefix |
|-------------|-----------|
| Test | `sk_test_...` |
| Live | `sk_live_...` |

## Credentials

Get from [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
