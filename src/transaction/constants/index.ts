export interface IResponseMessage {
  message: string;
}

type TTransactionMsgKeys = 'notFound' | 'statusChanged';

export const transactionMessages: Record<TTransactionMsgKeys, string> = {
  notFound: 'Transaction is not found',
  statusChanged: 'Transaction status changed',
};

export enum PaymentStatusEnum {
  SUCCEED = 'succeed',
}

export enum CurrencyEnum {
  USD = 'usd',
}

export enum TransactionTypeEnum {
  BOIR_PAYMENT = 'BOIR Payment',
}
