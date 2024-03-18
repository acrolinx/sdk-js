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

import { AcrolinxEndpointProps } from 'src';
import { AccessToken, ServiceType, StringMap } from './common-types';

export const HEADER_X_ACROLINX_CLIENT = 'X-Acrolinx-Client';
export const HEADER_X_ACROLINX_AUTH = 'X-Acrolinx-Auth';
export const HEADER_X_ACROLINX_BASE_URL = 'X-Acrolinx-Base-Url';
export const HEADER_X_ACROLINX_CLIENT_LOCALE = 'X-Acrolinx-Client-Locale';
export const HEADER_X_ACROLINX_APP_SIGNATURE = 'X-Acrolinx-App';

export const HEADER_ACROLINX_ONE_AUTH = 'Authorization';

export function getCommonHeaders(
  props: AcrolinxEndpointProps,
  accessToken?: AccessToken,
  serviceType?: ServiceType,
): StringMap {
  const headers: StringMap = {
    'Content-Type': 'application/json',
  };
  if (serviceType === ServiceType.ACROLINX_CORE) {
    return {
      ...headers,
      ...getHeadersLegacy(props, accessToken),
    };
  }
  return {
    ...headers,
    ...getHeaders(accessToken),
  };
}

export function getHeaders(accessToken?: AccessToken): StringMap {
  const headers: StringMap = {};
  if (accessToken) {
    headers[HEADER_ACROLINX_ONE_AUTH] = `Bearer ${accessToken}`;
  }
  return headers;
}

export function getHeadersLegacy(props: AcrolinxEndpointProps, accessToken?: AccessToken): StringMap {
  const headers: StringMap = {};
  headers[HEADER_X_ACROLINX_BASE_URL] = props.acrolinxUrl;
  headers[HEADER_X_ACROLINX_CLIENT] = getAcrolinxClientHttpHeader(props);
  if (props.clientLocale) {
    headers[HEADER_X_ACROLINX_CLIENT_LOCALE] = props.clientLocale;
  }
  if (accessToken) {
    headers[HEADER_X_ACROLINX_AUTH] = accessToken;
  }
  return headers;
}

export function getAcrolinxClientHttpHeader(props: AcrolinxEndpointProps) {
  return `${props.client.signature}; ${props.client.version}`;
}
