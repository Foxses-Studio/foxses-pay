"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGateway = void 0;
const index_js_1 = require("../errors/index.js");
class PaymentGateway {
    constructor() {
        this.providers = new Map();
    }
    static registerProvider(name, ctor) {
        PaymentGateway.registry.set(name, ctor);
    }
    use(provider, config) {
        const Ctor = PaymentGateway.registry.get(provider);
        if (!Ctor) {
            throw new index_js_1.ValidationError(`Provider "${provider}" is not registered. Did you import it? e.g. import "@foxses/pay-${provider}"`);
        }
        this.providers.set(provider, new Ctor(config));
        return this;
    }
    getProvider(provider) {
        const p = this.providers.get(provider);
        if (!p) {
            throw new index_js_1.ValidationError(`Provider "${provider}" is not configured. Call gateway.use("${provider}", config) first.`);
        }
        return p;
    }
    createPayment(provider, params) {
        return this.getProvider(provider).createPayment(params);
    }
    verifyPayment(provider, params) {
        return this.getProvider(provider).verifyPayment(params);
    }
    getPaymentStatus(provider, transactionId) {
        return this.getProvider(provider).getPaymentStatus(transactionId);
    }
    refundPayment(provider, params) {
        return this.getProvider(provider).refundPayment(params);
    }
}
exports.PaymentGateway = PaymentGateway;
PaymentGateway.registry = new Map();
//# sourceMappingURL=payment.gateway.js.map