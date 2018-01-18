export interface PollMoreResult {
  _type: 'PollMoreResult';
  retryAfterSeconds: number;
}

export type SigninPollResult = SigninSuccessResult | PollMoreResult;

export function isSigninLinksResult(signinResult: SigninResult): signinResult is SigninLinksResult {
  return !!((signinResult as SigninLinksResult).links.interactive);
}

export function isSigninSuccessResult(signinResult: SigninSuccessResult
  | PollMoreResult
  | undefined): signinResult is SigninSuccessResult {
  return !!(signinResult && (signinResult as SigninSuccessResult).authToken);
}

export interface SigninRequestBody {
  clientName: string;
}

export type SigninResult = SigninLinksResult | SigninSuccessResult;

export interface SigninLinksResult {
  interactiveLinkTimeout: number;
  links: {
    interactive: string;
    poll: string;
  };
}

export enum AuthorizationType {
  ACROLINX_SSO = 'ACROLINX_SSO',
  ACROLINX_SIGN_IN = 'ACROLINX_SIGN_IN',
  ACROLINX_TOKEN = 'ACROLINX_TOKEN'
}

export interface SigninSuccessResult {
  authToken: string;
  userId: string;
  privileges: string[];
  authorizedUsing: AuthorizationType;
  links: {};
}
