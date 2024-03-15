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

import { JwtPayload } from "jwt-decode";

export type IntServiceDiscovery = {
  auth: string;
};

export type DeviceAuthResponse = {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresInSeconds: number;
  pollingIntervalInSeconds: number;
  pollingUrl: string;
};

export interface DeviceAuthResponseRaw {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface DeviceSignInOptions {
  tenantId?: string;
  accessToken?: string;
  refreshToken?: string;
  timeoutMs?: number;
  clientId?: string;
}

export interface DeviceSignInOptionsInteractive extends DeviceSignInOptions {
  onDeviceGrantUserAction: (deviceGrantUserAction: DeviceAuthResponse) => void;
}

export type DeviceSignInSuccessResponseRaw = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
};

export type DeviceSignInSuccessResponse = {
  accessToken: string;
  accessTokenExpiryInSeconds: number;
  refreshTokenExpiryInSeconds: number;
  refreshToken: string;
  tokenType: string;
  sessionState: string;
  scope: string;
};

export const generateDeviceAuthUrl = (intServiceDiscovery: IntServiceDiscovery, tenantId: string): string => {
  const authUrl = new URL(intServiceDiscovery.auth);
  return `${authUrl.protocol}//${authUrl.hostname}/realms/${tenantId}/protocol/openid-connect/auth/device`;
};

export const generateTokenUrl = (intServiceDiscovery: IntServiceDiscovery, tenantId: string): string => {
  const authUrl = new URL(intServiceDiscovery.auth);
  return `${authUrl.protocol}//${authUrl.hostname}/realms/${tenantId}/protocol/openid-connect/token`;
};

export const getClientId = (opts?: DeviceSignInOptions) => {
  return opts?.clientId ?? 'device-sign-in';
};

export const getTenantId = (acrolinxUrl: string, opts: DeviceSignInOptions) => {
  const url = new URL(acrolinxUrl);
  return opts.tenantId ?? url.host.split('.')[0];
};

export interface JWTAcrolinxPayload extends JwtPayload {
  preferred_username: string;
  genericPassword: string;
}

export const tidyKeyCloakSuccessResponse = (
  rawResponse: DeviceSignInSuccessResponseRaw,
): DeviceSignInSuccessResponse => {
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

export const tidyKeyCloakDeviceAuthResponse = (pollingUrl: string, response: DeviceAuthResponseRaw) => {
  return {
    deviceCode: response.device_code,
    expiresInSeconds: response.expires_in,
    pollingIntervalInSeconds: response.interval,
    userCode: response.user_code,
    verificationUrl: response.verification_uri,
    verificationUrlComplete: response.verification_uri_complete,
    pollingUrl: pollingUrl,
  };
};

export const isSignInDeviceGrantSuccess = (
  result: DeviceAuthResponse | DeviceSignInSuccessResponse,
): result is DeviceSignInSuccessResponse => {
  const asSignInDeviceGrant = result as DeviceSignInSuccessResponse;
  return !!(asSignInDeviceGrant && asSignInDeviceGrant.accessToken && asSignInDeviceGrant.refreshToken);
};

export function isDeviceAuthResponse(
  result: DeviceAuthResponse | DeviceSignInSuccessResponse,
): result is DeviceAuthResponse {
  const asDeviceAuthResponse = result as DeviceAuthResponse;
  return !!asDeviceAuthResponse.verificationUrlComplete;
}
