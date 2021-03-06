/*
 * Copyright 2018-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Addon} from './addons';
import {
  AccessToken,
  ApiResponse,
  AsyncApiResponse,
  ProgressResponse,
  StringMap,
  UserId,
  Username
} from './common-types';

export type PollMoreResult = ProgressResponse;

export type SigninPollResult = AsyncApiResponse<SigninSuccessData>;

export function isSigninLinksResult(signinResult: SigninResult): signinResult is SigninLinksResult {
  return !!((signinResult as SigninLinksResult).links.interactive);
}

export function isSigninSuccessResult(
  signinResult: SigninResult | SigninPollResult): signinResult is SigninSuccessResult {
  const asSigninSuccessResult = signinResult as SigninSuccessResult;
  return !!(asSigninSuccessResult && asSigninSuccessResult.data && asSigninSuccessResult.data.accessToken);
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

export type SigninSuccessResult =  ApiResponse<SigninSuccessData>;

export interface SigninSuccessData {
  accessToken: AccessToken;
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
