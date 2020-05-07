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

import {GuidanceProfileId} from './capabilities';
import {LanguageId} from './common-types';
import {DocumentId} from './document-descriptor';

export enum DictionaryScope {
  language = 'language',
  guidanceProfile = 'guidanceProfile',
  document = 'document',
}

export interface DictionaryCapabilities {
  scopes: DictionaryScope[];
}

export interface CommonAddToDictionaryRequest {
  surface: string;
  languageId?: LanguageId;
}

export interface AddToDictionaryGuidanceProfileRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.guidanceProfile;
  guidanceProfileId: GuidanceProfileId;
}

export interface AddToDictionaryLanguageRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.language;
  languageId: GuidanceProfileId;
}

export interface AddToDictionaryDocumentRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.document;
  languageId: GuidanceProfileId;
  documentId: DocumentId;
}

export type AddToDictionaryRequest =
  AddToDictionaryGuidanceProfileRequest
  | AddToDictionaryLanguageRequest
  | AddToDictionaryDocumentRequest;


export interface AddToDictionaryResponse extends CommonAddToDictionaryRequest {
  scope: DictionaryScope;
  languageId: LanguageId;
  guidanceProfileId?: GuidanceProfileId;
  documentId?: GuidanceProfileId;
}
