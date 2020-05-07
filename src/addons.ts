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

import {StringMap, UserId, Username} from './common-types';

export type AddonId = string;
export type AppAccessToken = string;

export interface Addon {
  id: AddonId;
  title: string;
  links: {
    icon: string;
    app: string;
  };
}

interface AppUser {
  id: UserId;
  username: Username;
}

export interface AppAccessTokenApiResult {
  appAccessToken: AppAccessToken;
  user: AppUser;
  appId: AddonId;
}


export interface AppAccessTokenResult extends AppAccessTokenApiResult {
  validationRequest: HttpGetRequest;
}

export interface HttpGetRequest {
  url: string;
  headers: StringMap;
}

export interface AppAccessTokenValidationResult {
  user: AppUser;
}
