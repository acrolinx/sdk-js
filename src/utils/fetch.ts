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

import { AccessToken, AcrolinxEndpointProps, ServiceType, StringMap } from '../index';
import { AcrolinxError, createErrorFromFetchResponse, ErrorType, HttpRequest, wrapFetchError } from '../errors';
import { getCommonHeaders } from '../headers';

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
    if (jsonError.error && typeof jsonError.error === 'object') {
      error = createErrorFromFetchResponse(req, res, jsonError.error);
    } else {
      error = createErrorFromFetchResponse(req, res, jsonError);
    }
  } catch {
    error = createErrorFromFetchResponse(req, res, undefined);
  }
  return error;
}

export function toJson<T>(httpRequest: HttpRequest, res: Response): T | Promise<T> {
  return res.json().catch((e) => {
    throw new AcrolinxError({
      detail: e.message,
      httpRequest,
      title: 'Invalid Json',
      type: ErrorType.InvalidJson,
    });
  });
}

export async function fetchWithProps(
  input: RequestInfo,
  props: AcrolinxEndpointProps,
  init: RequestInit = {},
): Promise<Response> {
  const fetchFunction = props.fetch || fetch;
  const fetchProps: RequestInit = {
    ...init,
    // Ensure credentials: 'same-origin' in old browsers: https://github.com/github/fetch#sending-cookies
    credentials: props.corsWithCredentials ? 'include' : 'same-origin',
    ...(props.additionalFetchProperties || {}),
  };
  if (props.enableHttpLogging) {
    try {
      console.log('Fetch', input, init, props.additionalFetchProperties);
      const result = await fetchFunction(input, fetchProps);
      console.log('Fetched Result', result.status);
      return result;
    } catch (error) {
      console.error('Fetch Error', error);
      throw error;
    }
  } else {
    return fetchFunction(input, fetchProps);
  }
}

export async function fetchJson<T>(url: string, props: AcrolinxEndpointProps, init: RequestInit = {}): Promise<T> {
  const httpRequest = {
    url,
    method: init.method || 'GET',
  };
  return fetchWithProps(url, props, init).then(
    (res) => handleExpectedJsonResponse(httpRequest, res),
    (error) => wrapFetchError(httpRequest, error),
  );
}

export async function send<T>(
  method: 'POST' | 'PUT',
  path: string,
  body: {},
  headers: StringMap = {},
  props: AcrolinxEndpointProps,
  accessToken?: AccessToken,
  serviceType?: ServiceType,
): Promise<T> {
  return fetchJson(getUrlOfPath(props, path), props, {
    body: JSON.stringify(body),
    headers: { ...getCommonHeaders(props, accessToken, serviceType), ...headers },
    method,
  });
}

export function getUrlOfPath(props: AcrolinxEndpointProps, path: string) {
  return props.acrolinxUrl + path;
}

export async function post<T>(
  path: string,
  body: {},
  headers: StringMap = {},
  props: AcrolinxEndpointProps,
  accessToken?: AccessToken,
  serviceType?: ServiceType,
): Promise<T> {
  return send<T>('POST', path, body, headers, props, accessToken, serviceType);
}

export async function put<T>(
  path: string,
  body: {},
  headers: StringMap = {},
  props: AcrolinxEndpointProps,
  accessToken?: AccessToken,
): Promise<T> {
  return send<T>('PUT', path, body, headers, props, accessToken);
}
