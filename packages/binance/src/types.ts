export interface BinancePayConfig {
  apiKey: string;
  secretKey: string;
  successUrl: string;
  failureUrl: string;
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface BinancePayCreateOrderRequest {
  env: { terminalType: "WEB" | "WAP" | "APP" | "MINI_PROGRAM" | "OTHERS" };
  merchantTradeNo: string;
  orderAmount: number;
  currency: string;
  goods: {
    goodsType: "01" | "02";
    goodsCategory: string;
    referenceGoodsId: string;
    goodsName: string;
  };
  returnUrl?: string;
  cancelUrl?: string;
}

export interface BinancePayCreateOrderResult {
  prepayId: string;
  terminalType: string;
  expireTime: number;
  qrcodeLink: string;
  qrContent: string;
  checkoutUrl: string;
  deeplink: string;
  universalUrl: string;
}

export interface BinancePayQueryResult {
  merchantId: number;
  prepayId: string;
  merchantTradeNo: string;
  status: "INITIAL" | "PENDING" | "PAID" | "CANCELED" | "ERROR" | "REFUNDING" | "REFUNDED" | "EXPIRED";
  currency: string;
  orderAmount: string;
  openUserId: string;
  transactionId: string;
  payTime: number;
  createTime: number;
}

export interface BinancePayApiResponse<T> {
  status: "SUCCESS" | "FAIL";
  code: string;
  data: T;
  errorMessage?: string;
}
