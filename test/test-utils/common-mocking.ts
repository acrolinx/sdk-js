import {MockResponseObject} from 'fetch-mock';

export interface Route {
  handler: (args: string[], requestOpts: RequestInit) => MockResponseObject | {};
  method: string;
  path: RegExp;
}
