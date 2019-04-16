import * as Ajv from 'ajv';
import 'cross-fetch/polyfill';
import * as dotenv from 'dotenv';
import * as _ from 'lodash';
import {
  CheckCancelledByClientError,
  CheckRequest,
  CheckResult,
  CustomFieldType,
  DEVELOPMENT_SIGNATURE,
  DictionaryScope,
  ErrorType,
  hasTermHarvestingReport,
  HasTermHarvestingReport,
  PollMoreResult,
  ReportType,
  User
} from '../../src';
import {CheckOptions} from '../../src/check';
import {DocumentDescriptor} from '../../src/document-descriptor';
import {AcrolinxError, ValidationDetail} from '../../src/errors';
import {AcrolinxEndpoint, isSigninSuccessResult, SigninSuccessResult} from '../../src/index';
import {SigninLinksResult} from '../../src/signin';
import {waitMs} from '../../src/utils/mixed-utils';
import * as checkResultSchema from '../schemas/check-result.json';
import * as termHarvestingReportSchema from '../schemas/term-harvesting-report.json';
import {describeIf, expectFailingPromise, testIf} from '../test-utils/utils';

dotenv.config();

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'https://test-next-ssl.acrolinx.com';
const SSO_USER_ID = process.env.SSO_USER_ID;
const SSO_PASSWORD = process.env.SSO_PASSWORD;
const ACROLINX_API_TOKEN = process.env.ACROLINX_API_TOKEN || '';
const ACROLINX_API_USER_ID = process.env.ACROLINX_API_USER_ID || 'jenkins-api-js';

const ajv = new Ajv({allErrors: true});

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


function assertDictionaryScopes(scopes: DictionaryScope[]) {
  expect(scopes.length).toBeGreaterThanOrEqual(2);
  expect(scopes).toContain(DictionaryScope.language);
  expect(scopes).toContain(DictionaryScope.document);
}

// tslint:disable:next-line: no-big-function
describe('e2e - AcrolinxEndpoint', () => {
  describe('errors by bad server address', () => {
    const LONG_TIME_OUT_MS = 10000;
    const DUMMY_PATH = '/something';

    it('should return an failing promise for 404', async () => {
      const api = createEndpoint(TEST_SERVER_URL);
      try {
        await api.getJsonFromPath('/not-there');
      } catch (error) {
        expect(error.type).toEqual(ErrorType.HttpErrorStatus);
        expect(error.status).toEqual(404);
        expect(error.httpRequest).toEqual({method: 'GET', url: TEST_SERVER_URL + '/not-there'});
      }
      expect.hasAssertions();
    });

    it('should return an failing promise for non existing server', async () => {
      const api = createEndpoint('http://non-extisting-server');
      await expectFailingPromise(api.getJsonFromPath(DUMMY_PATH), ErrorType.HttpConnectionProblem,
        {method: 'GET', url: 'http://non-extisting-server' + DUMMY_PATH});
    }, LONG_TIME_OUT_MS);

    it('should return an failing promise for invalid URLS', async () => {
      const invalidServerAddress = 'http://non-ext!::?isting-server';
      const api = createEndpoint(invalidServerAddress);
      await expectFailingPromise(api.getJsonFromPath(DUMMY_PATH), ErrorType.HttpConnectionProblem,
        {method: 'GET', url: invalidServerAddress + DUMMY_PATH});

    }, LONG_TIME_OUT_MS);
  });

  describe('signin', () => {
    let api: AcrolinxEndpoint;

    beforeEach(() => {
      api = createEndpoint(TEST_SERVER_URL);
    });

    it('should return the signin links', async () => {
      const result = await api.signin() as SigninLinksResult;
      expect(result.links.interactive).toContain(TEST_SERVER_URL);
      expect(result.data.interactiveLinkTimeout).toBeGreaterThan(100);
    });

    describeIf(ACROLINX_API_TOKEN, 'Signin with valid token', () => {
      it('should return the provided API-Token', async () => {
        const result = await api.signin({authToken: ACROLINX_API_TOKEN}) as SigninSuccessResult;
        expect(result.data.accessToken).toBe(ACROLINX_API_TOKEN);
        expect(result.data.user.id).toBe(ACROLINX_API_USER_ID);
      });

      it('should return client properties', async () => {
        const result = await api.signin({authToken: ACROLINX_API_TOKEN}) as SigninSuccessResult;
        expect(Object.keys(result.data.integration.properties).length).toBeGreaterThan(0);
      });
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
      expect(result.data.user.id).toContain(SSO_USER_ID);
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
      // TODO: Do we need to configure required user custom fields?
    });

    beforeEach(() => {
      api = createEndpoint(TEST_SERVER_URL);
    });

    async function getGuidanceProfileId(guidanceProfilePrefix = 'en'): Promise<string> {
      const capabilities = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);
      const guidanceProfile = _.find(capabilities.guidanceProfiles, a =>
        _.startsWith(a.displayName, guidanceProfilePrefix))!;
      expect(guidanceProfile).toBeDefined();
      return guidanceProfile.id;
    }

    async function createDummyCheckRequest(checkRequestArg: Partial<CheckRequest> = {}) {
      const checkRequest = _.cloneDeep(checkRequestArg);

      if (!checkRequest.checkOptions || !checkRequest.checkOptions.guidanceProfileId) {
        checkRequest.checkOptions = {
          guidanceProfileId: await getGuidanceProfileId(),
          disableCustomFieldValidation: true,
          ...checkRequest.checkOptions
        };
      }

      if (!checkRequest.document) {
        checkRequest.document = {reference: 'filename.txt'};
      }

      return {content: 'Testt Textt with errror', ...checkRequest};
    }

    async function createDummyCheck(checkRequestArg: Partial<CheckRequest> = {}) {
      return await api.check(ACROLINX_API_TOKEN, await createDummyCheckRequest(checkRequestArg));
    }

    async function checkAndWaitForResult(checkRequestArg: Partial<CheckRequest> = {}): Promise<CheckResult> {
      const check = await createDummyCheck(checkRequestArg);

      let checkResultOrProgress;
      do {
        checkResultOrProgress = await api.pollForCheckResult(ACROLINX_API_TOKEN, check);
        if ('progress' in checkResultOrProgress) {
          expect(checkResultOrProgress.progress.percent).toBeGreaterThanOrEqual(0);
          expect(checkResultOrProgress.progress.percent).toBeLessThanOrEqual(100);
          // We could wait for checkResultOrProgress.progress.retryAfter but this would slow down the test.
        }
      } while ('progress' in checkResultOrProgress);

      return checkResultOrProgress.data;
    }

    async function checkAndWaitUntilFinished(checkOptions?: CheckOptions): Promise<CheckResult> {
      const check = await createDummyCheck({checkOptions});

      let checkResultOrProgress;
      do {
        checkResultOrProgress = await api.pollForCheckResult(ACROLINX_API_TOKEN, check);
      } while ('progress' in checkResultOrProgress);

      return checkResultOrProgress.data;
    }

    /**
     * This test requires to setup a document custom field 'Department'
     * with the at least one possible value 'Example Department'.
     */
    describe('user data', () => {
      let user: User;
      const DEPARTMENT_KEY = 'Department';

      beforeEach(async () => {
        const result = await api.signin({authToken: ACROLINX_API_TOKEN}) as SigninSuccessResult;
        user = await api.getUserData(ACROLINX_API_TOKEN, result.data.user.id);
      });

      test('should return user data with custom fields', async () => {
        expect(user.username).toBeDefined();
        const departmentCustomField = _.find(user.customFields, cf => cf.key === DEPARTMENT_KEY);
        expect(departmentCustomField).toBeDefined();
        expect(departmentCustomField!.type).toEqual(CustomFieldType.TYPE_LIST);
      });

      test('should set user custom fields', async () => {
        const updatedUser = await api.setUserCustomFields(ACROLINX_API_TOKEN, user.id, [{
          key: DEPARTMENT_KEY,
          value: 'Example Department'
        }]);

        expect(updatedUser).toBeDefined();
      });
    });

    describe('PlatformCapabilities', () => {
      it('should contain checking and document capabilities', async () => {
        const result = await api.getCapabilities(ACROLINX_API_TOKEN);
        expect(result.document.customFields.length).toBeGreaterThan(0);
        expect(result.checking.guidanceProfiles.length).toBeGreaterThan(0);
      });
    });

    it('should return the checking capabilities', async () => {
      const result = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);
      expect(result.guidanceProfiles.length).toBeGreaterThan(0);
    });

    describe('server notifications', () => {
      it('should return something', async () => {
        const serverMessages = await api.getServerNotifications(ACROLINX_API_TOKEN, 0);
        expect(Array.isArray(serverMessages.data.platformNotifications)).toBe(true);
        expect(serverMessages.data.requestTimeInMilliseconds).toBeGreaterThan(0);
      });

      it('post notifications privilege validation', async () => {
        await expectFailingPromise<AcrolinxError>(api.postServerNotifications(ACROLINX_API_TOKEN, {
            title: 'dummyTitle',
            body: 'dummyBody',
            start: Date.now(),
            end: Date.now() + 1000 * 60
          }), ErrorType.InsufficientPrivileges,
          {method: 'POST', url: TEST_SERVER_URL + '/api/v1/broadcasts/platform-notifications/'});
      });
    });


    describe('check', () => {
      it('can check', async () => {
        const checkResult = await checkAndWaitForResult();

        expect(checkResult.goals.length).toBeGreaterThan(0);
        assertDictionaryScopes(checkResult.dictionaryScopes);

        const spellingIssue = _.find(checkResult.issues, issue => issue.goalId === 'SPELLING')!;
        expect(spellingIssue).toBeDefined();
        expect(spellingIssue.canAddToDictionary).toBe(true);

        const keywords = checkResult.keywords!;
        expect(typeof keywords.links.getTargetKeywords).toEqual('string');
        expect(typeof keywords.links.putTargetKeywords).toEqual('string');
        expect(Array.isArray(keywords.discovered)).toBeTruthy();
        expect(Array.isArray(keywords.target)).toBeTruthy();

        const validateCheckResult = ajv.compile(checkResultSchema);
        validateCheckResult(checkResult);
        expect(validateCheckResult.errors).toBeNull();
      }, 10000);

      it('can cancel check', async () => {
        const check = await createDummyCheck();

        const cancelResponse = await api.cancelCheck(ACROLINX_API_TOKEN, check);
        expect(cancelResponse.data.id).toBe(check.data.id);

        // According to Heiko, cancelling may need some time. (See also DEV-17377)
        await waitMs(1000);

        await expectFailingPromise(api.pollForCheckResult(ACROLINX_API_TOKEN, check), ErrorType.CheckCancelled);
      });

      it('cancel needs correct auth token', async () => {
        const check = await createDummyCheck();
        await expectFailingPromise(api.cancelCheck('invalid token', check), ErrorType.Auth,
          {method: 'DELETE', url: check.links.cancel});
      });

      it.skip('exception if partialCheckRanges are invalid', async () => {
        await expectFailingPromise(createDummyCheck({
          checkOptions: {
            partialCheckRanges: [{
              begin: 0,
              end: 1e9
            }]
          }
        }), ErrorType.Client);
      });

      it('exception GuidanceProfileDoesNotExist for unknown id', async () => {
        await expectFailingPromise(checkAndWaitUntilFinished({guidanceProfileId: '12345-invalid'}),
          ErrorType.GuidanceProfileDoesNotExist);
      });

      it('exception GuidanceProfileDoesNotExist for invalid uuid', async () => {
        await expectFailingPromise(checkAndWaitUntilFinished({guidanceProfileId: 'invalid!uuid'}),
          ErrorType.GuidanceProfileDoesNotExist);
      });

      it('can request the termHarvesting report', async () => {
        const checkResult = await checkAndWaitForResult({
          checkOptions: {
            guidanceProfileId: await getGuidanceProfileId('en-Publications'),
            reportTypes: [ReportType.termHarvesting]
          },
          content: 'NewTerm'
        });
        expect(hasTermHarvestingReport(checkResult.reports)).toEqual(true);
        const reports: HasTermHarvestingReport = checkResult.reports as HasTermHarvestingReport;
        expect(typeof reports.termHarvesting.link).toEqual('string');

        const termHarvestingReport = await api.getTermHarvestingReport(ACROLINX_API_TOKEN, reports);

        const validateTermHarvestingReport = ajv.compile(termHarvestingReportSchema);
        validateTermHarvestingReport(termHarvestingReport);
        expect(validateTermHarvestingReport.errors).toBeNull();

        const harvestedTerm = termHarvestingReport.terms[0];
        // TODO: expect harvestedTerm.links.termContribution
        expect(harvestedTerm.links.termContributionInteractive).toMatch(/^http/);
        expect(harvestedTerm.occurrences).toHaveLength(1);
        expect(harvestedTerm.occurrences[0].positionalInformation.matches).toHaveLength(1);
      }, 10000);

    });

    describe('checkAndGetResult', () => {
      it('should check', async () => {
        const checkResult = await api.checkAndGetResult(ACROLINX_API_TOKEN, await createDummyCheckRequest()).promise;
        expect(checkResult.goals.length).toBeGreaterThan(0);
      });

      it('can be cancelled', async () => {
        const currentCheck = api.checkAndGetResult(ACROLINX_API_TOKEN, await createDummyCheckRequest());

        currentCheck.cancel();

        const error = await expectFailingPromise<AcrolinxError>(currentCheck.promise, ErrorType.CheckCancelled);
        expect(error).toBeInstanceOf(CheckCancelledByClientError);
      });
    });

    describe('after check ', () => {
      let checkResult: CheckResult;
      let document: DocumentDescriptor;

      beforeEach(async () => {
        checkResult = await checkAndWaitUntilFinished();
        expect(checkResult.document.id).toBeDefined();
        document = await api.getDocumentDescriptor(ACROLINX_API_TOKEN, checkResult.document.id);
      });

      it('should get custom fields', async () => {
        expect(document.id).toBeTruthy();
        expect(Array.isArray(document.customFields)).toEqual(true);
      });

      /**
       * This test requires to setup a document custom field 'List Field'
       * with the at least one possible 'List Item 2'.
       */
      it('can write custom field values', async () => {
        const documentInfo2 = await api.setDocumentCustomFields(ACROLINX_API_TOKEN, document.id, [
          {
            key: 'List Field',
            value: 'List Item 2'
          } as any
        ]);

        expect(documentInfo2.id).toEqual(document.id);
      });
    });

    describe('dictionary', () => {
      it('getDictionaryCapabilities', async () => {
        const dictionaryCapabilities = await api.getDictionaryCapabilities(ACROLINX_API_TOKEN);

        assertDictionaryScopes(dictionaryCapabilities.scopes);
      });

      describe('addToDictionary', () => {
        it('language', async () => {
          const result = await api.addToDictionary(ACROLINX_API_TOKEN, {
            surface: 'TestSurface',
            scope: DictionaryScope.language,
            languageId: 'en'
          });

          expect(result.surface).toEqual('TestSurface');
          expect(result.scope).toEqual(DictionaryScope.language);
          expect(result.languageId).toEqual('en');
        });

        it.skip('guidanceProfile', async () => {
          const guidanceProfile = (await api.getCheckingCapabilities(ACROLINX_API_TOKEN)).guidanceProfiles[0];

          const result = await api.addToDictionary(ACROLINX_API_TOKEN, {
            surface: 'TestSurface',
            scope: DictionaryScope.guidanceProfile,
            guidanceProfileId: guidanceProfile.id
          });

          expect(result.surface).toEqual('TestSurface');
          expect(result.scope).toEqual(DictionaryScope.guidanceProfile);
          expect(result.guidanceProfileId).toEqual(guidanceProfile.id);
          expect(result.languageId).toEqual(guidanceProfile.language.id);
        });

        function assertValidValidationDetail(validationDetail: ValidationDetail) {
          expect(typeof validationDetail.constraint).toBe('string');
          expect(typeof validationDetail.title).toBe('string');
          expect(typeof validationDetail.invalidValue).toBe('string');
          expect(typeof validationDetail.detail).toBe('string');
        }

        it('validation error for invalid scope', async () => {
          const error = await expectFailingPromise<AcrolinxError>(api.addToDictionary(ACROLINX_API_TOKEN, {
            surface: 'TestSurface',
            scope: 'invalidScope' as any,
            languageId: 'en',
          }), ErrorType.Validation);

          const validationDetails = error.validationDetails!;

          expect(error.validationDetails).not.toBeUndefined();
          expect(validationDetails.length).toEqual(1);

          const validationDetail = validationDetails[0];
          expect(validationDetail.attributePath).toEqual('scope');
          assertValidValidationDetail(validationDetail);
          expect(Array.isArray(validationDetail.possibleValues)).toBeTruthy();
        });


        it('validation error for invalid klingon language code', async () => {
          const invalidLanguageId = 'thl';
          const error = await expectFailingPromise<AcrolinxError>(api.addToDictionary(ACROLINX_API_TOKEN, {
            surface: 'TestSurface',
            scope: DictionaryScope.language,
            languageId: invalidLanguageId,
          }), ErrorType.Validation);

          const validationDetails = error.validationDetails!;

          expect(error.validationDetails).not.toBeUndefined();
          expect(validationDetails.length).toEqual(1);

          const validationDetail = validationDetails[0];
          assertValidValidationDetail(validationDetail);
          expect(Array.isArray(validationDetail.possibleValues)).toBeTruthy();
          expect(validationDetail.possibleValues!.length).toBeGreaterThan(1);
        });

        it.skip('validation error for invalid guidanceProfile id', async () => {
          const error = await expectFailingPromise<AcrolinxError>(api.addToDictionary(ACROLINX_API_TOKEN, {
            surface: 'TestSurface',
            scope: DictionaryScope.guidanceProfile,
            guidanceProfileId: 'thisGuidanceProfileDoesReallyNotExist',
          }), ErrorType.Validation);

          const validationDetails = error.validationDetails!;

          expect(error.validationDetails).not.toBeUndefined();
          expect(validationDetails.length).toEqual(1);

          assertValidValidationDetail(validationDetails[0]);
        });
      });
    });
  });
});
