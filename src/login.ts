export interface PollMoreResult {
  _type: 'PollMoreResult';
}

export const POLL_MORE_RESULT: PollMoreResult = {
  _type: 'PollMoreResult'
};

export type SigninPollResult = SigninSuccessResult | PollMoreResult;

export function isSigninLinksResult(signinResult: LoginResult): signinResult is SigninLinksResult {
  return !!((signinResult as SigninLinksResult).links.interactive);
}

export function isSigninSuccessResult(signinResult: SigninSuccessResult
  | PollMoreResult
  | undefined): signinResult is SigninSuccessResult {
  return !!(signinResult && (signinResult as SigninSuccessResult).authToken);
}

export interface LoginRequestBody {
  authToken?: string;
  clientName: string;
}

export type LoginResult = SigninLinksResult | SigninSuccessResult;

export interface SigninLinksResult {
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
