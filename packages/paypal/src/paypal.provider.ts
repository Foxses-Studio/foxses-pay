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
  PayPalConfig,
  PayPalTokenResponse,
  PayPalOrderResponse,
} from "./types";

const SANDBOX_URL = "https://api-m.sandbox.paypal.com";
const PROD_URL = "https://api-m.paypal.com";

export class PayPalProvider extends BaseProvider {
  readonly name = "paypal" as const;
  private ppConfig: PayPalConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: PaymentConfig) {
    super(config);
    if (!config.clientId) throw new ValidationError("PayPal clientId is required");
    if (!config.clientSecret) throw new ValidationError("PayPal clientSecret is required");
    if (!config.successUrl) throw new ValidationError("PayPal successUrl is required");
    if (!config.failureUrl) throw new ValidationError("PayPal failureUrl is required");

    this.ppConfig = {
      clientId: config.clientId as string,
      clientSecret: config.clientSecret as string,
      successUrl: config.successUrl as string,
      failureUrl: config.failureUrl as string,
      sandbox: config.sandbox ?? true,
    };
  }

  private get baseUrl(): string {
    return this.ppConfig.sandbox ? SANDBOX_URL : PROD_URL;
  }

  private async getAccessToken(): Promise<string> {
    // Reuse token if still valid (with 60s buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.ppConfig.clientId}:${this.ppConfig.clientSecret}`
    ).toString("base64");

    try {
      const { data } = await axios.post<PayPalTokenResponse>(
        `${this.baseUrl}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
      return this.accessToken;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) throw new NetworkError(`PayPal network error: ${err.message}`);
        throw new ProviderError(`PayPal auth error: ${err.response.data?.error_description ?? err.message}`, "paypal");
      }
      throw new ProviderError(`PayPal unknown error: ${String(err)}`, "paypal");
    }
  }

  private async request<T>(method: "get" | "post", endpoint: string, body?: object): Promise<T> {
    const token = await this.getAccessToken();

    try {
      const { data } = await axios.request<T>({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data: body,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? err.message;
        if (!err.response) throw new NetworkError(`PayPal network error: ${err.message}`);
        throw new ProviderError(`PayPal error: ${msg}`, "paypal");
      }
      throw new ProviderError(`PayPal unknown error: ${String(err)}`, "paypal");
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderId,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
          description: `Order ${params.orderId}`,
        },
      ],
      application_context: {
        return_url: this.ppConfig.successUrl,
        cancel_url: this.ppConfig.failureUrl,
        user_action: "PAY_NOW",
      },
    };

    const order = await this.request<PayPalOrderResponse>("post", "/v2/checkout/orders", body);

    // Find the approval URL from HATEOAS links
    const approveLink = order.links?.find((l) => l.rel === "approve");
    const checkoutUrl = approveLink?.href ?? "";

    return {
      transactionId: order.id,
      provider: "paypal",
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      checkoutUrl,
      raw: order,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    // First capture the order (idempotent — safe to call even if already captured)
    try {
      await this.request("post", `/v2/checkout/orders/${params.transactionId}/capture`, {});
    } catch {
      // Ignore capture errors — may already be captured, check status below
    }

    const order = await this.request<PayPalOrderResponse>(
      "get",
      `/v2/checkout/orders/${params.transactionId}`
    );

    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = capture?.id ?? order.id;

    return {
      transactionId: captureId,
      provider: "paypal",
      amount: parseFloat(order.purchase_units?.[0]?.amount?.value ?? "0"),
      currency: order.purchase_units?.[0]?.amount?.currency_code ?? params.transactionId,
      status: this.mapStatus(order.status),
      raw: order,
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    const order = await this.request<PayPalOrderResponse>(
      "get",
      `/v2/checkout/orders/${transactionId}`
    );

    return {
      transactionId: order.id,
      provider: "paypal",
      amount: parseFloat(order.purchase_units?.[0]?.amount?.value ?? "0"),
      currency: order.purchase_units?.[0]?.amount?.currency_code ?? "",
      status: this.mapStatus(order.status),
      raw: order,
    };
  }

  async refundPayment(params: RefundParams): Promise<RefundResponse> {
    const body: Record<string, unknown> = {};
    if (params.amount) {
      // Need currency — fetch from capture first
      body.amount = { value: params.amount.toFixed(2), currency_code: "USD" };
    }
    if (params.reason) {
      body.note_to_payer = params.reason.slice(0, 255);
    }

    const refund = await this.request<{ id: string; status: string }>(
      "post",
      `/v2/payments/captures/${params.transactionId}/refund`,
      body
    );

    return {
      refundId: refund.id,
      transactionId: params.transactionId,
      amount: params.amount ?? 0,
      status: "refunded",
      raw: refund,
    };
  }

  private mapStatus(status: PayPalOrderResponse["status"]): PaymentResponse["status"] {
    switch (status) {
      case "COMPLETED":
        return "completed";
      case "APPROVED":
        return "pending";
      case "VOIDED":
        return "cancelled";
      default:
        return "pending";
    }
  }
}

// Self-register
PaymentGateway.registerProvider("paypal", PayPalProvider as never);
