export declare class PaymentError extends Error {
    readonly code: string;
    readonly provider?: string | undefined;
    constructor(message: string, code: string, provider?: string | undefined);
}
export declare class AuthenticationError extends PaymentError {
    constructor(message: string, provider?: string);
}
export declare class ValidationError extends PaymentError {
    constructor(message: string, provider?: string);
}
export declare class NetworkError extends PaymentError {
    constructor(message: string, provider?: string);
}
export declare class ProviderError extends PaymentError {
    constructor(message: string, provider?: string);
}
//# sourceMappingURL=index.d.ts.map