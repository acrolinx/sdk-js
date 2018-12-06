import {GuidanceProfileId} from './capabilities';
import {DocumentId} from './check';
import {LanguageId} from './common-types';

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
