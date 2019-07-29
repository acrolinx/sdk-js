import * as _ from 'lodash';
import {AcrolinxEndpoint, ErrorType, isSigninLinksResult, isSigninSuccessResult, PollMoreResult} from '../../src/index';
import {SigninLinksResult, SigninSuccessResult} from '../../src/signin';
import {waitMs} from '../../src/utils/mixed-utils';
import {
  AcrolinxServerMock,
  DUMMY_ACCESS_TOKEN,
  DUMMY_INTERACTIVE_LINK_TIMEOUT,
  DUMMY_RETRY_AFTER,
  DUMMY_SIGNIN_LINK_PATH_INTERACTIVE,
  DUMMY_USER_NAME,
  mockAcrolinxServer,
  restoreOriginalFetch,
  SSO_GENERIC_TOKEN,
  SsoMockMode
} from '../test-utils/mock-server';
import {expectFailingPromise} from '../test-utils/utils';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

describe('signin', () => {
  let endpoint: AcrolinxEndpoint;
  let mockedAcrolinxServer: AcrolinxServerMock;

  beforeEach(() => {
    mockedAcrolinxServer = mockAcrolinxServer(DUMMY_SERVER_URL);
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  it('should return the signin links', async () => {
    const result = await endpoint.signin() as SigninLinksResult;
    expect(isSigninLinksResult(result)).toBeTruthy();
    expect(_.startsWith(result.links.interactive, DUMMY_SERVER_URL + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE)).toBeTruthy();
    expect(result.data.interactiveLinkTimeout).toEqual(DUMMY_INTERACTIVE_LINK_TIMEOUT);
  });

  it('should return the provided accessToken if valid', async () => {
    const result = await endpoint.signin({accessToken: DUMMY_ACCESS_TOKEN}) as SigninLinksResult;
    if (isSigninSuccessResult(result)) {
      expect(result.data.accessToken).toEqual(DUMMY_ACCESS_TOKEN);
    } else {
      expect(isSigninSuccessResult(result)).toBeTruthy();
    }
  });

  it('polling should return accessToken after signin', async () => {
    const signinLinks = await endpoint.signin() as SigninLinksResult;

    const pollResult1 = await endpoint.pollForSignin(signinLinks) as PollMoreResult;
    expect(isSigninSuccessResult(pollResult1)).toBeFalsy();
    expect(pollResult1.progress.retryAfter).toEqual(DUMMY_RETRY_AFTER);

    mockedAcrolinxServer.fakeSignIn();

    const signinSuccess = await endpoint.pollForSignin(signinLinks) as SigninSuccessResult;
    expect(isSigninSuccessResult(signinSuccess)).toBeTruthy();
    expect(signinSuccess.data.accessToken).toEqual(DUMMY_ACCESS_TOKEN);
  });

  describe('signInWithSSO', () => {
    it('success', async () => {
      mockedAcrolinxServer.enableSSO(SsoMockMode.direct);
      const signinSuccess = await endpoint.signInWithSSO(SSO_GENERIC_TOKEN, 'kaja');
      expect(signinSuccess.data.user.username).toEqual('kaja');
    });

    it('failure because of disabled SSO', async () => {
      return expectFailingPromise(endpoint.signInWithSSO(SSO_GENERIC_TOKEN, 'kaja'), ErrorType.SSO);
    });

    it('failure because of wrong generic password', async () => {
      mockedAcrolinxServer.enableSSO(SsoMockMode.direct);
      return expectFailingPromise(endpoint.signInWithSSO('wrongGenericPassword', 'kaja'), ErrorType.SSO);
    });

  });

  describe.only('singInInteractive', () => {
    it('success with token', async () => {
      const onSignInUrl = jest.fn();
      const result = await endpoint.singInInteractive({onSignInUrl, accessToken: DUMMY_ACCESS_TOKEN});

      expect(onSignInUrl).toHaveBeenCalledTimes(0);
      expect(result.user.username).toEqual(DUMMY_USER_NAME);
    });

    it('polling', async () => {
      const onSignInUrl = jest.fn();
      const singInInteractivePromise = endpoint.singInInteractive({onSignInUrl});

      mockedAcrolinxServer.fakeSignIn();

      const result = await singInInteractivePromise;

      expect(onSignInUrl).toHaveBeenCalledTimes(1);
      expect(onSignInUrl.mock.calls[0][0]).toMatch(/^http/);
      expect(result.user.username).toEqual(DUMMY_USER_NAME);
    });

    it('polling timeout', async () => {
      const onSignInUrl = jest.fn();
      const singInInteractivePromise = endpoint.singInInteractive({onSignInUrl, timeoutMs: 100});

      await waitMs(1000);

      expect(onSignInUrl).toHaveBeenCalledTimes(1);
      expect(onSignInUrl.mock.calls[0][0]).toMatch(/^http/);
      await expectFailingPromise(singInInteractivePromise, ErrorType.SigninTimedOut);
    });
  });
});
