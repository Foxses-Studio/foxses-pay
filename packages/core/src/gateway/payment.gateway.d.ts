import type { BaseProvider } from "./base.provider.js";
import type { SupportedProvider, PaymentConfig, CreatePaymentParams, VerifyPaymentParams, PaymentResponse, RefundParams, RefundResponse } from "../types/index.js";
type ProviderConstructor = new (config: PaymentConfig) => BaseProvider;
export declare class PaymentGateway {
    private providers;
    private static registry;
    static registerProvider(name: SupportedProvider, ctor: ProviderConstructor): void;
    use(provider: SupportedProvider, config: PaymentConfig): this;
    private getProvider;
    createPayment(provider: SupportedProvider, params: CreatePaymentParams): Promise<PaymentResponse>;
    verifyPayment(provider: SupportedProvider, params: VerifyPaymentParams): Promise<PaymentResponse>;
    getPaymentStatus(provider: SupportedProvider, transactionId: string): Promise<PaymentResponse>;
    refundPayment(provider: SupportedProvider, params: RefundParams): Promise<RefundResponse>;
}
export {};
//# sourceMappingURL=payment.gateway.d.ts.map