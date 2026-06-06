import type {
  PaymentConfig,
  CreatePaymentParams,
  VerifyPaymentParams,
  PaymentResponse,
  RefundParams,
  RefundResponse,
  SupportedProvider,
} from "../types/index.js";

export abstract class BaseProvider {
  protected config: PaymentConfig;
  abstract readonly name: SupportedProvider;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  abstract createPayment(params: CreatePaymentParams): Promise<PaymentResponse>;
  abstract verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse>;
  abstract getPaymentStatus(transactionId: string): Promise<PaymentResponse>;

  refundPayment(_params: RefundParams): Promise<RefundResponse> {
    return Promise.reject(
      new Error(`Refund not supported by ${this.name} provider yet.`)
    );
  }
}
