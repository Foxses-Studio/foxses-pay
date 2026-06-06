import axios, { AxiosInstance } from "axios";
import { BaseProvider } from "../base.provider.js";
import { PaymentGateway } from "../../core/gateway.js";
import {
  AuthenticationError,
  NetworkError,
  ProviderError,
  ValidationError,
} from "../../errors/index.js";
import type {
  PaymentConfig,
  CreatePaymentParams,
  VerifyPaymentParams,
  PaymentResponse,
  RefundParams,
  RefundResponse,
  PaymentStatus,
} from "../../types/index.js";
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
    case "Completed":
      return "completed";
    case "Initiated":
    case "Authorized":
      return "pending";
    case "Failed":
      return "failed";
    case "Cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export class BkashProvider extends BaseProvider {
  readonly name = "bkash" as const;

  private bkashConfig: BkashConfig;
  private baseUrl: string;
  private http: AxiosInstance;

  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: PaymentConfig & BkashConfig) {
    super(config);
    this.bkashConfig = {
      appKey: config.appKey,
      appSecret: config.secretKey,
      username: (config as BkashConfig).username,
      password: (config as BkashConfig).password,
      callbackUrl: config.callbackUrl,
      sandbox: config.sandbox ?? true,
    };

    this.baseUrl = this.bkashConfig.sandbox ? SANDBOX_BASE : PRODUCTION_BASE;

    this.http = axios.create({ baseURL: this.baseUrl });
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt - 60_000) {
      return this.token;
    }

    try {
      const res = await this.http.post<BkashTokenResponse>(
        "/token/grant",
        {
          app_key: this.bkashConfig.appKey,
          app_secret: this.bkashConfig.appSecret,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: this.bkashConfig.username,
            password: this.bkashConfig.password,
          },
        }
      );

      const data = res.data;

      if (data.statusCode !== "0000") {
        throw new AuthenticationError(
          `bKash token grant failed: ${data.statusMessage}`,
          "bkash"
        );
      }

      this.token = data.id_token;
      this.tokenExpiresAt = now + data.expires_in * 1000;
      return this.token;
    } catch (err) {
      if (err instanceof AuthenticationError) throw err;
      throw new NetworkError(
        `bKash token request failed: ${(err as Error).message}`,
        "bkash"
      );
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
    if (!params.amount || params.amount <= 0) {
      throw new ValidationError("Amount must be greater than 0", "bkash");
    }

    const token = await this.getToken();

    try {
      const res = await this.http.post<BkashCreatePaymentResponse>(
        "/create",
        {
          mode: "0011",
          payerReference: params.customerPhone ?? params.orderId,
          callbackURL: this.bkashConfig.callbackUrl,
          amount: params.amount.toFixed(2),
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: params.orderId,
        },
        { headers: this.authHeaders(token) }
      );

      const data = res.data;

      if (data.statusCode !== "0000") {
        throw new ProviderError(
          `bKash create payment failed: ${data.statusMessage}`,
          "bkash"
        );
      }

      return {
        transactionId: data.paymentID,
        provider: "bkash",
        amount: params.amount,
        currency: "BDT",
        status: mapStatus(data.transactionStatus),
        checkoutUrl: data.bkashURL,
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(
        `bKash create payment request failed: ${(err as Error).message}`,
        "bkash"
      );
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    if (!params.transactionId) {
      throw new ValidationError("transactionId (paymentID) is required", "bkash");
    }

    const token = await this.getToken();

    try {
      const res = await this.http.post<BkashExecutePaymentResponse>(
        "/execute",
        { paymentID: params.transactionId },
        { headers: this.authHeaders(token) }
      );

      const data = res.data;

      if (data.statusCode !== "0000") {
        throw new ProviderError(
          `bKash execute payment failed: ${data.statusMessage}`,
          "bkash"
        );
      }

      return {
        transactionId: data.trxID ?? data.paymentID,
        provider: "bkash",
        amount: parseFloat(data.amount),
        currency: data.currency,
        status: mapStatus(data.transactionStatus),
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(
        `bKash execute payment request failed: ${(err as Error).message}`,
        "bkash"
      );
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    const token = await this.getToken();

    try {
      const res = await this.http.post<BkashQueryPaymentResponse>(
        "/payment/status",
        { paymentID: transactionId },
        { headers: this.authHeaders(token) }
      );

      const data = res.data;

      if (data.statusCode !== "0000") {
        throw new ProviderError(
          `bKash query payment failed: ${data.statusMessage}`,
          "bkash"
        );
      }

      return {
        transactionId: data.trxID ?? data.paymentID,
        provider: "bkash",
        amount: parseFloat(data.amount),
        currency: data.currency,
        status: mapStatus(data.transactionStatus),
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new NetworkError(
        `bKash query payment request failed: ${(err as Error).message}`,
        "bkash"
      );
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResponse> {
    if (!params.transactionId) {
      throw new ValidationError("transactionId (trxID) is required for refund", "bkash");
    }
    if (!params.amount || params.amount <= 0) {
      throw new ValidationError("amount is required for bKash refund", "bkash");
    }

    const token = await this.getToken();

    try {
      const res = await this.http.post<BkashRefundResponse>(
        "/payment/refund",
        {
          paymentID: params.transactionId,
          trxID: params.transactionId,
          amount: params.amount.toFixed(2),
          currency: "BDT",
          reason: params.reason ?? "Refund",
        },
        { headers: this.authHeaders(token) }
      );

      const data = res.data;

      if (data.statusCode !== "0000") {
        throw new ProviderError(
          `bKash refund failed: ${data.statusMessage}`,
          "bkash"
        );
      }

      return {
        refundId: data.refundTrxID,
        transactionId: data.originalTrxID,
        amount: parseFloat(data.amount),
        status: mapStatus(data.transactionStatus),
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(
        `bKash refund request failed: ${(err as Error).message}`,
        "bkash"
      );
    }
  }
}

// Self-register
PaymentGateway.registerProvider("bkash", BkashProvider as never);
