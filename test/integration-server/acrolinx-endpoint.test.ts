import 'cross-fetch/polyfill';
import {ErrorType} from '../../src/errors';
import {AcrolinxEndpoint, isSigninSuccessResult, SigninSuccessResult} from '../../src/index';
import {SigninLinksResult} from '../../src/signin';
import {testIf} from '../test-utils/utils';

const TEST_SERVER_URL = 'https://test-latest-ssl.acrolinx.com';
const SSO_USER_ID = process.env.SSO_USER_ID;
const SSO_PASSWORD = process.env.SSO_PASSWORD;

function createEndpoint(serverAddress: string) {
  return new AcrolinxEndpoint({clientName: 'TestClient', serverAddress});
}

describe('e2e - AcrolinxEndpoint', () => {
  describe('errors by bad server address', () => {
    it('should return an failing promise for 404', async () => {
      const api = createEndpoint(TEST_SERVER_URL + '/not-there');
      try {
        await api.getServerVersion();
      } catch (e) {
        expect(e.type).toEqual(ErrorType.httpError);
        expect(e.httpStatus).toEqual(404);
      }
    });

    it('should return an failing promise for non existing server', async () => {
      const api = createEndpoint('http://non-extisting-server');
      try {
        await api.getServerVersion();
      } catch (e) {
        expect(e.type).toEqual(ErrorType.unknownError);
      }
    });

    it('should return an failing promise for invalid URLS', async () => {
      const api = createEndpoint('http://non-ext!::?isting-server');
      try {
        await api.getServerVersion();
      } catch (e) {
        expect(e.type).toEqual(ErrorType.unknownError);
      }
    });
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
