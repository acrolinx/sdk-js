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

import { describe, expect, test } from 'vitest';
import { DEVELOPMENT_SIGNATURE } from '../../src';
import { AcrolinxEndpoint } from '../../src/index';
import { ACROLINX_DEV_SIGNATURE } from 'test/integration-server/env-config';
import { DUMMY_ENDPOINT_PROPS } from './common';

function createEndpoint(acrolinxUrl: string) {
  return new AcrolinxEndpoint({
    acrolinxUrl,
    enableHttpLogging: true,
    client: {
      integrationDetails: DUMMY_ENDPOINT_PROPS.client.integrationDetails,
      signature: ACROLINX_DEV_SIGNATURE ?? DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666',
    },
  });
}

describe('AcrolinxEndpoint', () => {
  describe('sanitize acrolinxUrl', () => {
    test('trim and remove training slash', () => {
      expect(createEndpoint(' http://host/ ').props.acrolinxUrl).toEqual('http://host');
      // eslint-disable-next-line sonarjs/no-duplicate-string
      expect(createEndpoint(' http://host/path/ ').props.acrolinxUrl).toEqual('http://host/path');

      expect(createEndpoint(' http://host/path ').props.acrolinxUrl).toEqual('http://host/path');
    });
  });
});
