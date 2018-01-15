import * as fetchMock from 'fetch-mock';
import {MockResponseObject} from 'fetch-mock';
import * as _ from 'lodash';
import {ServerVersionInfo} from '../../src/index';
import {AuthorizationType, LoginResult, POLL_MORE_RESULT, SigninPollResult, SigninSuccessResult} from '../../src/login';

export const DUMMY_SERVER_INFO: ServerVersionInfo = {
  buildDate: '2018-01-10',
  buildNumber: '1234',
  version: '1.2.3',
};

export const DUMMY_SIGNIN_LINK_PATH_INTERACTIVE = '/dashboard.html';
export const DUMMY_SIGNIN_LINK_PATH_POLL = '/iq/services/v1/rest/login/6c081ee6-f816-4881-a548-87f9c1372163';
export const DUMMY_AUTH_TOKEN = 'dummyAuthToken';
export const DUMMY_USER_ID = 'dummyUserId';

interface MockResponseObjectOf<T> extends MockResponseObject {
  body: T;
}

export interface LoggedRequest {
  url: string;
  opts: {
    headers: StringMap
  };
}

export interface StringMap { [key: string]: string; }


export class AcrolinxServerMock {
  public requests: LoggedRequest[] = [];
  private _isUserSignedIn?: AuthorizationType;

  constructor(public readonly url: string) {
  }

  public fakeSignIn(value = AuthorizationType.ACROLINX_SIGN_IN) {
    this._isUserSignedIn = value;
  }


  public handleFetchRequest = (url: string, opts: RequestInit = {}): MockResponseObject => {
    this.requests.push({
      opts: {headers: (opts.headers || {}) as StringMap},
      url,
    });
    if (_.endsWith(url, 'serverVersion')) {
      return this.returnResponse(this.getServerVersion());
    } else if (_.endsWith(url, 'login') && opts.method === 'POST') {
      return this.returnResponse(this.login(opts));
    } else if (_.endsWith(url, DUMMY_SIGNIN_LINK_PATH_POLL) && (!opts || !opts.method || opts.method === 'GET')) {
      return this.pollForSignin(opts);
    }
    console.log(`FakeServer can not handle url "${url}"`, opts);
    return {status: 404};
  }

  private returnResponse(body: {}) {
    return {body};
  }

  private getServerVersion(): ServerVersionInfo {
    return DUMMY_SERVER_INFO;
  }

  private login(_opts: RequestInit): LoginResult {
    if (this._isUserSignedIn) {
      return this.createLoginSuccessResult();
    }
    return {
      links: {
        interactive: this.url + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE,
        poll: this.url + DUMMY_SIGNIN_LINK_PATH_POLL,
      }
    };
  }

  private pollForSignin(_opts: RequestInit): MockResponseObjectOf<SigninPollResult> {
    if (this._isUserSignedIn) {
      return {
        body: this.createLoginSuccessResult(),
        status: 200,
      };
    } else {
      return {status: 202, body: POLL_MORE_RESULT};
    }
  }

  private createLoginSuccessResult(): SigninSuccessResult {
    return {
      authToken: DUMMY_AUTH_TOKEN,
      authorizedUsing: this._isUserSignedIn!,
      links: {},
      privileges: [],
      userId: DUMMY_USER_ID,
    };
  }

}

export function mockAcrolinxServer(url: string): AcrolinxServerMock {
  const mockedServer = new AcrolinxServerMock(url);
  fetchMock.mock('begin:' + url, mockedServer.handleFetchRequest);
  return mockedServer;
}

export function mockBrokenJsonServer(url: string) {
  fetchMock.mock('begin:' + url, (_url: string, _opts: RequestInit): MockResponseObject => {
      return {body: 'This isn\'t the json you are looking for'};
    }
  );
}

export function restoreOriginalFetch() {
  fetchMock.restore();
}

