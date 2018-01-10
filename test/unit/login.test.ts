import * as fetchMock from 'fetch-mock';
import {AcrolinxEndpoint, AcrolinxEndpointProps, isSigninLinksResult, isSigninSuccessResult} from '../../src/index';
import {SigninLinksResult, SigninSuccessResult} from '../../src/login';
import {
  AcrolinxServerMock, DUMMY_AUTH_TOKEN, DUMMY_SIGNIN_LINK_PATH_INTERACTIVE,
  mockAcrolinxServer
} from '../test-utils/mock-server';

const DUMMY_SERVER_URL = 'http://dummy-server';

const DUMMY_ENDPOINT_PROPS: AcrolinxEndpointProps = {
  clientName: 'TestClient',
  serverAddress: DUMMY_SERVER_URL
};

describe('login', () => {
  let endpoint: AcrolinxEndpoint;
  let mockedAcrolinxServer: AcrolinxServerMock;

  beforeEach(() => {
    fetchMock.restore();
    mockedAcrolinxServer = mockAcrolinxServer(DUMMY_SERVER_URL);
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should return the signin links', async () => {
    const result = await endpoint.login() as SigninLinksResult;
    expect(isSigninLinksResult(result)).toBeTruthy();
    expect(result.links.interactive).toEqual(DUMMY_SERVER_URL + DUMMY_SIGNIN_LINK_PATH_INTERACTIVE);
  });

  it('polling should return authtoken after signin', async () => {
    const signinLinks = await endpoint.login() as SigninLinksResult;

    const pollResult1 = await endpoint.pollForSignin(signinLinks);
    expect(isSigninSuccessResult(pollResult1)).toBeFalsy();

    mockedAcrolinxServer.isUserSignedIn = true;

    const signinSuccess = await endpoint.pollForSignin(signinLinks) as SigninSuccessResult;
    expect(isSigninSuccessResult(signinSuccess)).toBeTruthy();
    expect(signinSuccess.authToken).toEqual(DUMMY_AUTH_TOKEN);
  });

});
