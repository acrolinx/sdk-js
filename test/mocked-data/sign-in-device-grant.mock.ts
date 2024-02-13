import { AcrolinxEndpoint, AcrolinxError, ErrorType } from '../../src';
import {
  DeviceAuthResponseRaw,
  MultTenantLoginInfo,
  DeviceSignInSuccessResponseRaw,
  DeviceAuthResponse,
} from '../../src/signin-device-grant';

export const deviceGrantUserActionInfo: DeviceAuthResponseRaw = {
  device_code: 'kXn1FPdnEYmKYXaswtwJyiM02bqQF59pER-Y9fMZ1wg',
  user_code: 'VJGF-LQOP',
  verification_uri: 'https://comapny.acrolinx.cloud/realms/test-tenant-01/device',
  verification_uri_complete: 'https://comapny.acrolinx.cloud/realms/test-tenant-01/device?user_code=VJGF-LQOP',
  expires_in: 600,
  interval: 0.5,
};

export const deviceAuthResponse: DeviceAuthResponse = {
  deviceCode: 'kXn1FPdnEYmKYXaswtwJyiM02bqQF59pER-Y9fMZ1wg',
  expiresInSeconds: 600,
  pollingIntervalInSeconds: 0.5,
  pollingUrl: 'https://auth.company.cloud/realms/tenant/protocol/openid-connect/token',
  userCode: 'VJGF-LQOP',
  verificationUrl: 'https://comapny.acrolinx.cloud/realms/test-tenant-01/device',
  verificationUrlComplete: 'https://comapny.acrolinx.cloud/realms/test-tenant-01/device?user_code=VJGF-LQOP',
};

export const multTenantLoginInfo: MultTenantLoginInfo = {
  loginUrl: 'https://auth.company.cloud/some-path/we-dont-care',
};

export const signInMultiTenantSuccessResultRaw: DeviceSignInSuccessResponseRaw = {
  access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiS...',
  expires_in: 259200,
  refresh_expires_in: 679922,
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiw...',
  token_type: 'Bearer',
  'not-before-policy': 0,
  session_state: 'd1abe37c-5ba4-4312-9609-81b570d77b6a',
  scope: 'profile email',
};

export const invalidClientError = new AcrolinxError({
  detail: 'Invalid client or Invalid client credentials',
  status: 401,
  httpRequest: undefined,
  title: 'invalid_client',
  type: ErrorType.InvalidClient,
});

export const invalidRealmError = new AcrolinxError({
  detail: 'Unknown Auth Error',
  status: 404,
  httpRequest: undefined,
  title: 'Realm does not exist',
  type: ErrorType.RealmNotExist,
});

export const invalidGrantError = new AcrolinxError({
  detail: 'Device code not valid',
  status: 400,
  httpRequest: undefined,
  title: 'invalid_grant',
  type: ErrorType.InvalidGrant,
});

export const unsupportedGrantType = new AcrolinxError({
  detail: 'Unsupported grant_type',
  status: 400,
  httpRequest: undefined,
  title: 'unsupported_grant_type',
  type: ErrorType.UnsuppotedGrantType,
});

const fetchLoginInfoMock = jest.spyOn(AcrolinxEndpoint.prototype as any, 'fetchLoginInfo');
const fetchDeviceGrantUserActionMock = jest.spyOn(AcrolinxEndpoint.prototype as any, 'fetchDeviceGrantUserAction');
const fetchTokenForDeviceGrantMock = jest.spyOn(AcrolinxEndpoint.prototype as any, 'fetchTokenKeyCloak');

export const fetchLoginInfoMockSuccess = () => {
  fetchLoginInfoMock.mockImplementation(async () => {
    return new Promise((res, _rej) => {
      res(multTenantLoginInfo);
    });
  });
};

export const fetchDeviceGrantUserActionMockSuccess = () => {
  fetchDeviceGrantUserActionMock.mockImplementation(async () => {
    return new Promise((res, _rej) => {
      res(deviceGrantUserActionInfo);
    });
  });
};

export const fetchDeviceGrantUserActionMockFailure = (error: AcrolinxError) => {
  fetchDeviceGrantUserActionMock.mockImplementation(async () => {
    return new Promise((_res, rej) => {
      rej(error);
    });
  });
};

export const fetchTokenForDeviceGrantMockSuccess = () => {
  fetchTokenForDeviceGrantMock.mockImplementation(async () => {
    return new Promise((res, _rej) => {
      res(signInMultiTenantSuccessResultRaw);
    });
  });
};

export const fetchTokenForDeviceGrantMockFailure = () => {
  fetchTokenForDeviceGrantMock.mockImplementation(async () => {
    return new Promise((_res, rej) => {
      rej(invalidGrantError);
    });
  });
};
