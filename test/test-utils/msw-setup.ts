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
import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Create MSW server instance
export const server = setupServer();

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Re-export commonly used MSW utilities
export { http, HttpResponse };

// Helper function to create a mock response with proper typing
export function createMockResponse<T extends Record<string, any>>(
  data: T,
  status = 200,
  headers?: Record<string, string>,
) {
  return HttpResponse.json(data, { status, headers });
}

// Helper function to create an error response
export function createErrorResponse(status: number, error: any) {
  return HttpResponse.json(error, { status });
}

// Helper function to create a network error
export function createNetworkError() {
  return HttpResponse.error();
}

// Type for request handlers
export type RequestHandler = ReturnType<
  typeof http.get | typeof http.post | typeof http.put | typeof http.delete | typeof http.patch
>;

// Add generic handlers for telemetry endpoints to suppress MSW warnings
server.use(
  http.post(/\/otlp\/metrics$/, () => new Response(null, { status: 200 })),
  http.post(/\/otlp\/logs$/, () => new Response(null, { status: 200 })),
);
