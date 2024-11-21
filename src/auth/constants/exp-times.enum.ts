export enum ExpirationTimes {
  ACCESS_TOKEN = '1h',
  REFRESH_TOKEN = '24h',
}

export const userVerificationTime = [1, 'hour'];
export const companyExpirationTimes = {
  oneDay: '24 hours',
  oneWeek: '7 days',
};

export const cookieExpTime = 1000 * 60 * 60 * 24; // 1 day
