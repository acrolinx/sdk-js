import {LanguageId} from './common-types';

export type AspectId = string;
export type ContentGoalId = string;
export type ContentFormatId = string;

export interface ContentGoal {
  id: ContentGoalId;
  displayName: string;
  language: Language;
  aspects: Aspect[];
  termSets: TermSet[];
  status: ContentGoalStatus;
}

export enum ContentGoalStatus {
  ready = 'ready',
  loading = 'loading',
  unavailable = 'unavailable'
}

export interface Language {
  id: LanguageId;
  displayName: string;
}

export interface Aspect {
  id: AspectId;
  displayName: string;
  color: string;
}

export interface TermSet {
  displayName: string;
}

export interface ContentFormat {
  id: ContentFormatId;
  displayName: string;
  extensions: string[];
}

export enum CheckType {
  batch = 'batch',
  interactive = 'interactive'
}

export enum ContentEncoding {
  none = 'none',
  zip_base64 = 'zip,base64',
  base64 = 'base64',
}

export enum ReportType {
  scorecard_xml = 'scorecard.xml',
  scorecard_html = 'scorecard.html',
  debug = 'debug',
  termharvesting = 'termharvesting',
  legacyJson = 'legacyJson',
  scorecard = 'scorecard',
  request_text = 'extractedText'
}

export interface CheckingCapabilities {
  contentGoals: ContentGoal[];
  contentFormats: ContentFormat[];
  contentEncodings: ContentEncoding[];
  checkTypes: CheckType[];
  reportTypes: ReportType[];
}

