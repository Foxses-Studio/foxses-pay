// Auto-register all providers
import "@foxses/pay-bkash";
import "@foxses/pay-nagad";
import "@foxses/pay-sslcommerz";
import "@foxses/pay-stripe";

import { PaymentGateway } from "@foxses/pay-core";
import type {
  SupportedProvider,
  CreatePaymentParams,
  VerifyPaymentParams,
  PaymentResponse,
  RefundParams,
  RefundResponse,
  PaymentConfig,
} from "@foxses/pay-core";

// Re-export everything for advanced users
export * from "@foxses/pay-core";
export * from "@foxses/pay-bkash";
export * from "@foxses/pay-nagad";
export * from "@foxses/pay-sslcommerz";
export * from "@foxses/pay-stripe";

// ─── Singleton simple API ────────────────────────────────────────────────────

const _gateway = new PaymentGateway();

/**
 * Configure one or more payment providers.
 *
 * @example
 * configure({
 *   bkash: { appKey: "...", secretKey: "...", username: "...", password: "...", callbackUrl: "...", successUrl: "...", failureUrl: "..." },
 *   stripe: { apiKey: "sk_test_...", successUrl: "...", failureUrl: "..." },
 * });
 */
export function configure(
  providers: Partial<Record<SupportedProvider, PaymentConfig>>
): void {
  for (const [name, config] of Object.entries(providers)) {
    _gateway.use(name as SupportedProvider, config as PaymentConfig);
  }
}

/**
 * Create a payment with any configured provider.
 *
 * @example
 * const payment = await createPayment("bkash", {
 *   amount: 500,
 *   currency: "BDT",
 *   orderId: "ORDER-001",
 * });
 * // Redirect user to: payment.checkoutUrl
 */
export function createPayment(
  provider: SupportedProvider,
  params: CreatePaymentParams
): Promise<PaymentResponse> {
  return _gateway.createPayment(provider, params);
}

/**
 * Verify a payment after the user completes checkout.
 *
 * @example
 * const result = await verifyPayment("bkash", { transactionId: paymentID });
 */
export function verifyPayment(
  provider: SupportedProvider,
  params: VerifyPaymentParams
): Promise<PaymentResponse> {
  return _gateway.verifyPayment(provider, params);
}

/**
 * Check current payment status.
 */
export function getPaymentStatus(
  provider: SupportedProvider,
  transactionId: string
): Promise<PaymentResponse> {
  return _gateway.getPaymentStatus(provider, transactionId);
}

/**
 * Issue a refund.
 *
 * @example
 * const refunded = await refund("bkash", { transactionId: trxID, amount: 500 });
 */
export function refund(
  provider: SupportedProvider,
  params: RefundParams
): Promise<RefundResponse> {
  return _gateway.refundPayment(provider, params);
}

// Also export the PaymentGateway class for advanced users who need multiple instances
export { PaymentGateway };
