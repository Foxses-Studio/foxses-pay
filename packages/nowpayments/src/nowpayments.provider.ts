import axios from "axios";
import {
  BaseProvider,
  PaymentGateway,
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
import type {
  NOWPaymentsConfig,
  NOWPaymentsInvoiceResponse,
  NOWPaymentsPaymentResponse,
} from "./types";

const PROD_API = "https://api.nowpayments.io/v1";
const SANDBOX_API = "https://api-sandbox.nowpayments.io/v1";

export class NOWPaymentsProvider extends BaseProvider {
  readonly name = "nowpayments" as const;
  private npConfig: NOWPaymentsConfig;

  constructor(config: PaymentConfig) {
    super(config);
    if (!config.apiKey) throw new ValidationError("NOWPayments apiKey is required");
    if (!config.successUrl) throw new ValidationError("NOWPayments successUrl is required");
    if (!config.failureUrl) throw new ValidationError("NOWPayments failureUrl is required");

    this.npConfig = {
      apiKey: config.apiKey as string,
      ipnSecretKey: config.ipnSecretKey as string | undefined,
      successUrl: config.successUrl as string,
      failureUrl: config.failureUrl as string,
      sandbox: config.sandbox ?? false,
    };
  }

  private get baseUrl() {
    return this.npConfig.sandbox ? SANDBOX_API : PROD_API;
  }

  private get headers() {
    return {
      "x-api-key": this.npConfig.apiKey,
      "Content-Type": "application/json",
    };
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    try {
      const body = {
        price_amount: params.amount,
        price_currency: params.currency.toLowerCase(),
        order_id: params.orderId,
        order_description: `Payment for order ${params.orderId}`,
        success_url: this.npConfig.successUrl,
        cancel_url: this.npConfig.failureUrl,
        ...(this.npConfig.ipnSecretKey ? { ipn_callback_url: this.npConfig.successUrl } : {}),
      };

      const { data } = await axios.post<NOWPaymentsInvoiceResponse>(
        `${this.baseUrl}/invoice`,
        body,
        { headers: this.headers }
      );

      return {
        transactionId: data.id,
        provider: "nowpayments",
        amount: params.amount,
        currency: params.currency,
        status: "pending",
        checkoutUrl: data.invoice_url,
        raw: data,
      };
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    try {
      const { data } = await axios.get<NOWPaymentsPaymentResponse>(
        `${this.baseUrl}/payment/${params.transactionId}`,
        { headers: this.headers }
      );

      return {
        transactionId: String(data.payment_id),
        provider: "nowpayments",
        amount: data.price_amount,
        currency: data.price_currency.toUpperCase(),
        status: this.mapStatus(data.payment_status),
        raw: data,
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
      "NOWPayments does not support programmatic refunds. Please refund manually from the NOWPayments dashboard.",
      "nowpayments"
    );
  }

  private mapStatus(status: string): PaymentResponse["status"] {
    switch (status) {
      case "finished":
      case "confirmed":
        return "completed";
      case "failed":
      case "refunded":
        return status as PaymentResponse["status"];
      case "expired":
        return "cancelled";
      default:
        return "pending";
    }
  }

  private handleError(err: unknown): never {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.message ?? err.message;
      if (!err.response) throw new NetworkError(`NOWPayments network error: ${err.message}`);
      throw new ProviderError(`NOWPayments error: ${msg}`, "nowpayments");
    }
    throw new ProviderError(`NOWPayments unknown error: ${String(err)}`, "nowpayments");
  }
}

// Self-register
PaymentGateway.registerProvider("nowpayments", NOWPaymentsProvider as never);
