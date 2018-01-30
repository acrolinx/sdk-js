import {wrapUnknownError} from './errors';
import {
  HEADER_X_ACROLINX_AUTH, HEADER_X_ACROLINX_BASE_URL, HEADER_X_ACROLINX_CLIENT,
  HEADER_X_ACROLINX_CLIENT_LOCALE
} from './headers';

import {
  isSigninLinksResult,
  PollMoreResult,
  SigninLinksResult,
  SigninPollResult,
  SigninRequestBody,
  SigninResult,
  SigninSuccessResult
} from './signin';
import {handleExpectedJsonResponse} from './utils/fetch';
import * as logging from './utils/logging';
import {waitMs} from './utils/mixed-utils';

export {isSigninSuccessResult, AuthorizationType} from './signin';
export {setLoggingEnabled} from './utils/logging';

// You'll get the clientSignature for your integration after a successful certification meeting.
// See: https://support.acrolinx.com/hc/en-us/articles/205687652-Getting-Started-with-Custom-Integrations
export const DEVELOPMENT_SIGNATURE = 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5';

export {SigninSuccessResult, isSigninLinksResult, PollMoreResult, SigninResult, SigninLinksResult};

export interface ServerVersionInfo {
  buildDate: string;
  buildNumber: string;
  version: string;
}

export interface AcrolinxEndpointProps {
  client: ClientInformation;
  clientLocale?: string;
  enableHttpLogging?: boolean;
  serverAddress: string;
}

export interface ClientInformation {
  name: string;
  signature: string;
  /**
   * The version of the client.
   * @format: ${major}.${minor}.${patch}.${buildNumber}
   * @example: '1.2.3.574'
   */
  version: string;
}

export interface HasAuthToken {
  authToken: string;
}

export function hasAuthToken(signinOptions: SigninOptions): signinOptions is HasAuthToken {
  return !!((signinOptions as HasAuthToken).authToken);
}

export function isSsoSigninOption(signinOptions: SigninOptions): signinOptions is SsoSigninOption {
  const potentialSsoOptions = signinOptions as SsoSigninOption;
  return !!(potentialSsoOptions.password && potentialSsoOptions.userId);
}

export interface SsoSigninOption {
  usernameKey?: string;
  passwordKey?: string;
  userId: string;
  password: string;
}

export interface StringMap {
  [index: string]: string;
}

export type SigninOptions = HasAuthToken | SsoSigninOption | {};

export class AcrolinxEndpoint {
  constructor(private readonly props: AcrolinxEndpointProps) {
  }

  public async getServerVersion(): Promise<ServerVersionInfo> {
    return this.get<ServerVersionInfo>('/iq/services/v3/rest/core/serverVersion');
  }

  public async signin(options: SigninOptions = {}): Promise<SigninResult> {
    const signinRequestBody: SigninRequestBody = {clientName: this.props.client.name};
    return this.post<SigninResult>('/api/v1/auth/sign-ins', signinRequestBody,
      this.getSigninRequestHeaders(options));
  }

  public async pollForSignin(signinLinks: SigninLinksResult,
                             lastPollResult?: PollMoreResult): Promise<SigninPollResult> {
    if (lastPollResult && lastPollResult.retryAfter) {
      logging.log('Waiting before retry', lastPollResult.retryAfter);
      await waitMs(lastPollResult.retryAfter * 1000);
    }
    return this.getUrl<SigninPollResult>(signinLinks.links.poll);
  }

  private getSigninRequestHeaders(options: SigninOptions = {}) {
    if (hasAuthToken(options)) {
      return {[HEADER_X_ACROLINX_AUTH]: options.authToken};
    } else if (isSsoSigninOption(options)) {
      return {
        [options.passwordKey || 'username']: options.userId,
        [options.passwordKey || 'password']: options.password,
      };
    } else {
      return {};
    }
  }

  private getCommonHeaders(): StringMap {
    const headers: StringMap = {
      'Content-Type': 'application/json',
      [HEADER_X_ACROLINX_BASE_URL]: this.props.serverAddress,
      [HEADER_X_ACROLINX_CLIENT]: this.props.client.signature + '; ' + this.props.client.version,
    };
    if (this.props.clientLocale) {
      headers[HEADER_X_ACROLINX_CLIENT_LOCALE] = this.props.clientLocale;
    }
    return headers;
  }

  private async get<T>(path: string): Promise<T> {
    return this.getUrl<T>(this.props.serverAddress + path);
  }

  private async getUrl<T>(url: string): Promise<T> {
    return this.fetch(url, {
      headers: this.getCommonHeaders()
    }).then(res => handleExpectedJsonResponse<T>(res), wrapUnknownError);
  }

  private async post<T>(path: string, body: {}, headers: StringMap = {}): Promise<T> {
    // console.log('post', this.props.serverAddress, path, body, headers);
    return this.fetch(this.props.serverAddress + path, {
      body: JSON.stringify(body),
      headers: {...this.getCommonHeaders(), ...headers},
      method: 'POST',
    }).then(res => handleExpectedJsonResponse<T>(res), wrapUnknownError);
  }


  /* tslint:disable:no-console */
  private async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (this.props.enableHttpLogging) {
      try {
        console.log('Fetch', input, init);
        const result = await fetch(input, init);
        console.log('Fetched Result', result.status);
        return result;
      } catch (error) {
        console.error('Fetch Error', error);
        throw error;
      }
    } else {
      return fetch(input, init);
    }
  }
  /* tslint:enable:no-console */

}
