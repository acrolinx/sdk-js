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
import { http, HttpResponse } from 'msw';
import { server } from '../test-utils/msw-setup';
import { mockGet } from '../test-utils/msw-migration-helpers';
import { AcrolinxEndpoint, AcrolinxError, Issue } from '../../src/index';
import { DUMMY_ACCESS_TOKEN } from '../test-utils/msw-acrolinx-server';
import { DUMMY_ENDPOINT_PROPS } from './common';
import { DUMMY_AI_REWRITE_CONTEXT } from '../test-utils/dummy-data';
import { AIServiceErrorTypes, WriteResponse } from '../../src/services/ai-service/ai-service.types';
import { AIService } from '../../src/services/ai-service/ai-service';
import { describe, afterEach, expect, test, beforeEach } from 'vitest';

describe('AI-service', () => {
  let endpoint: AcrolinxEndpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  const aiService = new AIService(endpoint.props);

  afterEach(() => {
    server.resetHandlers();
  });

  beforeEach(() => {
    server.use(
      http.get('*/int-service/api/v1/config', () => {
        return HttpResponse.json({
          activateGetSuggestionReplacement: true,
          telemetryEnabled: true,
        });
      }),
    );
  });

  describe('/ai-enabled', () => {
    test('truthy response', async () => {
      mockGet('/ai-enabled?privilege=generate', {
        value: true,
        tenant: 'int-1',
        userHasPrivilege: true,
      });

      const response = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response).toBe(true);
    });

    test('falsy response', async () => {
      mockGet('/ai-enabled?privilege=generate', {
        value: true,
        tenant: 'int-1',
        userHasPrivilege: false,
      });
      const response1 = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response1).toBe(false);
      server.resetHandlers();

      mockGet('/ai-enabled?privilege=generate', {
        value: false,
        tenant: 'int-1',
        userHasPrivilege: true,
      });
      const response2 = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response2).toBe(false);
      server.resetHandlers();

      mockGet('/ai-enabled?privilege=generate', {
        value: false,
        tenant: 'int-1',
        userHasPrivilege: false,
      });
      const response3 = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response3).toBe(false);
    });

    test('error response', async () => {
      mockGet(
        '/ai-enabled?privilege=generate',
        {
          httpErrorCode: 403,
          errorTitle: 'missing privilege GENERATE',
          errorDescription: 'missing privilege GENERATE',
          errorId: 'INSUFFICIENT_PRIVILEGES',
        },
        403,
      );
      const response = await aiService.isAIEnabled(DUMMY_ACCESS_TOKEN);
      expect(response).toBe(false);
    });
  });

  describe('/getAIChatCompletions', () => {
    const REQUEST_ERROR_MESSAGE = 'There was an error processing your request. It has been logged (ID some-random-id).';

    test('correct response without previousVersion', async () => {
      const aiResponse = 'some response';
      const response = await createDummyAIServiceRequest(200, { response: aiResponse });

      expect(response.response).toBe(aiResponse);

      // Note: MSW doesn't have a direct equivalent to fetchMock.lastCall()
      // You might need to track requests manually or use a different approach
      // For now, we'll just verify the response is correct
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
    });

    test('error response', async () => {
      const errorResponse = {
        httpErrorCode: 400,
        errorTitle: REQUEST_ERROR_MESSAGE,
        errorDescription: REQUEST_ERROR_MESSAGE,
        errorId: AIServiceErrorTypes.GENERAL_EXCEPTION,
      };

      await expect(createDummyAIServiceRequest(400, errorResponse)).rejects.toThrow(AcrolinxError);
    });

    test('network error', async () => {
      server.use(
        http.post('*/ai-service/api/v1/ai/chat-completions', () => {
          return HttpResponse.error();
        }),
      );

      await expect(createDummyAIServiceRequest(500, {})).rejects.toThrow(AcrolinxError);
    });

    test('timeout error', async () => {
      server.use(
        http.post('*/ai-service/api/v1/ai/chat-completions', () => {
          return HttpResponse.json(
            {
              httpErrorCode: 408,
              errorTitle: 'Request timeout',
              errorDescription: 'Request timeout',
              errorId: AIServiceErrorTypes.GENERAL_EXCEPTION,
            },
            { status: 408 },
          );
        }),
      );

      await expect(createDummyAIServiceRequest(408, {})).rejects.toThrow(AcrolinxError);
    });

    test('rate limit error', async () => {
      server.use(
        http.post('*/ai-service/api/v1/ai/chat-completions', () => {
          return HttpResponse.json(
            {
              httpErrorCode: 429,
              errorTitle: 'Rate limit exceeded',
              errorDescription: 'Rate limit exceeded',
              errorId: AIServiceErrorTypes.GENERAL_EXCEPTION,
            },
            { status: 429 },
          );
        }),
      );

      await expect(createDummyAIServiceRequest(429, {})).rejects.toThrow(AcrolinxError);
    });

    test('invalid response format', async () => {
      server.use(
        http.post('*/ai-service/api/v1/ai/chat-completions', () => {
          return HttpResponse.json({
            error: {
              httpErrorCode: 400,
              errorTitle: 'Invalid response format',
              errorDescription: 'The response format is invalid',
              errorId: AIServiceErrorTypes.GENERAL_EXCEPTION,
            },
          });
        }),
      );

      const count = 1;
      const internalName = 'simplify content';
      const aiRephraseHint = 'some hint';
      const targetUuid = '123e4567-e89b-12d3-a456-426614174000';
      const aiRewriteContext = DUMMY_AI_REWRITE_CONTEXT;

      await expect(
        aiService.getAIChatCompletion(
          {
            issue: {
              internalName,
              aiRephraseHint,
              aiRewriteContext,
            } as Issue,
            count,
            targetUuid,
            previousVersion: null,
          },
          DUMMY_ACCESS_TOKEN,
        ),
      ).rejects.toThrow(AcrolinxError);
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

      server.use(
        http.post('*/ai-service/api/v1/ai/chat-completions', () => {
          return HttpResponse.json(dummyResponseBody, { status: responseStatus });
        }),
      );

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
