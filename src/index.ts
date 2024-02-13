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

import {
  AddonId,
  AppAccessToken,
  AppAccessTokenApiResult,
  AppAccessTokenResult,
  AppAccessTokenValidationResult,
} from './addons';
import {
  CheckingCapabilities,
  CheckType,
  ContentEncoding,
  ContentFormat,
  GuidanceProfile,
  ReportType,
} from './capabilities';
import {
  AggregatedReportLinkResult,
  CancelCheckResponse,
  CheckOptions,
  CheckRequest,
  CheckResponse,
  CheckResult,
  CheckResultResponse,
  ContentAnalysisDashboardResult,
  HasTermHarvestingReport,
  KeyValuePair,
  Report,
  TermHarvestingReport,
  LiveSearchRequest,
  LiveSearchResponse,
} from './check';
import {
  AccessToken,
  ApiResponse,
  AsyncApiResponse,
  AsyncStartedProcess,
  isProgressResponse,
  Progress,
  StringMap,
  SuccessResponse,
  UserId,
} from './common-types';
import { AddToDictionaryRequest, AddToDictionaryResponse, DictionaryCapabilities } from './dictionary';
import { DocumentDescriptor, DocumentId, sanitizeDocumentDescriptor } from './document-descriptor';
import { AcrolinxError, CheckCanceledByClientError, ErrorType, wrapFetchError } from './errors';
import { AnalysisRequest, ExtractionResult } from './extraction';
import { PlatformFeatures, PlatformFeaturesResponse } from './features';
import {
  HEADER_X_ACROLINX_APP_SIGNATURE,
  HEADER_X_ACROLINX_AUTH,
  HEADER_X_ACROLINX_BASE_URL,
  HEADER_X_ACROLINX_CLIENT,
  HEADER_X_ACROLINX_CLIENT_LOCALE,
} from './headers';
import { ServerNotificationPost, ServerNotificationResponse } from './notifications';
import { PlatformCapabilities } from './platform-capabilities';
import {
  isSigninLinksResult,
  isSigninSuccessResult,
  PollMoreResult,
  SigninLinksResult,
  SigninPollResult,
  SigninResult,
  SigninSuccessData,
  SigninSuccessResult,
} from './signin';
import {
  DeviceAuthResponse,
  DeviceAuthResponseRaw,
  MultTenantLoginInfo,
  DeviceSignInSuccessResponse,
  DeviceSignInOptions,
  DeviceSignInOptionsInteractive,
  DeviceSignInSuccessResponseRaw,
  generateDeviceAuthUrl,
  generateTokenUrl,
  getClientId,
  getTenantId,
  isSignInDeviceGrantSuccess,
  tidyKeyCloakSuccessResponse,
} from './signin-device-grant';
import { User } from './user';
import { handleExpectedJsonResponse, handleExpectedTextResponse } from './utils/fetch';
import * as logging from './utils/logging';
import { waitMs } from './utils/mixed-utils';

export * from './dictionary';
export * from './extraction';
export { isSigninSuccessResult, AuthorizationType } from './signin';
export { AcrolinxApiError } from './errors';
export { setLoggingEnabled } from './utils/logging';
export { SigninSuccessResult, isSigninLinksResult, PollMoreResult, SigninResult, SigninLinksResult };
export {
  AcrolinxError,
  AccessToken,
  CheckingCapabilities,
  CheckCanceledByClientError,
  CancelCheckResponse,
  GuidanceProfile,
  ErrorType,
  ContentEncoding,
  ContentFormat,
  CheckOptions,
  CheckType,
  DocumentDescriptor,
  DocumentId,
  ReportType,
  SuccessResponse,
  CheckRequest,
  CheckResult,
  CheckResultResponse,
  CheckResponse,
  Report,
  PlatformFeatures,
};

export { HEADER_X_ACROLINX_APP_SIGNATURE };

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

/* tslint:disable-next-line:max-line-length*/
export const DEVELOPMENT_APP_SIGNATURE =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiS2lsbGVyIEFwcCIsImlkIjoiNGVlZDM3NjctMGYzMS00ZDVmLWI2MjktYzg2MWFiM2VkODUyIiwidHlwZSI6IkFQUCIsImlhdCI6MTU2MTE4ODI5M30.zlVJuGITMjAJ2p4nl-qtpj4N0p_8e4tenr-4dkrGdXg';

export interface Server {
  version: string;
  name: string;
}

export interface PlatformInformation {
  server: Server;
  locales: string[];
}

export interface AcrolinxEndpointProps {
  client: ClientInformation;
  clientLocale?: string;
  acrolinxUrl: string;

  corsWithCredentials?: boolean;
  additionalFetchProperties?: any;
  fetch?: typeof fetch;

  /**
   * @ignore
   */
  enableHttpLogging?: boolean;
}

export interface ClientInformation {
  signature: string;
  /**
   * The version of the client.
   * @format: ${major}.${minor}.${patch}.${buildNumber}
   * @example: '1.2.3.574'
   */
  version: string;
}

interface AccessTokenSigninOption {
  accessToken?: string;
}

function isSsoSigninOption(signinOptions: SigninOptions): signinOptions is SsoSigninOption {
  const potentialSsoOptions = signinOptions as SsoSigninOption;
  return !!(potentialSsoOptions.genericToken && potentialSsoOptions.username);
}

export interface SsoSigninOption {
  username: string;
  genericToken: string;
}

export type SigninOptions = AccessTokenSigninOption | SsoSigninOption;

export interface CheckAndGetResultOptions {
  onProgress?(progress: Progress): void;
}

export interface AdditionalRequestOptions {
  headers?: StringMap;
}

export interface CancelablePollLoopOptions extends CheckAndGetResultOptions, AdditionalRequestOptions {}

export interface CancelablePromiseWrapper<T> {
  promise: Promise<T>;

  getId(): string | undefined;

  cancel(): void;
}

export interface SignInInteractiveOptions {
  onSignInUrl: (url: string) => void;
  accessToken?: string;
  timeoutMs?: number;
}

const VALIDATE_APP_ACCESS_TOKEN_PATH = '/api/v1/apps/whoami';

export class AcrolinxEndpoint {
  public readonly props: AcrolinxEndpointProps;

  constructor(props: AcrolinxEndpointProps) {
    this.props = {
      ...props,
      acrolinxUrl: props.acrolinxUrl.trim().replace(/\/$/, ''),
    };
  }

  public setClientLocale(clientLocale: string) {
    this.props.clientLocale = clientLocale;
  }

  public async getPlatformInformation(): Promise<PlatformInformation> {
    return getData<PlatformInformation>(this.getJsonFromPath('/api/v1/'));
  }

  public async signInWithSSO(genericToken: string, username: string) {
    const signinResult = await this.signin({ genericToken, username });
    if (isSigninSuccessResult(signinResult)) {
      return signinResult;
    } else {
      throw new AcrolinxError({
        type: ErrorType.SSO,
        title: 'SSO Error',
        detail: 'Sign-In by SSO failed.',
      });
    }
  }

  public async singInInteractive(opts: SignInInteractiveOptions): Promise<SigninSuccessData> {
    const signinResult = await this.signin({ accessToken: opts.accessToken });

    if (isSigninSuccessResult(signinResult)) {
      return signinResult.data;
    }

    opts.onSignInUrl(signinResult.links.interactive);

    return this.pollForInteractiveSignIn(signinResult, opts.timeoutMs || 60 * 60 * 1000);
  }

  private async fetchLoginInfo(tenantId: string): Promise<MultTenantLoginInfo> {
    return await this.fetchJson(this.getUrlOfPath(`/content-cube/api/auth/keycloak/login-url?tenant=${tenantId}`), {
      method: 'POST',
    });
  }

  private async fetchDeviceGrantUserAction(deviceGrantUrl: string, clientId: string): Promise<DeviceAuthResponseRaw> {
    return await this.fetchJson(deviceGrantUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
      }),
    });
  }

  public async deviceAuthSignIn(opts: DeviceSignInOptions): Promise<DeviceAuthResponse | DeviceSignInSuccessResponse> {
    const tenantId = getTenantId(this.props.acrolinxUrl, opts);
    const multTenantLoginInfo: MultTenantLoginInfo = await this.fetchLoginInfo(tenantId);
    const clientId = getClientId(opts);

    const tokenValidationResult = await this.verifyTokenIsValid(
      generateTokenUrl(multTenantLoginInfo, tenantId),
      clientId,
      opts.refreshToken,
    );

    if (tokenValidationResult) {
      return tokenValidationResult;
    }

    const verificationResultRaw: DeviceAuthResponseRaw = await this.fetchDeviceGrantUserAction(
      generateDeviceAuthUrl(multTenantLoginInfo, tenantId),
      clientId,
    );

    //TODO: error handling

    const verificationResult: DeviceAuthResponse = {
      deviceCode: verificationResultRaw.device_code,
      expiresInSeconds: verificationResultRaw.expires_in,
      pollingIntervalInSeconds: verificationResultRaw.interval,
      userCode: verificationResultRaw.user_code,
      verificationUrl: verificationResultRaw.verification_uri,
      verificationUrlComplete: verificationResultRaw.verification_uri_complete,
      pollingUrl: generateTokenUrl(multTenantLoginInfo, tenantId),
    };

    return verificationResult;
  }

  private async verifyTokenIsValid(
    url: string,
    clientId: string,
    refreshToken: string | undefined,
  ): Promise<DeviceSignInSuccessResponse | undefined> {
    try {
      const response = await this.fetchTokenKeyCloak(
        url,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          refresh_token: refreshToken || '',
        }),
      );
      return tidyKeyCloakSuccessResponse(response);
    } catch (error: unknown) {
      const acrolinxError = error as AcrolinxError;
      if (acrolinxError.type === ErrorType.InvalidGrant) {
        console.log('Refresh token invalid, fetching new device code');
        return undefined;
      } else {
        throw error;
      }
    }
  }

  public async deviceAuthSignInInteractive(opts: DeviceSignInOptionsInteractive): Promise<DeviceSignInSuccessResponse> {
    const result = await this.deviceAuthSignIn(opts);
    const clientId = opts.clientId || 'device-sign-in';

    if (isSignInDeviceGrantSuccess(result)) {
      return result as DeviceSignInSuccessResponse;
    }
    const verificationResult = result as DeviceAuthResponse;

    opts.onDeviceGrantUserAction(verificationResult);
    return await this.pollDeviceSignInCompletion(clientId, verificationResult);
  }

  private async fetchTokenKeyCloak(
    url: string,
    urlSearchParams: URLSearchParams,
  ): Promise<DeviceSignInSuccessResponseRaw> {
    return await this.fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: urlSearchParams,
    });
  }

  public async pollDeviceSignInCompletion(
    clientId: string,
    verificationResult: DeviceAuthResponse,
  ): Promise<DeviceSignInSuccessResponse> {
    const startTime = Date.now();
    while (Date.now() < startTime + verificationResult.expiresInSeconds) {
      await waitMs(verificationResult.pollingIntervalInSeconds * 1000);
      try {
        const response: DeviceSignInSuccessResponseRaw = await this.fetchTokenKeyCloak(
          verificationResult.pollingUrl,
          new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: verificationResult.deviceCode,
            client_id: clientId,
          }),
        );

        return tidyKeyCloakSuccessResponse(response);
      } catch (error: unknown) {
        const acrolinxError = error as AcrolinxError;
        if (acrolinxError.type === ErrorType.AuthorizationPending) {
          console.log(acrolinxError.detail);
          continue;
        }
        throw error;
      }
    }

    throw new AcrolinxError({
      type: ErrorType.SigninTimedOut,
      title: 'Interactive device grant sign-in time out',
      detail: `Interactive device grant sign-in has timed out by client (${Date.now() - startTime} > ${
        verificationResult.expiresInSeconds
      } ms).`,
    });
  }

  public async signin(options: SigninOptions = {}): Promise<SigninResult> {
    return this.post<SigninResult>('/api/v1/auth/sign-ins', {}, getSigninRequestHeaders(options));
  }

  public async pollForSignin(
    signinLinks: SigninLinksResult,
    lastPollResult?: PollMoreResult,
  ): Promise<SigninPollResult> {
    if (lastPollResult && lastPollResult.progress.retryAfter) {
      logging.log('Waiting before retry', lastPollResult.progress.retryAfter);
      await waitMs(lastPollResult.progress.retryAfter * 1000);
    }
    return this.getJsonFromUrl<SigninPollResult>(signinLinks.links.poll);
  }

  public async getAppAccessToken(accessToken: AccessToken, appId: AddonId): Promise<AppAccessTokenResult> {
    const tokenApiResult = await getData<AppAccessTokenApiResult>(
      this.post('/api/v1/apps/accessToken/' + appId, {}, undefined, accessToken),
    );
    return {
      ...tokenApiResult,
      validationRequest: {
        url: this.getUrlOfPath(VALIDATE_APP_ACCESS_TOKEN_PATH),
        headers: {
          'Content-Type': 'application/json',
          [HEADER_X_ACROLINX_CLIENT]: this.getAcrolinxClientHttpHeader(),
          [HEADER_X_ACROLINX_AUTH]: tokenApiResult.appAccessToken,
        },
      },
    };
  }

  public async validateAppAccessToken(appToken: AppAccessToken): Promise<AppAccessTokenValidationResult> {
    return getData(this.getJsonFromPath(VALIDATE_APP_ACCESS_TOKEN_PATH, appToken));
  }

  public getCapabilities(accessToken: AccessToken): Promise<PlatformCapabilities> {
    return getData(this.getJsonFromPath('/api/v1/capabilities', accessToken));
  }

  public async getFeatures(accessToken: AccessToken): Promise<PlatformFeatures> {
    const responsePromise = await getData<PlatformFeaturesResponse>(
      this.getJsonFromPath('/api/v1/configuration/features', accessToken),
    );
    return responsePromise.features;
  }

  public getCheckingCapabilities(accessToken: AccessToken): Promise<CheckingCapabilities> {
    return getData(this.getJsonFromPath('/api/v1/checking/capabilities', accessToken));
  }

  public async check(accessToken: AccessToken, req: CheckRequest): Promise<CheckResponse> {
    return this.post<CheckResponse>('/api/v1/checking/checks', req, {}, accessToken);
  }

  public async getLiveSuggestions(accessToken: AccessToken, req: LiveSearchRequest): Promise<LiveSearchResponse> {
    return this.post<LiveSearchResponse>(
      '/reuse-service/api/v1/phrases/preferred/with-description',
      req,
      {},
      accessToken,
    );
  }

  public checkAndGetResult(
    accessToken: AccessToken,
    req: CheckRequest,
    opts: CheckAndGetResultOptions = {},
  ): CancelablePromiseWrapper<CheckResult> {
    return this.startCancelablePollLoop(accessToken, this.check(accessToken, req), opts);
  }

  public analyzeAndPoll(
    accessToken: AccessToken,
    req: AnalysisRequest,
    opts: CheckAndGetResultOptions = {},
  ): CancelablePromiseWrapper<ExtractionResult> {
    const headers = { [HEADER_X_ACROLINX_APP_SIGNATURE]: req.appSignature };
    const asyncStartedProcessPromise = this.post<AsyncStartedProcess>(
      '/api/v1/apps/analyses',
      req,
      headers,
      accessToken,
    );
    return this.startCancelablePollLoop(accessToken, asyncStartedProcessPromise, { ...opts, headers });
  }

  public async cancelCheck(accessToken: AccessToken, check: CheckResponse): Promise<CancelCheckResponse> {
    return this.cancelAsyncStartedProcess(accessToken, check);
  }

  public async pollForCheckResult(accessToken: AccessToken, check: CheckResponse): Promise<CheckResultResponse> {
    return this.pollForAsyncResult<CheckResultResponse>(accessToken, check);
  }

  public async getTermHarvestingReport(
    accessToken: AccessToken,
    reports: HasTermHarvestingReport,
  ): Promise<TermHarvestingReport> {
    return getData(this.getJsonFromUrl<ApiResponse<TermHarvestingReport>>(reports.termHarvesting.link, accessToken));
  }

  /**
   * @deprecated Please use {@link getContentAnalysisDashboard}
   */
  public async getLinkToAggregatedReport(
    accessToken: AccessToken,
    batchId: string,
  ): Promise<AggregatedReportLinkResult> {
    return this.getJsonFromPath<AggregatedReportLinkResult>(
      '/api/v1/checking/aggregation/' + encodeURIComponent(batchId),
      accessToken,
    );
  }

  public async getContentAnalysisDashboard(accessToken: AccessToken, batchId: string): Promise<string> {
    const serviceResult = await getData(
      this.getJsonFromPath<SuccessResponse<ContentAnalysisDashboardResult>>(
        `/api/v1/checking/${encodeURIComponent(batchId)}/contentanalysis`,
        accessToken,
      ),
    );
    const shortWithoutAccessToken = serviceResult.links.filter(
      (link) => link.linkType === 'shortWithoutAccessToken',
    )[0];
    return shortWithoutAccessToken.link;
  }

  public async getServerNotifications(
    accessToken: AccessToken,
    sinceTimeStamp: number,
  ): Promise<ServerNotificationResponse> {
    return this.getJsonFromPath<any>('/api/v1/broadcasts/platform-notifications/' + sinceTimeStamp, accessToken);
  }

  // TODO (marco) Review! Added this method to test DEV-17460
  public async postServerNotifications(
    accessToken: AccessToken,
    notification: ServerNotificationPost,
  ): Promise<ServerNotificationResponse> {
    return this.post<ServerNotificationResponse>(
      '/api/v1/broadcasts/platform-notifications/',
      notification,
      {},
      accessToken,
    );
  }

  public getDictionaryCapabilities(accessToken: AccessToken): Promise<DictionaryCapabilities> {
    return getData(this.getJsonFromPath('/api/v1/dictionary/capabilities', accessToken));
  }

  public addToDictionary(accessToken: AccessToken, req: AddToDictionaryRequest): Promise<AddToDictionaryResponse> {
    return getData(this.post('/api/v1/dictionary/submit', req, {}, accessToken));
  }

  public getUserData(accessToken: AccessToken, id: UserId): Promise<User> {
    return getData(this.getJsonFromPath('/api/v1/user/' + id, accessToken));
  }

  public setUserCustomFields(accessToken: AccessToken, id: UserId, customFieldValues: KeyValuePair[]): Promise<User> {
    const requestBody = { id, customFields: customFieldValues };
    return getData(this.put('/api/v1/user/' + id, requestBody, {}, accessToken));
  }

  public getDocumentDescriptor(accessToken: AccessToken, id: DocumentId): Promise<DocumentDescriptor> {
    return getData<DocumentDescriptor>(this.getJsonFromPath('/api/v1/document/' + id, accessToken)).then(
      sanitizeDocumentDescriptor,
    );
  }

  public setDocumentCustomFields(
    accessToken: AccessToken,
    documentId: DocumentId,
    customFieldValues: KeyValuePair[],
  ): Promise<DocumentDescriptor> {
    const requestBody = { id: documentId, customFields: customFieldValues };
    return getData(this.put('/api/v1/document/' + documentId, requestBody, {}, accessToken));
  }

  public async getJsonFromPath<T>(path: string, accessToken?: AccessToken): Promise<T> {
    return this.getJsonFromUrl<T>(this.getUrlOfPath(path), accessToken);
  }

  public async getJsonFromUrl<T>(
    url: string,
    accessToken?: AccessToken,
    opts: AdditionalRequestOptions = {},
  ): Promise<T> {
    return this.fetchJson(url, {
      headers: { ...this.getCommonHeaders(accessToken), ...opts.headers },
    });
  }

  public async getTextFromUrl(
    url: string,
    accessToken?: AccessToken,
    opts: AdditionalRequestOptions = {},
  ): Promise<string> {
    const httpRequest = { url, method: 'GET' };
    return this.fetch(url, {
      headers: { ...this.getCommonHeaders(accessToken), ...opts.headers },
    }).then(
      (res) => handleExpectedTextResponse(httpRequest, res),
      (error) => wrapFetchError(httpRequest, error),
    );
  }

  private getUrlOfPath(path: string) {
    return this.props.acrolinxUrl + path;
  }

  private async pollForInteractiveSignIn(
    signinLinksResult: SigninLinksResult,
    timeoutMs: number,
  ): Promise<SigninSuccessData> {
    const startTime = Date.now();
    let pollResult;
    while (Date.now() < startTime + timeoutMs) {
      pollResult = await this.pollForSignin(signinLinksResult, pollResult);
      if (isSigninSuccessResult(pollResult)) {
        return pollResult.data;
      }
    }

    throw new AcrolinxError({
      type: ErrorType.SigninTimedOut,
      title: 'Interactive sign-in time out',
      detail: `Interactive sign-in has timed out by client (${Date.now() - startTime} > ${timeoutMs} ms).`,
    });
  }

  private startCancelablePollLoop<Result>(
    accessToken: AccessToken,
    asyncStartedProcessPromise: Promise<AsyncStartedProcess>,
    opts: CancelablePollLoopOptions = {},
  ): CancelablePromiseWrapper<Result> {
    let canceledByClient = false;
    let requestedCanceledOnServer = false;
    let runningCheck: AsyncStartedProcess | undefined;

    let cancelPromiseReject: (e: Error) => void;
    const cancelPromise = new Promise<never>((_resolve, reject) => {
      cancelPromiseReject = reject;
    });

    function cancel() {
      canceledByClient = true;
      cancelPromiseReject(createCheckCanceledByClientError());
      cancelOnServerIfPossibleAndStillNeeded();
    }

    const handlePotentialCancellation = () => {
      if (canceledByClient) {
        cancelOnServerIfPossibleAndStillNeeded();
        // We don't want to poll forever if the canceling does not work on the server.
        // To be consistent we throw the same exception, that the server would throw while polling.
        throw createCheckCanceledByClientError();
      }
    };

    const cancelOnServerIfPossibleAndStillNeeded = () => {
      if (!requestedCanceledOnServer && runningCheck) {
        requestedCanceledOnServer = true;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.cancelAsyncStartedProcess(accessToken, runningCheck, opts);
      }
    };

    const poll = async (): Promise<Result> => {
      runningCheck = await asyncStartedProcessPromise;
      handlePotentialCancellation();

      let checkResultOrProgress: AsyncApiResponse<Result>;
      do {
        checkResultOrProgress = await this.pollForAsyncResult(accessToken, runningCheck, opts);
        handlePotentialCancellation();

        if (isProgressResponse(checkResultOrProgress)) {
          if (opts.onProgress) {
            opts.onProgress(checkResultOrProgress.progress);
          }

          await waitMs(checkResultOrProgress.progress.retryAfter * 1000);
          handlePotentialCancellation();
        }
      } while (isProgressResponse(checkResultOrProgress));

      return checkResultOrProgress.data;
    };

    return {
      promise: Promise.race([poll(), cancelPromise]),
      getId(): string | undefined {
        return runningCheck?.data.id;
      },
      cancel,
    };
  }

  private async pollForAsyncResult<R>(
    accessToken: AccessToken,
    check: AsyncStartedProcess,
    opts: AdditionalRequestOptions = {},
  ): Promise<R> {
    return this.getJsonFromUrl<R>(check.links.result, accessToken, opts);
  }

  private async cancelAsyncStartedProcess<CancelResponse>(
    accessToken: AccessToken,
    process: AsyncStartedProcess,
    opts: AdditionalRequestOptions = {},
  ): Promise<CancelResponse> {
    return this.deleteUrl<CancelResponse>(process.links.cancel, accessToken, opts);
  }

  private getCommonHeaders(accessToken?: AccessToken): StringMap {
    const headers: StringMap = {
      'Content-Type': 'application/json',
      [HEADER_X_ACROLINX_BASE_URL]: this.props.acrolinxUrl,
      [HEADER_X_ACROLINX_CLIENT]: this.getAcrolinxClientHttpHeader(),
    };
    if (this.props.clientLocale) {
      headers[HEADER_X_ACROLINX_CLIENT_LOCALE] = this.props.clientLocale;
    }
    if (accessToken) {
      headers[HEADER_X_ACROLINX_AUTH] = accessToken;
    }
    return headers;
  }

  private getAcrolinxClientHttpHeader() {
    return `${this.props.client.signature}; ${this.props.client.version}`;
  }

  private async post<T>(path: string, body: {}, headers: StringMap = {}, accessToken?: AccessToken): Promise<T> {
    return this.send<T>('POST', path, body, headers, accessToken);
  }

  private async put<T>(path: string, body: {}, headers: StringMap = {}, accessToken?: AccessToken): Promise<T> {
    return this.send<T>('PUT', path, body, headers, accessToken);
  }

  private async send<T>(
    method: 'POST' | 'PUT',
    path: string,
    body: {},
    headers: StringMap = {},
    accessToken?: AccessToken,
  ): Promise<T> {
    return this.fetchJson(this.getUrlOfPath(path), {
      body: JSON.stringify(body),
      headers: { ...this.getCommonHeaders(accessToken), ...headers },
      method,
    });
  }

  private async deleteUrl<T>(url: string, accessToken: AccessToken, opts: AdditionalRequestOptions = {}): Promise<T> {
    return this.fetchJson(url, {
      headers: { ...this.getCommonHeaders(accessToken), ...opts.headers },
      method: 'DELETE',
    });
  }

  private async fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const httpRequest = {
      url,
      method: init.method || 'GET',
    };
    return this.fetch(url, init).then(
      (res) => handleExpectedJsonResponse(httpRequest, res),
      (error) => wrapFetchError(httpRequest, error),
    );
  }

  /* tslint:disable:no-console */
  private async fetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const fetchFunction = this.props.fetch || fetch;
    const fetchProps: RequestInit = {
      ...init,
      // Ensure credentials: 'same-origin' in old browsers: https://github.com/github/fetch#sending-cookies
      credentials: this.props.corsWithCredentials ? 'include' : 'same-origin',
      ...(this.props.additionalFetchProperties || {}),
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
  return promise.then((r) => r.data);
}

function getSigninRequestHeaders(options: SigninOptions = {}): StringMap {
  if ('accessToken' in options && options.accessToken) {
    return { [HEADER_X_ACROLINX_AUTH]: options.accessToken };
  } else if (isSsoSigninOption(options)) {
    return {
      username: options.username,
      password: options.genericToken,
    };
  } else {
    return {};
  }
}

function createCheckCanceledByClientError() {
  return new CheckCanceledByClientError({
    detail: 'The check was canceled. No result is available.',
    type: ErrorType.CheckCanceled,
    title: 'Check canceled',
    status: 400,
  });
}
