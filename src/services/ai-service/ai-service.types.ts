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

import { CommonIssue } from '../../check';

export interface AiFeatures {
  ai: boolean;
  aiAssistant: boolean;
}

export interface IsAIEnabledInformation {
  tenant: string;
  value: boolean;
  userHasPrivilege: boolean;
}

export type ChatCompletionRequest = {
  issue: CommonIssue;
  count: number;
  targetUuid: string;
  previousVersion?: string | null;
};

export interface WriteResponse {
  response: string;
}

export interface AIServiceError {
  httpErrorCode: number;
  errorTitle: string;
  errorDescription: string;
  errorId: AIServiceErrorTypes;
}

export enum AIServiceErrorTypes {
  GENERAL_EXCEPTION = 'GENERAL_EXCEPTION',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  INVALID_USER_INPUT = 'INVALID_USER_INPUT',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  BUDGET_EXPIRED = 'BUDGET_EXPIRED',
  BUDGET_CONFIGURATION_ERROR = 'BUDGET_CONFIGURATION_ERROR',
}
