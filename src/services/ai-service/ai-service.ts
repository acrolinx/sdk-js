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

import { getJsonFromPath, postJsonToPath } from 'src/utils/fetch';
import { AcrolinxEndpointProps, ServiceType } from '../../index';
import { AiFeatures, ChatCompletionRequest, IsAIEnabledInformation, WriteResponse } from './ai-service.types';

/**
 * Available in Acrolinx One
 */
export class AIService {
  private readonly aiServiceBasePath = '/ai-service/api/v1';

  constructor(private readonly endpointProps: AcrolinxEndpointProps) {}

  public async getAiFeatures(accessToken: string): Promise<AiFeatures> {
    return getJsonFromPath<AiFeatures>(
      this.constructFullPath('/tenants/features/ai'),
      this.endpointProps,
      accessToken,
      {
        serviceType: ServiceType.ACROLINX_ONE,
      },
    );
  }

  public async getAIEnabled(accessToken: string): Promise<IsAIEnabledInformation> {
    return getJsonFromPath(
      this.constructFullPath('/tenants/feature/ai-enabled?privilege=generate'),
      this.endpointProps,
      accessToken,
      {
        serviceType: ServiceType.ACROLINX_ONE,
      },
    );
  }

  public async isAIEnabled(accessToken: string): Promise<boolean> {
    try {
      const response = await this.getAIEnabled(accessToken);
      return response.value && response.userHasPrivilege;
    } catch {
      return false;
    }
  }

  public async getAIChatCompletion(params: ChatCompletionRequest, accessToken: string): Promise<WriteResponse> {
    const { aiRephraseHint: prompt, internalName } = params.issue;
    const { targetUuid, count, previousVersion } = params;

    return postJsonToPath<WriteResponse>(
      this.constructFullPath('/ai/chat-completions'),
      {
        prompt,
        targetUuid,
        count,
        issueInternalName: internalName,
        previousVersion,
      },
      this.endpointProps,
      accessToken,
      { serviceType: ServiceType.ACROLINX_ONE },
    );
  }

  private constructFullPath(path: string): string {
    return this.aiServiceBasePath + path;
  }
}
