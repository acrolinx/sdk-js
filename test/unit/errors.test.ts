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

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { CheckCanceledByClientError, ErrorType } from '../../src/errors';
import { AcrolinxEndpoint } from '../../src/index';
import { mockAcrolinxServer, mockBrokenJsonServer, restoreOriginalFetch } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL } from './common';

const BROKEN_JSON_SERVER = 'http://broken-json-server';

describe('errors', () => {
  beforeEach(() => {
    mockAcrolinxServer(DUMMY_SERVER_URL);
    mockBrokenJsonServer(BROKEN_JSON_SERVER);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  test('should return an failing promise for broken json', async () => {
    const api = new AcrolinxEndpoint({ ...DUMMY_ENDPOINT_PROPS, acrolinxUrl: BROKEN_JSON_SERVER });
    try {
      await api.getJsonFromUrl(BROKEN_JSON_SERVER);
    } catch (e) {
      expect(e.type).toEqual(ErrorType.InvalidJson);
    }
    expect.hasAssertions();
  });

  test('should return an api error for invalid signin poll address', async () => {
    const api = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
    try {
      await api.pollForSignin({
        data: { interactiveLinkTimeout: 0 },
        links: {
          interactive: 'dummy',
          poll: DUMMY_ENDPOINT_PROPS.acrolinxUrl + '/api/v1/auth/sign-ins/0ddece9c-464a-442b-8a5d-d2f242d54c81',
        },
      });
    } catch (e) {
      expect(e.type).toEqual(ErrorType.Client);
    }
    expect.hasAssertions();
  });

  describe('custom errors and instanceof', () => {
    // Needed because of https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    test('CheckCanceledByClientError should support instanceof', () => {
      const error = new CheckCanceledByClientError({
        detail: 'The check was canceled. No result is available.',
        type: ErrorType.CheckCanceled,
        title: 'Check canceled',
        status: 400,
      });
      expect(error).toBeInstanceOf(CheckCanceledByClientError);
    });
  });
});
