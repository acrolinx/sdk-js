import {SuccessResponse} from './common-types';

export enum ServerNotificationImportance {
  Normal = 'normal',
  High = 'high',
}

export interface ServerNotification {
  title: string;
  body: string;
  importance: ServerNotificationImportance;
}

export interface ServerNotificationResponseData {
  requestTimeInMilliseconds: number;
  platformNotifications: ServerNotification[];
}

// TODO (marco) Review
export interface ServerNotificationPostResponseData {
  id: string;
}

// TODO (marco) Review
export interface ServerNotificationPost {
  title: string;
  body: string;
  importance?: ServerNotificationImportance;
  start: number;
  end: number;
}

export type ServerNotificationResponse = SuccessResponse<ServerNotificationResponseData>;
export type ServerNotificationPostResponse = SuccessResponse<ServerNotificationPostResponseData>;
