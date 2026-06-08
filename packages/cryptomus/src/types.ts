export interface CryptomusConfig {
  merchantId: string;
  apiKey: string;
  successUrl: string;
  failureUrl: string;
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface CryptomusCreateInvoiceRequest {
  amount: string;
  currency: string;
  order_id: string;
  url_return?: string;
  url_success?: string;
  url_callback?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  to_currency?: string;
}

export interface CryptomusInvoiceResult {
  uuid: string;
  order_id: string;
  amount: string;
  payment_amount: string;
  payer_amount: string;
  discount_percent: number;
  discount: string;
  payer_currency: string;
  currency: string;
  merchant_amount: string;
  network: string | null;
  address: string | null;
  from: string | null;
  txid: string | null;
  payment_status: string;
  url: string;
  expired_at: number;
  status: string;
  is_final: boolean;
  additional_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface CryptomusApiResponse<T> {
  state: number;
  result: T;
}
