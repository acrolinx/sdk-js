export enum ErrorType {
  httpError = 'httpError',
  unknownError = 'unknownError',
  invalidJson = 'invalidJson'
}

export interface AcrolinxErrorProps {
  httpStatus?: number;
  message: string;
  type: ErrorType;
}

export class AcrolinxError extends Error {
  public readonly httpStatus?: number;
  public readonly type: ErrorType;

  public constructor(props: AcrolinxErrorProps) {
    super(props.message);
    this.httpStatus = props.httpStatus;
    this.type = props.type;
  }
}

export function wrapError(error: Error): Promise<any> {
  throw new AcrolinxError({message: error.message, type: ErrorType.unknownError});
}

