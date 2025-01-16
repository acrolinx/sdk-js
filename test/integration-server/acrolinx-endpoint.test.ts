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

import Ajv from 'ajv';
import 'cross-fetch/polyfill';
import * as dotenv from 'dotenv';
import * as _ from 'lodash';
import {
  AnalysisType,
  AppAccessTokenValidationResult,
  CheckCanceledByClientError,
  CheckRequest,
  CheckResult,
  CustomFieldType,
  DEVELOPMENT_APP_SIGNATURE,
  DEVELOPMENT_SIGNATURE,
  DictionaryScope,
  ErrorType,
  GoalScoring,
  hasTermHarvestingReport,
  HasTermHarvestingReport,
  OffsetReport,
  PollMoreResult,
  ReportType,
  SuccessResponse,
  User,
} from '../../src';
import { CheckOptions } from '../../src/check';
import { DocumentDescriptor } from '../../src/document-descriptor';
import { AcrolinxError, ValidationDetail } from '../../src/errors';
import { AcrolinxEndpoint, isSigninSuccessResult, SigninSuccessResult } from '../../src/index';
import { SigninLinksResult } from '../../src/signin';
import { waitMs } from '../../src/utils/mixed-utils';
import * as checkResultSchema from '../schemas/check-result.json';
import * as termHarvestingReportSchema from '../schemas/term-harvesting-report.json';
import { describeIf, expectFailingPromise, testIf } from '../test-utils/utils';
import { expect, describe, beforeEach, beforeAll, test } from 'vitest';

dotenv.config();

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || ''; /* Add here your own test server URL */
const SSO_GENERIC_TOKEN = process.env.SSO_GENERIC_TOKEN;
const ACROLINX_API_TOKEN = process.env.ACROLINX_API_TOKEN || '';
const ACROLINX_API_USERNAME = process.env.ACROLINX_API_USERNAME || '';
export const ACROLINX_DEV_SIGNATURE = process.env.ACROLINX_DEV_SIGNATURE;

const ajv = new Ajv({ allErrors: true });

function createEndpoint(acrolinxUrl: string) {
  return new AcrolinxEndpoint({
    acrolinxUrl,
    enableHttpLogging: true,
    client: {
      signature: ACROLINX_DEV_SIGNATURE || DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666',
    },
  });
}

function assertDictionaryScopes(scopes: DictionaryScope[]) {
  expect(scopes.length).toBeGreaterThanOrEqual(2);
  expect(scopes).toContain(DictionaryScope.language);
  expect(scopes).toContain(DictionaryScope.document);
}

describe('e2e - AcrolinxEndpoint', () => {
  describe('errors by bad server address', () => {
    const DUMMY_PATH = '/something';

    test('should return an failing promise for 404', async () => {
      const api = createEndpoint(TEST_SERVER_URL);
      try {
        await api.getJsonFromPath('/not-there', ACROLINX_API_TOKEN);
      } catch (error) {
        expect(error.type).toEqual(ErrorType.HttpErrorStatus);
        expect(error.status).toEqual(404);
        expect(error.httpRequest).toEqual({ method: 'GET', url: TEST_SERVER_URL + '/not-there' });
      }
      expect.hasAssertions();
    });

    test('should return an failing promise for non existing server', async () => {
      const api = createEndpoint('https://non-extisting-server');
      await expectFailingPromise(api.getJsonFromPath(DUMMY_PATH), ErrorType.HttpConnectionProblem, {
        method: 'GET',
        url: 'https://non-extisting-server' + DUMMY_PATH,
      });
    });

    test('should return an failing promise for invalid URLS', async () => {
      const invalidAcrolinxUrl = 'http://non-ext!::?isting-server';
      const api = createEndpoint(invalidAcrolinxUrl);
      await expectFailingPromise(api.getJsonFromPath(DUMMY_PATH), ErrorType.HttpConnectionProblem, {
        method: 'GET',
        url: invalidAcrolinxUrl + DUMMY_PATH,
      });
    });
  });

  describe('signin', () => {
    let api: AcrolinxEndpoint;

    beforeEach(() => {
      api = createEndpoint(TEST_SERVER_URL);
    });

    test('should return the signin links', async () => {
      const result = (await api.signin()) as SigninLinksResult;
      expect(result.links.interactive).toContain(TEST_SERVER_URL);
      expect(result.data.interactiveLinkTimeout).toBeGreaterThan(100);
    });

    describeIf(ACROLINX_API_TOKEN, 'Signin with valid token', () => {
      test('should return the provided API-Token', async () => {
        const result = (await api.signin({ accessToken: ACROLINX_API_TOKEN })) as SigninSuccessResult;
        expect(result.data.accessToken).toBe(ACROLINX_API_TOKEN);
        expect(result.data.user.username).toBe(ACROLINX_API_USERNAME);
      });

      test('should return client properties', async () => {
        const result = (await api.signin({ accessToken: ACROLINX_API_TOKEN })) as SigninSuccessResult;
        expect(Object.keys(result.data.integration.properties).length).toBeGreaterThan(0);
      });
    });

    test('should return an api error for invalid signin poll address', async () => {
      const signinPollResultPromise = api.pollForSignin({
        data: { interactiveLinkTimeout: 0 },
        links: {
          interactive: 'dummy',
          poll: TEST_SERVER_URL + '/api/v1/auth/sign-ins/0ddece9c-464a-442b-8a5d-d2f242d54c81',
        },
      });
      await expectFailingPromise(signinPollResultPromise, ErrorType.SigninTimedOut);
    });

    testIf(ACROLINX_API_USERNAME && SSO_GENERIC_TOKEN, 'signin with sso', async () => {
      const result = (await api.signin({
        genericToken: SSO_GENERIC_TOKEN!,
        username: ACROLINX_API_USERNAME,
      })) as SigninSuccessResult;
      expect(result.data.user.username).toContain(ACROLINX_API_USERNAME);
    });

    test('signInWithSSO throws SSO Error', async () =>
      expectFailingPromise(api.signInWithSSO('invalidGenericToken', 'dummyUsername'), ErrorType.SSO));

    test('poll for signin', async () => {
      const result = (await api.signin()) as SigninLinksResult;
      const pollResult = await api.pollForSignin(result);
      expect(isSigninSuccessResult(pollResult)).toBeFalsy();
      expect((pollResult as PollMoreResult).progress.retryAfter).toBeGreaterThan(0);
    });
  });

  describeIf(ACROLINX_API_TOKEN, 'with API token', () => {
    let api: AcrolinxEndpoint;

    beforeAll(async () => {
      // TODO: Do we need to configure required user custom fields?
    });

    beforeEach(() => {
      api = createEndpoint(TEST_SERVER_URL);
    });

    async function getGuidanceProfileId(guidanceProfilePrefix = 'en'): Promise<string> {
      const capabilities = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);
      const guidanceProfile = _.find(capabilities.guidanceProfiles, (a) =>
        _.startsWith(a.displayName, guidanceProfilePrefix),
      )!;
      expect(guidanceProfile).toBeDefined();
      return guidanceProfile.id;
    }

    async function createDummyCheckRequest(checkRequestArg: Partial<CheckRequest> = {}) {
      const checkRequest = _.cloneDeep(checkRequestArg);

      if (!checkRequest.checkOptions || !checkRequest.checkOptions.guidanceProfileId) {
        checkRequest.checkOptions = {
          guidanceProfileId: await getGuidanceProfileId(),
          ...checkRequest.checkOptions,
        };
      }

      if (!checkRequest.document) {
        checkRequest.document = { reference: 'filename.txt' };
      }

      return { content: 'Testt Textt with errror', ...checkRequest };
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
      const check = await createDummyCheck({ checkOptions });

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
        const result = (await api.signin({ accessToken: ACROLINX_API_TOKEN })) as SigninSuccessResult;
        user = await api.getUserData(ACROLINX_API_TOKEN, result.data.user.id);
      });

      test('should return user data with custom fields', () => {
        expect(user.username).toBeDefined();
        const departmentCustomField = _.find(user.customFields, (cf) => cf.key === DEPARTMENT_KEY);
        expect(departmentCustomField).toBeDefined();
        expect(departmentCustomField!.type).toEqual(CustomFieldType.TYPE_LIST);
      });

      test('should set user custom fields', async () => {
        const updatedUser = await api.setUserCustomFields(ACROLINX_API_TOKEN, user.id, [
          {
            key: DEPARTMENT_KEY,
            value: 'Example Department',
          },
        ]);

        expect(updatedUser).toBeDefined();
      });
    });

    describe('PlatformCapabilities', () => {
      test('should contain checking and document capabilities', async () => {
        const result = await api.getCapabilities(ACROLINX_API_TOKEN);
        expect(result.document.customFields.length).toBeGreaterThan(0);
        expect(result.checking.guidanceProfiles.length).toBeGreaterThan(0);
      });
    });

    describe('Features', () => {
      test('should return features', async () => {
        const features = await api.getFeatures(ACROLINX_API_TOKEN);
        expect(typeof features.enableTargetService).toBe('boolean');
      });
    });

    test('should return the checking capabilities', async () => {
      const result = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);
      expect(result.guidanceProfiles.length).toBeGreaterThan(0);
    });

    describe('server notifications', () => {
      test('should return something', async () => {
        const serverMessages = await api.getServerNotifications(ACROLINX_API_TOKEN, 0);
        expect(Array.isArray(serverMessages.data.platformNotifications)).toBe(true);
        expect(serverMessages.data.requestTimeInMilliseconds).toBeGreaterThan(0);
      });

      test('post notifications privilege validation', async () => {
        await expectFailingPromise<AcrolinxError>(
          api.postServerNotifications(ACROLINX_API_TOKEN, {
            title: 'dummyTitle',
            body: 'dummyBody',
            start: Date.now(),
            end: Date.now() + 1000 * 60,
          }),
          ErrorType.InsufficientPrivileges,
          { method: 'POST', url: TEST_SERVER_URL + '/api/v1/broadcasts/platform-notifications/' },
        );
      });
    });

    describe('check', () => {
      test('can check', async () => {
        const checkResult = await checkAndWaitForResult();

        const features = await api.getFeatures(ACROLINX_API_TOKEN);
        if (features.enableTargetService) {
          expect(checkResult.goals.every((goal) => goal.scoring! in GoalScoring)).toBeTruthy();
        }

        expect(checkResult.goals.length).toBeGreaterThan(0);
        assertDictionaryScopes(checkResult.dictionaryScopes);

        const spellingIssue = _.find(
          checkResult.issues,
          (issue) => issue.goalId === 'SPELLING' || issue.goalId === 'CORRECTNESS',
        )!;
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
      });

      test('can check with external content set', async () => {
        const text = `<?xml version='1.0' encoding='UTF-8'?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="copyright">
    <title>Copyright</title>
    <body>
        <p conref="#Link_zur_ID">Der Inhalt des Elements, der ignoriert und ersetzt wird.</p>
    </body>
</topic>`;
        const checkResult = await checkAndWaitForResult({
          content: text,
          externalContent: {
            ditaReferences: [
              {
                id: '#Link_zur_ID',
                content: 'This is the actual great content, that is supposed to show up...',
              },
            ],
          },
        });
        expect(checkResult.goals.length).toBeGreaterThan(0);
      });

      test('can check with xinclude external content set', async () => {
        const text =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<book xmlns:xi="http://www.w3.org/2001/XInclude">' +
          '<title>Subject Books</title>' +
          '<xi:include href="math.xml"/>' +
          '<xi:include href="spanish.xml"/>' +
          '</book>';
        const checkResult = await checkAndWaitForResult({
          content: text,
          document: {
            reference: 'subjects.xml',
          },
          externalContent: {
            xincludeReferences: [
              {
                id: 'math.xml',
                content: '<?xml version="1.0" encoding="UTF-8"?><math><title>Mathemaatics Grade 1</title></math>',
              },
              {
                id: 'spanish.xml',
                content: '<?xml version="1.0" encoding="UTF-8"?><spanish><title>Spaanish Grade 2</title></spanish>',
              },
            ],
          },
        });
        expect(checkResult.goals.length).toBeGreaterThan(0);
      });

      test('can check with integration field set', async () => {
        const text = 'Sample content to test integration field in check request';
        const checkResult = await checkAndWaitForResult({
          content: text,
          integration: {
            components: [
              {
                id: 'com.acrolinx.sdk',
                name: 'Acrolinx SDK JS',
                version: '0.0.1',
                category: 'MAIN',
              },
            ],
          },
        });
        expect(checkResult.quality.score).toBeGreaterThan(0);
      });

      test.skip('can cancel check', async () => {
        const check = await createDummyCheck();

        const cancelResponse = await api.cancelCheck(ACROLINX_API_TOKEN, check);
        expect(cancelResponse.data.id).toBe(check.data.id);

        // According to Heiko, cancelling may need some time. (See also DEV-17377)
        await waitMs(1000);

        await expectFailingPromise(api.pollForCheckResult(ACROLINX_API_TOKEN, check), ErrorType.CheckCanceled);
      });

      test('cancel needs correct auth token', async () => {
        const check = await createDummyCheck();
        await expectFailingPromise(api.cancelCheck('invalid token', check), ErrorType.Auth, {
          method: 'DELETE',
          url: check.links.cancel,
        });
      });

      test.skip('exception if partialCheckRanges are invalid', async () => {
        await expectFailingPromise(
          createDummyCheck({
            checkOptions: {
              partialCheckRanges: [
                {
                  begin: 0,
                  end: 1e9,
                },
              ],
            },
          }),
          ErrorType.Client,
        );
      });

      test('exception GuidanceProfileDoesNotExist for unknown id', async () => {
        await expectFailingPromise(
          checkAndWaitUntilFinished({ guidanceProfileId: '12345-invalid' }),
          ErrorType.GuidanceProfileDoesNotExist,
        );
      });

      test('exception GuidanceProfileDoesNotExist for invalid uuid', async () => {
        await expectFailingPromise(
          checkAndWaitUntilFinished({ guidanceProfileId: 'invalid!uuid' }),
          ErrorType.GuidanceProfileDoesNotExist,
        );
      });

      test('can request the termHarvesting report', async () => {
        // Formerly (before targets) we used the "en-Publications" profile, which had termHarvesting enabled.
        const guidanceProfileIdWithTermHarvesting = await getGuidanceProfileId();
        const checkResult = await checkAndWaitForResult({
          checkOptions: {
            guidanceProfileId: guidanceProfileIdWithTermHarvesting,
            reportTypes: [ReportType.termHarvesting],
          },
          content: 'NewTerm',
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
      });
    });

    describe('checkAndGetResult', () => {
      test('should check', async () => {
        const checkProcess = api.checkAndGetResult(ACROLINX_API_TOKEN, await createDummyCheckRequest());
        const checkResult = await checkProcess.promise;
        expect(checkProcess.getId()).toBeTruthy();
        expect(checkResult.goals.length).toBeGreaterThan(0);
      });

      test('should return the check id even in case of some kind of errors', async () => {
        const checkProcess = api.checkAndGetResult(
          ACROLINX_API_TOKEN,
          await createDummyCheckRequest({
            content: '<tag>test</wrong>',
            checkOptions: { contentFormat: 'XML' },
          }),
        );

        await expectFailingPromise<AcrolinxError>(checkProcess.promise, ErrorType.CheckFailed);
        expect(checkProcess.getId()).toBeTruthy();
      });

      test('can be canceled', async () => {
        const currentCheck = api.checkAndGetResult(ACROLINX_API_TOKEN, await createDummyCheckRequest());

        currentCheck.cancel();

        const error = await expectFailingPromise<AcrolinxError>(currentCheck.promise, ErrorType.CheckCanceled);
        expect(error).toBeInstanceOf(CheckCanceledByClientError);
      });
    });

    //At least one target with Acrolinx Live support needs to be assigned for the following test case
    describe('liveSearch', () => {
      test.skip('should get suggestions for a live search', async () => {
        const capabilities = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);
        let reuseTarget = capabilities.guidanceProfiles[0].id;
        for (const guidanceProfile of capabilities.guidanceProfiles) {
          if (guidanceProfile.acrolinxLive) {
            reuseTarget = guidanceProfile.id;
            break;
          }
        }
        const liveRequest = {
          requestId: 'abc1-Request',
          phrase: 'phrase from the document',
          target: reuseTarget,
        };
        const liveSearchResult = await api.getLiveSuggestions(ACROLINX_API_TOKEN, liveRequest);
        expect(liveSearchResult.requestId).toEqual(liveRequest.requestId);
        expect(liveSearchResult.results).toBeTruthy();
      });
    });

    describe('Checking capabilities for Acrolinx Live supported targets', () => {
      test.skip('Checking capabilities should have an additional acrolinxLive flag', async () => {
        const capabilities = await api.getCheckingCapabilities(ACROLINX_API_TOKEN);
        expect(typeof capabilities.guidanceProfiles[0].acrolinxLive).toBe('boolean');
      });
    });

    describe('getContentAnalysisDashboard', () => {
      test('it works also without any checks', async () => {
        const urlString = await api.getContentAnalysisDashboard(ACROLINX_API_TOKEN, 'dummyId');
        expect(urlString).toContain(TEST_SERVER_URL);

        const url = new URL(urlString);
        expect(url).toBeTruthy();
      });

      test('works with real checks', async () => {
        const batchId = 'batch' + Date.now();
        await api.checkAndGetResult(
          ACROLINX_API_TOKEN,
          await createDummyCheckRequest({
            content: 'This text is nice.',
            checkOptions: { batchId },
            document: { reference: 'nice.txt' },
          }),
        ).promise;

        await api.checkAndGetResult(
          ACROLINX_API_TOKEN,
          await createDummyCheckRequest({
            content: 'Thiss textt iss stupidd',
            checkOptions: { batchId },
            document: { reference: 'stupid.txt' },
          }),
        ).promise;

        const urlString = await api.getContentAnalysisDashboard(ACROLINX_API_TOKEN, batchId);
        const url = new URL(urlString);
        expect(url).toBeTruthy();
        // Here you should open the url and test of it loads the correct results :-)
      });
    });

    describe('analyzeAndGetResult', () => {
      test('should extract simple text', async () => {
        const inputText = 'This is text';
        const result = await api.analyzeAndPoll(ACROLINX_API_TOKEN, {
          content: inputText,
          options: {
            contentFormat: 'TEXT',
            analysisTypes: [AnalysisType.extractedText, AnalysisType.offsets],
          },
          appSignature: DEVELOPMENT_APP_SIGNATURE,
        }).promise;

        expect(result.options.languageId).toEqual('en');
        expect(result.options.contentFormat).toEqual('TEXT');

        // Verify extracted text
        expect(new URL(result.extracted.link)).toBeTruthy();
        expect(new URL(result.extracted.linkAuthenticated)).toBeTruthy();

        const extractedText = await api.getTextFromUrl(result.extracted.link, ACROLINX_API_TOKEN);
        expect(extractedText).toContain(inputText);

        // Verify offsets
        expect(new URL(result.offsets!.link)).toBeTruthy();
        const offsets = (
          await api.getJsonFromUrl<SuccessResponse<OffsetReport>>(result.offsets!.link, ACROLINX_API_TOKEN)
        ).data;

        const firstRange = offsets.ranges[0];
        expect(firstRange.changed).toEqual(false);

        expect(firstRange.extracted.begin).toEqual(0);
        expect(firstRange.extracted.end).toEqual(inputText.length);

        expect(firstRange.original.begin).toEqual(0);
        expect(firstRange.original.end).toEqual(inputText.length);
      });

      test('should extract html', async () => {
        const inputText = 'K<b>&ouml;r</b>per';
        const result = await api.analyzeAndPoll(ACROLINX_API_TOKEN, {
          content: inputText,
          options: {
            contentFormat: 'HTML',
            analysisTypes: [AnalysisType.extractedText, AnalysisType.offsets],
          },
          appSignature: DEVELOPMENT_APP_SIGNATURE,
        }).promise;

        expect(result.options.languageId).toEqual('en');
        expect(result.options.contentFormat).toEqual('HTML');

        // Verify extracted text
        expect(new URL(result.extracted.link)).toBeTruthy();
        expect(new URL(result.extracted.linkAuthenticated)).toBeTruthy();

        const extractedText = await api.getTextFromUrl(result.extracted.link, ACROLINX_API_TOKEN);
        expect(extractedText).toEqual('Körper');

        // Verify offsets
        expect(new URL(result.offsets!.link)).toBeTruthy();
        const offsets = (
          await api.getJsonFromUrl<SuccessResponse<OffsetReport>>(result.offsets!.link, ACROLINX_API_TOKEN)
        ).data;

        expect(offsets).toEqual({
          ranges: [
            {
              original: { begin: 0, end: 1 },
              extracted: { begin: 0, end: 1 },
              changed: false,
            },
            {
              original: { begin: 4, end: 10 },
              extracted: { begin: 1, end: 2 },
              changed: true,
            },
            {
              original: { begin: 10, end: 11 },
              extracted: { begin: 2, end: 3 },
              changed: false,
            },
            {
              original: { begin: 15, end: 18 },
              extracted: { begin: 3, end: 6 },
              changed: false,
            },
          ],
        });
      });

      describe('error handling', () => {
        function analyzeAndPollWithSignature(appSignature: string) {
          return api.analyzeAndPoll(ACROLINX_API_TOKEN, {
            content: 'This is text',
            options: {
              contentFormat: 'TEXT',
              analysisTypes: [AnalysisType.extractedText, AnalysisType.offsets],
            },
            appSignature,
          }).promise;
        }

        test('should work with an empty signature', async () => {
          const result = await analyzeAndPollWithSignature('');
          expect(result).toBeTruthy();
        });

        test('should not work with broken signature', async () => {
          const error = await expectFailingPromise<AcrolinxError>(
            analyzeAndPollWithSignature('brokenAppSignature'),
            ErrorType.AppSignatureRejected,
          );

          expect(error.status).toEqual(403);
          expect(error.title).toEqual('App signature rejected'); // This string might change, that's fine
          expect(error.detail).toEqual('JWT Token is not decodable.'); // This string might change, that's fine
        });

        test('should return response headers in case of error', async () => {
          const error = await expectFailingPromise<AcrolinxError>(
            analyzeAndPollWithSignature('brokenAppSignature'),
            ErrorType.AppSignatureRejected,
          );

          expect(error.status).toEqual(403);
          expect(error.responseHeaders).toBeDefined();
        });

        test('should only work with signature type "APP"', async () => {
          const appSignatureWithInvalidType =
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiS2FqYSBBbm91ayBTdGFobCIsImlkIjoiNGVlZDM3NjctMGYzMS00ZDVmLWI2MjktYzg2MWFiM2VkODUyIiwidHlwZSI6IktBSkEiLCJpYXQiOjE1NjExODgyOTN9.XaCSr2piA0u-JZLjRlO4QtuhsRgDOuurbhsvTFmCv1w';
          const error = await expectFailingPromise<AcrolinxError>(
            analyzeAndPollWithSignature(appSignatureWithInvalidType),
            ErrorType.AppSignatureRejected,
          );

          expect(error.status).toEqual(403);
          // These strings might change in the future, that's fine.
          expect(error.title).toEqual('App signature rejected');
          expect(error.detail).toEqual("JWT Token type 'KAJA' is not known.");
        });
      });
    });

    /**
     * The user associated with the used ACROLINX_API_TOKEN must have the admin privilege for
     * the test app "selectRanges".
     */
    test.skip('request and validate app token', async () => {
      // SI-307
      const appId = 'selectRanges';

      const appTokenResult = await api.getAppAccessToken(ACROLINX_API_TOKEN, appId);

      expect(appTokenResult.appAccessToken).toMatch(/\S+/);
      expect(appTokenResult.user.username).toEqual(ACROLINX_API_USERNAME);
      expect(appTokenResult.appId).toEqual(appId);

      const tokenVerificationResult = await api.validateAppAccessToken(appTokenResult.appAccessToken);
      expect(tokenVerificationResult.user).toEqual(appTokenResult.user);

      const tokenVerificationResult2: SuccessResponse<AppAccessTokenValidationResult> = await fetch(
        appTokenResult.validationRequest.url,
        { headers: appTokenResult.validationRequest.headers },
      ).then((r) => r.json());

      expect(tokenVerificationResult2.data.user).toEqual(tokenVerificationResult.user);

      expect(tokenVerificationResult2.data.privileges).toEqual(['admin']);
    });

    describe('after check ', () => {
      let checkResult: CheckResult;
      let document: DocumentDescriptor;

      beforeEach(async () => {
        checkResult = await checkAndWaitUntilFinished();
        expect(checkResult.document.id).toBeDefined();
        document = await api.getDocumentDescriptor(ACROLINX_API_TOKEN, checkResult.document.id);
      });

      test('should get custom fields', () => {
        expect(document.id).toBeTruthy();
        expect(Array.isArray(document.customFields)).toEqual(true);
      });

      /**
       * This test requires to setup a document custom field 'List Field'
       * with the at least one possible 'List Item 2'.
       */
      test('can write custom field values', async () => {
        const documentInfo2 = await api.setDocumentCustomFields(ACROLINX_API_TOKEN, document.id, [
          {
            key: 'List Field',
            value: 'List Item 2',
          } as any,
        ]);

        expect(documentInfo2.id).toEqual(document.id);
      });
    });

    describe('dictionary', () => {
      test('getDictionaryCapabilities', async () => {
        const dictionaryCapabilities = await api.getDictionaryCapabilities(ACROLINX_API_TOKEN);

        assertDictionaryScopes(dictionaryCapabilities.scopes);
      });

      describe('addToDictionary', () => {
        test('language', async () => {
          const result = await api.addToDictionary(ACROLINX_API_TOKEN, {
            surface: 'TestSurface',
            scope: DictionaryScope.language,
            languageId: 'en',
          });

          expect(result.surface).toEqual('TestSurface');
          expect(result.scope).toEqual(DictionaryScope.language);
          expect(result.languageId).toEqual('en');
        });

        test.skip('guidanceProfile', async () => {
          const guidanceProfile = (await api.getCheckingCapabilities(ACROLINX_API_TOKEN)).guidanceProfiles[0];

          const result = await api.addToDictionary(ACROLINX_API_TOKEN, {
            surface: 'TestSurface',
            scope: DictionaryScope.guidanceProfile,
            guidanceProfileId: guidanceProfile.id,
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

        test('validation error for invalid scope', async () => {
          const error = await expectFailingPromise<AcrolinxError>(
            api.addToDictionary(ACROLINX_API_TOKEN, {
              surface: 'TestSurface',
              scope: 'invalidScope' as any,
              languageId: 'en',
            }),
            ErrorType.Validation,
          );

          const validationDetails = error.validationDetails!;

          expect(error.validationDetails).not.toBeUndefined();
          expect(validationDetails.length).toEqual(1);

          const validationDetail = validationDetails[0];
          expect(validationDetail.attributePath).toEqual('scope');
          assertValidValidationDetail(validationDetail);
          expect(Array.isArray(validationDetail.possibleValues)).toBeTruthy();
        });

        test('validation error for invalid klingon language code', async () => {
          const invalidLanguageId = 'thl';
          const error = await expectFailingPromise<AcrolinxError>(
            api.addToDictionary(ACROLINX_API_TOKEN, {
              surface: 'TestSurface',
              scope: DictionaryScope.language,
              languageId: invalidLanguageId,
            }),
            ErrorType.Validation,
          );

          const validationDetails = error.validationDetails!;

          expect(error.validationDetails).not.toBeUndefined();
          expect(validationDetails.length).toEqual(1);

          const validationDetail = validationDetails[0];
          assertValidValidationDetail(validationDetail);
          expect(Array.isArray(validationDetail.possibleValues)).toBeTruthy();
          expect(validationDetail.possibleValues!.length).toBeGreaterThan(1);
        });

        test.skip('validation error for invalid guidanceProfile id', async () => {
          const error = await expectFailingPromise<AcrolinxError>(
            api.addToDictionary(ACROLINX_API_TOKEN, {
              surface: 'TestSurface',
              scope: DictionaryScope.guidanceProfile,
              guidanceProfileId: 'thisGuidanceProfileDoesReallyNotExist',
            }),
            ErrorType.Validation,
          );

          const validationDetails = error.validationDetails!;

          expect(error.validationDetails).not.toBeUndefined();
          expect(validationDetails.length).toEqual(1);

          assertValidValidationDetail(validationDetails[0]);
        });
      });
    });
  });
});
