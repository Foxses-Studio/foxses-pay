export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  successUrl: string;
  failureUrl: string;
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PayPalCreateOrderRequest {
  intent: "CAPTURE";
  purchase_units: Array<{
    reference_id?: string;
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
  application_context?: {
    return_url: string;
    cancel_url: string;
    brand_name?: string;
    user_action?: "PAY_NOW" | "CONTINUE";
  };
}

export interface PayPalOrderResponse {
  id: string;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  purchase_units?: Array<{
    reference_id?: string;
    amount: { currency_code: string; value: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}
