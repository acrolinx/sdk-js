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
  ServiceType,
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
  HEADER_X_ACROLINX_CLIENT,
  getAcrolinxClientHttpHeader,
  getCommonHeaders,
} from './headers';
import { ServerNotificationPost, ServerNotificationResponse } from './notifications';
import { PlatformCapabilities } from './platform-capabilities';
import {
  getSigninRequestHeaders,
  isSigninLinksResult,
  isSigninSuccessResult,
  PollMoreResult,
  SignInInteractiveOptions,
  SigninLinksResult,
  SigninOptions,
  SigninPollResult,
  SigninResult,
  SigninSuccessData,
  SigninSuccessResult,
} from './signin';
import { AcrolinxInstrumentation, Instruments } from './telemetry/acrolinxInstrumentation';

import { User } from './user';
import { fetchJson, fetchWithProps, getUrlOfPath, handleExpectedTextResponse, post, put } from './utils/fetch';
import * as logging from './utils/logging';
import { waitMs } from './utils/mixed-utils';

export * from './dictionary';
export * from './extraction';
export { isSigninSuccessResult, AuthorizationType } from './signin';
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
  ReportType,
  SuccessResponse,
  CheckRequest,
  CheckResult,
  CheckResultResponse,
  CheckResponse,
  Report,
};

export { HEADER_X_ACROLINX_APP_SIGNATURE };
export * from './services/ai-service/ai-service';
export * from './services/ai-service/ai-service.types';
export * from './services/ai-service/ai-service.utils';

export * from './services/int-service/int-service';
export * from './services/int-service/int-service.types';

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
  /**
   * The name of the app.
   * @example: 'acrolinx-for-chrome'
   */
  appName?: string;
  signature: string;
  /**
   * The version of the client.
   * @format: ${major}.${minor}.${patch}.${buildNumber}
   * @example: '1.2.3.574'
   */
  version: string;
}

export interface CheckAndGetResultOptions {
  onProgress?(progress: Progress): void;
}

export interface AdditionalRequestOptions {
  headers?: StringMap;
  serviceType?: ServiceType;
}

export interface CancelablePollLoopOptions extends CheckAndGetResultOptions, AdditionalRequestOptions {}

export interface CancelablePromiseWrapper<T> {
  promise: Promise<T>;

  getId(): string | undefined;

  cancel(): Promise<void>;
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

  public async getTelemetryInstruments(accessToken: AccessToken): Promise<Instruments | undefined> {
    try {
      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(this, {
        accessToken: accessToken,
        acrolinxUrl: this.props.acrolinxUrl,
        serviceName: this.props.client.appName ?? 'sdk-js',
        serviceVersion: this.props.client.version,
      });
      return await acrolinxInstrumentation.getInstruments();
    } catch (e) {
      console.log(e);
      return undefined;
    }
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

  public async signin(options: SigninOptions = {}): Promise<SigninResult> {
    return post<SigninResult>('/api/v1/auth/sign-ins', {}, getSigninRequestHeaders(options), this.props);
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
      post('/api/v1/apps/accessToken/' + appId, {}, undefined, this.props, accessToken),
    );
    return {
      ...tokenApiResult,
      validationRequest: {
        url: getUrlOfPath(this.props, VALIDATE_APP_ACCESS_TOKEN_PATH),
        headers: {
          'Content-Type': 'application/json',
          [HEADER_X_ACROLINX_CLIENT]: getAcrolinxClientHttpHeader(this.props),
          [HEADER_X_ACROLINX_AUTH]: tokenApiResult.appAccessToken,
        },
      },
    };
  }

  public async validateAppAccessToken(appToken: AppAccessToken): Promise<AppAccessTokenValidationResult> {
    return getData(this.getJsonFromPath(VALIDATE_APP_ACCESS_TOKEN_PATH, appToken));
  }

  public async getCapabilities(accessToken: AccessToken): Promise<PlatformCapabilities> {
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
    const instruments = await this.getTelemetryInstruments(accessToken);
    instruments?.metrics.defaultCounters.check.add(1);
    return post<CheckResponse>('/api/v1/checking/checks', req, {}, this.props, accessToken);
  }

  public async getLiveSuggestions(accessToken: AccessToken, req: LiveSearchRequest): Promise<LiveSearchResponse> {
    return post<LiveSearchResponse>(
      '/reuse-service/api/v1/phrases/preferred/with-description',
      req,
      {},
      this.props,
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
    const asyncStartedProcessPromise = post<AsyncStartedProcess>(
      '/api/v1/apps/analyses',
      req,
      headers,
      this.props,
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
    return post<ServerNotificationResponse>(
      '/api/v1/broadcasts/platform-notifications/',
      notification,
      {},
      this.props,
      accessToken,
    );
  }

  public getDictionaryCapabilities(accessToken: AccessToken): Promise<DictionaryCapabilities> {
    return getData(this.getJsonFromPath('/api/v1/dictionary/capabilities', accessToken));
  }

  public addToDictionary(accessToken: AccessToken, req: AddToDictionaryRequest): Promise<AddToDictionaryResponse> {
    return getData(post('/api/v1/dictionary/submit', req, {}, this.props, accessToken));
  }

  public getUserData(accessToken: AccessToken, id: UserId): Promise<User> {
    return getData(this.getJsonFromPath('/api/v1/user/' + id, accessToken));
  }

  public setUserCustomFields(accessToken: AccessToken, id: UserId, customFieldValues: KeyValuePair[]): Promise<User> {
    const requestBody = { id, customFields: customFieldValues };
    return getData(put('/api/v1/user/' + id, requestBody, {}, this.props, accessToken));
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
    return getData(put('/api/v1/document/' + documentId, requestBody, {}, this.props, accessToken));
  }

  public async getJsonFromPath<T>(
    path: string,
    accessToken?: AccessToken,
    opts?: AdditionalRequestOptions,
  ): Promise<T> {
    return this.getJsonFromUrl<T>(getUrlOfPath(this.props, path), accessToken, opts);
  }

  public async getJsonFromUrl<T>(
    url: string,
    accessToken?: AccessToken,
    opts: AdditionalRequestOptions = {},
  ): Promise<T> {
    return fetchJson(url, this.props, {
      headers: {
        ...getCommonHeaders(this.props, accessToken, opts.serviceType),
        ...opts.headers,
      },
    });
  }

  public async postJsonToPath<T>(
    path: string,
    body: any,
    accessToken?: AccessToken,
    opts: AdditionalRequestOptions = {},
  ): Promise<T> {
    const url = getUrlOfPath(this.props, path);
    return fetchJson(url, this.props, {
      method: 'POST',
      headers: {
        ...getCommonHeaders(this.props, accessToken, opts.serviceType),
        'Content-Type': 'application/json',
        ...opts.headers,
      },
      body: JSON.stringify(body),
    });
  }

  public async getTextFromUrl(
    url: string,
    accessToken?: AccessToken,
    opts: AdditionalRequestOptions = {},
  ): Promise<string> {
    const httpRequest = { url, method: 'GET' };
    return fetchWithProps(url, this.props, {
      headers: {
        ...getCommonHeaders(this.props, accessToken, opts.serviceType),
        ...opts.headers,
      },
    }).then(
      (res) => handleExpectedTextResponse(httpRequest, res),
      (error) => wrapFetchError(httpRequest, error),
    );
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

    async function cancel() {
      canceledByClient = true;
      cancelPromiseReject(createCheckCanceledByClientError());
      await cancelOnServerIfPossibleAndStillNeeded();
    }

    const handlePotentialCancellation = async () => {
      if (canceledByClient) {
        await cancelOnServerIfPossibleAndStillNeeded();
        // We don't want to poll forever if the canceling does not work on the server.
        // To be consistent we throw the same exception, that the server would throw while polling.
        throw createCheckCanceledByClientError();
      }
    };

    const cancelOnServerIfPossibleAndStillNeeded = async () => {
      if (!requestedCanceledOnServer && runningCheck) {
        requestedCanceledOnServer = true;
        await this.cancelAsyncStartedProcess(accessToken, runningCheck, opts);
      }
    };

    const poll = async (): Promise<Result> => {
      runningCheck = await asyncStartedProcessPromise;
      await handlePotentialCancellation();

      let checkResultOrProgress: AsyncApiResponse<Result>;
      do {
        checkResultOrProgress = await this.pollForAsyncResult(accessToken, runningCheck, opts);
        await handlePotentialCancellation();

        if (isProgressResponse(checkResultOrProgress)) {
          if (opts.onProgress) {
            opts.onProgress(checkResultOrProgress.progress);
          }

          await waitMs(checkResultOrProgress.progress.retryAfter * 1000);
          await handlePotentialCancellation();
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

  private async deleteUrl<T>(url: string, accessToken: AccessToken, opts: AdditionalRequestOptions = {}): Promise<T> {
    return fetchJson(url, this.props, {
      headers: {
        ...getCommonHeaders(this.props, accessToken, opts.serviceType),
        ...opts.headers,
      },
      method: 'DELETE',
    });
  }
}

function getData<T>(promise: Promise<SuccessResponse<T>>): Promise<T> {
  return promise.then((r) => r.data);
}

function createCheckCanceledByClientError() {
  return new CheckCanceledByClientError({
    detail: 'The check was canceled. No result is available.',
    type: ErrorType.CheckCanceled,
    title: 'Check canceled',
    status: 400,
  });
}
