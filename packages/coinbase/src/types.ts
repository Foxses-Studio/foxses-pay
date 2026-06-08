export interface CoinbaseConfig {
  apiKey: string;
  successUrl: string;
  failureUrl: string;
  webhookSecret?: string;
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface CoinbaseChargeRequest {
  name: string;
  description: string;
  local_price: {
    amount: string;
    currency: string;
  };
  pricing_type: "fixed_price";
  redirect_url: string;
  cancel_url: string;
  metadata?: Record<string, string>;
}

export interface CoinbaseChargeResponse {
  data: {
    id: string;
    code: string;
    name: string;
    description: string;
    hosted_url: string;
    created_at: string;
    expires_at: string;
    timeline: Array<{ time: string; status: string }>;
    metadata: Record<string, string>;
    pricing: Record<string, { amount: string; currency: string }>;
    local_price: { amount: string; currency: string };
    payments: CoinbasePayment[];
    timeline_status: string;
  };
}

export interface CoinbasePayment {
  network: string;
  transaction_id: string;
  status: string;
  detected_at: string;
  value: { local: { amount: string; currency: string }; crypto: { amount: string; currency: string } };
  block: { network_confirmations: number; height: number };
}
