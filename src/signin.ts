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

import { Addon } from './addons';
import {
  AccessToken,
  ApiResponse,
  AsyncApiResponse,
  ProgressResponse,
  StringMap,
  UserId,
  Username,
} from './common-types';
import { HEADER_X_ACROLINX_AUTH } from './headers';

export type PollMoreResult = ProgressResponse;

export type SigninPollResult = AsyncApiResponse<SigninSuccessData>;

export interface SsoSigninOption {
  username: string;
  genericToken: string;
}

interface AccessTokenSigninOption {
  accessToken?: string;
}

export type SigninOptions = AccessTokenSigninOption | SsoSigninOption;

export function isSigninLinksResult(signinResult: SigninResult): signinResult is SigninLinksResult {
  return !!(signinResult as SigninLinksResult).links.interactive;
}

export function isSigninSuccessResult(
  signinResult: SigninResult | SigninPollResult,
): signinResult is SigninSuccessResult {
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

export interface SignInInteractiveOptions {
  onSignInUrl: (url: string) => void;
  accessToken?: string;
  timeoutMs?: number;
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
  ACROLINX_TOKEN = 'ACROLINX_TOKEN',
}

export type SigninSuccessResult = ApiResponse<SigninSuccessData>;

export interface SigninSuccessData {
  accessToken: AccessToken;
  user: {
    id: UserId;
    username: Username;
  };
  integration: {
    properties: StringMap;
    addons: Addon[];
  };
  authorizedUsing: AuthorizationType;
  links: {};
}

export function getSigninRequestHeaders(options: SigninOptions = {}): StringMap {
  if ('accessToken' in options && options.accessToken) {
    return { [HEADER_X_ACROLINX_AUTH]: options.accessToken };
  } else if (isSsoSigninOption(options)) {
    let username = options.username;
    let password = options.genericToken;
    if (!isUrlEncoded(username)) {
      username = encodeURIComponent(username);
    }
    if (!isUrlEncoded(password)) {
      password = encodeURIComponent(password);
    }
    return {
      username,
      password,
    };
  } else {
    return {};
  }
}

export function isSsoSigninOption(signinOptions: SigninOptions): signinOptions is SsoSigninOption {
  const potentialSsoOptions = signinOptions as SsoSigninOption;
  return !!(potentialSsoOptions.genericToken && potentialSsoOptions.username);
}

function isUrlEncoded(str: string) {
  if (!str.includes('%')) return false;

  try {
    const decoded = decodeURIComponent(str);
    return str !== decoded;
  } catch {
    // If decoding fails, it might be partially encoded or malformed
    return false;
  }
}
