export enum SendGridEventTypeEnum {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  BOUNCE = 'bounce',
  DROPPED = 'dropped',
  OPEN = 'open',
  CLICK = 'click',
  UNKNOWN = 'unknown',
}

export enum MessageTypeEnum {
  FILLING = 'filling',
  CHANGE = 'BOIRChange',
  WARNING = 'expirationWarning',
  EXPIRED = 'expiredCompanies',
  OTP = 'oneTimePass',
}
