import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";
import { BaseProvider } from "../base.provider.js";
import { PaymentGateway } from "../../core/gateway.js";
import {
  NetworkError,
  ProviderError,
  ValidationError,
} from "../../errors/index.js";
import type {
  PaymentConfig,
  CreatePaymentParams,
  VerifyPaymentParams,
  PaymentResponse,
  PaymentStatus,
} from "../../types/index.js";
import type {
  NagadConfig,
  NagadInitSensitiveData,
  NagadInitPayload,
  NagadInitResponse,
  NagadDecryptedInitResponse,
  NagadCompleteSensitiveData,
  NagadCompletePayload,
  NagadCompleteResponse,
  NagadVerifyResponse,
} from "./types.js";

const SANDBOX_BASE = "http://sandbox.mynagad.com:10080";
const PRODUCTION_BASE = "https://api.mynagad.com";
const DEFAULT_API_VERSION = "v-0.2.0";

function mapStatus(nagadStatus: string): PaymentStatus {
  switch (nagadStatus?.toUpperCase()) {
    case "Success":
    case "SUCCESS":
      return "completed";
    case "PENDING":
      return "pending";
    case "ABORTED":
    case "CANCELLED":
      return "cancelled";
    case "FAIL":
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

export class NagadProvider extends BaseProvider {
  readonly name = "nagad" as const;

  private nagadConfig: NagadConfig;
  private baseUrl: string;
  private http: AxiosInstance;
  private privateKey: string;
  private nagadPublicKey: string;

  constructor(config: PaymentConfig & NagadConfig) {
    super(config);

    this.nagadConfig = {
      merchantId: config.merchantId,
      merchantNumber: config.merchantNumber,
      privateKey: config.privateKey,
      nagadPublicKey: config.nagadPublicKey,
      callbackUrl: config.callbackUrl,
      apiVersion: config.apiVersion ?? DEFAULT_API_VERSION,
      sandbox: config.sandbox ?? true,
    };

    this.baseUrl = this.nagadConfig.sandbox ? SANDBOX_BASE : PRODUCTION_BASE;
    this.privateKey = this.formatKey(config.privateKey, "PRIVATE");
    this.nagadPublicKey = this.formatKey(config.nagadPublicKey, "PUBLIC");

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-KM-Api-Version": this.nagadConfig.apiVersion,
      },
    });
  }

  private formatKey(key: string, type: "PRIVATE" | "PUBLIC"): string {
    if (/begin/i.test(key)) return key.trim();
    return `-----BEGIN ${type} KEY-----\n${key.trim()}\n-----END ${type} KEY-----`;
  }

  private encrypt(data: object): string {
    const encrypted = crypto.publicEncrypt(
      { key: this.nagadPublicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(JSON.stringify(data))
    );
    return encrypted.toString("base64");
  }

  private decrypt(data: string): NagadDecryptedInitResponse {
    const decrypted = crypto.privateDecrypt(
      { key: this.privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(data, "base64")
    );
    return JSON.parse(decrypted.toString()) as NagadDecryptedInitResponse;
  }

  private sign(data: object): string {
    const signer = crypto.createSign("SHA256");
    signer.update(JSON.stringify(data));
    signer.end();
    return signer.sign(this.privateKey, "base64");
  }

  private getTimestamp(): string {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" })
      .replace(/[-: ]/g, "")
      .slice(0, 14);
  }

  private createChallenge(orderId: string): string {
    return crypto.createHash("sha1").update(orderId).digest("hex").toUpperCase();
  }

  private async initialize(
    orderId: string,
    ip: string
  ): Promise<NagadDecryptedInitResponse> {
    const timestamp = this.getTimestamp();
    const sensitive: NagadInitSensitiveData = {
      merchantId: this.nagadConfig.merchantId,
      datetime: timestamp,
      orderId,
      challenge: this.createChallenge(orderId),
    };

    const payload: NagadInitPayload = {
      accountNumber: this.nagadConfig.merchantNumber,
      dateTime: timestamp,
      sensitiveData: this.encrypt(sensitive),
      signature: this.sign(sensitive),
    };

    const endpoint = `/api/dfs/check-out/initialize/${this.nagadConfig.merchantId}/${orderId}`;

    try {
      const res = await this.http.post<NagadInitResponse>(endpoint, payload, {
        headers: {
          "X-KM-IP-V4": ip,
          "X-KM-Client-Type": "PC_WEB",
        },
      });

      if (res.data.reason) {
        throw new ProviderError(
          `Nagad initialize failed: ${res.data.devMessage ?? res.data.reason}`,
          "nagad"
        );
      }

      return this.decrypt(res.data.sensitiveData);
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new NetworkError(
        `Nagad initialize request failed: ${(err as Error).message}`,
        "nagad"
      );
    }
  }

  private async complete(
    paymentReferenceId: string,
    challenge: string,
    orderId: string,
    amount: string,
    ip: string,
    productDetails?: Record<string, unknown>
  ): Promise<string> {
    const sensitive: NagadCompleteSensitiveData = {
      merchantId: this.nagadConfig.merchantId,
      orderId,
      amount,
      currencyCode: "050",
      challenge,
    };

    const payload: NagadCompletePayload = {
      paymentRefId: paymentReferenceId,
      sensitiveData: this.encrypt(sensitive),
      signature: this.sign(sensitive),
      merchantCallbackURL: this.nagadConfig.callbackUrl,
      additionalMerchantInfo: productDetails,
    };

    const endpoint = `/api/dfs/check-out/complete/${paymentReferenceId}`;

    try {
      const res = await this.http.post<NagadCompleteResponse>(endpoint, payload, {
        headers: {
          "X-KM-IP-V4": ip,
          "X-KM-Client-Type": "PC_WEB",
        },
      });

      if (res.data.reason) {
        throw new ProviderError(
          `Nagad complete failed: ${res.data.devMessage ?? res.data.reason}`,
          "nagad"
        );
      }

      return res.data.callBackUrl;
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new NetworkError(
        `Nagad complete request failed: ${(err as Error).message}`,
        "nagad"
      );
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    if (!params.amount || params.amount <= 0) {
      throw new ValidationError("Amount must be greater than 0", "nagad");
    }

    const ip =
      (params.metadata?.["ip"] as string | undefined) ?? "103.100.200.100";
    const amount = params.amount.toFixed(2);

    const { paymentReferenceId, challenge } = await this.initialize(
      params.orderId,
      ip
    );

    const checkoutUrl = await this.complete(
      paymentReferenceId,
      challenge,
      params.orderId,
      amount,
      ip,
      params.metadata as Record<string, unknown> | undefined
    );

    return {
      transactionId: paymentReferenceId,
      provider: "nagad",
      amount: params.amount,
      currency: "BDT",
      status: "pending",
      checkoutUrl,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    if (!params.transactionId) {
      throw new ValidationError(
        "transactionId (paymentReferenceId) is required",
        "nagad"
      );
    }

    try {
      const res = await this.http.get<NagadVerifyResponse>(
        `/api/dfs/verify/payment/${params.transactionId}`
      );

      const data = res.data;

      if (data.reason) {
        throw new ProviderError(
          `Nagad verify failed: ${data.devMessage ?? data.reason}`,
          "nagad"
        );
      }

      return {
        transactionId: data.issuerPaymentRefNo ?? data.paymentRefId,
        provider: "nagad",
        amount: parseFloat(data.amount),
        currency: "BDT",
        status: mapStatus(data.status),
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(
        `Nagad verify request failed: ${(err as Error).message}`,
        "nagad"
      );
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    return this.verifyPayment({ transactionId });
  }
}

// Self-register
PaymentGateway.registerProvider("nagad", NagadProvider as never);
