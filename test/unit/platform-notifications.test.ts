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

import {AcrolinxEndpoint} from '../../src/index';
import {DUMMY_ACCESS_TOKEN, mockAcrolinxServer, restoreOriginalFetch} from '../test-utils/mock-server';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

describe('platform-notifications', () => {
  let endpoint: AcrolinxEndpoint;

  beforeEach(() => {
    mockAcrolinxServer(DUMMY_SERVER_URL);
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  it('get notifications', async () => {
    const serverMessages = await endpoint.getServerNotifications(DUMMY_ACCESS_TOKEN, 0);
    expect(Array.isArray(serverMessages.data.platformNotifications)).toBe(true);
    expect(serverMessages.data.requestTimeInMilliseconds).toBeGreaterThan(0);
  });
});
