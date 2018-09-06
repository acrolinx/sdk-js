import 'cross-fetch/polyfill';
import * as dotenv from 'dotenv';
import {DEVELOPMENT_SIGNATURE, PollMoreResult} from '../../src';
import {CheckOptions} from '../../src/check';
import {ErrorType} from '../../src/errors';
import {AcrolinxEndpoint, isSigninSuccessResult, SigninSuccessResult} from '../../src/index';
import {SigninLinksResult} from '../../src/signin';
import {waitMs} from '../../src/utils/mixed-utils';
import {resetUserMetaData} from '../test-utils/meta-data';
import {describeIf, expectFailingPromise, testIf} from '../test-utils/utils';

dotenv.config();

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'https://test-next-ssl.acrolinx.com';
const SSO_USER_ID = process.env.SSO_USER_ID;
const SSO_PASSWORD = process.env.SSO_PASSWORD;
const ACROLINX_API_TOKEN = process.env.ACROLINX_API_TOKEN || '';

function createEndpoint(serverAddress: string) {
  return new AcrolinxEndpoint({
    enableHttpLogging: true,
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
      await expectFailingPromise(api.getServerVersion(), ErrorType.HttpConnectionProblem);
    }, LONG_TIME_OUT_MS);

    it('should return an failing promise for invalid URLS', async () => {
      const api = createEndpoint('http://non-ext!::?isting-server');
      await expectFailingPromise(api.getServerVersion(), ErrorType.HttpConnectionProblem);
    }, LONG_TIME_OUT_MS);
  });

  describe('signin', () => {
    let api: AcrolinxEndpoint;

    beforeEach(() => {
      api = createEndpoint(TEST_SERVER_URL);
    });

    it('should return the server version', async () => {
      const result = await api.getServerVersion();
      expect(result.version).toBe('2018.10');
    });

    it('should return the signin links', async () => {
      const result = await api.signin() as SigninLinksResult;
      expect(result.links.interactive).toContain(TEST_SERVER_URL);
      expect(result.data.interactiveLinkTimeout).toBeGreaterThan(100);
    });

    testIf(ACROLINX_API_TOKEN, 'should return the provided API-Token', async () => {
      const result = await api.signin({authToken: ACROLINX_API_TOKEN}) as SigninSuccessResult;
      expect(result.data.authToken).toBe(ACROLINX_API_TOKEN);
    });

    it('should return an api error for invalid signin poll address', async () => {
      const signinPollResultPromise = api.pollForSignin({
        data: {interactiveLinkTimeout: 0},
        links: {
          interactive: 'dummy',
          poll: TEST_SERVER_URL + '/api/v1/auth/sign-ins/0ddece9c-464a-442b-8a5d-d2f242d54c81'
        }
      });
      await expectFailingPromise(signinPollResultPromise, ErrorType.SigninTimedOut);
    });

    testIf(SSO_USER_ID || SSO_PASSWORD, 'signin with sso', async () => {
      const result = await api.signin({
          password: SSO_PASSWORD,
          userId: SSO_USER_ID,
        }
      ) as SigninSuccessResult;
      expect(result.data.userId).toContain(SSO_USER_ID);
    });

    it('poll for signin', async () => {
      const result = await api.signin() as SigninLinksResult;
      const pollResult = await api.pollForSignin(result);
      expect(isSigninSuccessResult(pollResult)).toBeFalsy();
      expect((pollResult as PollMoreResult).progress.retryAfter).toBeGreaterThan(0);
    });
  });

  describeIf(ACROLINX_API_TOKEN, 'with API token', async () => {
    let api: AcrolinxEndpoint;

    beforeAll(async () => {
      if (ACROLINX_API_TOKEN) {
        return resetUserMetaData(createEndpoint(TEST_SERVER_URL), ACROLINX_API_TOKEN);
      }
    });

    beforeEach(() => {
      api = createEndpoint(TEST_SERVER_URL);
    });

    it('should return the checking capabilities', async () => {
      const result = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);
      expect(result.audiences.length).toBeGreaterThan(0);
    });

    describe('server notifications', () => {
      it('should return something', async () => {
        const serverMessages = await api.getServerNotifications(ACROLINX_API_TOKEN, 0);
        expect(Array.isArray(serverMessages.data.platformNotifications)).toBe(true);
        expect(serverMessages.data.requestTimeInMilliseconds).toBeGreaterThan(0);
      });
    });

    describe('check', () => {
      async function createDummyCheck(checkOptions: CheckOptions = {}) {
        const capabilities = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);

        return await api.check(ACROLINX_API_TOKEN, {
          checkOptions: {
            audienceId: capabilities.audiences[0].id,
            ...checkOptions
          },
          document: {
            reference: 'filename.txt'
          },
          content: 'Testt Textt'
        });
      }

      it('can check', async () => {
        const check = await createDummyCheck();

        let checkResultOrProgress;
        do {
          checkResultOrProgress = await api.pollForCheckResult(ACROLINX_API_TOKEN, check);
          if ('progress' in checkResultOrProgress) {
            expect(checkResultOrProgress.progress.percent).toBeGreaterThanOrEqual(0);
            expect(checkResultOrProgress.progress.percent).toBeLessThanOrEqual(100);
            // We could wait for checkResultOrProgress.progress.retryAfter but this would slow down the test.
          }
        } while ('progress' in checkResultOrProgress);

        expect(checkResultOrProgress.data.goals.length).toBeGreaterThan(0);
      }, 10000);

      it.skip('can cancel check', async () => {
        const check = await createDummyCheck();

        const cancelResponse = await api.cancelCheck(ACROLINX_API_TOKEN, check);
        expect(cancelResponse.data.id).toBe(check.data.id);

        // According to Heiko, cancelling may need some time. (See also DEV-17377)
        await waitMs(1000);

        await expectFailingPromise(api.pollForCheckResult(ACROLINX_API_TOKEN, check), ErrorType.CheckCancelled);
      });

      it('cancel needs correct auth token', async () => {
        const check = await createDummyCheck();
        await expectFailingPromise(api.cancelCheck('invalid token', check), ErrorType.Auth);
      });

      it('exception if partialCheckRanges are invalid', async () => {
        await expectFailingPromise(createDummyCheck({partialCheckRanges: [{begin: 0, end: 1e9}]}), ErrorType.Client);
      });

    });
  });
});
