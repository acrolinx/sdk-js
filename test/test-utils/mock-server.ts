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

// Re-export everything from the MSW version to maintain compatibility
export {
  SIGNIN_URL_EXPIRED_ERROR,
  DUMMY_SIGNIN_LINK_PATH_INTERACTIVE,
  DUMMY_ACCESS_TOKEN,
  DUMMY_USER_ID,
  DUMMY_USER_NAME,
  DUMMY_RETRY_AFTER,
  DUMMY_INTERACTIVE_LINK_TIMEOUT,
  ALLOWED_CLIENT_SIGNATURES,
  SSO_GENERIC_TOKEN,
  LoggedRequest,
  SsoMockMode,
  AcrolinxServerMock,
} from './msw-acrolinx-server';

import { server } from './msw-setup';
import { AcrolinxServerMock, createBrokenJsonServer } from './msw-acrolinx-server';

// Compatibility functions that maintain the same API as the old fetch-mock version
export function mockAcrolinxServer(url: string): AcrolinxServerMock {
  const mockedServer = new AcrolinxServerMock(url);
  server.use(...mockedServer.getHandlers());
  return mockedServer;
}

export function mockBrokenJsonServer(url: string) {
  server.use(createBrokenJsonServer(url));
}

export function restoreOriginalFetch() {
  server.resetHandlers();
}

// Re-export types for compatibility
export interface StringMap {
  [key: string]: string;
}

// Re-export the old interface for compatibility
export interface MockResponseObjectOf<T extends string | {} | undefined> {
  body: T;
  status?: number;
  headers?: Record<string, string>;
}
