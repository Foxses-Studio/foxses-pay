# Error Handling

foxses-pay throws typed errors so you can handle each case precisely.

## Error Classes

| Class | Code | When it happens |
|-------|------|----------------|
| `AuthenticationError` | `AUTHENTICATION_ERROR` | Wrong API key, expired token, invalid credentials |
| `ValidationError` | `VALIDATION_ERROR` | Missing required params, invalid amount, wrong format |
| `NetworkError` | `NETWORK_ERROR` | HTTP failure, timeout, DNS error |
| `ProviderError` | `PROVIDER_ERROR` | Provider returned an error response |
| `PaymentError` | `PAYMENT_ERROR` | Base class — catch all payment errors |

All extend `PaymentError` which extends `Error`.

## Usage

```ts
import {
  AuthenticationError,
  ValidationError,
  NetworkError,
  ProviderError,
  PaymentError,
} from "foxses-pay";

try {
  const payment = await gateway.createPayment("bkash", params);
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Credentials wrong — check your API keys
    console.error("Auth failed:", err.message);
    console.error("Provider:", err.provider); // "bkash"

  } else if (err instanceof ValidationError) {
    // Something missing or invalid in your request
    console.error("Validation:", err.message);

  } else if (err instanceof NetworkError) {
    // Could not reach the provider — retry or alert
    console.error("Network issue:", err.message);

  } else if (err instanceof ProviderError) {
    // Provider responded with an error
    console.error("Provider error:", err.message);

  } else if (err instanceof PaymentError) {
    // Any payment-related error
    console.error("Payment error:", err.message, err.code);
  }
}
```

## Error Properties

Every error exposes:

```ts
err.message   // human-readable description
err.code      // "AUTHENTICATION_ERROR" | "VALIDATION_ERROR" | ...
err.provider  // "bkash" | "nagad" | "sslcommerz" | undefined
err.name      // class name: "AuthenticationError" etc.
err.stack     // stack trace
```

## Common Errors by Provider

### bKash

| Error | Cause | Fix |
|-------|-------|-----|
| `AuthenticationError` | Wrong appKey/appSecret/username/password | Check merchant dashboard credentials |
| `ProviderError: statusCode 2001` | Invalid payment amount | Amount must be > 0 |
| `ProviderError: statusCode 2062` | Duplicate orderId | Use a unique orderId per payment |
| `NetworkError` | Cannot reach bKash servers | Check internet / sandbox URL |

### Nagad

| Error | Cause | Fix |
|-------|-------|-----|
| `ProviderError` | RSA encryption failed | Check private key / nagadPublicKey format |
| `ProviderError` | Duplicate orderId | Use a unique orderId per payment |
| `NetworkError` | Cannot reach Nagad servers | Sandbox may require specific IP whitelist |

### SSLCommerz

| Error | Cause | Fix |
|-------|-------|-----|
| `ProviderError: FAILED` | Wrong storeId/storePassword | Check store credentials |
| `ProviderError: amount mismatch` | Response amount differs from expected | Possible tampered response — do not fulfill order |
| `ProviderError: INVALID_TRANSACTION` | val_id does not exist or expired | Do not fulfill order |

## Retry Strategy

Retry only `NetworkError` — never retry `ProviderError` or `ValidationError`.

```ts
async function createPaymentWithRetry(
  provider: string,
  params: CreatePaymentParams,
  retries = 2
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await gateway.createPayment(provider as any, params);
    } catch (err) {
      if (err instanceof NetworkError && attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // backoff
        continue;
      }
      throw err;
    }
  }
}
```
