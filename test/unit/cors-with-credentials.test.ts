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

import { AcrolinxEndpoint } from '../../src/index';
import { SigninLinksResult } from '../../src/signin';
import { AcrolinxServerMock, mockAcrolinxServer, restoreOriginalFetch } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL } from './common';
import { describe, afterEach, expect, beforeEach, test } from 'vitest';

describe('corsWithCredentials', () => {
  let endpoint: AcrolinxEndpoint;
  let mockedAcrolinxServer: AcrolinxServerMock;

  beforeEach(() => {
    mockedAcrolinxServer = mockAcrolinxServer(DUMMY_SERVER_URL);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  test('corsWithCredentials === true should set fetch option credentials to "include"', async () => {
    endpoint = new AcrolinxEndpoint({ ...DUMMY_ENDPOINT_PROPS, corsWithCredentials: true });

    const result = (await endpoint.signin()) as SigninLinksResult;

    expect(result).toBeDefined();
    expect(mockedAcrolinxServer.requests[0].opts.credentials).toEqual('include');
  });

  /**
   * Ensure credentials: 'same-origin' in old browsers: https://github.com/github/fetch#sending-cookies
   */
  test('corsWithCredentials !== true should set fetch option credentials to "same-origin"', async () => {
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);

    const result = (await endpoint.signin()) as SigninLinksResult;

    expect(result).toBeDefined();
    expect(mockedAcrolinxServer.requests[0].opts.credentials).toEqual('same-origin');
  });
});
