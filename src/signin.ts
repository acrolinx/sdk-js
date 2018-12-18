import {Addon} from './addons';
import {ApiResponse, AsyncApiResponse, AuthToken, ProgressResponse, StringMap, UserId, Username} from './common-types';

export type PollMoreResult = ProgressResponse;

export type SigninPollResult = AsyncApiResponse<SigninSuccessData>;

export function isSigninLinksResult(signinResult: SigninResult): signinResult is SigninLinksResult {
  return !!((signinResult as SigninLinksResult).links.interactive);
}

export function isSigninSuccessResult(signinResult: SigninSuccessResult
  | PollMoreResult | SigninLinksResult): signinResult is SigninSuccessResult {
  const asSigninSuccessResult = signinResult as SigninSuccessResult;
  return !!(asSigninSuccessResult && asSigninSuccessResult.data && asSigninSuccessResult.data.accessToken);
}

export interface SigninRequestBody {
  clientName: string;
}

export type SigninResult = SigninLinksResult | SigninSuccessResult;

export interface SigninLinksData {
  /**
   * Duration in seconds
   */
  interactiveLinkTimeout: number;
}

export interface SigninLinksResult extends ApiResponse<SigninLinksData> {
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
  accessToken: AuthToken;
  user: {
    id: UserId;
    username: Username;
  };
  integration: {
    properties: StringMap,
    addons: Addon[]
  };
  authorizedUsing: AuthorizationType;
  links: {};
}
