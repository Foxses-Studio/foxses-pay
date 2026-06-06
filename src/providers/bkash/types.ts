export interface BkashConfig {
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  callbackUrl: string;
  sandbox?: boolean;
}

export interface BkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface BkashCreatePaymentRequest {
  mode: "0011";
  payerReference: string;
  callbackURL: string;
  amount: string;
  currency: "BDT";
  intent: "sale";
  merchantInvoiceNumber: string;
}

export interface BkashCreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashExecutePaymentResponse {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  paymentExecuteTime: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashQueryPaymentResponse {
  paymentID: string;
  trxID: string;
  initiationTime: string;
  completedTime: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashRefundResponse {
  originalTrxID: string;
  refundTrxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  completedTime: string;
  statusCode: string;
  statusMessage: string;
}
