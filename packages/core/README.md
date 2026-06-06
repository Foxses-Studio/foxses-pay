# @foxses/pay-core

Core engine for [foxses-pay](https://paydoc.foxses.com) — types, errors, BaseProvider, and PaymentGateway.

## Install

```bash
npm install @foxses/pay-core
```

## Usage

Most developers should use [`@foxses/pay`](https://www.npmjs.com/package/@foxses/pay) instead.

`@foxses/pay-core` is for advanced users who want to:
- Install only specific providers
- Build a custom payment provider

```ts
import { PaymentGateway } from "@foxses/pay-core";
import "@foxses/pay-bkash"; // register bKash

const gateway = new PaymentGateway();

gateway.use("bkash", {
  appKey: "YOUR_APP_KEY",
  secretKey: "YOUR_APP_SECRET",
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  callbackUrl: "https://yoursite.com/callback",
  successUrl: "https://yoursite.com/success",
  failureUrl: "https://yoursite.com/failure",
  sandbox: true,
});

const payment = await gateway.createPayment("bkash", {
  amount: 500,
  currency: "BDT",
  orderId: "ORDER-001",
});

console.log(payment.checkoutUrl);
```

## Build a Custom Provider

```ts
import { BaseProvider, PaymentGateway } from "@foxses/pay-core";
import type { CreatePaymentParams, PaymentResponse, VerifyPaymentParams } from "@foxses/pay-core";

class MyProvider extends BaseProvider {
  readonly name = "myprovider" as any;

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    // your implementation
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    // your implementation
  }

  async getPaymentStatus(id: string): Promise<PaymentResponse> {
    // your implementation
  }
}

PaymentGateway.registerProvider("myprovider" as any, MyProvider as any);
```

## Documentation

[paydoc.foxses.com](https://paydoc.foxses.com)

## License

MIT © [Foxses Studio](https://github.com/Foxses-Studio)
