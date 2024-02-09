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
  expiresInMs: number;
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
  tenantId: string;
  onDeviceGrantUserAction: (deviceGrantUserAction: DeviceGrantUserActionInfo) => void;
  accessToken?: string;
  refreshToken?: string;
  timeoutMs?: number;
  clientId?: string;
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
