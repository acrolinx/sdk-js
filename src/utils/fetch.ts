import {AcrolinxApiError, AcrolinxError, ErrorType} from '../errors';

export async function handleExpectedJsonResponse<T>(res: Response): Promise<T> {
  if (200 <= res.status && res.status < 300) {
    return toJson<T>(res);
  } else {
    let error;
    try {
      const jsonError = await toJson<AcrolinxApiError>(res);
      error = createError(res, jsonError);
    } catch {
      error = createError(res, {});
    }
    throw error;
  }
}

export function toJson<T>(res: Response): T | Promise<T> {
  return res.json().catch(e => {
    throw new AcrolinxError({
      detail: e.message,
      title: 'Invalid Json',
      type: ErrorType.invalidJson,
    });
  });
}

function createError(res: Response, jsonBody: any | AcrolinxApiError): AcrolinxError {
  if (jsonBody.type) {
    return new AcrolinxError({
      detail: jsonBody.detail || 'Unknown HTTP Error',
      status: jsonBody.status || res.status,
      title: jsonBody.title || res.statusText,
      type: jsonBody.type,
    });
  } else {
    return new AcrolinxError({
      detail: res.statusText,
      status: res.status,
      title: 'Unknown HTTP Error',
      type: ErrorType.httpError,
    });
  }
}
