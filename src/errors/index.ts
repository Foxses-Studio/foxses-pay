export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider?: string
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class AuthenticationError extends PaymentError {
  constructor(message: string, provider?: string) {
    super(message, "AUTHENTICATION_ERROR", provider);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string, provider?: string) {
    super(message, "VALIDATION_ERROR", provider);
    this.name = "ValidationError";
  }
}

export class NetworkError extends PaymentError {
  constructor(message: string, provider?: string) {
    super(message, "NETWORK_ERROR", provider);
    this.name = "NetworkError";
  }
}

export class ProviderError extends PaymentError {
  constructor(message: string, provider?: string) {
    super(message, "PROVIDER_ERROR", provider);
    this.name = "ProviderError";
  }
}
