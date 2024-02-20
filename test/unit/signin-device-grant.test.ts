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

import { AcrolinxEndpoint, ErrorType } from '../../src/index';
import { DUMMY_ENDPOINT_PROPS } from './common';
import {
  deviceAuthResponse,
  fetchDeviceGrantUserActionMockFailure,
  fetchDeviceGrantUserActionMockSuccess,
  fetchLoginInfoMockSuccess,
  fetchTokenForDeviceGrantMockFailure,
  fetchTokenForDeviceGrantMockSuccess,
  invalidClientError,
  invalidRealmError,
  signInMultiTenantSuccessResultRaw,
  signInSingleTenantWithKeycloakAccessToken,
  signInSuccesResult,
  unsupportedGrantType,
} from '../mocked-data/sign-in-device-grant.mock';

describe('Sign In With Device Grant', () => {
  const onDeviceGrantUserActionCallback = jest.fn();
  const dummyTenantId = 'tenant';
  const dummyClientId = 'test-client';

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
      tenantId: dummyTenantId,
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

  it('should return correct device auth response', async () => {
    fetchLoginInfoMockSuccess();
    fetchDeviceGrantUserActionMockSuccess();
    fetchTokenForDeviceGrantMockFailure();

    const response = await endpoint.deviceAuthSignIn({
      tenantId: dummyTenantId,
    });

    expect(response).toBeDefined();
    expect(response).toEqual(deviceAuthResponse);
  });

  it('should throw if client is invalid', async () => {
    fetchLoginInfoMockSuccess();
    fetchTokenForDeviceGrantMockFailure();
    fetchDeviceGrantUserActionMockFailure(invalidClientError);

    await expect(
      endpoint.deviceAuthSignInInteractive({
        onDeviceGrantUserAction: onDeviceGrantUserActionCallback,
        tenantId: dummyTenantId,
        clientId: dummyClientId,
      }),
    ).rejects.toThrowError(ErrorType.InvalidClient);
  });

  it('should throw if realm is invalid', async () => {
    fetchLoginInfoMockSuccess();
    fetchTokenForDeviceGrantMockFailure();
    fetchDeviceGrantUserActionMockFailure(invalidRealmError);

    await expect(
      endpoint.deviceAuthSignInInteractive({
        onDeviceGrantUserAction: onDeviceGrantUserActionCallback,
        tenantId: 'invalid-realm',
        clientId: dummyClientId,
      }),
    ).rejects.toThrowError(ErrorType.RealmNotExist);
  });

  it('should throw if grant type is unsupported', async () => {
    fetchLoginInfoMockSuccess();
    fetchTokenForDeviceGrantMockFailure();
    fetchDeviceGrantUserActionMockFailure(unsupportedGrantType);

    await expect(
      endpoint.deviceAuthSignInInteractive({
        onDeviceGrantUserAction: onDeviceGrantUserActionCallback,
        tenantId: 'valid-realm',
        clientId: dummyClientId,
      }),
    ).rejects.toThrowError(ErrorType.UnsuppotedGrantType);
  });

  it('should call device sign in callback function', async () => {
    fetchLoginInfoMockSuccess();
    fetchDeviceGrantUserActionMockSuccess();
    fetchTokenForDeviceGrantMockFailure();

    await expect(
      endpoint.deviceAuthSignInInteractive({
        onDeviceGrantUserAction: onDeviceGrantUserActionCallback,
        tenantId: 'tenant',
      }),
    ).rejects.toThrow();
    expect(onDeviceGrantUserActionCallback).toHaveBeenCalledTimes(1);
    expect(onDeviceGrantUserActionCallback).toHaveBeenCalledWith(deviceAuthResponse);
  });

  it('should get single tenant access token from keycloak token', async () => {
    signInSingleTenantWithKeycloakAccessToken();
    const acrolinxEndpint = new AcrolinxEndpoint({
      ...DUMMY_ENDPOINT_PROPS,
      additionalHeaders: {
        Authorization: 'Bearer random-token',
      },
    });
    const result = await acrolinxEndpint.signInWithHeaders();
    expect(result).toBeDefined();
    expect(result).toEqual(signInSuccesResult);
  });

  it('should throw SSO error if additional headers not set', async () => {
    signInSingleTenantWithKeycloakAccessToken();
    await expect(endpoint.signInWithHeaders()).rejects.toThrow();
  });
});
