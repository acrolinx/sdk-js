import { AcrolinxEndpoint, CommonIssue, DEVELOPMENT_SIGNATURE } from '../../src';
import * as dotenv from 'dotenv';
import 'cross-fetch/polyfill';
import { AIService } from '../../src/services/ai-service/ai-service';
import { IntService } from '../../src/services/int-service/int-service';

import { describe, beforeEach, expect, test } from 'vitest';
import { LogEntry, LogEntryType } from 'src/utils/logging-buffer';
import { IntegrationServiceResponse } from 'src/services/int-service/int-service.types';

dotenv.config();

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || ''; /* Add here your own test server URL */
const ACROLINX_API_TOKEN = process.env.ACROLINX_API_TOKEN || '';

export const ACROLINX_DEV_SIGNATURE = process.env.ACROLINX_DEV_SIGNATURE;

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

describe('Acrolinx One E2E Tests', () => {
  let endpoint: AcrolinxEndpoint;

  beforeEach(() => {
    endpoint = createEndpoint(TEST_SERVER_URL);
  });

  describe('AI Service Integration Tests', () => {
    // This tests requires valid keycloak access token

    test('getAiFeatures returns whether certain AI features are enabled', async () => {
      const aiService = new AIService(endpoint);

      const aiFeatures = await aiService.getAiFeatures(ACROLINX_API_TOKEN);

      expect(typeof aiFeatures.ai).toEqual('boolean');
      expect(typeof aiFeatures.aiAssistant).toEqual('boolean');
    });

    test('check if the ai service is activated', async () => {
      const aiService = new AIService(endpoint);

      const aiResult = await aiService.getAIEnabled(ACROLINX_API_TOKEN);
      expect(aiResult.tenant).toBeDefined();
      expect(aiResult.value).toBeDefined();
      expect(aiResult.userHasPrivilege).toBeDefined();
    });

    test('get a chat completion from the ai service & validate previous version too', async () => {
      const aiService = new AIService(endpoint);
      const aiResult = await aiService.getAIChatCompletion(
        {
          issue: {
            aiRephraseHint:
              '{"documentId":"random","aiRephraseHint":[{"role":"system","content":"You are a writing assistant designed to carry out specific tasks and follow instructions. You write clear, grammatically correct and simple text."},{"role":"user","content":"Avoid repeating \'this\' or \'that\' at the beginning of the sentence."},{"role":"user","content":"This is new document. This is not acceptable"},{"role":"assistant","content":"Sure! Here\'s your new sentence: "}]}',
            internalName: 'simplify',
          } as unknown as CommonIssue,
          count: 1,
          targetUuid: '2755ce18-fa33-4744-a16e-655bd6ce412e',
        },
        ACROLINX_API_TOKEN,
      );
      expect(aiResult.response).toBeDefined();
      const aiResultSecondTime = await aiService.getAIChatCompletion(
        {
          issue: {
            aiRephraseHint:
              '{"documentId":"random","aiRephraseHint":[{"role":"system","content":"You are a writing assistant designed to carry out specific tasks and follow instructions. You write clear, grammatically correct and simple text."},{"role":"user","content":"Avoid repeating \'this\' or \'that\' at the beginning of the sentence."},{"role":"user","content":"This is new document. This is not acceptable"},{"role":"assistant","content":"Sure! Here\'s your new sentence: "}]}',
            internalName: 'simplify',
          } as unknown as CommonIssue,
          count: 2,
          previousVersion: aiResult.response,
          targetUuid: '2755ce18-fa33-4744-a16e-655bd6ce412e',
        },
        ACROLINX_API_TOKEN,
      );
      expect(aiResultSecondTime.response).toBeDefined();
      expect(aiResultSecondTime.response).not.equal(aiResult.response);
    }, 100000);
  });

  describe('Integrations Service Integration Tests', () => {
    test('Getting integration config', async () => {
      const intService = new IntService(endpoint);

      const intConfig = await intService.getConfig(ACROLINX_API_TOKEN);

      expect(intConfig.activateGetSuggestionReplacement).toEqual(false);
    }, 100000);
  });

  test('Send log integration test', async () => {
    const intService = new IntService(endpoint);

    const logs: LogEntry[] = [
      {
        type: LogEntryType.action,
        message: 'Test sdk-js log message',
        details: [{ 'sdk-test': 'sdk-test-data' }],
      },
    ];

    const intResponse = (await intService.sendLogs(
      'sdk-js-test',
      logs,
      ACROLINX_API_TOKEN,
    )) as IntegrationServiceResponse;

    expect(intResponse.message).toBeDefined();
  }, 100000);
});
