/*
 * Copyright 2023-present Acrolinx GmbH
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

import { DUMMY_ACCESS_TOKEN, mockAcrolinxServer, restoreOriginalFetch } from '../test-utils/mock-server';
import { AcrolinxEndpoint } from '../../src/index';
import { DUMMY_SERVER_URL, DUMMY_ENDPOINT_PROPS } from './common';

function createEndpoint(useTokenAsAuthHeader?: boolean) {
  return new AcrolinxEndpoint({
    ...DUMMY_ENDPOINT_PROPS,
    useTokenAsAuthHeader: useTokenAsAuthHeader,
  });
}

describe('Authorization header', () => {
  describe('set Authorization header props', () => {
    it('not defined', () => {
      expect(createEndpoint().props.useTokenAsAuthHeader).toBeUndefined();
    });

    it('set disabled', () => {
      expect(createEndpoint(false).props.useTokenAsAuthHeader).toBe(false);
    });

    it('set enabled', () => {
      expect(createEndpoint(true).props.useTokenAsAuthHeader).toBe(true);
    });
  });

  describe('Test API using Auth Header', () => {
    let endpoint: AcrolinxEndpoint;
    beforeEach(() => {
      mockAcrolinxServer(DUMMY_SERVER_URL);
      endpoint = createEndpoint(true);
    });

    afterEach(() => {
      restoreOriginalFetch();
    });
    it('capabilities using Auth header', async () => {
      const capabilities = await endpoint.getCheckingCapabilities(DUMMY_ACCESS_TOKEN);
      expect(capabilities.guidanceProfiles.length).toBeGreaterThan(0);
    });

    it('check using Auth header', async () => {
      const checkResponse = await endpoint.check(DUMMY_ACCESS_TOKEN, {
        content: 'text content',
      });
      expect(checkResponse).toBeDefined();
    });
  });
});
