import {ApiResponse, AsyncApiResponse, AuthToken, ProgressResponse} from './common-types';

export type PollMoreResult = ProgressResponse;

export type SigninPollResult = AsyncApiResponse<SigninSuccessData>;

export function isSigninLinksResult(signinResult: SigninResult): signinResult is SigninLinksResult {
  return !!((signinResult as SigninLinksResult).links.interactive);
}

export function isSigninSuccessResult(signinResult: SigninSuccessResult
  | PollMoreResult | SigninLinksResult
  | undefined): signinResult is SigninSuccessResult {
  const asSigninSuccessResult = signinResult as SigninSuccessResult;
  return !!(asSigninSuccessResult && asSigninSuccessResult.data && asSigninSuccessResult.data.authToken);
}

export interface SigninRequestBody {
  clientName: string;
}

export type SigninResult = SigninLinksResult | SigninSuccessResult;

export interface SigninLinksResult extends ApiResponse<{ interactiveLinkTimeout: number }> {
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

export interface SigninSuccessResult extends ApiResponse<SigninSuccessData> {
}

export interface SigninSuccessData {
  authToken: AuthToken;
  user: {
    id: string;
  };
  authorizedUsing: AuthorizationType;
  links: {};
}
