export enum ErrorType {
  httpError = 'https://acrolinx.com/apispec/v1/errors/http-error',
  unknownError = 'https://acrolinx.com/apispec/v1/errors/unknown-error',
  invalidJson = 'https://acrolinx.com/apispec/v1/errors/invalid-json',
  client = 'https://acrolinx.com/apispec/v1/errors/client',
  client_signature_missing = 'https://acrolinx.com/apispec/v1/errors/client_signature_missing',
  client_signature_invalid = 'https://acrolinx.com/apispec/v1/errors/client_signature_invalid',
  auth_token_missing = 'https://acrolinx.com/apispec/v1/errors/auth_token_missing',
  not_found = 'https://acrolinx.com/apispec/v1/errors/not_found'
}

export interface AcrolinxErrorProps {
  detail: string;
  status?: number;
  title: string;
  type: string;
}

export interface AcrolinxApiError extends AcrolinxErrorProps {
  status: number;
}

export class AcrolinxError extends Error implements AcrolinxErrorProps {
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly status?: number;

  public constructor(props: AcrolinxErrorProps) {
    super(props.title);
    this.type = props.type;
    this.status = props.status;
    this.title = props.title;
    this.detail = props.detail;
  }
}

export function wrapUnknownError(error: Error): Promise<any> {
  throw new AcrolinxError({
    detail: error.message,
    title: 'Unknown Error',
    type: ErrorType.unknownError,
  });
}

