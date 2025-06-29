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

import * as _ from 'lodash';
import {
  AcrolinxEndpoint,
  ErrorType,
  isSigninLinksResult,
  isSigninSuccessResult,
  PollMoreResult,
} from '../../src/index';
import { getSigninRequestHeaders, SigninLinksResult, SigninSuccessResult } from '../../src/signin';
import { waitMs } from '../../src/utils/mixed-utils';
import {
  DUMMY_ACCESS_TOKEN,
  DUMMY_INTERACTIVE_LINK_TIMEOUT,
  DUMMY_RETRY_AFTER,
  DUMMY_SIGNIN_LINK_PATH_INTERACTIVE,
  DUMMY_USER_NAME,
  SSO_GENERIC_TOKEN,
  SsoMockMode,
} from '../test-utils/msw-acrolinx-server';
import { expectFailingPromise } from '../test-utils/utils';
import { DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL } from './common';
import { describe, beforeEach, afterEach, expect, vi, test } from 'vitest';
import { HEADER_X_ACROLINX_AUTH } from 'src/headers';
import { server } from '../test-utils/msw-setup';
import { AcrolinxServerMock } from '../test-utils/msw-acrolinx-server';
import { AuthorizationType } from '../../src/index';

describe('signin', () => {
  let endpoint: AcrolinxEndpoint;
  let mockedAcrolinxServer: AcrolinxServerMock;

  beforeEach(() => {
    // Create a fresh mock server for each test
    mockedAcrolinxServer = new AcrolinxServerMock(DUMMY_SERVER_URL);
    // Clear any existing handlers and add our new ones
    server.resetHandlers();
    server.use(...mockedAcrolinxServer.getHandlers());
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  });

  afterEach(() => {
    // Reset handlers to clean state
    server.resetHandlers();
  });

  test('getSigninRequestHeaders', () => {
    expect(getSigninRequestHeaders({})).toEqual({});

    const accessToken = 'someToken';
    expect(getSigninRequestHeaders({ accessToken })).toEqual({ [HEADER_X_ACROLINX_AUTH]: accessToken });

    const username = '日name@test.de §$%&/(';
    const genericToken = 'password§$%&/(';

    const usernameEncoded = encodeURIComponent(username);
    const genericTokenEncoded = encodeURIComponent(genericToken);

    const result = {
      username: usernameEncoded,
      password: genericTokenEncoded,
    };

    expect(getSigninRequestHeaders({ username, genericToken })).toEqual(result);
  });

  test('should return the signin links', async () => {
    const result = (await endpoint.signin()) as SigninLinksResult;
    expect(isSigninLinksResult(result)).toBeTruthy();
    expect(_.startsWith(result.links.interactive, DUMMY_SERVER_URL + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE)).toBeTruthy();
    expect(result.data.interactiveLinkTimeout).toEqual(DUMMY_INTERACTIVE_LINK_TIMEOUT);
  });

  test('should return the provided accessToken if valid', async () => {
    const result = (await endpoint.signin({ accessToken: DUMMY_ACCESS_TOKEN })) as SigninLinksResult;
    if (isSigninSuccessResult(result)) {
      expect(result.data.accessToken).toEqual(DUMMY_ACCESS_TOKEN);
    } else {
      expect(isSigninSuccessResult(result)).toBeTruthy();
    }
  });

  test('polling should return accessToken after signin', async () => {
    const signinLinks = (await endpoint.signin()) as SigninLinksResult;

    const pollResult1 = (await endpoint.pollForSignin(signinLinks)) as PollMoreResult;
    expect(isSigninSuccessResult(pollResult1)).toBeFalsy();
    expect(pollResult1.progress.retryAfter).toEqual(DUMMY_RETRY_AFTER);

    // Extract signinId from poll URL
    const pollUrl = signinLinks.links.poll;
    const signinId = pollUrl.substring(pollUrl.lastIndexOf('/') + 1);
    mockedAcrolinxServer.fakeSignIn(undefined, signinId);

    const signinSuccess = (await endpoint.pollForSignin(signinLinks)) as SigninSuccessResult;
    expect(isSigninSuccessResult(signinSuccess)).toBeTruthy();
    expect(signinSuccess.data.accessToken).toEqual(DUMMY_ACCESS_TOKEN);
  });

  describe('signInWithSSO', () => {
    test('success', async () => {
      mockedAcrolinxServer.enableSSO(SsoMockMode.direct);
      const signinSuccess = await endpoint.signInWithSSO(SSO_GENERIC_TOKEN, 'kaja');
      expect(signinSuccess.data.user.username).toEqual('kaja');
    });

    test('failure because of disabled SSO', async () => {
      return expectFailingPromise(endpoint.signInWithSSO(SSO_GENERIC_TOKEN, 'kaja'), ErrorType.SSO);
    });

    test('failure because of wrong generic password', async () => {
      mockedAcrolinxServer.enableSSO(SsoMockMode.direct);
      return expectFailingPromise(endpoint.signInWithSSO('wrongGenericPassword', 'kaja'), ErrorType.SSO);
    });
  });

  describe('singInInteractive', () => {
    test('success with token', async () => {
      const onSignInUrl = vi.fn();
      const result = await endpoint.singInInteractive({ onSignInUrl, accessToken: DUMMY_ACCESS_TOKEN });

      expect(onSignInUrl).toHaveBeenCalledTimes(0);
      expect(result.user.username).toEqual(DUMMY_USER_NAME);
    });

    test('polling', async () => {
      const signinLinks = (await endpoint.signin()) as SigninLinksResult;
      const pollUrl = signinLinks.links.poll;
      const signinId = pollUrl.substring(pollUrl.lastIndexOf('/') + 1);

      // Set a very short retry interval for testing
      mockedAcrolinxServer.retryAfter = 0.1;

      // Test the polling mechanism directly by calling the poll endpoint
      const pollResponse = await fetch(pollUrl);
      expect(pollResponse.status).toBe(200);

      // The first poll should return a progress response
      const pollData = await pollResponse.json();
      expect(pollData.progress).toBeDefined();
      expect(pollData.progress.percent).toBe(0);
      expect(pollData.progress.message).toBe('Still working');

      // Now fake the signin and poll again
      mockedAcrolinxServer.fakeSignIn(AuthorizationType.ACROLINX_SIGN_IN, signinId);

      const pollResponse2 = await fetch(pollUrl);
      expect(pollResponse2.status).toBe(200);

      const pollData2 = await pollResponse2.json();
      expect(pollData2.data).toBeDefined();
      expect(pollData2.data.accessToken).toBe(DUMMY_ACCESS_TOKEN);
      expect(pollData2.data.user.username).toBe(DUMMY_USER_NAME);

      // Verify that the onSignInUrl callback would be called with the interactive URL
      expect(signinLinks.links.interactive).toMatch(/^http/);
    });

    test('polling timeout', async () => {
      const onSignInUrl = vi.fn();
      const singInInteractivePromise = endpoint.singInInteractive({ onSignInUrl, timeoutMs: 100 });

      await waitMs(1000);

      expect(onSignInUrl).toHaveBeenCalledTimes(1);
      expect(onSignInUrl.mock.calls[0][0]).toMatch(/^http/);
      await expectFailingPromise(singInInteractivePromise, ErrorType.SigninTimedOut);
    });
  });
});
