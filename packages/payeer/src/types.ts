export interface PayeerConfig {
  merchantId: string;     // Payeer account ID (e.g. "P1000000")
  secretKey: string;      // Secret key from merchant settings
  successUrl: string;
  failureUrl: string;
  statusUrl?: string;     // IPN/status callback URL
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface PayeerFormParams {
  m_shop: string;
  m_orderid: string;
  m_amount: string;
  m_curr: string;
  m_desc: string;
  m_sign: string;
  m_status_url?: string;
  m_success_url?: string;
  m_fail_url?: string;
}
