/* tslint:disable:no-console */
import * as fetchMock from 'fetch-mock';
import {MockResponseObject} from 'fetch-mock';
import * as _ from 'lodash';
import {AcrolinxApiError} from '../../src/errors';
import {HEADER_X_ACROLINX_CLIENT} from '../../src/headers';
import {ServerVersionInfo} from '../../src/index';
import {AuthorizationType, SigninPollResult, SigninResult, SigninSuccessResult} from '../../src/signin';

export const DUMMY_SERVER_INFO: ServerVersionInfo = {
  buildDate: '2018-01-10',
  buildNumber: '1234',
  version: '1.2.3',
};

export const DUMMY_SIGNIN_LINK_PATH_INTERACTIVE = '/dashboard.html';
const DUMMY_SIGNIN_LINK_PATH_POLL = '/api/v1/auth/sign-ins/';
export const DUMMY_AUTH_TOKEN = 'dummyAuthToken';
export const DUMMY_USER_ID = 'dummyUserId';
export const DUMMY_RETRY_AFTER = 1;
export const DUMMY_INTERACTIVE_LINK_TIMEOUT = 900;

interface MockResponseObjectOf<T> extends MockResponseObject {
  body: T;
}

export interface LoggedRequest {
  url: string;
  opts: {
    headers: StringMap
  };
}

export interface StringMap {
  [key: string]: string;
}


interface Route {
  path: RegExp;
  method: string;
  handler: (args: string[], requestOpts: RequestInit) => MockResponseObject | {};
}

function isMockResponseObject(o: MockResponseObject | {}): o is MockResponseObject {
  return !!((o as MockResponseObject).status);
}

interface SigninState {
  signedIn: boolean;
}

export class AcrolinxServerMock {
  public requests: LoggedRequest[] = [];
  private _isUserSignedIn?: AuthorizationType;
  private routes: Route[];
  private signinIds: { [id: string]: SigninState } = {};

  constructor(public readonly url: string) {
    this.routes = [
      {
        handler: () => this.getServerVersion(),
        method: 'GET',
        path: /serverVersion$/,
      },
      {
        handler: (_args, opts) => this.login(opts),
        method: 'POST',
        path: /sign-ins$/,
      },
      {
        handler: (args, opts) => this.pollForSignin(args[1], opts),
        method: 'GET',
        path: /sign-ins\/(.*)$/,
      }
    ];
  }


  public fakeSignIn(value = AuthorizationType.ACROLINX_SIGN_IN) {
    this._isUserSignedIn = value;
  }

  public handleFetchRequest = (url: string, optsArg: RequestInit = {}): MockResponseObject => {
    const opts = {method: 'GET', ...optsArg};

    const acrolinxClientHeader = getHeader(optsArg, HEADER_X_ACROLINX_CLIENT);
    if (acrolinxClientHeader) {
      const [signature, version] = acrolinxClientHeader.split(';').map(_.trim);
      if (!signature || !version) {
        return this.createAcrolinxApiErrorResponse({type: 'BrokenClientSignature'});
      }
    } else {
      return this.createAcrolinxApiErrorResponse({type: 'MissingClientSignature'});
    }

    this.requests.push({
      opts: {headers: (opts.headers || {}) as StringMap},
      url,
    });

    // console.log('try to match url', url);
    for (const route of this.routes) {
      console.log('try rout', route);
      const matches = url.match(route.path);
      if (matches && opts.method === route.method) {
        // console.log('Found match!', matches);
        const handlerResult = route.handler(matches!, opts);
        if (isMockResponseObject(handlerResult)) {
          return handlerResult;
        } else {
          return this.returnResponse(handlerResult);
        }
      }
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

  private login(_opts: RequestInit): SigninResult {
    if (this._isUserSignedIn) {
      return this.createLoginSuccessResult();
    }
    const id = _.uniqueId('signin-id-');
    this.signinIds[id] = {signedIn: true};
    return {
      interactiveLinkTimeout: DUMMY_INTERACTIVE_LINK_TIMEOUT,
      links: {
        interactive: this.url + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE,
        poll: this.url + DUMMY_SIGNIN_LINK_PATH_POLL + id,
      }
    };
  }

  private pollForSignin(signinId: string,
                        _opts: RequestInit): MockResponseObjectOf<SigninPollResult | AcrolinxApiError> {
    const signinState = this.signinIds[signinId];
    if (!signinState) {
      return this.createAcrolinxApiErrorResponse({
        detail: 'The sign-in URL is does not exists or is expired. Please start a new sign-in process.',
        status: 404,
        title: 'Sign-in URL is not available.',
        type: 'https://acrolinx.com/apispec/v1/errors/sign_in_not_available',
      });
    }

    if (this._isUserSignedIn) {
      return {
        body: this.createLoginSuccessResult(),
        status: 200,
      };
    } else {
      return {
        body: {_type: 'PollMoreResult', retryAfterSeconds: 1},
        headers: {'retry-after': '' + DUMMY_RETRY_AFTER},
        status: 202,
      };
    }
  }

  private createAcrolinxApiErrorResponse(apiError: Partial<AcrolinxApiError>): MockResponseObjectOf<AcrolinxApiError> {
    const fullApiError = {
      detail: 'DummyErrorDetail',
      status: 400,
      title: 'DummyErrorTitle',
      type: 'DummyErrorType',
      ...apiError
    };
    return {
      body: fullApiError,
      status: fullApiError.status
    };
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

function getHeader(requestOpts: RequestInit, headerKey: string) {
  if (!requestOpts.headers) {
    return undefined;
  }
  return (requestOpts.headers as StringMap)[headerKey];
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

