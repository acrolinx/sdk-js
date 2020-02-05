import {DocumentId} from './document-descriptor';

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
  CheckCancelled = 'checkCancelled',
  CheckFailed = 'checkFailed',
  CustomFieldsIncorrect = 'customFieldsIncorrect',
  Validation = 'validation',
  InsufficientPrivileges = 'insufficientPrivileges',
  GuidanceProfileDoesNotExist = 'guidanceProfileDoesntExist',
  InvalidBaseUrl = 'invalidBaseUrl',
  NoGuidanceProfileConfigured = 'noGuidanceProfileConfigured',
  AppSignatureRejected = 'appSignatureRejected',
  LicenseLimitExceeded = 'licenseLimitExceeded'
}

export interface AcrolinxErrorProps {
  title: string;
  detail: string;
  type: string;
  httpRequest?: HttpRequest;
  status?: number;
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
}

export class AcrolinxError extends Error implements AcrolinxErrorProps {
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly httpRequest?: HttpRequest;
  public readonly status?: number;
  public readonly reference?: string;
  public readonly cause?: Error;
  public readonly validationDetails?: ValidationDetail[];
  public readonly documentId?: DocumentId;


  public constructor(props: AcrolinxErrorProps) {
    super(props.title);
    this.type = props.type;
    this.status = props.status;

    // Copy only known props, to avoid accidental leaking of stuff.
    this.httpRequest = props.httpRequest ? {
      url: props.httpRequest.url,
      method: props.httpRequest.method
    } : undefined;

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
  jsonBody: any | AcrolinxApiError
): AcrolinxError {
  if (jsonBody.type) {
    return new AcrolinxError({
      detail: jsonBody.detail || 'Unknown HTTP Error',
      status: jsonBody.status || res.status,
      httpRequest: req,
      title: jsonBody.title || res.statusText,
      validationDetails: jsonBody.validationDetails,
      reference: jsonBody.reference,
      type: jsonBody.type,
      documentId: jsonBody.documentId,
    });
  } else {
    return new AcrolinxError({
      detail: `${res.statusText}:${JSON.stringify(jsonBody)}`,
      status: res.status,
      httpRequest: req,
      title: 'Unknown HTTP Error',
      type: ErrorType.HttpErrorStatus,
    });
  }
}


export function wrapFetchError(httpRequest: HttpRequest, error: Error): Promise<any> {
  throw new AcrolinxError({
    detail: `${error.message} (${error.name}, URL: ${httpRequest.url}, Method: ${httpRequest.method})`,
    title: 'Http Connection Problem',
    httpRequest,
    type: ErrorType.HttpConnectionProblem,
    cause: error
  });
}

export class CheckCancelledByClientError extends AcrolinxError {
  constructor(props: AcrolinxErrorProps) {
    super(props);
    setCorrectErrorPrototype(this, CheckCancelledByClientError);
  }
}

function setCorrectErrorPrototype<T>(self: T, clazz: new(...args: any[]) => T) {
  // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
  (Object as any).setPrototypeOf(self, clazz.prototype);
}
