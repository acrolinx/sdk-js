import 'cross-fetch/polyfill';
import {DEVELOPMENT_SIGNATURE} from '../../src';
import {ErrorType} from '../../src/errors';
import {AcrolinxEndpoint, isSigninSuccessResult, SigninSuccessResult} from '../../src/index';
import {SigninLinksResult} from '../../src/signin';
import {testIf} from '../test-utils/utils';

const TEST_SERVER_URL = 'https://test-latest-ssl.acrolinx.com';
const SSO_USER_ID = process.env.SSO_USER_ID;
const SSO_PASSWORD = process.env.SSO_PASSWORD;

function createEndpoint(serverAddress: string) {
  return new AcrolinxEndpoint({
    client: {
      name: 'TestClient',
      signature: DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666'
    }, serverAddress
  });
}

describe('e2e - AcrolinxEndpoint', () => {
  describe('errors by bad server address', () => {
    const LONG_TIME_OUT_MS = 10000;

    it('should return an failing promise for 404', async () => {
      const api = createEndpoint(TEST_SERVER_URL + '/not-there');
      try {
        await api.getServerVersion();
      } catch (e) {
        expect(e.type).toEqual(ErrorType.HttpErrorStatus);
        expect(e.status).toEqual(404);
      }
      expect.hasAssertions();
    });

    it('should return an failing promise for non existing server', async () => {
      const api = createEndpoint('http://non-extisting-server');
      try {
        await api.getServerVersion();
      } catch (e) {
        expect(e.type).toEqual(ErrorType.HttpConnectionProblem);
      }
      expect.hasAssertions();
    });

    it('should return an failing promise for invalid URLS', async () => {
      const api = createEndpoint('http://non-ext!::?isting-server');
      try {
        await api.getServerVersion();
      } catch (e) {
        expect(e.type).toEqual(ErrorType.HttpConnectionProblem);
      }
      expect.hasAssertions();
    }, LONG_TIME_OUT_MS);
  });

  describe('test-latest', () => {
    let api: AcrolinxEndpoint;

    beforeEach(() => {
      api = createEndpoint(TEST_SERVER_URL);
    });

    it('should return the server version', async () => {
      const result = await api.getServerVersion();
      expect(result.version).toBe('5.4.0');
    });

    it('should return the signin links', async () => {
      const result = await api.signin() as SigninLinksResult;
      expect(result.links.interactive).toContain(TEST_SERVER_URL);
      expect(result.interactiveLinkTimeout).toBeGreaterThan(100);
    });

    it('should return an api error for invalid signin poll address', async () => {
      try {
        await api.pollForSignin({
          interactiveLinkTimeout: 0,
          links: {
            interactive: 'dummy',
            poll: TEST_SERVER_URL + '/api/v1/auth/sign-ins/0ddece9c-464a-442b-8a5d-d2f242d54c81'
          }
        });
      } catch (e) {
        expect(e.type).toEqual(ErrorType.Client);
      }
      expect.hasAssertions();
    });

    testIf(!!(SSO_USER_ID || SSO_PASSWORD), 'signin with sso', async () => {
      const result = await api.signin({
          password: SSO_PASSWORD,
          userId: SSO_USER_ID,
        }
      ) as SigninSuccessResult;
      expect(result.userId).toContain(SSO_USER_ID);
    });

    // skipped because of long polling
    it.skip('poll for signin', async () => {
      const result = await api.signin() as SigninLinksResult;
      const pollResult = await api.pollForSignin(result);
      expect(isSigninSuccessResult(pollResult)).toBeFalsy();
    });
  });

});
