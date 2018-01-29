import * as _ from 'lodash';
import {DEVELOPMENT_SIGNATURE} from '../../src';
import {
  AcrolinxEndpoint, AcrolinxEndpointProps, isSigninLinksResult, isSigninSuccessResult,
  PollMoreResult
} from '../../src/index';
import {SigninLinksResult, SigninSuccessResult} from '../../src/signin';
import {
  AcrolinxServerMock, DUMMY_AUTH_TOKEN, DUMMY_INTERACTIVE_LINK_TIMEOUT, DUMMY_RETRY_AFTER,
  DUMMY_SIGNIN_LINK_PATH_INTERACTIVE,
  mockAcrolinxServer,
  restoreOriginalFetch
} from '../test-utils/mock-server';

const DUMMY_SERVER_URL = 'http://dummy-server';

const DUMMY_ENDPOINT_PROPS: AcrolinxEndpointProps = {
  client: {
    name: 'TestClient',
    signature: DEVELOPMENT_SIGNATURE,
    version: '1.2.3.666'
  },
  serverAddress: DUMMY_SERVER_URL
};

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
    expect(result.interactiveLinkTimeout).toEqual(DUMMY_INTERACTIVE_LINK_TIMEOUT);
  });

  it('should return the provided auth token if valid', async () => {
    const result = await endpoint.signin({authToken: DUMMY_AUTH_TOKEN}) as SigninLinksResult;
    if (isSigninSuccessResult(result)) {
      expect(result.authToken).toEqual(DUMMY_AUTH_TOKEN);
    } else {
      expect(isSigninSuccessResult(result)).toBeTruthy();
    }
  });

  it('polling should return authtoken after signin', async () => {
    const signinLinks = await endpoint.signin() as SigninLinksResult;

    const pollResult1 = await endpoint.pollForSignin(signinLinks) as PollMoreResult;
    expect(isSigninSuccessResult(pollResult1)).toBeFalsy();
    expect(pollResult1.retryAfterSeconds).toEqual(DUMMY_RETRY_AFTER);

    mockedAcrolinxServer.fakeSignIn();

    const signinSuccess = await endpoint.pollForSignin(signinLinks) as SigninSuccessResult;
    expect(isSigninSuccessResult(signinSuccess)).toBeTruthy();
    expect(signinSuccess.authToken).toEqual(DUMMY_AUTH_TOKEN);
  });

});
