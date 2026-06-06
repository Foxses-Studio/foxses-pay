/* eslint-disable @typescript-eslint/no-require-imports */
const StripeLib = require("stripe");
type StripeInstance = InstanceType<typeof StripeLib>;

import { BaseProvider } from "@foxses/pay-core";
import { PaymentGateway } from "@foxses/pay-core";
import {
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
import type { StripeConfig } from "./types.js";

type StripeSession = {
  id: string;
  status: "open" | "complete" | "expired" | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  payment_intent: string | StripePaymentIntent | null;
  amount_total: number | null;
  currency: string | null;
  url: string | null;
};

type StripePaymentIntent = {
  id: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded";
  amount: number;
  currency: string;
};

type StripeRefund = {
  id: string;
  amount: number;
  status: string;
};

function mapSessionStatus(session: StripeSession): PaymentStatus {
  switch (session.status) {
    case "complete":
      return session.payment_status === "paid" ? "completed" : "pending";
    case "expired":
      return "cancelled";
    default:
      return "pending";
  }
}

function mapIntentStatus(status: StripePaymentIntent["status"]): PaymentStatus {
  switch (status) {
    case "succeeded":
      return "completed";
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
}

export class StripeProvider extends BaseProvider {
  readonly name = "stripe" as const;

  private client: StripeInstance;
  private stripeConfig: StripeConfig;

  constructor(config: PaymentConfig & StripeConfig) {
    super(config);

    this.stripeConfig = {
      apiKey: config.apiKey,
      webhookSecret: config.webhookSecret,
      successUrl: config.successUrl,
      failureUrl: config.failureUrl,
      callbackUrl: config.callbackUrl,
      sandbox: config.sandbox ?? true,
    };

    this.client = new StripeLib(config.apiKey);
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    if (!params.amount || params.amount <= 0) {
      throw new ValidationError("Amount must be greater than 0", "stripe");
    }

    const unitAmount = Math.round(params.amount * 100);

    try {
      const session: StripeSession =
        await this.client.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: params.currency.toLowerCase(),
                unit_amount: unitAmount,
                product_data: {
                  name:
                    (params.metadata?.["productName"] as string) ?? "Order",
                  description:
                    (params.metadata?.["productDescription"] as string) ??
                    undefined,
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${this.stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: this.stripeConfig.failureUrl,
          client_reference_id: params.orderId,
          customer_email: params.customerEmail ?? undefined,
          metadata: {
            orderId: params.orderId,
            ...(params.metadata as Record<string, string> | undefined),
          },
        });

      return {
        transactionId: session.id,
        provider: "stripe",
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        status: mapSessionStatus(session),
        checkoutUrl: session.url ?? undefined,
        raw: session,
      };
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentResponse> {
    if (!params.transactionId) {
      throw new ValidationError(
        "transactionId (checkout session ID) is required",
        "stripe"
      );
    }

    try {
      const session: StripeSession =
        await this.client.checkout.sessions.retrieve(params.transactionId, {
          expand: ["payment_intent"],
        });

      const amount = (session.amount_total ?? 0) / 100;

      if (params.amount && amount !== params.amount) {
        throw new ProviderError(
          "Stripe amount mismatch — possible tampered response",
          "stripe"
        );
      }

      const intent =
        typeof session.payment_intent === "object"
          ? (session.payment_intent as StripePaymentIntent)
          : null;

      return {
        transactionId: intent?.id ?? session.id,
        provider: "stripe",
        amount,
        currency: session.currency?.toUpperCase() ?? "",
        status: mapSessionStatus(session),
        raw: session,
      };
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      if (transactionId.startsWith("pi_")) {
        const intent: StripePaymentIntent =
          await this.client.paymentIntents.retrieve(transactionId);
        return {
          transactionId: intent.id,
          provider: "stripe",
          amount: intent.amount / 100,
          currency: intent.currency.toUpperCase(),
          status: mapIntentStatus(intent.status),
          raw: intent,
        };
      }

      const session: StripeSession =
        await this.client.checkout.sessions.retrieve(transactionId, {
          expand: ["payment_intent"],
        });

      const intent =
        typeof session.payment_intent === "object"
          ? (session.payment_intent as StripePaymentIntent)
          : null;

      return {
        transactionId: intent?.id ?? session.id,
        provider: "stripe",
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency?.toUpperCase() ?? "",
        status: mapSessionStatus(session),
        raw: session,
      };
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResponse> {
    if (!params.transactionId) {
      throw new ValidationError(
        "transactionId (payment intent ID pi_xxx) is required for refund",
        "stripe"
      );
    }

    try {
      const refundParams: Record<string, unknown> = {
        payment_intent: params.transactionId,
        reason: params.reason ?? "requested_by_customer",
      };

      if (params.amount) {
        refundParams["amount"] = Math.round(params.amount * 100);
      }

      const refund: StripeRefund =
        await this.client.refunds.create(refundParams);

      return {
        refundId: refund.id,
        transactionId: params.transactionId,
        amount: (refund.amount ?? 0) / 100,
        status: refund.status === "succeeded" ? "refunded" : "pending",
        raw: refund,
      };
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  /**
   * Verify a Stripe webhook signature.
   * Call this in your webhook handler before processing events.
   */
  verifyWebhook(payload: string | Buffer, signature: string): unknown {
    if (!this.stripeConfig.webhookSecret) {
      throw new ValidationError(
        "webhookSecret is required to verify Stripe webhooks",
        "stripe"
      );
    }
    try {
      return this.client.webhooks.constructEvent(
        payload,
        signature,
        this.stripeConfig.webhookSecret
      );
    } catch (err) {
      throw new ProviderError(
        `Stripe webhook signature invalid: ${(err as Error).message}`,
        "stripe"
      );
    }
  }

  private wrapError(err: unknown): Error {
    if (err instanceof ProviderError || err instanceof ValidationError) {
      return err;
    }

    const stripeErr = err as { type?: string; message?: string };

    switch (stripeErr?.type) {
      case "StripeAuthenticationError":
        return new AuthenticationError(
          `Stripe authentication failed: ${stripeErr.message}`,
          "stripe"
        );
      case "StripeInvalidRequestError":
        return new ValidationError(
          `Stripe invalid request: ${stripeErr.message}`,
          "stripe"
        );
      case "StripeConnectionError":
      case "StripeAPIError":
        return new NetworkError(
          `Stripe network error: ${stripeErr.message}`,
          "stripe"
        );
      default:
        return new ProviderError(
          `Stripe error: ${(err as Error).message}`,
          "stripe"
        );
    }
  }
}

// Self-register
PaymentGateway.registerProvider("stripe", StripeProvider as never);
