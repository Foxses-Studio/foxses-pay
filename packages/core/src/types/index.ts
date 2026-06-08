export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export type SupportedProvider =
  | "stripe"
  | "bkash"
  | "nagad"
  | "rocket"
  | "sslcommerz"
  | "coinbase"
  | "nowpayments"
  | "coinpayments"
  | "cryptomus";

export interface PaymentConfig {
  apiKey?: string;
  secretKey?: string;
  callbackUrl?: string;
  successUrl?: string;
  failureUrl?: string;
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  transactionId: string;
  orderId?: string;
  amount?: number;
}

export interface PaymentResponse {
  transactionId: string;
  provider: SupportedProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  raw?: unknown;
}

export interface RefundParams {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  raw?: unknown;
}
