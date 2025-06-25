/*
 * Copyright 2025-present Acrolinx GmbH
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

import { http, HttpResponse } from 'msw';
import * as _ from 'lodash';
import { SuccessResponse } from '../../src/common-types';
import { AcrolinxApiError } from '../../src/errors';
import { DEVELOPMENT_SIGNATURE } from '../../src/index';
import { ServerNotificationResponseData } from '../../src/notifications';
import { AuthorizationType, SigninPollResult, SigninResult, SigninSuccessResult } from '../../src/signin';
import { CheckServiceMock } from './mock-server-checking';
import { SIGNIN_URL_EXPIRED_ERROR } from './mocked-errors';
import { createMockResponse } from './msw-setup';

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
    headers: Record<string, string>;
    credentials?: RequestCredentials;
  };
  url: string;
}

interface SigninState {
  authorizationType?: AuthorizationType;
}

export enum SsoMockMode {
  none = 'none',
  proxy = 'proxy',
  direct = 'direct',
}

export class AcrolinxServerMock {
  public readonly checkService: CheckServiceMock;
  public requests: LoggedRequest[] = [];
  public simulatedError: {
    signin?: Error;
  } = {};
  public retryAfter: number = DUMMY_RETRY_AFTER;

  private signinIds: { [id: string]: SigninState } = {};
  private ssoMockMode: SsoMockMode = SsoMockMode.none;

  constructor(public readonly acrolinxUrl: string) {
    this.checkService = new CheckServiceMock(acrolinxUrl);
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

  public deleteSigninPollUrl(url: string) {
    const signinId = url.substr(url.lastIndexOf('/') + 1);
    this.deleteSignin(signinId);
  }

  public pollForSignin(signinId: string, _opts: RequestInit): SigninPollResult | AcrolinxApiError {
    if (this.signinIds[signinId]) {
      const signinState = this.signinIds[signinId];
      if (signinState.authorizationType) {
        const result = this.createLoginSuccessResult(signinState.authorizationType);
        this.deleteSignin(signinId);
        return result;
      }
    }

    return {
      progress: {
        percent: 0,
        message: 'Still working',
        retryAfter: this.retryAfter,
      },
      links: {
        poll: `${this.acrolinxUrl}/api/v1/auth/sign-ins/${signinId}`,
      },
    };
  }

  private deleteSignin(signinId: string) {
    delete this.signinIds[signinId];
  }

  private returnResponse(body: {}) {
    return createMockResponse(body);
  }

  private getPlatformNotifications(
    _sinceTimeStamp: string,
    _opts: RequestInit,
  ): SuccessResponse<ServerNotificationResponseData> {
    return {
      data: {
        platformNotifications: [],
        requestTimeInMilliseconds: 100,
      },
      links: {},
    };
  }

  public signin(): SigninResult {
    const signinId = 'dummy-signin-id-' + Date.now();
    this.signinIds[signinId] = {};

    return {
      links: {
        interactive: this.acrolinxUrl + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE + signinId,
        poll: this.acrolinxUrl + DUMMY_SIGNIN_LINK_PATH_POLL + signinId,
      },
      data: {
        interactiveLinkTimeout: DUMMY_INTERACTIVE_LINK_TIMEOUT,
      },
    };
  }

  private createLoginSuccessResult(
    authorizedUsing: AuthorizationType,
    username = DUMMY_USER_NAME,
  ): SigninSuccessResult {
    return {
      data: {
        accessToken: DUMMY_ACCESS_TOKEN,
        user: {
          id: DUMMY_USER_ID,
          username,
        },
        integration: {
          properties: {
            'integration.version': '1.2.3.666',
          },
          addons: [],
        },
        authorizedUsing,
        links: {},
      },
      links: {},
    };
  }

  private returnFakeSigninPage(signinId: string) {
    if (this.ssoMockMode === SsoMockMode.proxy) {
      return this.createLoginSuccessResult(AuthorizationType.ACROLINX_SIGN_IN);
    }

    return this.returnResponse({
      signinId,
      formAction: this.acrolinxUrl + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE + signinId + '/confirm',
    });
  }

  private returnConfirmSigninPage(signinId: string) {
    this.fakeSignIn(AuthorizationType.ACROLINX_SIGN_IN, signinId);
    return this.returnResponse({ success: true });
  }

  private returnSigninDeletedPage(signinId: string) {
    this.deleteSignin(signinId);
    return this.returnResponse({ success: true });
  }

  // MSW handler methods
  public getHandlers() {
    return [
      // Signin endpoint
      http.post(`${this.acrolinxUrl}/api/v1/auth/sign-ins`, async ({ request }) => {
        this.logRequest(request);
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
        // Check for access token
        if (headers['x-acrolinx-auth'] === DUMMY_ACCESS_TOKEN) {
          return createMockResponse(this.createLoginSuccessResult(AuthorizationType.ACROLINX_TOKEN));
        }
        // Check for SSO (maximally permissive)
        if (this.ssoMockMode === SsoMockMode.direct) {
          let username: string | undefined, genericToken: string | undefined;
          try {
            const contentType = headers['content-type'] || '';
            if (contentType.includes('application/json')) {
              const body = (await request.json()) as { username?: string; genericToken?: string };
              username = body.username;
              genericToken = body.genericToken;
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
              const text = await request.text();
              const params = new URLSearchParams(text);
              username = params.get('username') || undefined;
              genericToken = params.get('genericToken') || undefined;
            }
          } catch {}
          // Also check headers and query for SSO token
          if (
            (username && genericToken === SSO_GENERIC_TOKEN) ||
            Object.values(headers).includes(SSO_GENERIC_TOKEN) ||
            request.url.includes(SSO_GENERIC_TOKEN)
          ) {
            return createMockResponse(
              this.createLoginSuccessResult(AuthorizationType.ACROLINX_SSO, username || 'kaja'),
            );
          }
        }
        return createMockResponse(this.signin());
      }),

      // Signin poll endpoint
      http.get(`${this.acrolinxUrl}/api/v1/auth/sign-ins/:signinId`, ({ params, request }) => {
        this.logRequest(request);
        const signinId = params.signinId as string;
        // Ensure fakeSignIn can update the correct signinId
        return createMockResponse(this.pollForSignin(signinId, {}));
      }),

      // Signin UI endpoints
      http.get(`${this.acrolinxUrl}/signin-ui/:signinId`, ({ params, request }) => {
        this.logRequest(request);
        const signinId = params.signinId as string;
        return createMockResponse(this.returnFakeSigninPage(signinId));
      }),

      http.post(`${this.acrolinxUrl}/signin-ui/:signinId/confirm`, ({ params, request }) => {
        this.logRequest(request);
        const signinId = params.signinId as string;
        return createMockResponse(this.returnConfirmSigninPage(signinId));
      }),

      http.post(`${this.acrolinxUrl}/signin-ui/:signinId/delete`, ({ params, request }) => {
        this.logRequest(request);
        const signinId = params.signinId as string;
        return createMockResponse(this.returnSigninDeletedPage(signinId));
      }),

      // Platform notifications
      http.get(`${this.acrolinxUrl}/api/v1/broadcasts/platform-notifications/:timestamp`, ({ request }) => {
        this.logRequest(request);
        return createMockResponse(this.getPlatformNotifications('', {}));
      }),

      // Telemetry endpoints - add handlers for OTLP endpoints
      http.post(`${this.acrolinxUrl}/otlp/logs`, ({ request }) => {
        this.logRequest(request);
        return createMockResponse({ success: true });
      }),

      http.post(`${this.acrolinxUrl}/otlp/metrics`, ({ request }) => {
        this.logRequest(request);
        return createMockResponse({ success: true });
      }),

      // Int-service config endpoint
      http.get(`${this.acrolinxUrl}/int-service/api/v1/config`, ({ request }) => {
        this.logRequest(request);
        return createMockResponse({
          activateGetSuggestionReplacement: true,
          telemetryEnabled: true,
        });
      }),

      // Check service handlers
      ...this.checkService.getMSWHandlers(this.acrolinxUrl),
    ];
  }

  private logRequest(request: Request) {
    const url = new URL(request.url);
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    this.requests.push({
      opts: {
        headers,
        credentials: request.credentials,
      },
      url: url.toString(),
    });
  }
}

// Helper function to create a broken JSON server
export function createBrokenJsonServer(url: string) {
  return http.all(`${url}/*`, () => {
    return new HttpResponse("This isn't the json you are looking for", {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  });
}
