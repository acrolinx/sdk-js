import {AcrolinxApiError, AcrolinxError, ErrorType} from '../errors';


// TODO: Simplify as soon as all API Urls wraps the error
export async function handleExpectedJsonResponse<T>(res: Response): Promise<T> {
  if (200 <= res.status && res.status < 300) {
    const jsonResult = await toJson<any>(res);
    if (jsonResult.error) {
      throw createError(res, jsonResult.error);
    }
    return jsonResult;
  } else {
    let error;
    try {
      const jsonError = await toJson<any>(res);
      if (jsonError.error) {
        error = createError(res, jsonError.error);
      } else {
        error = createError(res, jsonError);
      }
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
      type: ErrorType.InvalidJson,
    });
  });
}

function createError(res: Response, jsonBody: any | AcrolinxApiError): AcrolinxError {
  if (jsonBody.type) {
    return new AcrolinxError({
      detail: jsonBody.detail || 'Unknown HTTP Error',
      status: jsonBody.status || res.status,
      title: jsonBody.title || res.statusText,
      validationDetails: jsonBody.validationDetails,
      type: jsonBody.type,
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
