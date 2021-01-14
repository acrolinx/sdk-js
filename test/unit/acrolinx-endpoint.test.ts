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

import {DEVELOPMENT_SIGNATURE} from '../../src';
import {AcrolinxEndpoint} from '../../src/index';

function createEndpoint(acrolinxUrl: string) {
  return new AcrolinxEndpoint({
    acrolinxUrl,
    enableHttpLogging: true,
    client: {
      signature: DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666'
    }
  });
}

describe('AcrolinxEndpoint', () => {
  describe('sanitize acrolinxUrl', () => {
    it('trim and remove training slash', () => {
      expect(createEndpoint(' http://host/ ').props.acrolinxUrl).toEqual('http://host');
      // eslint-disable-next-line sonarjs/no-duplicate-string
      expect(createEndpoint(' http://host/path/ ').props.acrolinxUrl).toEqual('http://host/path');

      expect(createEndpoint(' http://host/path ').props.acrolinxUrl).toEqual('http://host/path');
    });
  });
});
