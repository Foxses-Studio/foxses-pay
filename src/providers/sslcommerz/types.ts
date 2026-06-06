export interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  successUrl: string;
  failureUrl: string;
  cancelUrl: string;
  ipnUrl?: string;
  sandbox?: boolean;
}

export interface SSLCommerzInitRequest {
  store_id: string;
  store_passwd: string;
  total_amount: string;
  currency: string;
  tran_id: string;
  product_name: string;
  product_category: string;
  product_profile: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url?: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1?: string;
  cus_city?: string;
  cus_country?: string;
  ship_name?: string;
  ship_add1?: string;
  ship_city?: string;
  ship_country?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

export interface SSLCommerzInitResponse {
  status: "SUCCESS" | "FAILED";
  sessionkey: string;
  GatewayPageURL: string;
  storeLogo?: string;
  storeBanner?: string;
  desc?: string;
  failedreason?: string;
}

export interface SSLCommerzValidateResponse {
  status: "VALID" | "VALIDATED" | "INVALID_TRANSACTION" | "FAILED";
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  currency_type: string;
  currency_amount: string;
  risk_level: string;
  risk_title: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

export interface SSLCommerzRefundResponse {
  APIConnect: string;
  bank_tran_id: string;
  trans_id: string;
  refund_ref_id: string;
  status: string;
  errorReason?: string;
}

export interface SSLCommerzRefundStatusResponse {
  APIConnect: string;
  bank_tran_id: string;
  refund_ref_id: string;
  initiated_on: string;
  refunded_on: string;
  status: "refunded" | "processing" | "cancelled";
  reason: string;
}
