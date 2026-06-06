"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
class BaseProvider {
    constructor(config) {
        this.config = config;
    }
    refundPayment(_params) {
        return Promise.reject(new Error(`Refund not supported by ${this.name} provider yet.`));
    }
}
exports.BaseProvider = BaseProvider;
//# sourceMappingURL=base.provider.js.map