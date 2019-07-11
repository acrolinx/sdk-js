import {AcrolinxError, createErrorFromFetchResponse, ErrorType, HttpRequest} from '../errors';

// TODO: Simplify as soon as all API Urls wraps the error
export async function handleExpectedJsonResponse<T>(req: HttpRequest, res: Response): Promise<T> {
  if (200 <= res.status && res.status < 300) {
    const jsonResult = await toJson<any>(req, res);
    if (jsonResult.error) {
      throw createErrorFromFetchResponse(req, res, jsonResult.error);
    }
    return jsonResult;
  } else {
    throw await createErrorFromResponse(req, res);
  }
}

export async function handleExpectedTextResponse(req: HttpRequest, res: Response): Promise<string> {
  if (200 <= res.status && res.status < 300) {
    return res.text();
  } else {
    throw await createErrorFromResponse(req, res);
  }
}

async function createErrorFromResponse(req: HttpRequest, res: Response): Promise<Error> {
  let error;
  try {
    const jsonError = await toJson<any>(req, res);
    if (jsonError.error) {
      error = createErrorFromFetchResponse(req, res, jsonError.error);
    } else {
      error = createErrorFromFetchResponse(req, res, jsonError);
    }
  } catch {
    error = createErrorFromFetchResponse(req, res, {});
  }
  return error;
}

export function toJson<T>(httpRequest: HttpRequest, res: Response): T | Promise<T> {
  return res.json().catch(e => {
    throw new AcrolinxError({
      detail: e.message,
      httpRequest,
      title: 'Invalid Json',
      type: ErrorType.InvalidJson,
    });
  });
}
