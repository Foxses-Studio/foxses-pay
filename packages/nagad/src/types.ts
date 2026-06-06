export interface NagadConfig {
  merchantId: string;
  merchantNumber: string;
  privateKey: string;
  nagadPublicKey: string;
  callbackUrl: string;
  apiVersion?: string;
  sandbox?: boolean;
}

export interface NagadInitSensitiveData {
  merchantId: string;
  datetime: string;
  orderId: string;
  challenge: string;
}

export interface NagadInitPayload {
  accountNumber: string;
  dateTime: string;
  sensitiveData: string;
  signature: string;
}

export interface NagadInitResponse {
  sensitiveData: string;
  status: string;
  reason?: string;
  devMessage?: string;
}

export interface NagadDecryptedInitResponse {
  paymentReferenceId: string;
  challenge: string;
}

export interface NagadCompleteSensitiveData {
  merchantId: string;
  orderId: string;
  amount: string;
  currencyCode: "050";
  challenge: string;
}

export interface NagadCompletePayload {
  paymentRefId: string;
  sensitiveData: string;
  signature: string;
  merchantCallbackURL: string;
  additionalMerchantInfo?: Record<string, unknown>;
}

export interface NagadCompleteResponse {
  callBackUrl: string;
  status?: string;
  reason?: string;
  devMessage?: string;
}

export interface NagadVerifyResponse {
  paymentRefId: string;
  orderId: string;
  amount: string;
  currencyCode: string;
  status: string;
  issuerPaymentRefNo: string;
  additionalMerchantInfo?: Record<string, unknown>;
  reason?: string;
  devMessage?: string;
}
