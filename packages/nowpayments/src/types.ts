export interface NOWPaymentsConfig {
  apiKey: string;
  ipnSecretKey?: string;
  successUrl: string;
  failureUrl: string;
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface NOWPaymentsInvoiceRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id: string;
  order_description?: string;
  success_url: string;
  cancel_url: string;
  ipn_callback_url?: string;
}

export interface NOWPaymentsInvoiceResponse {
  id: string;
  token_id: string;
  order_id: string;
  order_description: string;
  price_amount: string;
  price_currency: string;
  pay_currency: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  created_at: string;
  updated_at: string;
}

export interface NOWPaymentsPaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  actually_paid: number;
  outcome_amount: number;
  outcome_currency: string;
  created_at: string;
  updated_at: string;
}
