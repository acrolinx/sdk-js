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
  HasTermHarvestingReport,
  KeyValuePair,
  Report,
  TermHarvestingReport
} from './check';
import {
  ApiResponse,
  AsyncApiResponse,
  AsyncStartedProcess,
  AuthToken,
  isProgressResponse,
  Progress,
  StringMap,
  SuccessResponse,
  UserId
} from './common-types';
import {AddToDictionaryRequest, AddToDictionaryResponse, DictionaryCapabilities} from './dictionary';
import {DocumentDescriptor, DocumentId, sanitizeDocumentDescriptor} from './document-descriptor';
import {AcrolinxError, CheckCancelledByClientError, ErrorType, wrapFetchError} from './errors';
import {AnalysisRequest, ExtractionResult} from './extraction';
import {
  HEADER_X_ACROLINX_APP_SIGNATURE,
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
  SigninResult,
  SigninSuccessResult
} from './signin';
import {User} from './user';
import {handleExpectedJsonResponse, handleExpectedTextResponse} from './utils/fetch';
import * as logging from './utils/logging';
import {waitMs} from './utils/mixed-utils';

export * from './dictionary';
export * from './extraction';
export {isSigninSuccessResult, AuthorizationType} from './signin';
export {AcrolinxApiError} from './errors';
export {setLoggingEnabled} from './utils/logging';
export {SigninSuccessResult, isSigninLinksResult, PollMoreResult, SigninResult, SigninLinksResult};
export {
  AcrolinxError,
  AuthToken,
  CheckingCapabilities,
  CheckCancelledByClientError,
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
  Report
};

export {HEADER_X_ACROLINX_APP_SIGNATURE};

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
export const DEVELOPMENT_APP_SIGNATURE = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiS2lsbGVyIEFwcCIsImlkIjoiNGVlZDM3NjctMGYzMS00ZDVmLWI2MjktYzg2MWFiM2VkODUyIiwidHlwZSI6IkFQUCIsImlhdCI6MTU2MTE4ODI5M30.zlVJuGITMjAJ2p4nl-qtpj4N0p_8e4tenr-4dkrGdXg';

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

export interface HasAuthToken {
  authToken: string;  // TODO: accessToken
}

export function hasAuthToken(signinOptions: SigninOptions): signinOptions is HasAuthToken {
  return !!((signinOptions as HasAuthToken).authToken);
}

export function isSsoSigninOption(signinOptions: SigninOptions): signinOptions is SsoSigninOption {
  const potentialSsoOptions = signinOptions as SsoSigninOption;
  return !!(potentialSsoOptions.password && potentialSsoOptions.userId);
}

export interface SsoSigninOption {
  userId: string;
  password: string;
}

export type SigninOptions = HasAuthToken | SsoSigninOption | {};

export interface CheckAndGetResultOptions {
  onProgress?(progress: Progress): void;
}

export interface AdditionalRequestOptions {
  headers?: StringMap;
}

export interface CancelablePollLoopOptions extends CheckAndGetResultOptions, AdditionalRequestOptions {
}

export interface CancelablePromiseWrapper<T> {
  promise: Promise<T>;

  cancel(): void;
}

export class AcrolinxEndpoint {
  public readonly props: AcrolinxEndpointProps;

  constructor(props: AcrolinxEndpointProps) {
    this.props = {
      ...props,
      acrolinxUrl: props.acrolinxUrl.trim().replace(/\/$/, '')
    };
  }

  public setClientLocale(clientLocale: string) {
    this.props.clientLocale = clientLocale;
  }

  // TODO: getPlatformInformation
  public async getPlatformInformation(): Promise<PlatformInformation> {
    return getData<PlatformInformation>(this.getJsonFromPath('/api/v1/'));
  }

  public async signin(options: SigninOptions = {}): Promise<SigninResult> {
    return this.post<SigninResult>('/api/v1/auth/sign-ins', {}, getSigninRequestHeaders(options));
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

  public checkAndGetResult(
    authToken: AuthToken,
    req: CheckRequest,
    opts: CheckAndGetResultOptions = {}
  ): CancelablePromiseWrapper<CheckResult> {
    return this.startCancelablePollLoop(authToken, this.check(authToken, req), opts);
  }

  public analyzeAndPoll(
    authToken: AuthToken,
    req: AnalysisRequest,
    opts: CheckAndGetResultOptions = {}
  ): CancelablePromiseWrapper<ExtractionResult> {
    const headers = {[HEADER_X_ACROLINX_APP_SIGNATURE]: req.appSignature};
    const asyncStartedProcessPromise = this.post<AsyncStartedProcess>('/api/v1/apps/analyses', req, headers, authToken);
    return this.startCancelablePollLoop(authToken, asyncStartedProcessPromise, {...opts, headers});
  }

  public async cancelCheck(authToken: AuthToken, check: CheckResponse): Promise<CancelCheckResponse> {
    return this.cancelAsyncStartedProcess(authToken, check);
  }

  public async pollForCheckResult(authToken: AuthToken, check: CheckResponse): Promise<CheckResultResponse> {
    return this.pollForAsyncResult<CheckResultResponse>(authToken, check);
  }

  public async getAddonCheckResult(authToken: AuthToken, appDataLink: string): Promise<AddonCheckResult> {
    return getData(this.getJsonFromUrl<ApiResponse<AddonCheckResult>>(appDataLink, authToken));
  }

  public async getTermHarvestingReport(authToken: AuthToken,
                                       reports: HasTermHarvestingReport): Promise<TermHarvestingReport> {
    return getData(this.getJsonFromUrl<ApiResponse<TermHarvestingReport>>(reports.termHarvesting.link, authToken));
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
    return this.getJsonFromUrl<T>(this.props.acrolinxUrl + path, authToken);
  }

  public async getJsonFromUrl<T>(url: string, authToken?: AuthToken, opts: AdditionalRequestOptions = {}): Promise<T> {
    return this.fetchJson(url, {
      headers: {...this.getCommonHeaders(authToken), ...opts.headers},
    });
  }

  public async getTextFromUrl(
    url: string,
    authToken?: AuthToken,
    opts: AdditionalRequestOptions = {}
  ): Promise<string> {
    const httpRequest = {url, method: 'GET'};
    return this.fetch(url, {
      headers: {...this.getCommonHeaders(authToken), ...opts.headers},
    }).then(
      res => handleExpectedTextResponse(httpRequest, res),
      error => wrapFetchError(httpRequest, error)
    );
  }

  private startCancelablePollLoop<Result>(
    authToken: AuthToken,
    asyncStartedProcessPromise: Promise<AsyncStartedProcess>,
    opts: CancelablePollLoopOptions = {}
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
        /* tslint:disable-next-line:no-floating-promises */
        this.cancelAsyncStartedProcess(authToken, runningCheck, opts);
      }
    };

    const poll = async (): Promise<Result> => {
      runningCheck = await asyncStartedProcessPromise;
      handlePotentialCancellation();

      let checkResultOrProgress: AsyncApiResponse<Result>;
      do {
        checkResultOrProgress = await this.pollForAsyncResult(authToken, runningCheck, opts);
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
      cancel
    };
  }


  private async pollForAsyncResult<R>(
    authToken: AuthToken,
    check: AsyncStartedProcess,
    opts: AdditionalRequestOptions = {}
  ): Promise<R> {
    return this.getJsonFromUrl<R>(check.links.result, authToken, opts);
  }

  private async cancelAsyncStartedProcess<CancelResponse>(
    authToken: AuthToken,
    process: AsyncStartedProcess,
    opts: AdditionalRequestOptions = {}
  ): Promise<CancelResponse> {
    return this.deleteUrl<CancelResponse>(process.links.cancel, authToken, opts);
  }

  private getCommonHeaders(authToken?: AuthToken): StringMap {
    const headers: StringMap = {
      'Content-Type': 'application/json',
      [HEADER_X_ACROLINX_BASE_URL]: this.props.acrolinxUrl,
      [HEADER_X_ACROLINX_CLIENT]: `${this.props.client.signature}; ${this.props.client.version}`,
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
    return this.fetchJson(this.props.acrolinxUrl + path, {
      body: JSON.stringify(body),
      headers: {...this.getCommonHeaders(authToken), ...headers},
      method,
    });
  }

  private async deleteUrl<T>(url: string, authToken: AuthToken, opts: AdditionalRequestOptions = {}): Promise<T> {
    return this.fetchJson(url, {
      headers: {...this.getCommonHeaders(authToken), ...opts.headers},
      method: 'DELETE',
    });
  }


  private async fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const httpRequest = {
      url,
      method: init.method || 'GET'
    };
    return this.fetch(url, init).then((res) => handleExpectedJsonResponse(httpRequest, res),
      error => wrapFetchError(httpRequest, error));
  }

  /* tslint:disable:no-console */
  private async fetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const fetchFunction = this.props.fetch || fetch;
    const fetchProps: RequestInit = {
      ...init,
      // Ensure credentials: 'same-origin' in old browsers: https://github.com/github/fetch#sending-cookies
      credentials: this.props.corsWithCredentials ? 'include' : 'same-origin',
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

function getSigninRequestHeaders(options: SigninOptions = {}): StringMap {
  if (hasAuthToken(options)) {
    return {[HEADER_X_ACROLINX_AUTH]: options.authToken};
  } else if (isSsoSigninOption(options)) {
    return {
      username: options.userId,
      password: options.password,
    };
  } else {
    return {};
  }
}

function createCheckCanceledByClientError() {
  return new CheckCancelledByClientError({
    detail: 'The check was cancelled. No result is available.',
    type: ErrorType.CheckCancelled,
    title: 'Check cancelled',
    status: 400
  });
}
