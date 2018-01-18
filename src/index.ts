import {wrapError} from './errors';

import {
  isSigninLinksResult,
  PollMoreResult,
  SigninLinksResult,
  SigninPollResult,
  SigninRequestBody,
  SigninResult,
  SigninSuccessResult
} from './signin';
import {handleExpectedJsonResponse, throwErrorForHttpErrorStatus} from './utils/fetch';
import {waitMs} from './utils/mixed-utils';

export {isSigninSuccessResult, AuthorizationType} from './signin';

export {SigninSuccessResult, isSigninLinksResult, PollMoreResult, SigninResult, SigninLinksResult};

export interface ServerVersionInfo {
  version: string;
  buildNumber: string;
  buildDate: string;
}

export interface AcrolinxEndpointProps {
  serverAddress: string;
  clientLocale?: string;
  clientName: string;
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
    const signinRequestBody: SigninRequestBody = {clientName: this.props.clientName};
    const result = await this.post<SigninResult>('/api/v1/auth/sign-ins', signinRequestBody,
      this.getSigninRequestHeaders(options));

    // temporary workaround for not implemented in server
    if (isSigninLinksResult(result) && !result.interactiveLinkTimeout) {
      result.interactiveLinkTimeout = 900;
    }

    return result;
  }

  public async pollForSignin(signinLinks: SigninLinksResult,
                             lastPollResult?: PollMoreResult): Promise<SigninPollResult> {
    if (lastPollResult && lastPollResult.retryAfterSeconds) {
      console.log('Waiting before retry', lastPollResult.retryAfterSeconds);
      await waitMs(lastPollResult.retryAfterSeconds * 1000);
    }
    const res = await fetch(signinLinks.links.poll);
    switch (res.status) {
      case 200:
        return handleExpectedJsonResponse(res);
      case 202:
        return {
          _type: 'PollMoreResult',
          retryAfterSeconds: parseInt(res.headers.get('retry-after')!, 10)
        };
      default:
        throw throwErrorForHttpErrorStatus(res);
    }
  }

  private getSigninRequestHeaders(options: SigninOptions = {}) {
    if (hasAuthToken(options)) {
      return {'X-Acrolinx-Auth': options.authToken};
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
      'X-Acrolinx-Base-Url': this.props.serverAddress,
    };
    if (this.props.clientLocale) {
      headers['X-Acrolinx-Client-Locale'] = this.props.clientLocale;
    }
    return headers;
  }

  private async get<T>(path: string): Promise<T> {
    return fetch(this.props.serverAddress + path, {
      headers: this.getCommonHeaders()
    }).then(res => handleExpectedJsonResponse<T>(res), wrapError);
  }

  private async post<T>(path: string, body: {}, headers: StringMap = {}): Promise<T> {
    // console.log('post', this.props.serverAddress, path, body, headers);
    return fetch(this.props.serverAddress + path, {
      body: JSON.stringify(body),
      headers: {...this.getCommonHeaders(), ...headers},
      method: 'POST',
    }).then(res => handleExpectedJsonResponse<T>(res), wrapError);
  }
}
