import { AcrolinxEndpoint, CommonIssue, DEVELOPMENT_SIGNATURE } from '../../src';
import * as dotenv from 'dotenv';
import 'cross-fetch/polyfill';
import { AIService } from '../../src/services/ai-service/ai-service';

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

  describe.skip('AI Service Integration Tests', () => {
    // This tests requires valid keycloak access token

    it('getAiFeatures returns whether certain AI features are enabled', async () => {
      const aiService = new AIService(endpoint);

      const aiFeatures = await aiService.getAiFeatures(ACROLINX_API_TOKEN);

      expect(typeof aiFeatures.ai).toEqual('boolean');
      expect(typeof aiFeatures.aiAssistant).toEqual('boolean');
    });

    it('check if the ai service is activated', async () => {
      const aiService = new AIService(endpoint);

      const aiResult = await aiService.getAIEnabled(ACROLINX_API_TOKEN);
      expect(aiResult.tenant).toBeDefined();
      expect(aiResult.value).toBeDefined();
      expect(aiResult.userHasPrivilege).toBeDefined();
    });

    it('get a chat completion from the ai service', async () => {
      const aiService = new AIService(endpoint);
      const aiResult = await aiService.getAIChatCompletion(
        {
          issue: {
            aiRephraseHint:
              '[{"role": "system", "content": "Rewrite this content so that it mentions between 3 and 5 of the seven dwarfs"}]',
            internalName: 'simplify',
          } as unknown as CommonIssue,
          count: 1,
          targetUuid: '123e4567-e89b-12d3-a456-426614174000',
        },
        ACROLINX_API_TOKEN,
      );
      expect(aiResult.response).toBeDefined();
    }, 100000);
  });
});
