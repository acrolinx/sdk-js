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

import {LanguageId} from './common-types';

export type GoalId = string;
export type GuidanceProfileId = string;
export type ContentFormatId = string;

export interface GuidanceProfile {
  id: GuidanceProfileId;
  displayName: string;
  language: Language;
  goals: Goal[];
  termSets: TermSet[];
  status: GuidanceProfileStatus;
}

export enum GuidanceProfileStatus {
  ready = 'ready',
  loading = 'loading',
  unavailable = 'unavailable'
}

export interface Language {
  id: LanguageId;
  displayName: string;
}

export interface Goal {
  id: GoalId;
  displayName: string;
  color: string;
}

export interface TermSet {
  displayName: string;
}

export interface ContentFormat {
  id: ContentFormatId;
  displayName: string;
}

export enum CheckType {
  batch = 'batch',
  interactive = 'interactive',
  baseline = "baseline",
  automated = "automated"
}

export enum ContentEncoding {
  none = 'none',
  base64 = 'base64',
}

export enum ReportType {
  termHarvesting = 'termHarvesting',
  scorecard = 'scorecard',
  extractedText = 'extractedText',
  /**
   * TODO: Remove doubled enum value
   * @Deprecated Use extractedText
   */
  request_text = 'extractedText',
}

export interface CheckingCapabilities {
  guidanceProfiles: GuidanceProfile[];
  contentFormats: ContentFormat[];
  contentEncodings: ContentEncoding[];
  checkTypes: CheckType[];
  reportTypes: ReportType[];
  referencePattern: string;
}

