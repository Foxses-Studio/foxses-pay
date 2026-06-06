# @foxses/pay-nagad

Nagad Checkout provider for [foxses-pay](https://paydoc.foxses.com).

## Install

```bash
npm install @foxses/pay-core @foxses/pay-nagad
```

Or use the all-in-one package:

```bash
npm install @foxses/pay
```

## Usage

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-nagad";

const gateway = new PaymentGateway();

gateway.use("nagad", {
  merchantId: "YOUR_MERCHANT_ID",
  merchantNumber: "01XXXXXXXXX",
  privateKey: "YOUR_RSA_PRIVATE_KEY",    // base64 or PEM
  nagadPublicKey: "NAGAD_PUBLIC_KEY",    // from Nagad merchant portal
  callbackUrl: "https://yoursite.com/nagad/callback",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/failure",
  sandbox: true,
});

// Step 1: Create payment (initialize + complete in one call)
const payment = await gateway.createPayment("nagad", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
  metadata: { ip: "CLIENT_IP_ADDRESS" }, // required
});

// Redirect user to:
console.log(payment.checkoutUrl);

// Step 2: Verify after Nagad calls callbackUrl with ?payment_ref_id=xxx
const result = await gateway.verifyPayment("nagad", {
  transactionId: paymentRefId,
});

console.log(result.status); // "completed"
```

## Documentation

[paydoc.foxses.com/docs/providers/nagad](https://paydoc.foxses.com/docs/providers/nagad)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
