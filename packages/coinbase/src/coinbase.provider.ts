import axios from "axios";
import {
  BaseProvider,
  PaymentGateway,
  PaymentError,
  NetworkError,
  ProviderError,
  ValidationError,
} from "@foxses/pay-core";
import type {
  CreatePaymentParams,
  PaymentResponse,
  VerifyPaymentParams,
  RefundParams,
  RefundResponse,
  PaymentConfig,
} from "@foxses/pay-core";
import type { CoinbaseConfig, CoinbaseChargeResponse } from "./types";

const COINBASE_API = "https://api.commerce.coinbase.com";

export class CoinbaseProvider extends BaseProvider {
  readonly name = "coinbase" as const;
  private cbConfig: CoinbaseConfig;

  constructor(config: PaymentConfig) {
    super(config);
    if (!config.apiKey) throw new ValidationError("Coinbase apiKey is required");
    if (!config.successUrl) throw new ValidationError("Coinbase successUrl is required");
    if (!config.failureUrl) throw new ValidationError("Coinbase failureUrl is required");

    this.cbConfig = {
      apiKey: config.apiKey as string,
      successUrl: config.successUrl as string,
      failureUrl: config.failureUrl as string,
      webhookSecret: config.webhookSecret as string | undefined,
      sandbox: config.sandbox ?? false,
    };
  }

  private get headers() {
    return {
      "X-CC-Api-Key": this.cbConfig.apiKey,
      "X-CC-Version": "2018-03-22",
      "Content-Type": "application/json",
    };
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    try {
      const body = {
        name: `Order ${params.orderId}`,
        description: `Payment for order ${params.orderId}`,
        local_price: {
          amount: params.amount.toString(),
          currency: params.currency.toUpperCase(),
        },
        pricing_type: "fixed_price",
        redirect_url: this.cbConfig.successUrl,
        cancel_url: this.cbConfig.failureUrl,
        metadata: {
          orderId: params.orderId,
          ...(params.customerEmail ? { customerEmail: params.customerEmail } : {}),
          ...(params.customerName ? { customerName: params.customerName } : {}),
          ...(params.metadata ? (params.metadata as Record<string, string>) : {}),
        },
      };

      const { data } = await axios.post<CoinbaseChargeResponse>(
        `${COINBASE_API}/charges`,
        body,
        { headers: this.headers }
      );

      return {
        transactionId: data.data.code,
        provider: "coinbase",
        amount: params.amount,
        currency: params.currency,
        status: "pending",
        checkoutUrl: data.data.hosted_url,
        raw: data.data,
      };
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    try {
      const { data } = await axios.get<CoinbaseChargeResponse>(
        `${COINBASE_API}/charges/${params.transactionId}`,
        { headers: this.headers }
      );

      const charge = data.data;
      const timeline = charge.timeline ?? [];
      const lastStatus = timeline[timeline.length - 1]?.status?.toUpperCase() ?? "";

      const status = this.mapStatus(lastStatus);

      return {
        transactionId: charge.code,
        provider: "coinbase",
        amount: parseFloat(charge.local_price.amount),
        currency: charge.local_price.currency,
        status,
        raw: charge,
      };
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    return this.verifyPayment({ transactionId });
  }

  async refundPayment(_params: RefundParams): Promise<RefundResponse> {
    throw new ProviderError(
      "Coinbase Commerce does not support programmatic refunds. Please refund manually from the Coinbase Commerce dashboard.",
      "coinbase"
    );
  }

  private mapStatus(status: string): PaymentResponse["status"] {
    switch (status) {
      case "COMPLETED":
      case "CONFIRMED":
      case "RESOLVED":
        return "completed";
      case "EXPIRED":
      case "CANCELED":
        return "cancelled";
      case "FAILED":
        return "failed";
      default:
        return "pending";
    }
  }

  private handleError(err: unknown): never {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.error?.message ?? err.message;
      const status = err.response?.status;
      if (!err.response) throw new NetworkError(`Coinbase network error: ${err.message}`);
      if (status === 401 || status === 403) throw new PaymentError(`Coinbase auth error: ${msg}`, "AUTHENTICATION_ERROR", "coinbase");
      throw new ProviderError(`Coinbase error: ${msg}`, "coinbase");
    }
    throw new ProviderError(`Coinbase unknown error: ${String(err)}`, "coinbase");
  }
}

// Self-register
PaymentGateway.registerProvider("coinbase", CoinbaseProvider as never);
