import {SuccessResponse} from './common-types';

export enum ServerNotificationImportance {
  Normal = 'NORMAL',
  High = 'HIGH',
}

export interface ServerNotification {
  title: string;
  body: string;
  importance: ServerNotificationImportance;
}

export interface ServerNotificationResponseData {
  requestTimeInMilliseconds: number;
  serverMessages: ServerNotification[];
}

export type ServerNotificationResponse = SuccessResponse<ServerNotificationResponseData>;
