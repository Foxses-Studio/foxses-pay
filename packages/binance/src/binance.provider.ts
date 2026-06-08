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
  BinancePayConfig,
  BinancePayCreateOrderResult,
  BinancePayQueryResult,
  BinancePayApiResponse,
} from "./types";

const API_URL = "https://bpay.binanceapi.com";

export class BinancePayProvider extends BaseProvider {
  readonly name = "binance" as const;
  private bpConfig: BinancePayConfig;

  constructor(config: PaymentConfig) {
    super(config);
    if (!config.apiKey) throw new ValidationError("Binance Pay apiKey is required");
    if (!config.secretKey) throw new ValidationError("Binance Pay secretKey is required");
    if (!config.successUrl) throw new ValidationError("Binance Pay successUrl is required");
    if (!config.failureUrl) throw new ValidationError("Binance Pay failureUrl is required");

    this.bpConfig = {
      apiKey: config.apiKey as string,
      secretKey: config.secretKey as string,
      successUrl: config.successUrl as string,
      failureUrl: config.failureUrl as string,
      sandbox: config.sandbox ?? false,
    };
  }

  private generateNonce(length = 32): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  // signature = HMAC-SHA512(timestamp + "\n" + nonce + "\n" + body + "\n").toUpperCase()
  private sign(timestamp: string, nonce: string, body: string): string {
    const payload = `${timestamp}\n${nonce}\n${body}\n`;
    return crypto
      .createHmac("sha512", this.bpConfig.secretKey)
      .update(payload)
      .digest("hex")
      .toUpperCase();
  }

  private async post<T>(endpoint: string, body: object): Promise<T> {
    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    const bodyStr = JSON.stringify(body);
    const signature = this.sign(timestamp, nonce, bodyStr);

    try {
      const { data } = await axios.post<BinancePayApiResponse<T>>(
        `${API_URL}${endpoint}`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
            "BinancePay-Timestamp": timestamp,
            "BinancePay-Nonce": nonce,
            "BinancePay-Certificate-SN": this.bpConfig.apiKey,
            "BinancePay-Signature": signature,
          },
        }
      );

      if (data.status !== "SUCCESS" || data.code !== "000000") {
        throw new ProviderError(
          `Binance Pay error [${data.code}]: ${data.errorMessage ?? "Unknown error"}`,
          "binance"
        );
      }

      return data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) throw new NetworkError(`Binance Pay network error: ${err.message}`);
        const msg = err.response?.data?.errorMessage ?? err.message;
        throw new ProviderError(`Binance Pay error: ${msg}`, "binance");
      }
      if (err instanceof ProviderError || err instanceof NetworkError) throw err;
      throw new ProviderError(`Binance Pay unknown error: ${String(err)}`, "binance");
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    // merchantTradeNo: max 32 chars, alphanumeric only
    const merchantTradeNo = params.orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);

    const body = {
      env: { terminalType: "WEB" },
      merchantTradeNo,
      orderAmount: params.amount,
      currency: params.currency.toUpperCase(),
      goods: {
        goodsType: "02",           // virtual goods
        goodsCategory: "Z000",     // others
        referenceGoodsId: merchantTradeNo,
        goodsName: `Order ${params.orderId}`.slice(0, 256),
      },
      returnUrl: this.bpConfig.successUrl,
      cancelUrl: this.bpConfig.failureUrl,
    };

    const result = await this.post<BinancePayCreateOrderResult>(
      "/binancepay/openapi/v2/order",
      body
    );

    return {
      transactionId: result.prepayId,
      provider: "binance",
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      checkoutUrl: result.checkoutUrl,
      raw: result,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    const body = { prepayId: params.transactionId };

    const result = await this.post<BinancePayQueryResult>(
      "/binancepay/openapi/order/query",
      body
    );

    return {
      transactionId: result.prepayId,
      provider: "binance",
      amount: parseFloat(result.orderAmount),
      currency: result.currency,
      status: this.mapStatus(result.status),
      raw: result,
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    return this.verifyPayment({ transactionId });
  }

  async refundPayment(_params: RefundParams): Promise<RefundResponse> {
    throw new ProviderError(
      "Binance Pay refund is not supported via API. Please refund manually from the Binance merchant dashboard.",
      "binance"
    );
  }

  private mapStatus(status: BinancePayQueryResult["status"]): PaymentResponse["status"] {
    switch (status) {
      case "PAID":
        return "completed";
      case "CANCELED":
      case "EXPIRED":
        return "cancelled";
      case "ERROR":
        return "failed";
      case "REFUNDING":
      case "REFUNDED":
        return "refunded";
      default:
        return "pending";
    }
  }
}

// Self-register
PaymentGateway.registerProvider("binance", BinancePayProvider as never);
