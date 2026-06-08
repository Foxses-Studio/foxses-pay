import * as crypto from "crypto";
import {
  BaseProvider,
  PaymentGateway,
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
import type { PayeerConfig, PayeerFormParams } from "./types";

const PAYEER_GATEWAY = "https://payeer.com/merchant/";

export class PayeerProvider extends BaseProvider {
  readonly name = "payeer" as const;
  private peConfig: PayeerConfig;

  constructor(config: PaymentConfig) {
    super(config);
    if (!config.merchantId) throw new ValidationError("Payeer merchantId is required");
    if (!config.secretKey) throw new ValidationError("Payeer secretKey is required");
    if (!config.successUrl) throw new ValidationError("Payeer successUrl is required");
    if (!config.failureUrl) throw new ValidationError("Payeer failureUrl is required");

    this.peConfig = {
      merchantId: config.merchantId as string,
      secretKey: config.secretKey as string,
      successUrl: config.successUrl as string,
      failureUrl: config.failureUrl as string,
      statusUrl: config.statusUrl as string | undefined,
      sandbox: config.sandbox ?? false,
    };
  }

  // sign = SHA256( merchantId:orderId:amount:currency:base64(description):secretKey ).toUpperCase()
  private sign(orderId: string, amount: string, currency: string, description: string): string {
    const descBase64 = Buffer.from(description).toString("base64");
    const raw = [
      this.peConfig.merchantId,
      orderId,
      amount,
      currency,
      descBase64,
      this.peConfig.secretKey,
    ].join(":");

    return crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
  }

  // Payeer uses form-based redirect — build the checkout URL with params
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const amount = params.amount.toFixed(2);
    const currency = params.currency.toUpperCase();
    const description = `Order ${params.orderId}`;
    const orderId = params.orderId;

    const m_sign = this.sign(orderId, amount, currency, description);
    const descBase64 = Buffer.from(description).toString("base64");

    const formParams: PayeerFormParams = {
      m_shop: this.peConfig.merchantId,
      m_orderid: orderId,
      m_amount: amount,
      m_curr: currency,
      m_desc: descBase64,
      m_sign,
    };

    if (this.peConfig.statusUrl) formParams.m_status_url = this.peConfig.statusUrl;
    if (this.peConfig.successUrl) formParams.m_success_url = this.peConfig.successUrl;
    if (this.peConfig.failureUrl) formParams.m_fail_url = this.peConfig.failureUrl;

    // Build checkout URL
    const query = new URLSearchParams(
      Object.entries(formParams).map(([k, v]) => [k, String(v)])
    ).toString();

    const checkoutUrl = `${PAYEER_GATEWAY}?${query}`;

    return {
      transactionId: orderId,
      provider: "payeer",
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      checkoutUrl,
      raw: formParams,
    };
  }

  // Payeer sends IPN to statusUrl — verify the incoming IPN data
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    // params.transactionId should be the orderId
    // Actual verification happens via IPN — this returns pending by default
    // Pass raw IPN data via params to verify
    const raw = params as unknown as Record<string, unknown>;

    if (raw.m_operation_id && raw.m_sign) {
      const isValid = this.verifyIPN(raw as Record<string, string>);
      if (!isValid) {
        throw new ProviderError("Payeer IPN signature mismatch", "payeer");
      }

      const status = String(raw.m_status ?? "").toLowerCase();
      return {
        transactionId: String(raw.m_operation_id),
        provider: "payeer",
        amount: parseFloat(String(raw.m_amount ?? "0")),
        currency: String(raw.m_curr ?? ""),
        status: status === "success" ? "completed" : "failed",
        raw,
      };
    }

    // No IPN data — return pending
    return {
      transactionId: params.transactionId,
      provider: "payeer",
      amount: params.amount ?? 0,
      currency: "",
      status: "pending",
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    return this.verifyPayment({ transactionId });
  }

  async refundPayment(_params: RefundParams): Promise<RefundResponse> {
    throw new ProviderError(
      "Payeer does not support programmatic refunds. Please refund manually from the Payeer merchant dashboard.",
      "payeer"
    );
  }

  // Call this in your IPN handler to verify the callback
  verifyIPN(data: Record<string, string>): boolean {
    const { m_operation_id, m_operation_ps, m_operation_date, m_operation_pay_date,
      m_shop, m_orderid, m_amount, m_curr, m_desc, m_status, m_sign } = data;

    const descDecoded = Buffer.from(m_desc ?? "", "base64").toString("utf8");
    const descBase64 = Buffer.from(descDecoded).toString("base64");

    const raw = [
      m_operation_id, m_operation_ps, m_operation_date, m_operation_pay_date,
      m_shop, m_orderid, m_amount, m_curr, descBase64, m_status,
      this.peConfig.secretKey,
    ].join(":");

    const expected = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
    return expected === m_sign;
  }
}

// Self-register
PaymentGateway.registerProvider("payeer", PayeerProvider as never);
