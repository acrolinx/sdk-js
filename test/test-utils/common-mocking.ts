import {MockResponseObject} from 'fetch-mock';
import {AcrolinxApiError} from '../../src/errors';

export interface MockResponseObjectOf<T> extends MockResponseObject {
  body: T;
}

export interface Route {
  handler: (args: string[], requestOpts: RequestInit) => MockResponseObject | AcrolinxApiError | {};
  method: string;
  path: RegExp;
}
