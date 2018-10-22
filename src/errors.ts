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


  public constructor(props: AcrolinxErrorProps) {
    super(props.title);
    this.type = props.type;
    this.status = props.status;
    this.title = props.title;
    this.detail = props.detail;
    this.reference = props.reference;
    this.validationDetails = props.validationDetails;
    this.cause = props.cause;
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

