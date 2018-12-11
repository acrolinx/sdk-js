import {AddonCheckResult} from './addons';
import {
  CheckingCapabilities,
  CheckType,
  ContentEncoding,
  ContentFormat,
  GuidanceProfile,
  ReportType
} from './capabilities';
import {
  AggregatedReportLinkResult,
  CancelCheckResponse,
  CheckOptions,
  CheckRequest,
  CheckResponse,
  CheckResult,
  CheckResultResponse,
  DocumentDescriptor,
  DocumentId,
  KeyValuePair,
  Report,
  sanitizeDocumentDescriptor
} from './check';
import {ApiResponse, AuthToken, StringMap, SuccessResponse, UserId} from './common-types';
import {AddToDictionaryRequest, AddToDictionaryResponse, DictionaryCapabilities} from './dictionary';
import {AcrolinxError, ErrorType, wrapFetchError} from './errors';
import {
  HEADER_X_ACROLINX_AUTH,
  HEADER_X_ACROLINX_BASE_URL,
  HEADER_X_ACROLINX_CLIENT,
  HEADER_X_ACROLINX_CLIENT_LOCALE
} from './headers';
import {ServerNotificationPost, ServerNotificationResponse} from './notifications';
import {PlatformCapabilities} from './platform-capabilities';
import {
  isSigninLinksResult,
  PollMoreResult,
  SigninLinksResult,
  SigninPollResult,
  SigninRequestBody,
  SigninResult,
  SigninSuccessResult
} from './signin';
import {User} from './user';
import {handleExpectedJsonResponse, handleExpectedTextResponse} from './utils/fetch';
import * as logging from './utils/logging';
import {waitMs} from './utils/mixed-utils';

export * from './dictionary';
export {isSigninSuccessResult, AuthorizationType} from './signin';
export {AcrolinxApiError} from './errors';
export {setLoggingEnabled} from './utils/logging';
export {SigninSuccessResult, isSigninLinksResult, PollMoreResult, SigninResult, SigninLinksResult};
export {
  AcrolinxError,
  AuthToken,
  CheckingCapabilities,
  CancelCheckResponse,
  GuidanceProfile,
  ErrorType,
  ContentEncoding,
  ContentFormat,
  CheckOptions,
  CheckType,
  ReportType,
  SuccessResponse,
  CheckRequest,
  CheckResult,
  CheckResultResponse,
  CheckResponse,
  Report
};

export * from './check';
export * from './capabilities';
export * from './user';
export * from './custom-fields';
export * from './common-types';
export * from './signin';
export * from './addons';
export * from './notifications';

// You'll get the clientSignature for your integration after a successful certification meeting.
// See: https://support.acrolinx.com/hc/en-us/articles/205687652-Getting-Started-with-Custom-Integrations
export const DEVELOPMENT_SIGNATURE = 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5';

export interface ServerVersionInfo {
  version: string;
  name: string;
}

export interface ServerInfo {
  server: ServerVersionInfo;
  locales: string[];
}

export interface AcrolinxEndpointProps {
  client: ClientInformation;
  clientLocale?: string;
  enableHttpLogging?: boolean;
  serverAddress: string;
  corsWithCredentials?: boolean;
  additionalFetchProperties?: any;
  fetch?: typeof fetch;
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

export type SigninOptions = HasAuthToken | SsoSigninOption | {};

// FIX for Typescipt error in esnext compiled project...
// https://stackoverflow.com/questions/44987899/typescript-cannot-find-name-fetch-universal-library?rq=1
// export declare var fetch: any;

export class AcrolinxEndpoint {
  public readonly props: AcrolinxEndpointProps;

  constructor(props: AcrolinxEndpointProps) {
    this.props = {
      ...props,
      serverAddress: props.serverAddress.trim().replace(/\/$/, '')
    };
  }

  public setClientLocale(clientLocale: string) {
    this.props.clientLocale = clientLocale;
  }

  public async getServerInfo(): Promise<ServerInfo> {
    return getData<ServerInfo>(this.getJsonFromPath('/api/v1/'));
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

  public getCapabilities(authToken: AuthToken): Promise<PlatformCapabilities> {
    return getData(this.getJsonFromPath('/api/v1/capabilities', authToken));
  }

  public getCheckingCapabilities(authToken: AuthToken): Promise<CheckingCapabilities> {
    return getData(this.getJsonFromPath('/api/v1/checking/capabilities', authToken));
  }

  public async check(authToken: AuthToken, req: CheckRequest): Promise<CheckResponse> {
    return this.post<CheckResponse>('/api/v1/checking/checks', req, {}, authToken);
  }

  public async cancelCheck(authToken: AuthToken, check: CheckResponse): Promise<CancelCheckResponse> {
    return this.deleteUrl<CancelCheckResponse>(check.links.cancel, authToken);
  }

  public async pollForCheckResult(authToken: AuthToken, check: CheckResponse): Promise<CheckResultResponse> {
    return this.getJsonFromUrl<CheckResultResponse>(check.links.result, authToken);
  }

  public async getAddonCheckResult(authToken: AuthToken, appDataLink: string): Promise<AddonCheckResult> {
    return getData(this.getJsonFromUrl<ApiResponse<AddonCheckResult>>(appDataLink, authToken));
  }

  public async getLinkToAggregatedReport(authToken: AuthToken, batchId: string): Promise<AggregatedReportLinkResult> {
    return this.getJsonFromPath<AggregatedReportLinkResult>('/api/v1/checking/aggregation/'
      + encodeURIComponent(batchId), authToken);
  }

  public async getServerNotifications(authToken: AuthToken,
                                      sinceTimeStamp: number): Promise<ServerNotificationResponse> {
    return this.getJsonFromPath<any>('/api/v1/broadcasts/platform-notifications/' + sinceTimeStamp, authToken);
  }

  // TODO (marco) Review! Added this method to test DEV-17460
  public async postServerNotifications(authToken: AuthToken,
                                       notification: ServerNotificationPost): Promise<ServerNotificationResponse> {
    return this.post<ServerNotificationResponse>('/api/v1/broadcasts/platform-notifications/',
      notification, {}, authToken);
  }

  public getDictionaryCapabilities(authToken: AuthToken): Promise<DictionaryCapabilities> {
    return getData(this.getJsonFromPath('/api/v1/dictionary/capabilities', authToken));
  }

  public addToDictionary(authToken: AuthToken, req: AddToDictionaryRequest): Promise<AddToDictionaryResponse> {
    return getData(this.post('/api/v1/dictionary/submit', req, {}, authToken));
  }

  public getUserData(authToken: AuthToken, id: UserId): Promise<User> {
    return getData(this.getJsonFromPath('/api/v1/user/' + id, authToken));
  }

  public setUserCustomFields(authToken: AuthToken, id: UserId, customFieldValues: KeyValuePair[]): Promise<User> {
    const requestBody = {id, customFields: customFieldValues};
    return getData(this.put('/api/v1/user/' + id, requestBody, {}, authToken));
  }

  public getDocumentDescriptor(authToken: AuthToken, id: DocumentId): Promise<DocumentDescriptor> {
    return getData<DocumentDescriptor>(this.getJsonFromPath('/api/v1/document/' + id, authToken))
      .then(sanitizeDocumentDescriptor);
  }

  public setDocumentCustomFields(authToken: AuthToken,
                                 documentId: DocumentId,
                                 customFieldValues: KeyValuePair[]): Promise<DocumentDescriptor> {
    const requestBody = {id: documentId, customFields: customFieldValues};
    return getData(this.put('/api/v1/document/' + documentId, requestBody, {}, authToken));
  }

  public async getJsonFromPath<T>(path: string, authToken?: AuthToken): Promise<T> {
    return this.getJsonFromUrl<T>(this.props.serverAddress + path, authToken);
  }

  public async getJsonFromUrl<T>(url: string, authToken?: AuthToken): Promise<T> {
    return this.fetch(url, {
      headers: this.getCommonHeaders(authToken),
    }).then(res => handleExpectedJsonResponse<T>(res), wrapFetchError);
  }

  public async getTextFromUrl(url: string, authToken?: AuthToken): Promise<string> {
    return this.fetch(url, {
      headers: this.getCommonHeaders(authToken),
    }).then(res => handleExpectedTextResponse(res), wrapFetchError);
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
    }
    return headers;
  }

  private async post<T>(path: string, body: {}, headers: StringMap = {}, authToken?: AuthToken): Promise<T> {
    return this.send<T>('POST', path, body, headers, authToken);
  }

  private async put<T>(path: string, body: {}, headers: StringMap = {}, authToken?: AuthToken): Promise<T> {
    return this.send<T>('PUT', path, body, headers, authToken);
  }

  private async send<T>(method: 'POST' | 'PUT',
                        path: string,
                        body: {},
                        headers: StringMap = {},
                        authToken?: AuthToken): Promise<T> {
    // console.log('post', this.props.serverAddress, path, body, headers);
    return this.fetch(this.props.serverAddress + path, {
      body: JSON.stringify(body),
      headers: {...this.getCommonHeaders(authToken), ...headers},
      method,
    }).then(res => handleExpectedJsonResponse<T>(res), wrapFetchError);
  }

  private async deleteUrl<T>(url: string, authToken: AuthToken): Promise<T> {
    return this.fetch(url, {
      headers: this.getCommonHeaders(authToken),
      method: 'DELETE',
    }).then(res => handleExpectedJsonResponse<T>(res), wrapFetchError);
  }

  /* tslint:disable:no-console */
  private async fetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const fetchFunction = this.props.fetch || fetch;
    const fetchProps: RequestInit = {
      ...init,
      credentials: this.props.corsWithCredentials ? 'include' : undefined,
      ...(this.props.additionalFetchProperties || {})
    };
    if (this.props.enableHttpLogging) {
      try {
        console.log('Fetch', input, init, this.props.additionalFetchProperties);
        const result = await fetchFunction(input, fetchProps);
        console.log('Fetched Result', result.status);
        return result;
      } catch (error) {
        console.error('Fetch Error', error);
        throw error;
      }
    } else {
      return fetchFunction(input, fetchProps);
    }
  }

  /* tslint:enable:no-console */
}

function getData<T>(promise: Promise<SuccessResponse<T>>): Promise<T> {
  return promise.then(r => r.data);
}
