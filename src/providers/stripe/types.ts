export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
  successUrl: string;
  failureUrl: string;
  callbackUrl?: string;
  sandbox?: boolean;
}
