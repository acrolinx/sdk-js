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

import { DEVELOPMENT_SIGNATURE } from '../../src';
import { AcrolinxEndpoint } from '../../src/index';
import { ACROLINX_DEV_SIGNATURE } from '../integration-server/acrolinx-endpoint.test';

function createEndpoint(setTokenAsAuthHeader?: boolean) {
  return new AcrolinxEndpoint({
    acrolinxUrl: 'http://host/',
    enableHttpLogging: true,
    client: {
      signature: ACROLINX_DEV_SIGNATURE || DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666',
    },
    useTokenAsAuthHeader: setTokenAsAuthHeader,
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
      expect(createEndpoint(false).props.useTokenAsAuthHeader).toBe(true);
    });
  });
});
