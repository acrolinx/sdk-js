/*
 * Copyright 2025-present Acrolinx GmbH
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

import { http, HttpResponse } from 'msw';
import { server } from './msw-setup';

// Helper to create a simple HTTP mock for any method
function mockHttp(method: 'get' | 'post' | 'put' | 'delete', path: string, response: any, status = 200) {
  // Strip query parameters from path for MSW pattern matching
  const pathWithoutQuery = path.split('?')[0];
  const handler = http[method](`*${pathWithoutQuery}`, ({ request }) => {
    // If the original path had query parameters, validate them
    if (path.includes('?')) {
      const url = new URL(request.url);
      const originalUrl = new URL(`http://dummy${path}`);

      // Check if all query parameters match
      for (const [key, value] of originalUrl.searchParams.entries()) {
        if (url.searchParams.get(key) !== value) {
          return HttpResponse.json({ error: 'Query parameter mismatch' }, { status: 400 });
        }
      }
    }
    return HttpResponse.json(response, { status });
  });
  server.use(handler);
  return handler;
}

// Helper to create a simple GET mock
export function mockGet(path: string, response: any, status = 200) {
  return mockHttp('get', path, response, status);
}

// Helper to create a simple POST mock
export function mockPost(path: string, response: any, status = 200) {
  return mockHttp('post', path, response, status);
}

// Helper to create a simple PUT mock
export function mockPut(path: string, response: any, status = 200) {
  return mockHttp('put', path, response, status);
}

// Helper to create a simple DELETE mock
export function mockDelete(path: string, response: any, status = 200) {
  return mockHttp('delete', path, response, status);
}

// Helper to create a mock that throws a network error
export function mockNetworkError(path: string) {
  // Strip query parameters from path for MSW pattern matching
  const pathWithoutQuery = path.split('?')[0];
  const handler = http.all(`*${pathWithoutQuery}`, () => {
    return HttpResponse.error();
  });
  server.use(handler);
  return handler;
}

// Helper to create a mock with custom logic
export function mockWithLogic(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  handler: (info: any) => Response | Promise<Response>,
) {
  // Strip query parameters from path for MSW pattern matching
  const pathWithoutQuery = path.split('?')[0];
  const mswHandler = http[method.toLowerCase() as keyof typeof http](`*${pathWithoutQuery}`, handler);
  server.use(mswHandler);
  return mswHandler;
}

// Helper to get the last request
export function getLastRequest() {
  // Note: MSW doesn't have a direct equivalent to fetchMock.lastCall()
  // You might need to track requests manually or use a different approach
  // This is a placeholder for now
  return null;
}

// Helper to clear all mocks
export function clearAllMocks() {
  server.resetHandlers();
}

// Helper to create a mock that validates headers
export function mockWithHeaderValidation(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  response: any,
  validateHeaders?: (headers: Headers) => boolean,
) {
  // Strip query parameters from path for MSW pattern matching
  const pathWithoutQuery = path.split('?')[0];
  const handler = http[method.toLowerCase() as keyof typeof http](`*${pathWithoutQuery}`, ({ request }) => {
    if (validateHeaders && !validateHeaders(request.headers)) {
      return HttpResponse.json({ error: 'Invalid headers' }, { status: 400 });
    }
    return HttpResponse.json(response);
  });
  server.use(handler);
  return handler;
}

// Helper to create a mock that validates request body
export function mockWithBodyValidation(
  method: 'POST' | 'PUT' | 'PATCH',
  path: string,
  response: any,
  validateBody?: (body: any) => boolean,
) {
  // Strip query parameters from path for MSW pattern matching
  const pathWithoutQuery = path.split('?')[0];
  const handler = http[method.toLowerCase() as keyof typeof http](`*${pathWithoutQuery}`, async ({ request }) => {
    if (validateBody) {
      const body = await request.json();
      if (!validateBody(body)) {
        return HttpResponse.json({ error: 'Invalid body' }, { status: 400 });
      }
    }
    return HttpResponse.json(response);
  });
  server.use(handler);
  return handler;
}

// Telemetry-specific helpers to eliminate duplication in telemetry tests
export function mockTelemetryConfig(
  acrolinxUrl: string,
  config: {
    telemetryEnabled?: boolean | string;
    telemetryEndpoint?: string;
    activateGetSuggestionReplacement?: boolean;
    status?: number;
  } = {},
) {
  const { telemetryEnabled = true, telemetryEndpoint, activateGetSuggestionReplacement = true, status = 200 } = config;

  const response: any = {
    activateGetSuggestionReplacement,
  };

  if (telemetryEnabled !== undefined) {
    response.telemetryEnabled = telemetryEnabled;
  }

  if (telemetryEndpoint !== undefined) {
    response.telemetryEndpoint = telemetryEndpoint;
  }

  return mockGet(`${acrolinxUrl}/int-service/api/v1/config`, response, status);
}

// Helper to create telemetry config with enabled telemetry
export function mockTelemetryEnabled(acrolinxUrl: string, telemetryEndpoint?: string) {
  return mockTelemetryConfig(acrolinxUrl, {
    telemetryEnabled: true,
    telemetryEndpoint,
  });
}

// Helper to create telemetry config with disabled telemetry
export function mockTelemetryDisabled(acrolinxUrl: string) {
  return mockTelemetryConfig(acrolinxUrl, {
    telemetryEnabled: false,
  });
}

// Helper to create telemetry config with string telemetry enabled
export function mockTelemetryEnabledString(acrolinxUrl: string) {
  return mockTelemetryConfig(acrolinxUrl, {
    telemetryEnabled: 'true',
  });
}

// Helper to create telemetry config with missing telemetry config
export function mockTelemetryConfigMissing(acrolinxUrl: string) {
  return mockGet(`${acrolinxUrl}/int-service/api/v1/config`, {
    activateGetSuggestionReplacement: true,
    // telemetryEnabled is intentionally omitted
  });
}

// Helper to create telemetry config with server error
export function mockTelemetryConfigError(acrolinxUrl: string) {
  return mockTelemetryConfig(acrolinxUrl, {
    status: 500,
  });
}
