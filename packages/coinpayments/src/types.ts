export interface CoinPaymentsConfig {
  publicKey: string;
  privateKey: string;
  successUrl: string;
  failureUrl: string;
  ipnUrl?: string;
  sandbox?: boolean;
  [key: string]: unknown;
}

export interface CoinPaymentsCreateTransactionResponse {
  error: string;
  result: {
    amount: string;
    address: string;
    dest_tag?: string;
    txn_id: string;
    confirms_needed: string;
    timeout: number;
    checkout_url: string;
    status_url: string;
    qrcode_url: string;
  };
}

export interface CoinPaymentsTxInfoResponse {
  error: string;
  result: {
    time_created: number;
    time_expires: number;
    status: number;
    status_text: string;
    type: string;
    coin: string;
    amount: number;
    amountf: string;
    received: number;
    receivedf: string;
    recv_confirms: number;
    payment_address: string;
  };
}
