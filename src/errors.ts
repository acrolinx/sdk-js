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

import { DocumentId } from './document-descriptor';
import { isAIServiceError } from './services/ai-service/ai-service.utils';
import { errorIdGenerator } from './utils/errorid-generator';

/**
 * See also https://github.com/acrolinx/server-api-spec/blob/master/apiary.apib
 * and https://acrolinxapi.docs.apiary.io/#introduction/response-format/error-responses
 */
export enum ErrorType {
  HttpErrorStatus = 'http_error_status',
  HttpConnectionProblem = 'http_connection_problem',
  InvalidJson = 'invalid_json',
  Client = 'client',
  Server = 'server',
  ClientSignatureMissing = 'clientSignatureMissing',
  ClientSignatureRejected = 'clientSignatureRejected',
  Auth = 'auth',
  SSO = 'sso',
  NotFound = 'not_found',
  SigninTimedOut = 'interactiveSignInTimedOut',
  CheckCanceled = 'checkCancelled',
  CheckFailed = 'checkFailed',
  CustomFieldsIncorrect = 'customFieldsIncorrect',
  Validation = 'validation',
  InsufficientPrivileges = 'insufficientPrivileges',
  GuidanceProfileDoesNotExist = 'guidanceProfileDoesntExist',
  InvalidBaseUrl = 'invalidBaseUrl',
  NoGuidanceProfileConfigured = 'noGuidanceProfileConfigured',
  AppSignatureRejected = 'appSignatureRejected',
  LicenseLimitExceeded = 'licenseLimitExceeded',
  RequestTimeout = 'request_timeout',
}

export interface AcrolinxErrorProps {
  title: string;
  detail: string;
  type: string;
  id?: string;
  httpRequest?: HttpRequest;
  status?: number;
  responseHeaders?: Headers;
  reference?: string;
  validationDetails?: ValidationDetail[];
  cause?: Error;

  /**
   * Returned if {@link CustomFieldsIncorrect.CustomFieldsIncorrect} happens while checking.
   */
  documentId?: DocumentId;
}

export interface ValidationDetail {
  title: string;
  constraint: string;
  attributePath: string;
  detail: string;
  invalidValue: any;
  possibleValues?: any[];
}

export interface HttpRequest {
  url: string;
  method: string;
}

export interface AcrolinxApiError extends AcrolinxErrorProps {
  status: number;
  error_description?: string;
  error?: string;
}

export class AcrolinxError extends Error implements AcrolinxErrorProps {
  public readonly id: string;
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly httpRequest?: HttpRequest;
  public readonly status?: number;
  public readonly responseHeaders?: Headers;
  public readonly reference?: string;
  public readonly cause?: Error;
  public readonly validationDetails?: ValidationDetail[];
  public readonly documentId?: DocumentId;

  public constructor(props: AcrolinxErrorProps) {
    super(props.title);
    this.id = props.id || errorIdGenerator.generateUniqueErrorIdString();
    this.type = props.type;
    this.status = props.status;
    this.responseHeaders = props.responseHeaders;

    // Copy only known props, to avoid accidental leaking of stuff.
    this.httpRequest = props.httpRequest
      ? {
          url: props.httpRequest.url,
          method: props.httpRequest.method,
        }
      : undefined;

    this.title = props.title;
    this.detail = props.detail;
    this.reference = props.reference;
    this.validationDetails = props.validationDetails;
    this.cause = props.cause;
    this.documentId = props.documentId;
  }
}

export function createErrorFromFetchResponse(
  req: HttpRequest,
  res: Response,
  jsonBody: AcrolinxApiError | undefined,
): AcrolinxError {
  if (isAIServiceError(jsonBody)) {
    return new AcrolinxError({
      detail: jsonBody.errorDescription,
      status: jsonBody.httpErrorCode,
      type: jsonBody.errorId,
      title: jsonBody.errorTitle,
      httpRequest: req,
    });
  } else if (jsonBody && jsonBody.type) {
    return new AcrolinxError({
      detail: jsonBody.detail || 'Unknown HTTP Error',
      status: jsonBody.status || res.status,
      responseHeaders: res.headers,
      httpRequest: req,
      title: jsonBody.title || res.statusText,
      validationDetails: jsonBody.validationDetails,
      reference: jsonBody.reference,
      type: jsonBody.type,
      documentId: jsonBody.documentId,
    });
  } else {
    return new AcrolinxError({
      detail: formatGenericErrorDetail(res.statusText, jsonBody),
      status: res.status,
      httpRequest: req,
      title: 'Unknown HTTP Error',
      type: ErrorType.HttpErrorStatus,
    });
  }
}

function formatGenericErrorDetail(statusText: string, jsonBody: AcrolinxApiError | undefined): string {
  let detail = statusText;

  if (jsonBody) {
    try {
      detail += ':' + JSON.stringify(jsonBody);
    } catch (error) {
      console.error('Error stringifying JSON:', error);
      detail += ':[JSON stringify error]';
    }
  }

  return detail;
}

export function wrapFetchError(httpRequest: HttpRequest, error: Error): Promise<any> {
  throw new AcrolinxError({
    detail: `${error.message} (${error.name}, URL: ${httpRequest.url}, Method: ${httpRequest.method})`,
    title: 'Http Connection Problem',
    httpRequest,
    type: ErrorType.HttpConnectionProblem,
    cause: error,
  });
}

export class CheckCanceledByClientError extends AcrolinxError {
  constructor(props: AcrolinxErrorProps) {
    super(props);
    setCorrectErrorPrototype(this, CheckCanceledByClientError);
  }
}

function setCorrectErrorPrototype<T>(self: T, clazz: new (...args: any[]) => T) {
  // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
  Object.setPrototypeOf(self, clazz.prototype);
}
