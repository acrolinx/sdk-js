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
import { describe, afterEach, expect, test } from 'vitest';

describe('AI-service', () => {
  let endpoint: AcrolinxEndpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  const aiService = new AIService(endpoint.props);

  afterEach(() => {
    fetchMock.restore();
  });

  describe('/ai-enabled', () => {
    const aiEnabledMatcher = 'end:/ai-enabled?privilege=generate';
    test('truthy response', async () => {
      fetchMock.mock(aiEnabledMatcher, {
        status: 200,
        body: { value: true, tenant: 'int-1', userHasPrivilege: true },
      });

      const response = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response).toBe(true);
    });

    test('falsy response', async () => {
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

    test('error response', async () => {
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
    const getAIChatCompletionMatcher = () => 'end:/ai-service/api/v1/ai/chat-completions';

    test('correct response without previousVersion', async () => {
      const aiResponse = 'some response';
      const response = await createDummyAIServiceRequest(200, { response: aiResponse });

      expect(response.response).toBe(aiResponse);

      // Verify that previousVersion is null in the request body
      const lastCall = fetchMock.lastCall(getAIChatCompletionMatcher());
      expect(lastCall).toBeDefined();

      const requestBody = JSON.parse(lastCall![1]?.body as string);

      expect(requestBody.previousVersion).toBeNull();
    });

    test('correct response with previousVersion', async () => {
      const aiResponse = 'another response';
      const previousVersion = 'previous suggestion text';
      const intermediateResponse = 'intermediate response';

      const response = await createDummyAIServiceRequest(
        200,
        { response: aiResponse, intermediateResponse: intermediateResponse },
        previousVersion,
      );

      expect(response.response).toBe(aiResponse);

      // Verify that fetch was called with the correct body including previousVersion
      const lastCall = fetchMock.lastCall(getAIChatCompletionMatcher());
      expect(lastCall).toBeDefined();

      const requestBody = JSON.parse(lastCall![1]?.body as string);

      expect(requestBody.previousVersion).toBe(previousVersion);
    });

    test('error response', async () => {
      const response = createDummyAIServiceRequest(500, {
        httpErrorCode: 500,
        errorTitle: REQUEST_ERROR_MESSAGE,
        errorDescription: REQUEST_ERROR_MESSAGE,
        errorId: AIServiceErrorTypes.GENERAL_EXCEPTION,
      });

      await expect(response).rejects.toThrowError(AcrolinxError);
      await expect(response).rejects.toThrowError(
        expect.objectContaining({
          id: expect.any(String),
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

    test('should throw if response was filtered', async () => {
      const FILTERED_RESPONSE_MESSAGE = 'The response was filtered...';
      const response = createDummyAIServiceRequest(400, {
        httpErrorCode: 400,
        errorTitle: FILTERED_RESPONSE_MESSAGE,
        errorDescription: FILTERED_RESPONSE_MESSAGE,
        errorId: AIServiceErrorTypes.INVALID_USER_INPUT,
      });

      await expect(response).rejects.toThrowError(AcrolinxError);
      await expect(response).rejects.toThrowError(
        expect.objectContaining({
          id: expect.any(String),
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
      previousVersion?: string,
    ): Promise<WriteResponse> => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      const count = 1;
      const internalName = 'simplify content';
      const aiRephraseHint = 'some hint';
      const targetUuid = '123e4567-e89b-12d3-a456-426614174000';
      const aiRewriteContext = DUMMY_AI_REWRITE_CONTEXT;

      fetchMock.mock(getAIChatCompletionMatcher(), {
        status: responseStatus,
        body: dummyResponseBody,
      });

      return aiService.getAIChatCompletion(
        {
          issue: {
            internalName,
            aiRephraseHint,
            aiRewriteContext,
          } as Issue,
          count,
          targetUuid,
          previousVersion: previousVersion ?? null,
        },
        DUMMY_ACCESS_TOKEN,
      );
    };
  });
});
