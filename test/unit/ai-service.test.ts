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
import fetchMock from 'fetch-mock';
import { AcrolinxEndpoint, AcrolinxError, Issue } from '../../src/index';
import { DUMMY_ACCESS_TOKEN } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS } from './common';
import { DUMMY_AI_REWRITE_CONTEXT } from '../test-utils/dummy-data';
import { AIServiceErrorTypes, WriteResponse } from '../../src/services/ai-service/ai-service.types';
import { AIService } from '../../src/services/ai-service/ai-service';

describe('AI-service', () => {
  let endpoint: AcrolinxEndpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  const aiService = new AIService(endpoint);

  afterEach(() => {
    fetchMock.restore();
  });

  describe('/ai-enabled', () => {
    const aiEnabledMatcher = 'end:/ai-enabled?privilege=generate';
    it('truthy response', async () => {
      fetchMock.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: true, tenant: 'int-1', userHasPrivilege: true },
      });

      const response = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response).toBe(true);
    });

    it('falsy response', async () => {
      fetchMock.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: true, tenant: 'int-1', userHasPrivilege: false },
      });
      const response1 = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response1).toBe(false);
      fetchMock.restore();

      fetchMock.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: false, tenant: 'int-1', userHasPrivilege: true },
      });
      const response2 = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response2).toBe(false);
      fetchMock.restore();

      fetchMock.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: false, tenant: 'int-1', userHasPrivilege: false },
      });
      const response3 = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response3).toBe(false);
    });

    it('error response', async () => {
      fetchMock.mock(aiEnabledMatcher, {
        status: 403,
        body: {
          httpErrorCode: 403,
          errorTitle: 'missing privilege GENERATE',
          errorDescription: 'missing privilege GENERATE',
          errorId: 'INSUFFICIENT_PRIVILEGES',
        },
      });
      const response = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response).toBe(false);
    });
  });

  describe('/getAIChatCompletions', () => {
    const REQUEST_ERROR_MESSAGE = 'There was an error processing your request. It has been logged (ID some-random-id).';
    const getGetAIChatCompletionMatcher = (count: number, internalName: string) =>
      `end:/ai-service/api/v1/ai/chat-completions?count=${count}&issueInternalName=${internalName}`;

    it('correct response', async () => {
      const aiResponse = 'some responds';
      const response = await createDummyAIServiceRequest(200, { response: aiResponse });

      expect(response.response).toBe(aiResponse);
    });
    it('error response', async () => {
      const response = createDummyAIServiceRequest(500, {
        httpErrorCode: 500,
        errorTitle: REQUEST_ERROR_MESSAGE,
        errorDescription: REQUEST_ERROR_MESSAGE,
        errorId: AIServiceErrorTypes.GENERAL_EXCEPTION,
      });

      await expect(response).rejects.toThrowError(
        new AcrolinxError({
          detail: REQUEST_ERROR_MESSAGE,
          status: 500,
          type: AIServiceErrorTypes.GENERAL_EXCEPTION,
          title: REQUEST_ERROR_MESSAGE,
          httpRequest: {
            url: expect.stringContaining('/ai-service/api/v1/ai/chat-completions'),
            method: 'POST',
          },
        }),
      );
    });

    it('should throw if response was filtered', async () => {
      const FILTERED_RESPONSE_MESSAGE = 'The response was filtered...bla bla';
      const response = createDummyAIServiceRequest(400, {
        httpErrorCode: 400,
        errorTitle: FILTERED_RESPONSE_MESSAGE,
        errorDescription: FILTERED_RESPONSE_MESSAGE,
        errorId: AIServiceErrorTypes.INVALID_USER_INPUT,
      });

      await expect(response).rejects.toThrowError(
        new AcrolinxError({
          detail: FILTERED_RESPONSE_MESSAGE,
          status: 400,
          type: AIServiceErrorTypes.INVALID_USER_INPUT,
          title: FILTERED_RESPONSE_MESSAGE,
          httpRequest: {
            url: expect.stringContaining('/ai-service/api/v1/ai/chat-completions'),
            method: 'POST',
          },
        }),
      );
    });

    const createDummyAIServiceRequest = async (
      responseStatus: number,
      dummyResponseBody: any,
    ): Promise<WriteResponse> => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      const count = 1;
      const internalName = 'simplefy';
      const aiRephraseHint = 'some invalid data';
      const targetUuid = '123e4567-e89b-12d3-a456-426614174000';
      const aiRewriteContext = DUMMY_AI_REWRITE_CONTEXT;

      fetchMock.mock(getGetAIChatCompletionMatcher(count, internalName), {
        status: responseStatus,
        body: dummyResponseBody,
      });

      return aiService.getAIChatCompletion(
        {
          issue: {
            internalName,
            aiRephraseHint,
            aiRewriteContext,
          } as unknown as Issue,
          count,
          targetUuid,
        },
        DUMMY_ACCESS_TOKEN,
      );
    };
  });
});
