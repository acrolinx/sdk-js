import {AcrolinxError, createErrorFromFetchResponse, ErrorType} from '../errors';


// TODO: Simplify as soon as all API Urls wraps the error
export async function handleExpectedJsonResponse<T>(res: Response): Promise<T> {
  if (200 <= res.status && res.status < 300) {
    const jsonResult = await toJson<any>(res);
    if (jsonResult.error) {
      throw createErrorFromFetchResponse(res, jsonResult.error);
    }
    return jsonResult;
  } else {
    let error;
    try {
      const jsonError = await toJson<any>(res);
      if (jsonError.error) {
        error = createErrorFromFetchResponse(res, jsonError.error);
      } else {
        error = createErrorFromFetchResponse(res, jsonError);
      }
    } catch {
      error = createErrorFromFetchResponse(res, {});
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
