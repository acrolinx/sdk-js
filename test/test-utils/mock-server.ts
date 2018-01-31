/* tslint:disable:no-console object-literal-sort-keys */
import * as fetchMock from 'fetch-mock';
import {MockResponseObject} from 'fetch-mock';
import * as _ from 'lodash';
import {AcrolinxApiError} from '../../src/errors';
import {HEADER_X_ACROLINX_AUTH, HEADER_X_ACROLINX_BASE_URL, HEADER_X_ACROLINX_CLIENT} from '../../src/headers';
import {ServerVersionInfo} from '../../src/index';
import {AuthorizationType, SigninPollResult, SigninResult, SigninSuccessResult} from '../../src/signin';
import {MockResponseObjectOf, Route} from './common-mocking';
import {CheckServiceMock} from './mock-server-checking';
import {AUTH_TOKEN_MISSING, CLIENT_SIGNATURE_MISSING, SIGNIN_URL_EXPIRED_ERROR} from './mocked-errors';

export const DUMMY_SERVER_INFO: ServerVersionInfo = {
  buildDate: '2018-01-10',
  buildNumber: '1234',
  version: '1.2.3',
};

export {SIGNIN_URL_EXPIRED_ERROR};

export const DUMMY_SIGNIN_LINK_PATH_INTERACTIVE = '/signin-ui/';
const DUMMY_SIGNIN_LINK_PATH_POLL = '/api/v1/auth/sign-ins/';
export const DUMMY_AUTH_TOKEN = 'dummyAuthToken';
export const DUMMY_USER_ID = 'dummyUserId';
export const DUMMY_RETRY_AFTER = 1;
export const DUMMY_INTERACTIVE_LINK_TIMEOUT = 900;

export interface LoggedRequest {
  opts: {
    headers: StringMap
  };
  url: string;
}

export interface StringMap {
  [key: string]: string;
}

function isMockResponseObject(o: MockResponseObject | {}): o is MockResponseObject {
  return !!((o as MockResponseObject).body);
}

function isAcrolinxApiError(o: AcrolinxApiError | {}): o is AcrolinxApiError {
  const potentialAcroApiError = o as AcrolinxApiError;
  return !!(potentialAcroApiError.status && potentialAcroApiError.type && potentialAcroApiError.title);
}

interface SigninState {
  authorizationType?: AuthorizationType;
}

export class AcrolinxServerMock {
  public readonly checkService: CheckServiceMock;
  public requests: LoggedRequest[] = [];
  private routes: Route[];
  private signinIds: { [id: string]: SigninState } = {};
  private ssoEnabled: boolean = false;

  constructor(public readonly serverAddress: string) {
    this.checkService = new CheckServiceMock(serverAddress);
    this.routes = [
      {
        handler: () => this.getServerVersion(),
        method: 'GET',
        path: new RegExp('/iq/services/v3/rest/core/serverVersion$'),
      },
      {
        handler: (_args, opts) => this.signin(opts),
        method: 'POST',
        path: /api\/v1\/auth\/sign-ins$/,
      },
      {
        handler: (args, opts) => this.pollForSignin(args[1], opts),
        method: 'GET',
        path: /api\/v1\/auth\/sign-ins\/(.*)$/,
      },
      {
        handler: (args, opts) => this.returnFakeSigninPage(args[1], opts),
        method: 'GET',
        path: /signin-ui\/(.*)$/,
      },
      {
        handler: (args, opts) => this.returnConfirmSigninPage(args[1], opts),
        method: 'POST',
        path: /signin-ui\/(.*)\/confirm$/,
      },
      {
        handler: (args, opts) => this.returnSigninDeletedPage(args[1], opts),
        method: 'POST',
        path: /signin-ui\/(.*)\/delete/,
      },
      ...this.checkService.getRoutes()
    ];

    this.signinIds.dummy = {};
  }

  public fakeSignIn(authorizationType = AuthorizationType.ACROLINX_SIGN_IN, signinId?: string) {
    if (signinId) {
      this.signinIds[signinId].authorizationType = authorizationType;
    } else {
      _.forEach(this.signinIds, (signinState) => {
        // console.log('Fake it for', signinState);
        signinState.authorizationType = authorizationType;
      });
    }
  }

  public enableSSO() {
    this.ssoEnabled = true;
  }

  public handleFetchRequest = (url: string, optsArg: RequestInit = {}): MockResponseObject => {
    const opts = {method: 'GET', ...optsArg, headers: ((optsArg.headers || {}) as StringMap)};

    this.requests.push({opts, url});

    const acrolinxClientHeader = getHeader(optsArg, HEADER_X_ACROLINX_CLIENT);
    if (acrolinxClientHeader) {
      const [signature, version] = acrolinxClientHeader.split(';').map(_.trim);
      if (!signature || !version) {
        return this.createAcrolinxApiErrorResponse(CLIENT_SIGNATURE_MISSING);
      }
    } else if (_.includes(url, 'api')) {
      return this.createAcrolinxApiErrorResponse(CLIENT_SIGNATURE_MISSING);
    }

    if (!getHeader(opts, HEADER_X_ACROLINX_AUTH) && _.includes(url, '/api/') && !_.includes(url, '/auth/')) {
      return this.createAcrolinxApiErrorResponse(AUTH_TOKEN_MISSING);
    }

    // console.log('try to match url', url);
    for (const route of this.routes) {
      // console.log('try rout', route);
      const matches = url.match(route.path);
      if (matches && opts.method === route.method) {
        // console.log('Found match!', matches);
        const handlerResult = route.handler(matches!, opts);
        // console.log(`Handler for URL ${url} returned`, handlerResult);
        if (isMockResponseObject(handlerResult)) {
          return handlerResult;
        } else if (isAcrolinxApiError(handlerResult)) {
          return {body: handlerResult, status: handlerResult.status};
        } else {
          return this.returnResponse(handlerResult);
        }
      }
    }

    console.log(`FakeServer can not handle url "${url}"`, opts);
    return this.createAcrolinxApiErrorResponse({status: 404});
  }

  public deleteSigninPollUrl(url: string) {
    const signinId = url.substr(url.lastIndexOf('/') + 1);
    // console.warn('deleteSigninPollUrl', signinId);
    this.deleteSignin(signinId);
  }

  private deleteSignin(signinId: string) {
    delete this.signinIds[signinId];
  }

  private returnResponse(body: {}) {
    return {body};
  }

  private getServerVersion(): ServerVersionInfo {
    return DUMMY_SERVER_INFO;
  }

  private signin(opts: RequestInit): SigninResult {
    if (this.ssoEnabled) {
      return this.createLoginSuccessResult(AuthorizationType.ACROLINX_SSO);
    }
    if (getHeader(opts, HEADER_X_ACROLINX_AUTH) === DUMMY_AUTH_TOKEN) {
      return this.createLoginSuccessResult(AuthorizationType.ACROLINX_TOKEN);
    }
    const baseUrl = getHeader(opts, HEADER_X_ACROLINX_BASE_URL) || this.serverAddress;
    const id = _.uniqueId('signin-id-');
    this.signinIds[id] = {};
    return {
      interactiveLinkTimeout: DUMMY_INTERACTIVE_LINK_TIMEOUT,
      links: {
        interactive: baseUrl + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE + id,
        poll: baseUrl + DUMMY_SIGNIN_LINK_PATH_POLL + id,
      }
    };
  }

  private pollForSignin(signinId: string,
                        _opts: RequestInit): MockResponseObjectOf<SigninPollResult | AcrolinxApiError> {
    const signinState = this.signinIds[signinId];
    // console.log('pollForSignin', signinId, signinState);
    if (!signinState) {
      return this.createAcrolinxApiErrorResponse(SIGNIN_URL_EXPIRED_ERROR);
    }

    if (signinState.authorizationType) {
      return {
        body: this.createLoginSuccessResult(AuthorizationType.ACROLINX_SIGN_IN),
        status: 200,
      };
    } else {
      return {
        body: {retryAfter: 1},
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

  private createLoginSuccessResult(authorizedUsing: AuthorizationType): SigninSuccessResult {
    return {
      authToken: DUMMY_AUTH_TOKEN,
      authorizedUsing,
      links: {},
      privileges: [],
      userId: DUMMY_USER_ID,
    };
  }

  private returnFakeSigninPage(signinId: string, opts: RequestInit) {
    const signinState = this.signinIds[signinId];
    return {
      body: `
      <html>
        <head><title>Signin UI</title></head>
        <body>
          <h1>Interactive Signin</h1>
          <p>SigninID: ${signinId}</p>
          <p>SigninState: ${(signinState && (signinState.authorizationType || 'Signed out')) || 'Unknown'}</p>
          <form action="${signinId}/confirm" method="post"><button>Confirm Signin</button></form>
          <form action="${signinId}/delete" method="post"><button>Delete Signin</button></form>
          <pre>
          ${JSON.stringify(opts, null, 2)}
          </pre>
        </body>
      </html>
      `,
      headers: {
        'Content-Type': 'text/html'
      }
    };
  }

  private returnConfirmSigninPage(signinId: string, opts: RequestInit) {
    if (!this.signinIds[signinId]) {
      return {status: 404, body: {message: 'Unknown signinId ' + signinId}};
    }
    this.fakeSignIn(AuthorizationType.ACROLINX_SIGN_IN, signinId);
    return this.pollForSignin(signinId, opts);
  }

  private returnSigninDeletedPage(signinId: string, _opts: RequestInit) {
    this.deleteSignin(signinId);
    return {message: `${signinId} is deleted`};
  }
}

function getHeader(requestOpts: RequestInit, headerKey: string): string | undefined {
  if (!requestOpts.headers) {
    return undefined;
  }
  return _.find(requestOpts.headers, (_val, key) => key.toLowerCase() === headerKey.toLowerCase());
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

