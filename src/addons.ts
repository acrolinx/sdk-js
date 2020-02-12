import {UserId, Username} from './common-types';

export type AddonId = string;
export type AppToken = string;

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

export interface AppTokenResult {
  appAccessToken: AppToken;
  user: AppUser;
  appId: AddonId;
}

export interface AppTokenValidationResult {
  user: AppUser;
}
