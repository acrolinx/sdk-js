/*
 * Copyright 2019-present Acrolinx GmbH
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

import { ContentFormatId } from './capabilities';
import { CheckOptions, DocumentDescriptorRequest } from './check';
import { LanguageId, UrlString } from './common-types';

export enum AnalysisType {
  extractedText = 'extractedText',
  offsets = 'offsets',
}

export interface AnalysisRequestOptions extends CheckOptions {
  analysisTypes: AnalysisType[];
}

export interface AnalysisRequest {
  content: string;
  options?: AnalysisRequestOptions;
  document?: DocumentDescriptorRequest;
  appSignature: string;
}

export interface ExtractionResult {
  options: {
    contentFormat: ContentFormatId;
    languageId: LanguageId;
  };
  extracted: {
    link: UrlString;
    linkAuthenticated: UrlString;
  };
  offsets?: {
    link: UrlString;
    linkAuthenticated: UrlString;
  };
}

export interface OffsetReport {
  ranges: readonly MappedOffsetRange[];
}

export interface MappedOffsetRange {
  original: OffsetRange;
  extracted: OffsetRange;
  changed?: boolean;
}

export interface OffsetRange {
  begin: number;
  end: number;
}
