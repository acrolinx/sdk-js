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

interface HttpGetRequest {
  url: string;
  headers: StringMap;
}

export interface AppAccessTokenValidationResult {
  user: AppUser;
}
