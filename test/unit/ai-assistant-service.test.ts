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
import { AcrolinxEndpoint } from '../../src/index';
import { AIAssistantService } from '../../src/services/ai-assistant/ai-assistant-service';
import { DUMMY_ENDPOINT_PROPS } from './common';

describe('AIAssistantService', () => {
  let endpoint: AcrolinxEndpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  const aiAssistantService = new AIAssistantService(endpoint);

  describe('getAIAssistantUrl', () => {
    it('should return correct URL without targetId', () => {
      const expectedPath = '/content-cube/assistant';
      const url = aiAssistantService.getAIAssistantUrl();
      const parsedUrl = new URL(url);

      expect(parsedUrl.origin + parsedUrl.pathname).toBe(DUMMY_ENDPOINT_PROPS.acrolinxUrl.replace(/\/$/, '') + expectedPath);
      expect(parsedUrl.searchParams.get('targetId')).toBeNull();
    });

    it('should return correct URL with targetId', () => {
      const targetId = 'test-target-id';
      const expectedPath = '/content-cube/assistant';
      const url = aiAssistantService.getAIAssistantUrl(targetId);
      const parsedUrl = new URL(url);

      expect(parsedUrl.origin + parsedUrl.pathname).toBe(DUMMY_ENDPOINT_PROPS.acrolinxUrl.replace(/\/$/, '') + expectedPath);
      expect(parsedUrl.searchParams.get('targetId')).toBe(targetId);
    });
  });
});