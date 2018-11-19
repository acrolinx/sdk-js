import {ContentGoalId} from './capabilities';
import {DocumentId} from './check';
import {LanguageId} from './common-types';

export enum DictionaryScope {
  language = 'language',
  contentGoal = 'contentGoal',
  document = 'document',
}

export interface DictionaryCapabilities {
  scopes: DictionaryScope[];
}

export interface CommonAddToDictionaryRequest {
  surface: string;
  languageId?: LanguageId;
}

export interface AddToDictionaryContentGoalRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.contentGoal;
  contentGoalId: ContentGoalId;
}

export interface AddToDictionaryLanguageRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.language;
  languageId: ContentGoalId;
}

export interface AddToDictionaryDocumentRequest extends CommonAddToDictionaryRequest {
  scope: DictionaryScope.document;
  languageId: ContentGoalId;
  documentId: DocumentId;
}

export type AddToDictionaryRequest =
  AddToDictionaryContentGoalRequest
  | AddToDictionaryLanguageRequest
  | AddToDictionaryDocumentRequest;


export interface AddToDictionaryResponse extends CommonAddToDictionaryRequest {
  scope: DictionaryScope;
  languageId: LanguageId;
  contentGoalId?: ContentGoalId;
  documentId?: ContentGoalId;
}
