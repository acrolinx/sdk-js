import {DocumentId} from './check';

export enum ErrorType {
  HttpErrorStatus = 'http_error_status',
  HttpConnectionProblem = 'http_connection_problem',
  Unknown = 'unknown_error',
  InvalidJson = 'invalid_json',

  // https://github.com/acrolinx/server-api-spec/blob/master/apiary.apib
  Client = 'client',
  Server = 'server',
  ClientSignatureMissing = 'client_signature_missing',
  ClientSignatureRejected = 'client_signature_rejected',
  Auth = 'auth',
  SSO = 'sso',
  NotFound = 'not_found',
  SigninTimedOut = 'interactive_sign_in_timed_out',
  CheckCancelled = 'check_cancelled',
  CustomFieldsIncorrect = 'custom_fields_incorrect',
  Validation = 'validation'
}

export interface AcrolinxErrorProps {
  title: string;
  detail: string;
  type: string;
  status?: number;
  reference?: string;
  validationDetails?: ValidationDetail[];
  cause?: Error;

  /**
   * Returned if {@link CustomFieldsIncorrect.CustomFieldsIncorrect} happens while checking.
   */
  documentId?: DocumentId;
}

interface ValidationDetail  {
  title: string;
  constraint: string;
  attributePath: string;
  detail: string;
  invalidValue: any;
  possibleValues?: any[];
}

export interface AcrolinxApiError extends AcrolinxErrorProps {
  status: number;
}

export class AcrolinxError extends Error implements AcrolinxErrorProps {
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly status?: number;
  public readonly reference?: string;
  public readonly cause?: Error;
  public readonly validationDetails?: ValidationDetail[];
  public readonly documentId?: DocumentId;


  public constructor(props: AcrolinxErrorProps) {
    super(props.title);
    this.type = props.type;
    this.status = props.status;
    this.title = props.title;
    this.detail = props.detail;
    this.reference = props.reference;
    this.validationDetails = props.validationDetails;
    this.cause = props.cause;
    this.documentId = props.documentId;
  }
}

export function createErrorFromFetchResponse(res: Response, jsonBody: any | AcrolinxApiError): AcrolinxError {
  if (jsonBody.type) {
    return new AcrolinxError({
      detail: jsonBody.detail || 'Unknown HTTP Error',
      status: jsonBody.status || res.status,
      title: jsonBody.title || res.statusText,
      validationDetails: jsonBody.validationDetails,
      type: jsonBody.type,
      documentId: jsonBody.documentId,
    });
  } else {
    return new AcrolinxError({
      detail: res.statusText + ':' + JSON.stringify(jsonBody),
      status: res.status,
      title: 'Unknown HTTP Error',
      type: ErrorType.HttpErrorStatus,
    });
  }
}


export function wrapFetchError(error: Error): Promise<any> {
  throw new AcrolinxError({
    detail: `${error.message} (${error.name})`,
    title: 'Http Connection Problem',
    type: ErrorType.HttpConnectionProblem,
    cause: error
  });
}

