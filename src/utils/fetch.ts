import {AcrolinxError, ErrorType} from '../errors';

export function handleExpectedJsonResponse<T>(res: Response): T | Promise<T> {
  throwErrorForHttpErrorStatus(res);
  return toJson(res);
}

export function toJson<T>(res: Response): T | Promise<T> {
  return res.json().catch(e => {
    throw new AcrolinxError({message: e.message, type: ErrorType.invalidJson});
  });
}

export function throwErrorForHttpErrorStatus(res: Response) {
  if (res.status < 200 || res.status >= 300) {
    throw new AcrolinxError({message: res.statusText, type: ErrorType.httpError, httpStatus: res.status});
  }
}
