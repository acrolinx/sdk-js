/*
 * Copyright 2024-present Acrolinx GmbH
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
import * as mockFetch from 'fetch-mock';
import { AcrolinxEndpoint, Issue } from '../../src/index';
import { DUMMY_ACCESS_TOKEN } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS } from './common';

describe('AI-service', () => {
  let endpoint: AcrolinxEndpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);

  afterEach(() => {
    mockFetch.restore();
  });

  describe('/ai-enabled', () => {
    const aiEnabledMatcher = 'end:/ai-enabled?privilege=generate';
    it('truthy response', async () => {
      mockFetch.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: true, tenant: 'int-1', userHasPrivilege: true },
      });

      const response = await endpoint.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response).toBe(true);
    });

    it('falsy response', async () => {
      mockFetch.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: true, tenant: 'int-1', userHasPrivilege: false },
      });
      const response1 = await endpoint.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response1).toBe(false);
      mockFetch.restore();

      mockFetch.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: false, tenant: 'int-1', userHasPrivilege: true },
      });
      const response2 = await endpoint.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response2).toBe(false);
      mockFetch.restore();

      mockFetch.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: false, tenant: 'int-1', userHasPrivilege: false },
      });
      const response3 = await endpoint.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response3).toBe(false);
    });

    it('error response', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      mockFetch.mock(aiEnabledMatcher, {
        status: 403,
        throws: {
          code: 403,
          message: 'missing privilege GENERATE',
        },
      });
      const response = await endpoint.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response).toBe(false);
    });
  });

  describe('/getAIChatCompletions', () => {
    const getGetAIChatCompletionMatcher = (count: number, internalName: string) =>
      `end:/ai-service/api/v1/ai/chat-completions?count=${count}&issueInternalName=${internalName}`;

    it('correct response', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      const count = 1;
      const internalName = 'simplefy';
      const aiRephraseHint = 'some hint';
      const rewriteContext = 'some context';
      const response = 'some responds';
      mockFetch.mock(getGetAIChatCompletionMatcher(count, internalName), {
        status: 200,
        body: { response },
      });
      const apiResponse = await endpoint.getAIChatCompletion(
        {
          issue: {
            internalName,
            aiRephraseHint,
            rewriteContext,
          } as unknown as Issue,
          count,
        },
        DUMMY_ACCESS_TOKEN,
      );
      expect(apiResponse.response).toBe(response);
    });
    it('error response', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      const count = 1;
      const internalName = 'simplefy';
      const aiRephraseHint = 'some hint';
      const rewriteContext = 'some context';

      mockFetch.mock(getGetAIChatCompletionMatcher(count, internalName), {
        status: 401,
        throws: {
          code: 401,
          message: 'Unauthorized',
        },
      });

      await expect(
        endpoint.getAIChatCompletion(
          {
            issue: {
              internalName,
              aiRephraseHint,
              rewriteContext,
            } as unknown as Issue,
            count,
          },
          DUMMY_ACCESS_TOKEN,
        ),
      ).rejects.toThrow('Http Connection Problem');
    });
  });
});
