"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderError = exports.NetworkError = exports.ValidationError = exports.AuthenticationError = exports.PaymentError = void 0;
class PaymentError extends Error {
    constructor(message, code, provider) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.name = "PaymentError";
    }
}
exports.PaymentError = PaymentError;
class AuthenticationError extends PaymentError {
    constructor(message, provider) {
        super(message, "AUTHENTICATION_ERROR", provider);
        this.name = "AuthenticationError";
    }
}
exports.AuthenticationError = AuthenticationError;
class ValidationError extends PaymentError {
    constructor(message, provider) {
        super(message, "VALIDATION_ERROR", provider);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NetworkError extends PaymentError {
    constructor(message, provider) {
        super(message, "NETWORK_ERROR", provider);
        this.name = "NetworkError";
    }
}
exports.NetworkError = NetworkError;
class ProviderError extends PaymentError {
    constructor(message, provider) {
        super(message, "PROVIDER_ERROR", provider);
        this.name = "ProviderError";
    }
}
exports.ProviderError = ProviderError;
//# sourceMappingURL=index.js.map