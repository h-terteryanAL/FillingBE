export interface IResponseMessage {
  message: string;
}

export interface ILoginResponse {
  message: string;
  userId: string;
  accessToken: string;
}

type AuthResponseKeys =
  | 'successfulLogin'
  | 'otpWasSent'
  | 'wrongSentEmailOrPass'
  | 'userNotFound'
  | 'tokenRefreshed'
  | 'codeWasExpired'
  | 'accessDenied'
  | 'expiredRefreshToken'
  | 'tokenPayloadMissingFields'
  | 'successfulLogout'
  | 'tokenIsMissing'
  | 'accessTokenExpired';

export const authResponseMsgs: Record<AuthResponseKeys, string> = {
  successfulLogin: 'Sign-in successful.',
  otpWasSent: 'One-time password sent.',
  tokenRefreshed: 'Token successfully updated.',
  successfulLogout: 'Successfully signed out.',
  // errors
  wrongSentEmailOrPass: 'Email or password was not correct.',
  tokenIsMissing: 'No token provided.',
  userNotFound: 'User not found.',
  codeWasExpired: 'Current code has expired.',
  accessDenied: 'Access denied.',
  accessTokenExpired: 'Invalid or expired access token.',
  expiredRefreshToken: 'Invalid or expired refresh token.',
  tokenPayloadMissingFields: 'Token payload is missing required fields.',
};
