import type { PaymentConfig, CreatePaymentParams, VerifyPaymentParams, PaymentResponse, RefundParams, RefundResponse, SupportedProvider } from "../types/index.js";
export declare abstract class BaseProvider {
    protected config: PaymentConfig;
    abstract readonly name: SupportedProvider;
    constructor(config: PaymentConfig);
    abstract createPayment(params: CreatePaymentParams): Promise<PaymentResponse>;
    abstract verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse>;
    abstract getPaymentStatus(transactionId: string): Promise<PaymentResponse>;
    refundPayment(_params: RefundParams): Promise<RefundResponse>;
}
//# sourceMappingURL=base.provider.d.ts.map