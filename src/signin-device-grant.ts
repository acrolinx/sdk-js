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

export type MultTenantLoginInfo = {
  loginUrl: string;
};

export type DeviceGrantUserActionInfo = {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresInSeconds: number;
  pollingIntervalInSeconds: number;
  pollingUrl: string;
};

export interface DeviceGrantUserActionInfoRaw {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface SignInDeviceGrantOptions {
  tenantId?: string;
  accessToken?: string;
  refreshToken?: string;
  timeoutMs?: number;
  clientId?: string;
}

export interface SignInDeviceGrantOptionsInteractive extends SignInDeviceGrantOptions {
  onDeviceGrantUserAction: (deviceGrantUserAction: DeviceGrantUserActionInfo) => void;
}

export type SignInMultiTenantSuccessResultRaw = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
};

export type SignInDeviceGrant = {
  accessToken: string;
  accessTokenExpiryInSeconds: number;
  refreshTokenExpiryInSeconds: number;
  refreshToken: string;
  tokenType: string;
  sessionState: string;
  scope: string;
};

export const generateDeviceAuthUrl = (multiTenantLoginInfo: MultTenantLoginInfo, tenantId: string): string => {
  const loginUrl = new URL(multiTenantLoginInfo.loginUrl);
  return `${loginUrl.protocol}//${loginUrl.hostname}/realms/${tenantId}/protocol/openid-connect/auth/device`;
};

export const generateTokenUrl = (multiTenantLoginInfo: MultTenantLoginInfo, tenantId: string): string => {
  const loginUrl = new URL(multiTenantLoginInfo.loginUrl);
  return `${loginUrl.protocol}//${loginUrl.hostname}/realms/${tenantId}/protocol/openid-connect/token`;
};

export const getClientId = (opts: SignInDeviceGrantOptions) => {
  return opts.clientId || 'device-sign-in';
};

export const getTenantId = (acrolinxUrl: string, opts: SignInDeviceGrantOptions) => {
  const url = new URL(acrolinxUrl);
  return opts.tenantId || url.host.split('.')[0];
};

export const tidyKeyCloakSuccessResponse = (rawResponse: SignInMultiTenantSuccessResultRaw): SignInDeviceGrant => {
  return {
    accessToken: rawResponse.access_token,
    accessTokenExpiryInSeconds: rawResponse.expires_in,
    refreshToken: rawResponse.refresh_token,
    refreshTokenExpiryInSeconds: rawResponse.refresh_expires_in,
    scope: rawResponse.scope,
    sessionState: rawResponse.session_state,
    tokenType: rawResponse.token_type,
  };
};

export const isSignInDeviceGrantSuccess = (result: DeviceGrantUserActionInfo | SignInDeviceGrant): boolean => {
  const asSignInDeviceGrant = result as SignInDeviceGrant;
  return !!(asSignInDeviceGrant && asSignInDeviceGrant.accessToken && asSignInDeviceGrant.refreshToken);
};
