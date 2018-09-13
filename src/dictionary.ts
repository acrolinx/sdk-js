import {AudienceId} from './capabilities';
import {DocumentId} from './check';
import {LanguageId} from './common-types';

export enum DictionaryScope {
  language = 'language',
  audience = 'audience',
  document = 'document',
}

export interface DictionaryCapabilities {
  scopes: DictionaryScope[];
}

export interface CommonAddToDictionaryRequest {
  surface: string;
  languageId?: LanguageId;
}

export interface AddToDictionaryAudienceRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.audience;
  audienceId: AudienceId;
}

export interface AddToDictionaryLanguageRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.language;
  languageId: AudienceId;
}

export interface AddToDictionaryDocumentRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.document;
  languageId: AudienceId;
  documentId: DocumentId;
}

export type AddToDictionaryRequest =
  AddToDictionaryAudienceRequest
  | AddToDictionaryLanguageRequest
  | AddToDictionaryDocumentRequest;


export interface AddToDictionaryResponse extends CommonAddToDictionaryRequest {
  scope: DictionaryScope;
  languageId: LanguageId;
  audienceId?: AudienceId;
  documentId?: AudienceId;
}
