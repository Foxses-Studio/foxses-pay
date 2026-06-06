import axios, { AxiosInstance } from "axios";
import { BaseProvider } from "@foxses/pay-core";
import { PaymentGateway } from "@foxses/pay-core";
import {
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
  SSLCommerzConfig,
  SSLCommerzInitRequest,
  SSLCommerzInitResponse,
  SSLCommerzValidateResponse,
  SSLCommerzRefundResponse,
  SSLCommerzRefundStatusResponse,
} from "./types.js";

const SANDBOX_BASE = "https://sandbox.sslcommerz.com";
const PRODUCTION_BASE = "https://securepay.sslcommerz.com";

function mapStatus(sslStatus: string): PaymentStatus {
  switch (sslStatus) {
    case "VALID":
    case "VALIDATED":
      return "completed";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

export class SSLCommerzProvider extends BaseProvider {
  readonly name = "sslcommerz" as const;

  private sslConfig: SSLCommerzConfig;
  private http: AxiosInstance;

  constructor(config: PaymentConfig & SSLCommerzConfig) {
    super(config);

    this.sslConfig = {
      storeId: config.storeId,
      storePassword: config.storePassword ?? config.secretKey,
      successUrl: config.successUrl,
      failureUrl: config.failureUrl,
      cancelUrl: config.cancelUrl ?? config.failureUrl,
      ipnUrl: config.ipnUrl ?? config.callbackUrl,
      sandbox: config.sandbox ?? true,
    };

    const baseURL = this.sslConfig.sandbox ? SANDBOX_BASE : PRODUCTION_BASE;
    this.http = axios.create({ baseURL });
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    if (!params.amount || params.amount <= 0) {
      throw new ValidationError("Amount must be greater than 0", "sslcommerz");
    }
    if (!params.orderId) {
      throw new ValidationError("orderId is required", "sslcommerz");
    }

    const payload: SSLCommerzInitRequest = {
      store_id: this.sslConfig.storeId,
      store_passwd: this.sslConfig.storePassword,
      total_amount: params.amount.toFixed(2),
      currency: params.currency ?? "BDT",
      tran_id: params.orderId,
      product_name: (params.metadata?.["productName"] as string) ?? "Order",
      product_category: (params.metadata?.["productCategory"] as string) ?? "general",
      product_profile: (params.metadata?.["productProfile"] as string) ?? "general",
      success_url: this.sslConfig.successUrl,
      fail_url: this.sslConfig.failureUrl,
      cancel_url: this.sslConfig.cancelUrl,
      ipn_url: this.sslConfig.ipnUrl,
      cus_name: params.customerName ?? "Customer",
      cus_email: params.customerEmail ?? "customer@example.com",
      cus_phone: params.customerPhone ?? "01700000000",
      value_a: params.metadata?.["value_a"] as string | undefined,
      value_b: params.metadata?.["value_b"] as string | undefined,
      value_c: params.metadata?.["value_c"] as string | undefined,
      value_d: params.metadata?.["value_d"] as string | undefined,
    };

    try {
      const res = await this.http.post<SSLCommerzInitResponse>(
        "/gwprocess/v4/api.php",
        new URLSearchParams(payload as unknown as Record<string, string>),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const data = res.data;

      if (data.status !== "SUCCESS") {
        throw new ProviderError(
          `SSLCommerz init failed: ${data.failedreason ?? data.desc ?? "Unknown error"}`,
          "sslcommerz"
        );
      }

      return {
        transactionId: data.sessionkey,
        provider: "sslcommerz",
        amount: params.amount,
        currency: params.currency ?? "BDT",
        status: "pending",
        checkoutUrl: data.GatewayPageURL,
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(
        `SSLCommerz init request failed: ${(err as Error).message}`,
        "sslcommerz"
      );
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    if (!params.transactionId) {
      throw new ValidationError("transactionId (val_id) is required", "sslcommerz");
    }

    try {
      const res = await this.http.get<SSLCommerzValidateResponse>(
        "/validator/api/validationserverAPI.php",
        {
          params: {
            val_id: params.transactionId,
            store_id: this.sslConfig.storeId,
            store_passwd: this.sslConfig.storePassword,
            format: "json",
          },
        }
      );

      const data = res.data;

      if (
        data.status !== "VALID" &&
        data.status !== "VALIDATED"
      ) {
        throw new ProviderError(
          `SSLCommerz validation failed: status=${data.status}`,
          "sslcommerz"
        );
      }

      if (params.amount && parseFloat(data.amount) !== params.amount) {
        throw new ProviderError(
          "SSLCommerz amount mismatch — possible tampered response",
          "sslcommerz"
        );
      }

      return {
        transactionId: data.bank_tran_id ?? data.val_id,
        provider: "sslcommerz",
        amount: parseFloat(data.amount),
        currency: data.currency,
        status: mapStatus(data.status),
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(
        `SSLCommerz validate request failed: ${(err as Error).message}`,
        "sslcommerz"
      );
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const res = await this.http.get<SSLCommerzValidateResponse>(
        "/validator/api/merchantTransIDvalidationAPI.php",
        {
          params: {
            tran_id: transactionId,
            store_id: this.sslConfig.storeId,
            store_passwd: this.sslConfig.storePassword,
            format: "json",
          },
        }
      );

      const data = res.data;

      return {
        transactionId: data.bank_tran_id ?? data.tran_id,
        provider: "sslcommerz",
        amount: parseFloat(data.amount),
        currency: data.currency,
        status: mapStatus(data.status),
        raw: data,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new NetworkError(
        `SSLCommerz status request failed: ${(err as Error).message}`,
        "sslcommerz"
      );
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResponse> {
    if (!params.transactionId) {
      throw new ValidationError(
        "transactionId (bank_tran_id) is required for refund",
        "sslcommerz"
      );
    }
    if (!params.amount || params.amount <= 0) {
      throw new ValidationError("amount is required for SSLCommerz refund", "sslcommerz");
    }

    const refundTransId = `REFUND-${Date.now()}`;

    try {
      const res = await this.http.get<SSLCommerzRefundResponse>(
        "/validator/api/merchantTransIDvalidationAPI.php",
        {
          params: {
            bank_tran_id: params.transactionId,
            store_id: this.sslConfig.storeId,
            store_passwd: this.sslConfig.storePassword,
            refund_amount: params.amount.toFixed(2),
            refund_remarks: params.reason ?? "Refund",
            refund_trans_id: refundTransId,
            format: "json",
          },
        }
      );

      const data = res.data;

      if (data.APIConnect !== "DONE") {
        throw new ProviderError(
          `SSLCommerz refund failed: ${data.errorReason ?? data.status}`,
          "sslcommerz"
        );
      }

      // Query refund status to confirm
      const statusRes = await this.http.get<SSLCommerzRefundStatusResponse>(
        "/validator/api/merchantTransIDvalidationAPI.php",
        {
          params: {
            refund_ref_id: data.refund_ref_id,
            store_id: this.sslConfig.storeId,
            store_passwd: this.sslConfig.storePassword,
            format: "json",
          },
        }
      );

      const statusData = statusRes.data;

      return {
        refundId: data.refund_ref_id,
        transactionId: params.transactionId,
        amount: params.amount,
        status: statusData.status === "refunded" ? "refunded" : "pending",
        raw: statusData,
      };
    } catch (err) {
      if (err instanceof ProviderError || err instanceof ValidationError) throw err;
      throw new NetworkError(
        `SSLCommerz refund request failed: ${(err as Error).message}`,
        "sslcommerz"
      );
    }
  }
}

// Self-register
PaymentGateway.registerProvider("sslcommerz", SSLCommerzProvider as never);
