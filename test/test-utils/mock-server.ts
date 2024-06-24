/* eslint-disable @typescript-eslint/no-unsafe-call */
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

/* tslint:disable:no-console object-literal-sort-keys */
import fetchMock from 'fetch-mock';
import { MockResponseObject } from './common-mocking';
import * as _ from 'lodash';
import { SuccessResponse } from '../../src/common-types';
import { AcrolinxApiError, AcrolinxError, ErrorType } from '../../src/errors';
import { HEADER_X_ACROLINX_AUTH, HEADER_X_ACROLINX_BASE_URL, HEADER_X_ACROLINX_CLIENT } from '../../src/headers';
import { DEVELOPMENT_SIGNATURE } from '../../src/index';
import { ServerNotificationResponseData } from '../../src/notifications';
import { AuthorizationType, SigninPollResult, SigninResult, SigninSuccessResult } from '../../src/signin';
import { MockResponseObjectOf, Route } from './common-mocking';
import { CheckServiceMock } from './mock-server-checking';
import {
  AUTH_TOKEN_INVALID,
  AUTH_TOKEN_MISSING,
  CLIENT_SIGNATURE_INVALID,
  CLIENT_SIGNATURE_MISSING,
  SIGNIN_URL_EXPIRED_ERROR,
} from './mocked-errors';

export { SIGNIN_URL_EXPIRED_ERROR };

export const DUMMY_SIGNIN_LINK_PATH_INTERACTIVE = '/signin-ui/';
const DUMMY_SIGNIN_LINK_PATH_POLL = '/api/v1/auth/sign-ins/';
export const DUMMY_ACCESS_TOKEN = 'dummyAccessToken';
export const DUMMY_USER_ID = 'dummyUserId';
export const DUMMY_USER_NAME = 'dummy@username.org';
export const DUMMY_RETRY_AFTER = 1;
export const DUMMY_INTERACTIVE_LINK_TIMEOUT = 900;

export const ALLOWED_CLIENT_SIGNATURES = ['dummyClientSignature', DEVELOPMENT_SIGNATURE];
export const SSO_GENERIC_TOKEN = 'secretSsoToken';

export interface LoggedRequest {
  opts: {
    headers: StringMap;
    credentials?: RequestCredentials;
  };
  url: string;
}

export interface StringMap {
  [key: string]: string;
}

function isMockResponseObject(o: MockResponseObject | {}): o is MockResponseObject {
  return !!(o as MockResponseObject).body;
}

function isAcrolinxApiError(o: AcrolinxApiError | {}): o is AcrolinxApiError {
  const potentialAcroApiError = o as AcrolinxApiError;
  return !!(potentialAcroApiError.status && potentialAcroApiError.type && potentialAcroApiError.title);
}

interface SigninState {
  authorizationType?: AuthorizationType;
}

export enum SsoMockMode {
  none = 'none',

  /**
   * Used by to simulate a proxy that add credentials automatically (eg. for the Sidebar).
   */
  proxy = 'proxy',

  /**
   * Used to simulate an Acrolinx server that requires the correct generic password and a username for SSO.
   */
  direct = 'direct',
}

export class AcrolinxServerMock {
  public readonly checkService: CheckServiceMock;
  public requests: LoggedRequest[] = [];
  public simulatedError: {
    signin?: Error;
  } = {};
  public retryAfter: number = DUMMY_RETRY_AFTER;

  private routes: Route[];
  private signinIds: { [id: string]: SigninState } = {};
  private ssoMockMode: SsoMockMode = SsoMockMode.none;

  constructor(public readonly acrolinxUrl: string) {
    this.checkService = new CheckServiceMock(acrolinxUrl);
    this.routes = [
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
      {
        handler: (args, opts) => this.getPlatformNotifications(args[1], opts),
        method: 'GET',
        path: /api\/v1\/broadcasts\/platform-notifications\/(.*)$/,
      },
      ...this.checkService.getRoutes(),
    ];

    this.signinIds.dummy = {};
  }

  public fakeSignIn(authorizationType = AuthorizationType.ACROLINX_SIGN_IN, signinId?: string) {
    if (signinId) {
      this.signinIds[signinId].authorizationType = authorizationType;
    } else {
      _.forEach(this.signinIds, (signinState) => {
        signinState.authorizationType = authorizationType;
      });
    }
  }

  public enableSSO(ssoMockMode: SsoMockMode) {
    this.ssoMockMode = ssoMockMode;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public handleFetchRequest = (url: string, optsArg: RequestInit = {}): MockResponseObject => {
    const opts = { method: 'GET', ...optsArg, headers: (optsArg.headers || {}) as StringMap };

    this.requests.push({ opts, url });

    const acrolinxClientHeader = getHeader(optsArg, HEADER_X_ACROLINX_CLIENT);
    if (acrolinxClientHeader) {
      const [signature, version] = acrolinxClientHeader.split(';').map((s) => s.trim());
      if (!signature || !version) {
        return this.createAcrolinxApiErrorResponse(CLIENT_SIGNATURE_MISSING);
      }
      if (!_.includes(ALLOWED_CLIENT_SIGNATURES, signature)) {
        return this.createAcrolinxApiErrorResponse({ ...CLIENT_SIGNATURE_INVALID, title: signature });
      }
    } else if (_.includes(url, 'api')) {
      return this.createAcrolinxApiErrorResponse(CLIENT_SIGNATURE_MISSING);
    }

    if (_.includes(url, '/api/') && !_.includes(url, '/auth/')) {
      const token = getHeader(opts, HEADER_X_ACROLINX_AUTH);
      if (!token) {
        console.error('Missing Token', token);
        return this.createAcrolinxApiErrorResponse(AUTH_TOKEN_MISSING);
      } else if (token !== DUMMY_ACCESS_TOKEN) {
        console.error('Invalid Token', token);
        return this.createAcrolinxApiErrorResponse(AUTH_TOKEN_INVALID);
      }
    }

    for (const route of this.routes) {
      const matches = url.match(route.path);
      if (matches && opts.method === route.method) {
        try {
          const handlerResult = route.handler(matches, opts);
          if (isMockResponseObject(handlerResult)) {
            return handlerResult;
          } else if (isAcrolinxApiError(handlerResult)) {
            return { body: handlerResult, status: handlerResult.status };
          } else {
            return this.returnResponse(handlerResult);
          }
        } catch (error) {
          return { body: { error }, status: 500 };
        }
      }
    }

    console.log(`FakeServer can not handle url "${url}"`, opts);
    return this.createAcrolinxApiErrorResponse({ status: 404 });
  };

  public deleteSigninPollUrl(url: string) {
    const signinId = url.substr(url.lastIndexOf('/') + 1);
    this.deleteSignin(signinId);
  }

  public pollForSignin(
    signinId: string,
    _opts: RequestInit,
  ): MockResponseObjectOf<SigninPollResult | AcrolinxApiError> {
    const signinState = this.signinIds[signinId];
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
        body: { progress: { percent: 0, message: 'bla', retryAfter: this.retryAfter }, links: { poll: 'dummmy' } },
        headers: { 'retry-after': '' + this.retryAfter },
        status: 202,
      };
    }
  }

  private deleteSignin(signinId: string) {
    delete this.signinIds[signinId];
  }

  private returnResponse(body: {}) {
    return { body };
  }

  private getPlatformNotifications(
    _sinceTimeStamp: string,
    _opts: RequestInit,
  ): SuccessResponse<ServerNotificationResponseData> {
    return { data: { platformNotifications: [], requestTimeInMilliseconds: Date.now() }, links: {} };
  }

  private signin(opts: RequestInit): SigninResult {
    if (this.simulatedError.signin) {
      throw this.simulatedError.signin;
    }

    switch (this.ssoMockMode) {
      case SsoMockMode.direct:
        if (getHeader(opts, 'password') !== SSO_GENERIC_TOKEN) {
          throw new AcrolinxError({ type: ErrorType.SSO, title: 'SSO Error Title', detail: 'SSO Error Details' });
        }
        return this.createLoginSuccessResult(AuthorizationType.ACROLINX_SSO, getHeader(opts, 'username'));
      case SsoMockMode.proxy:
        return this.createLoginSuccessResult(AuthorizationType.ACROLINX_SSO);
      case SsoMockMode.none:
    }

    if (getHeader(opts, HEADER_X_ACROLINX_AUTH) === DUMMY_ACCESS_TOKEN) {
      return this.createLoginSuccessResult(AuthorizationType.ACROLINX_TOKEN);
    }
    const baseUrl = getHeader(opts, HEADER_X_ACROLINX_BASE_URL) || this.acrolinxUrl;
    const id = _.uniqueId('signin-id-');
    this.signinIds[id] = {};
    return {
      data: { interactiveLinkTimeout: DUMMY_INTERACTIVE_LINK_TIMEOUT },
      links: {
        interactive: baseUrl + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE + id,
        poll: baseUrl + DUMMY_SIGNIN_LINK_PATH_POLL + id,
      },
    };
  }

  private createAcrolinxApiErrorResponse(apiError: Partial<AcrolinxApiError>): MockResponseObjectOf<AcrolinxApiError> {
    const fullApiError = {
      detail: 'DummyErrorDetail',
      status: 400,
      title: 'DummyErrorTitle',
      type: 'DummyErrorType',
      ...apiError,
    };
    return {
      body: fullApiError,
      status: fullApiError.status,
    };
  }

  private createLoginSuccessResult(
    authorizedUsing: AuthorizationType,
    username = DUMMY_USER_NAME,
  ): SigninSuccessResult {
    return {
      data: {
        accessToken: DUMMY_ACCESS_TOKEN,
        authorizedUsing,
        links: {},
        user: {
          id: DUMMY_USER_ID,
          username,
        },
        integration: {
          properties: {},
          addons: [],
        },
      },
      links: {},
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
        'Content-Type': 'text/html',
      },
    };
  }

  private returnConfirmSigninPage(signinId: string, opts: RequestInit) {
    if (!this.signinIds[signinId]) {
      return { status: 404, body: { message: 'Unknown signinId ' + signinId } };
    }
    this.fakeSignIn(AuthorizationType.ACROLINX_SIGN_IN, signinId);
    return this.pollForSignin(signinId, opts);
  }

  private returnSigninDeletedPage(signinId: string, _opts: RequestInit) {
    this.deleteSignin(signinId);
    return { message: `${signinId} is deleted` };
  }
}

function getHeader(requestOpts: RequestInit, headerKey: string): string | undefined {
  if (!requestOpts.headers) {
    return undefined;
  }
  return _.find(
    requestOpts.headers as Record<string, string>,
    (_val, key) => key.toLowerCase() === headerKey.toLowerCase(),
  );
}

export function mockAcrolinxServer(url: string): AcrolinxServerMock {
  const mockedServer = new AcrolinxServerMock(url);
  fetchMock.mock('begin:' + url, mockedServer.handleFetchRequest);
  return mockedServer;
}

export function mockBrokenJsonServer(url: string) {
  fetchMock.mock('begin:' + url, (_url: string, _opts: RequestInit): MockResponseObject => {
    return { body: "This isn't the json you are looking for" };
  });
}

export function restoreOriginalFetch() {
  fetchMock.restore();
}
