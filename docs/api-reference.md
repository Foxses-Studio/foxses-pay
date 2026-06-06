# API Reference

## PaymentGateway

Main class. Single instance per application.

```ts
import { PaymentGateway } from "foxses-pay";
const gateway = new PaymentGateway();
```

---

### `gateway.use(provider, config)`

Register a payment provider. Call once per provider during app startup.

```ts
gateway.use(provider: SupportedProvider, config: PaymentConfig): this
```

| Param | Type | Description |
|-------|------|-------------|
| `provider` | `SupportedProvider` | `"bkash"` \| `"nagad"` \| `"sslcommerz"` |
| `config` | `PaymentConfig` | Provider-specific configuration |

Returns `this` for chaining:
```ts
gateway
  .use("bkash", bkashConfig)
  .use("nagad", nagadConfig)
  .use("sslcommerz", sslConfig);
```

---

### `gateway.createPayment(provider, params)`

Create a new payment session.

```ts
gateway.createPayment(
  provider: SupportedProvider,
  params: CreatePaymentParams
): Promise<PaymentResponse>
```

**`CreatePaymentParams`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `number` | ✅ | Payment amount (must be > 0) |
| `currency` | `string` | ✅ | Currency code e.g. `"BDT"` |
| `orderId` | `string` | ✅ | Unique order/transaction ID |
| `customerName` | `string` | ❌ | Customer full name |
| `customerEmail` | `string` | ❌ | Customer email |
| `customerPhone` | `string` | ❌ | Customer phone number |
| `metadata` | `Record<string, unknown>` | ❌ | Provider-specific extra data |

---

### `gateway.verifyPayment(provider, params)`

Verify/execute a payment after user completes checkout.

```ts
gateway.verifyPayment(
  provider: SupportedProvider,
  params: VerifyPaymentParams
): Promise<PaymentResponse>
```

**`VerifyPaymentParams`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transactionId` | `string` | ✅ | Provider's payment/transaction ID |
| `orderId` | `string` | ❌ | Your order ID |
| `amount` | `number` | ❌ | Expected amount (for validation) |

---

### `gateway.getPaymentStatus(provider, transactionId)`

Query current status of a payment.

```ts
gateway.getPaymentStatus(
  provider: SupportedProvider,
  transactionId: string
): Promise<PaymentResponse>
```

---

### `gateway.refundPayment(provider, params)`

Issue a refund for a completed payment.

```ts
gateway.refundPayment(
  provider: SupportedProvider,
  params: RefundParams
): Promise<RefundResponse>
```

**`RefundParams`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transactionId` | `string` | ✅ | Provider's transaction ID |
| `amount` | `number` | ❌ | Refund amount (partial refund if less than original) |
| `reason` | `string` | ❌ | Reason for refund |

---

## Types

### `PaymentResponse`

Returned by `createPayment`, `verifyPayment`, `getPaymentStatus`.

```ts
interface PaymentResponse {
  transactionId: string;        // provider's transaction/payment ID
  provider: SupportedProvider;  // which provider handled the payment
  amount: number;               // payment amount
  currency: string;             // currency code
  status: PaymentStatus;        // current status
  checkoutUrl?: string;         // redirect URL (only from createPayment)
  raw?: unknown;                // full raw API response from provider
}
```

### `RefundResponse`

Returned by `refundPayment`.

```ts
interface RefundResponse {
  refundId: string;             // provider's refund transaction ID
  transactionId: string;        // original transaction ID
  amount: number;               // refunded amount
  status: PaymentStatus;
  raw?: unknown;
}
```

### `PaymentStatus`

```ts
type PaymentStatus =
  | "pending"    // payment initiated, waiting for user action
  | "completed"  // payment successful
  | "failed"     // payment failed
  | "cancelled"  // user cancelled
  | "refunded";  // payment refunded
```

### `SupportedProvider`

```ts
type SupportedProvider =
  | "stripe"
  | "bkash"
  | "nagad"
  | "rocket"
  | "sslcommerz";
```

### `PaymentConfig`

Base config required by all providers.

```ts
interface PaymentConfig {
  apiKey: string;
  secretKey: string;
  callbackUrl: string;
  successUrl: string;
  failureUrl: string;
  sandbox?: boolean;
}
```

Each provider extends this with additional fields. See individual provider docs.

---

## BaseProvider

Abstract class for building custom providers.

```ts
import { BaseProvider, PaymentGateway } from "foxses-pay";
import type {
  CreatePaymentParams,
  VerifyPaymentParams,
  PaymentResponse,
  PaymentConfig,
} from "foxses-pay";

class MyProvider extends BaseProvider {
  readonly name = "myprovider" as const;

  constructor(config: PaymentConfig) {
    super(config);
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    // your implementation
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    // your implementation
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    // your implementation
  }
}

// Register your provider
PaymentGateway.registerProvider("myprovider" as any, MyProvider as any);
```
