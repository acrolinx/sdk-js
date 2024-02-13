/*
 * Copyright 2024-present Acrolinx GmbH
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
import { DUMMY_ENDPOINT_PROPS } from './common';
import {
  deviceGrantUserActionInfo,
  multTenantLoginInfo,
  signInMultiTenantSuccessResultRaw,
} from '../mocked-data/sign-in-device-grant.mock';
import { DeviceAuthResponse } from '../../src/signin-device-grant';

describe('Sign In With Device Grant', () => {
  const onDeviceGrantUserActionCallback = (deviceGrantUserAction: DeviceAuthResponse) => {
    console.log(deviceGrantUserAction);
  };

  const fetchLoginInfoMock = jest.spyOn(AcrolinxEndpoint.prototype as any, 'fetchLoginInfo');
  const fetchDeviceGrantUserActionMock = jest.spyOn(AcrolinxEndpoint.prototype as any, 'fetchDeviceGrantUserAction');
  const fetchTokenForDeviceGrantMock = jest.spyOn(AcrolinxEndpoint.prototype as any, 'fetchTokenForDeviceGrant');

  const fetchLoginInfoMockSuccess = () => {
    fetchLoginInfoMock.mockImplementation(async () => {
      return new Promise((res, _rej) => {
        res(multTenantLoginInfo);
      });
    });
  };

  const fetchDeviceGrantUserActionMockSuccess = () => {
    fetchDeviceGrantUserActionMock.mockImplementation(async () => {
      return new Promise((res, _rej) => {
        res(deviceGrantUserActionInfo);
      });
    });
  };

  const fetchTokenForDeviceGrantMockSuccess = () => {
    fetchTokenForDeviceGrantMock.mockImplementation(async () => {
      return new Promise((res, _rej) => {
        res(signInMultiTenantSuccessResultRaw);
      });
    });
  };

  let endpoint: AcrolinxEndpoint;
  beforeEach(() => {
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  });

  it('should return success result', async () => {
    fetchLoginInfoMockSuccess();
    fetchDeviceGrantUserActionMockSuccess();
    fetchTokenForDeviceGrantMockSuccess();

    const response = await endpoint.deviceAuthSignInInteractive({
      onDeviceGrantUserAction: onDeviceGrantUserActionCallback,
      tenantId: 'test-tenant',
    });

    expect(response).toBeDefined();
    expect(response).toHaveProperty('accessToken', signInMultiTenantSuccessResultRaw.access_token);
    expect(response).toHaveProperty('accessTokenExpiryInSeconds', signInMultiTenantSuccessResultRaw.expires_in);
    expect(response).toHaveProperty('refreshToken', signInMultiTenantSuccessResultRaw.refresh_token);
    expect(response).toHaveProperty(
      'refreshTokenExpiryInSeconds',
      signInMultiTenantSuccessResultRaw.refresh_expires_in,
    );
    expect(response).toHaveProperty('sessionState', signInMultiTenantSuccessResultRaw.session_state);
    expect(response).toHaveProperty('tokenType', signInMultiTenantSuccessResultRaw.token_type);
    expect(response).toHaveProperty('scope', signInMultiTenantSuccessResultRaw.scope);
  });
});
