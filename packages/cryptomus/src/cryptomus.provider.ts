import axios from "axios";
import * as crypto from "crypto";
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
  CryptomusConfig,
  CryptomusInvoiceResult,
  CryptomusApiResponse,
} from "./types";

const API_URL = "https://api.cryptomus.com/v1";

export class CryptomusProvider extends BaseProvider {
  readonly name = "cryptomus" as const;
  private cmConfig: CryptomusConfig;

  constructor(config: PaymentConfig) {
    super(config);
    if (!config.merchantId) throw new ValidationError("Cryptomus merchantId is required");
    if (!config.apiKey) throw new ValidationError("Cryptomus apiKey is required");
    if (!config.successUrl) throw new ValidationError("Cryptomus successUrl is required");
    if (!config.failureUrl) throw new ValidationError("Cryptomus failureUrl is required");

    this.cmConfig = {
      merchantId: config.merchantId as string,
      apiKey: config.apiKey as string,
      successUrl: config.successUrl as string,
      failureUrl: config.failureUrl as string,
      sandbox: config.sandbox ?? false,
    };
  }

  // sign = md5(base64(jsonBody) + apiKey)
  private sign(body: object): string {
    const encoded = Buffer.from(JSON.stringify(body)).toString("base64");
    return crypto
      .createHash("md5")
      .update(encoded + this.cmConfig.apiKey)
      .digest("hex");
  }

  private get headers() {
    return {
      merchant: this.cmConfig.merchantId,
      "Content-Type": "application/json",
    };
  }

  private async post<T>(endpoint: string, body: object): Promise<T> {
    const sign = this.sign(body);
    try {
      const { data } = await axios.post<CryptomusApiResponse<T>>(
        `${API_URL}${endpoint}`,
        body,
        {
          headers: { ...this.headers, sign },
        }
      );

      if (data.state !== 0) {
        throw new ProviderError(`Cryptomus error: state ${data.state}`, "cryptomus");
      }

      return data.result;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? err.message;
        if (!err.response) throw new NetworkError(`Cryptomus network error: ${err.message}`);
        throw new ProviderError(`Cryptomus error: ${msg}`, "cryptomus");
      }
      if (err instanceof ProviderError || err instanceof NetworkError) throw err;
      throw new ProviderError(`Cryptomus unknown error: ${String(err)}`, "cryptomus");
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const body = {
      amount: params.amount.toString(),
      currency: params.currency.toUpperCase(),
      order_id: params.orderId,
      url_success: this.cmConfig.successUrl,
      url_return: this.cmConfig.failureUrl,
      url_callback: this.cmConfig.successUrl,
      is_payment_multiple: false,
      lifetime: 3600, // 1 hour
    };

    const result = await this.post<CryptomusInvoiceResult>("/payment", body);

    return {
      transactionId: result.uuid,
      provider: "cryptomus",
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      checkoutUrl: result.url,
      raw: result,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    const body = { uuid: params.transactionId };
    const result = await this.post<CryptomusInvoiceResult>("/payment/info", body);

    return {
      transactionId: result.uuid,
      provider: "cryptomus",
      amount: parseFloat(result.amount),
      currency: result.currency,
      status: this.mapStatus(result.payment_status),
      raw: result,
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    return this.verifyPayment({ transactionId });
  }

  async refundPayment(_params: RefundParams): Promise<RefundResponse> {
    throw new ProviderError(
      "Cryptomus does not support programmatic refunds. Please refund manually from the Cryptomus dashboard.",
      "cryptomus"
    );
  }

  private mapStatus(status: string): PaymentResponse["status"] {
    switch (status) {
      case "paid":
      case "paid_over":
        return "completed";
      case "cancel":
      case "system_fail":
      case "fail":
        return "failed";
      case "refund_process":
      case "refund_fail":
      case "refund_paid":
        return "refunded";
      case "wrong_amount":
      case "wrong_amount_waiting":
      case "check":
      case "confirm_check":
      case "waiting":
        return "pending";
      default:
        return "pending";
    }
  }
}

// Self-register
PaymentGateway.registerProvider("cryptomus", CryptomusProvider as never);
