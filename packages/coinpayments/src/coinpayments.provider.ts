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
  CoinPaymentsConfig,
  CoinPaymentsCreateTransactionResponse,
  CoinPaymentsTxInfoResponse,
} from "./types";

const API_URL = "https://www.coinpayments.net/api.php";

export class CoinPaymentsProvider extends BaseProvider {
  readonly name = "coinpayments" as const;
  private cpConfig: CoinPaymentsConfig;

  constructor(config: PaymentConfig) {
    super(config);
    if (!config.publicKey) throw new ValidationError("CoinPayments publicKey is required");
    if (!config.privateKey) throw new ValidationError("CoinPayments privateKey is required");
    if (!config.successUrl) throw new ValidationError("CoinPayments successUrl is required");
    if (!config.failureUrl) throw new ValidationError("CoinPayments failureUrl is required");

    this.cpConfig = {
      publicKey: config.publicKey as string,
      privateKey: config.privateKey as string,
      successUrl: config.successUrl as string,
      failureUrl: config.failureUrl as string,
      ipnUrl: config.ipnUrl as string | undefined,
      sandbox: config.sandbox ?? false,
    };
  }

  private sign(postData: string): string {
    return crypto
      .createHmac("sha512", this.cpConfig.privateKey)
      .update(postData)
      .digest("hex");
  }

  private async callApi<T>(params: Record<string, string | number>): Promise<T> {
    const body: Record<string, string | number> = {
      version: 1,
      key: this.cpConfig.publicKey,
      format: "json",
      ...params,
    };

    const postData = new URLSearchParams(
      Object.entries(body).map(([k, v]) => [k, String(v)])
    ).toString();

    const hmac = this.sign(postData);

    try {
      const { data } = await axios.post<T>(API_URL, postData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          HMAC: hmac,
        },
      });
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) throw new NetworkError(`CoinPayments network error: ${err.message}`);
        throw new ProviderError(`CoinPayments error: ${err.message}`, "coinpayments");
      }
      throw new ProviderError(`CoinPayments unknown error: ${String(err)}`, "coinpayments");
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const apiParams: Record<string, string | number> = {
      cmd: "create_transaction",
      amount: params.amount,
      currency1: params.currency.toUpperCase(),
      currency2: params.currency.toUpperCase(), // accept same currency by default
      buyer_email: params.customerEmail ?? "",
      item_name: `Order ${params.orderId}`,
      item_number: params.orderId,
      success_url: this.cpConfig.successUrl,
      cancel_url: this.cpConfig.failureUrl,
    };

    if (this.cpConfig.ipnUrl) {
      apiParams.ipn_url = this.cpConfig.ipnUrl;
    }

    const data = await this.callApi<CoinPaymentsCreateTransactionResponse>(apiParams);

    if (data.error !== "ok") {
      throw new ProviderError(`CoinPayments error: ${data.error}`, "coinpayments");
    }

    return {
      transactionId: data.result.txn_id,
      provider: "coinpayments",
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      checkoutUrl: data.result.checkout_url,
      raw: data.result,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    const data = await this.callApi<CoinPaymentsTxInfoResponse>({
      cmd: "get_tx_info",
      txid: params.transactionId,
    });

    if (data.error !== "ok") {
      throw new ProviderError(`CoinPayments error: ${data.error}`, "coinpayments");
    }

    const result = data.result;

    return {
      transactionId: params.transactionId,
      provider: "coinpayments",
      amount: result.amount / 1e8, // CoinPayments uses satoshi-like units
      currency: result.coin,
      status: this.mapStatus(result.status),
      raw: result,
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    return this.verifyPayment({ transactionId });
  }

  async refundPayment(_params: RefundParams): Promise<RefundResponse> {
    throw new ProviderError(
      "CoinPayments does not support programmatic refunds. Please refund manually from the CoinPayments dashboard.",
      "coinpayments"
    );
  }

  private mapStatus(status: number): PaymentResponse["status"] {
    if (status >= 100 || status === 2) return "completed";
    if (status < 0) return "failed";
    if (status === 0) return "pending";
    return "pending";
  }
}

// Self-register
PaymentGateway.registerProvider("coinpayments", CoinPaymentsProvider as never);
