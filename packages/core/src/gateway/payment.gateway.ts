import type { BaseProvider } from "./base.provider.js";
import type {
  SupportedProvider,
  PaymentConfig,
  CreatePaymentParams,
  VerifyPaymentParams,
  PaymentResponse,
  RefundParams,
  RefundResponse,
} from "../types/index.js";
import { ValidationError } from "../errors/index.js";

type ProviderConstructor = new (config: PaymentConfig) => BaseProvider;

export class PaymentGateway {
  private providers: Map<SupportedProvider, BaseProvider> = new Map();
  private static registry: Map<SupportedProvider, ProviderConstructor> = new Map();

  static registerProvider(name: SupportedProvider, ctor: ProviderConstructor): void {
    PaymentGateway.registry.set(name, ctor);
  }

  use(provider: SupportedProvider, config: PaymentConfig): this {
    const Ctor = PaymentGateway.registry.get(provider);
    if (!Ctor) {
      throw new ValidationError(
        `Provider "${provider}" is not registered. Did you import it? e.g. import "@foxses/pay-${provider}"`
      );
    }
    this.providers.set(provider, new Ctor(config));
    return this;
  }

  private getProvider(provider: SupportedProvider): BaseProvider {
    const p = this.providers.get(provider);
    if (!p) {
      throw new ValidationError(
        `Provider "${provider}" is not configured. Call gateway.use("${provider}", config) first.`
      );
    }
    return p;
  }

  createPayment(provider: SupportedProvider, params: CreatePaymentParams): Promise<PaymentResponse> {
    return this.getProvider(provider).createPayment(params);
  }

  verifyPayment(provider: SupportedProvider, params: VerifyPaymentParams): Promise<PaymentResponse> {
    return this.getProvider(provider).verifyPayment(params);
  }

  getPaymentStatus(provider: SupportedProvider, transactionId: string): Promise<PaymentResponse> {
    return this.getProvider(provider).getPaymentStatus(transactionId);
  }

  refundPayment(provider: SupportedProvider, params: RefundParams): Promise<RefundResponse> {
    return this.getProvider(provider).refundPayment(params);
  }
}
