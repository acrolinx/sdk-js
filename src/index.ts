import {Audience, CheckingCapabilities, CheckType, ContentEncoding, ContentFormat, ReportType} from './capabilities';
import {AggregatedReportLinkResult, CheckRequest, CheckResponse, CheckResultResponse} from './check';
import {AuthToken, SuccessResponse} from './common-types';
import {ErrorType, wrapFetchError} from './errors';
import {
  HEADER_X_ACROLINX_AUTH, HEADER_X_ACROLINX_AUTH_OLD,
  HEADER_X_ACROLINX_BASE_URL,
  HEADER_X_ACROLINX_CLIENT,
  HEADER_X_ACROLINX_CLIENT_LOCALE
} from './headers';
import {MetaDataResponse, MetaDataValueMap} from './meta-data';

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
export {AcrolinxApiError} from './errors';
export {setLoggingEnabled} from './utils/logging';

// You'll get the clientSignature for your integration after a successful certification meeting.
// See: https://support.acrolinx.com/hc/en-us/articles/205687652-Getting-Started-with-Custom-Integrations
export const DEVELOPMENT_SIGNATURE = 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5';

export {SigninSuccessResult, isSigninLinksResult, PollMoreResult, SigninResult, SigninLinksResult};
export {
  AuthToken, CheckingCapabilities, Audience, ErrorType, ContentEncoding, ContentFormat, CheckType, ReportType,
  CheckResultResponse
};

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

  public async signin(options: SigninOptions = {}): Promise<SigninResult> {
    const signinRequestBody: SigninRequestBody = {clientName: this.props.client.name};
    return this.post<SigninResult>('/api/v1/auth/sign-ins', signinRequestBody,
      this.getSigninRequestHeaders(options));
  }

  public async pollForSignin(signinLinks: SigninLinksResult,
                             lastPollResult?: PollMoreResult): Promise<SigninPollResult> {
    if (lastPollResult && lastPollResult.progress.retryAfter) {
      logging.log('Waiting before retry', lastPollResult.progress.retryAfter);
      await waitMs(lastPollResult.progress.retryAfter * 1000);
    }
    return this.getJsonFromUrl<SigninPollResult>(signinLinks.links.poll);
  }

  public async getCheckingCapabilities(authToken: AuthToken): Promise<CheckingCapabilities> {
    const result = await this.getJsonFromPath<SuccessResponse<CheckingCapabilities>>(
      '/api/v1/checking/capabilities', authToken);
    return result.data;
  }

  public async check(authToken: AuthToken, req: CheckRequest): Promise<CheckResponse> {
    return this.post<CheckResponse>('/api/v1/checking/checks', req, {}, authToken);
  }

  public async pollForCheckResult(authToken: AuthToken, check: CheckResponse): Promise<CheckResultResponse> {
    return this.getJsonFromUrl<CheckResultResponse>(check.links.result, authToken);
  }

  public async getLinkToAggregatedReport(authToken: AuthToken, batchId: string): Promise<AggregatedReportLinkResult> {
    return this.getJsonFromPath<AggregatedReportLinkResult>('/api/v1/checking/aggregation/' + batchId, authToken);
  }

  // Here begin some calls to the old API
  // TODO: Remove when no old API calls are needed anymore

  public async getServerVersion(): Promise<ServerVersionInfo> {
    return this.getJsonFromPath<ServerVersionInfo>('/iq/services/v3/rest/core/serverVersion');
  }

  public async getUserMetaData(authToken: AuthToken, username: string): Promise<MetaDataResponse> {
    return this.getJsonFromPath<MetaDataResponse>('/iq/services/v2/rest/metadata/user/' + username, authToken);
  }

  public async saveUserMetaData(authToken: AuthToken, username: string, valueMap: MetaDataValueMap): Promise<void> {
    try {
      await this.post('/iq/services/v2/rest/metadata/user/update/' + username, {metaData: valueMap}, {}, authToken);
    } catch (error) {
      if (error.type !== ErrorType.InvalidJson) {
        throw error;
      }
    }
  }

  // Here end some calls to the old API

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

  private getCommonHeaders(authToken?: AuthToken): StringMap {
    const headers: StringMap = {
      'Content-Type': 'application/json',
      [HEADER_X_ACROLINX_BASE_URL]: this.props.serverAddress,
      [HEADER_X_ACROLINX_CLIENT]: this.props.client.signature + '; ' + this.props.client.version,
    };
    if (this.props.clientLocale) {
      headers[HEADER_X_ACROLINX_CLIENT_LOCALE] = this.props.clientLocale;
    }
    if (authToken) {
      headers[HEADER_X_ACROLINX_AUTH] = authToken;
      // TODO: Remove when no old API calls are needed anymore
      headers[HEADER_X_ACROLINX_AUTH_OLD] = authToken;
    }
    return headers;
  }

  private async getJsonFromPath<T>(path: string, authToken?: AuthToken): Promise<T> {
    return this.getJsonFromUrl<T>(this.props.serverAddress + path, authToken);
  }

  private async getJsonFromUrl<T>(url: string, authToken?: AuthToken): Promise<T> {
    return this.fetch(url, {
      headers: this.getCommonHeaders(authToken),
    }).then(res => handleExpectedJsonResponse<T>(res), wrapFetchError);
  }

  private async post<T>(path: string, body: {}, headers: StringMap = {}, authToken?: AuthToken): Promise<T> {
    // console.log('post', this.props.serverAddress, path, body, headers);
    return this.fetch(this.props.serverAddress + path, {
      body: JSON.stringify(body),
      headers: {...this.getCommonHeaders(authToken), ...headers},
      method: 'POST',
    }).then(res => handleExpectedJsonResponse<T>(res), wrapFetchError);
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
