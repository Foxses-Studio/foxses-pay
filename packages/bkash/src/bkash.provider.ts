import axios, { AxiosInstance } from "axios";
import {
  BaseProvider,
  PaymentGateway,
  AuthenticationError,
  NetworkError,
  ProviderError,
  ValidationError,
} from "@foxses/pay-core";
import type {
  PaymentConfig,
  CreatePaymentParams,
  VerifyPaymentParams,
  PaymentResponse,
  RefundParams,
  RefundResponse,
  PaymentStatus,
} from "@foxses/pay-core";
import type {
  BkashConfig,
  BkashTokenResponse,
  BkashCreatePaymentResponse,
  BkashExecutePaymentResponse,
  BkashQueryPaymentResponse,
  BkashRefundResponse,
} from "./types.js";

const SANDBOX_BASE = "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout";
const PRODUCTION_BASE = "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout";

function mapStatus(bkashStatus: string): PaymentStatus {
  switch (bkashStatus) {
    case "Completed": return "completed";
    case "Initiated":
    case "Authorized": return "pending";
    case "Failed": return "failed";
    case "Cancelled": return "cancelled";
    default: return "pending";
  }
}

export class BkashProvider extends BaseProvider {
  readonly name = "bkash" as const;

  private bkashConfig: BkashConfig;
  private http: AxiosInstance;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: PaymentConfig & BkashConfig) {
    super(config);
    this.bkashConfig = {
      appKey: config.appKey!,
      appSecret: config.secretKey!,
      username: (config as BkashConfig).username,
      password: (config as BkashConfig).password,
      callbackUrl: config.callbackUrl!,
      sandbox: config.sandbox ?? true,
    };
    const baseURL = this.bkashConfig.sandbox ? SANDBOX_BASE : PRODUCTION_BASE;
    this.http = axios.create({ baseURL });
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt - 60_000) return this.token;

    try {
      const res = await this.http.post<BkashTokenResponse>("/token/grant", {
        app_key: this.bkashConfig.appKey,
        app_secret: this.bkashConfig.appSecret,
      }, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: this.bkashConfig.username,
          password: this.bkashConfig.password,
        },
      });

      if (res.data.statusCode !== "0000") {
        throw new AuthenticationError(`bKash token grant failed: ${res.data.statusMessage}`, "bkash");
      }

      this.token = res.data.id_token;
      this.tokenExpiresAt = now + res.data.expires_in * 1000;
      return this.token;
    } catch (err) {
      if (err instanceof AuthenticationError) throw err;
      throw new NetworkError(`bKash token request failed: ${(err as Error).message}`, "bkash");
    }
  }

  private authHeaders(token: string) {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: token,
      "x-app-key": this.bkashConfig.appKey,
    };
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    if (!params.amount || params.amount <= 0)
      throw new ValidationError("Amount must be greater than 0", "bkash");

    const token = await this.getToken();
    try {
      const res = await this.http.post<BkashCreatePaymentResponse>("/create", {
        mode: "0011",
        payerReference: params.customerPhone ?? params.orderId,
        callbackURL: this.bkashConfig.callbackUrl,
        amount: params.amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: params.orderId,
      }, { headers: this.authHeaders(token) });

      if (res.data.statusCode !== "0000")
        throw new ProviderError(`bKash create payment failed: ${res.data.statusMessage}`, "bkash");

      return {
        transactionId: res.data.paymentID,
        provider: "bkash",
        amount: params.amount,
        currency: "BDT",
        status: mapStatus(res.data.transactionStatus),
        checkoutUrl: res.data.bkashURL,
        raw: res.data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(`bKash create payment failed: ${(err as Error).message}`, "bkash");
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    if (!params.transactionId)
      throw new ValidationError("transactionId (paymentID) is required", "bkash");

    const token = await this.getToken();
    try {
      const res = await this.http.post<BkashExecutePaymentResponse>("/execute",
        { paymentID: params.transactionId },
        { headers: this.authHeaders(token) }
      );

      if (res.data.statusCode !== "0000")
        throw new ProviderError(`bKash execute failed: ${res.data.statusMessage}`, "bkash");

      return {
        transactionId: res.data.trxID ?? res.data.paymentID,
        provider: "bkash",
        amount: parseFloat(res.data.amount),
        currency: res.data.currency,
        status: mapStatus(res.data.transactionStatus),
        raw: res.data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(`bKash execute failed: ${(err as Error).message}`, "bkash");
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    const token = await this.getToken();
    try {
      const res = await this.http.post<BkashQueryPaymentResponse>("/payment/status",
        { paymentID: transactionId },
        { headers: this.authHeaders(token) }
      );

      if (res.data.statusCode !== "0000")
        throw new ProviderError(`bKash query failed: ${res.data.statusMessage}`, "bkash");

      return {
        transactionId: res.data.trxID ?? res.data.paymentID,
        provider: "bkash",
        amount: parseFloat(res.data.amount),
        currency: res.data.currency,
        status: mapStatus(res.data.transactionStatus),
        raw: res.data,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new NetworkError(`bKash query failed: ${(err as Error).message}`, "bkash");
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResponse> {
    if (!params.transactionId)
      throw new ValidationError("transactionId is required", "bkash");
    if (!params.amount || params.amount <= 0)
      throw new ValidationError("amount is required for bKash refund", "bkash");

    const token = await this.getToken();
    try {
      const res = await this.http.post<BkashRefundResponse>("/payment/refund", {
        paymentID: params.transactionId,
        trxID: params.transactionId,
        amount: params.amount.toFixed(2),
        currency: "BDT",
        reason: params.reason ?? "Refund",
      }, { headers: this.authHeaders(token) });

      if (res.data.statusCode !== "0000")
        throw new ProviderError(`bKash refund failed: ${res.data.statusMessage}`, "bkash");

      return {
        refundId: res.data.refundTrxID,
        transactionId: res.data.originalTrxID,
        amount: parseFloat(res.data.amount),
        status: mapStatus(res.data.transactionStatus),
        raw: res.data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(`bKash refund failed: ${(err as Error).message}`, "bkash");
    }
  }
}

PaymentGateway.registerProvider("bkash", BkashProvider as never);
