# @foxses/pay-payeer

Payeer payment provider for [foxses-pay](https://paydoc.foxses.com).

Accept USD, EUR, RUB and crypto payments via Payeer merchant gateway.

## Install

```bash
npm install @foxses/pay-core @foxses/pay-payeer
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-payeer";

const gateway = new PaymentGateway();

gateway.use("payeer", {
  merchantId: "P1000000",               // Your Payeer account ID
  secretKey: "YOUR_SECRET_KEY",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/cancel",
  statusUrl: "https://yoursite.com/payeer/ipn", // optional IPN
});

// Step 1: Create payment (builds signed checkout URL)
const payment = await gateway.createPayment("payeer", {
  amount: 10,
  currency: "USD",
  orderId: "ORDER-001",
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify via IPN (Payeer POSTs to your statusUrl)
app.post("/payeer/ipn", (req, res) => {
  const { PayeerProvider } = require("@foxses/pay-payeer");
  // or get from gateway
  const result = await gateway.verifyPayment("payeer", {
    transactionId: req.body.m_orderid,
    ...req.body, // pass IPN data for signature verification
  });

  if (result.status === "completed") {
    await fulfillOrder(req.body.m_orderid);
  }

  res.send("OK");
});
```

## Getting Credentials

1. Go to [payeer.com](https://payeer.com) → Log in
2. **Merchant → Add store**
3. Copy **Shop ID** (merchantId) and **Secret Key**

## Documentation

[paydoc.foxses.com/docs/providers/payeer](https://paydoc.foxses.com/docs/providers/payeer)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
