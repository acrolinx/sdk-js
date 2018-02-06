export enum ErrorType {
  HttpErrorStatus = 'http_error_status',
  HttpConnectionProblem = 'http_connection_problem',
  Unknown = 'unknown_error',
  InvalidJson = 'invalid_json',

  // https://github.com/acrolinx/server-api-spec/blob/master/apiary.apib
  Client = 'https://acrolinx.com/apispec/v1/errors/client',
  Server = 'https://acrolinx.com/apispec/v1/errors/server',
  ClientSignatureMissing = 'https://acrolinx.com/apispec/v1/errors/client_signature_missing',
  ClientSignatureRejected = 'https://acrolinx.com/apispec/v1/errors/client_signature_rejected',
  Auth = 'https://acrolinx.com/apispec/v1/errors/auth',
  NotFound = 'https://acrolinx.com/apispec/v1/errors/not_found'
}

export interface AcrolinxErrorProps {
  title: string;
  detail: string;
  type: string;
  status?: number;
  reference?: string;
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

  public constructor(props: AcrolinxErrorProps) {
    super(props.title);
    this.type = props.type;
    this.status = props.status;
    this.title = props.title;
    this.detail = props.detail;
    this.reference = props.reference;
  }
}

export function wrapFetchError(error: Error): Promise<any> {
  throw new AcrolinxError({
    detail: error.message,
    title: 'Http Connection Problem',
    type: ErrorType.HttpConnectionProblem,
  });
}

