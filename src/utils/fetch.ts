/*
 * Copyright 2018-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AcrolinxError, createErrorFromFetchResponse, ErrorType, HttpRequest} from '../errors';

// TODO: Simplify as soon as all API Urls wrap the error
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
