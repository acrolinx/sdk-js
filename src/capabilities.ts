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
  interactive = 'interactive'
}

export enum ContentEncoding {
  none = 'none',
  zip_base64 = 'zip,base64',  // TODO: Remove
  base64 = 'base64',
}

// TODO: Remove all except scorecard and extractedText
export enum ReportType {
  scorecard_xml = 'scorecard.xml',
  scorecard_html = 'scorecard.html',
  debug = 'debug',
  termharvesting = 'termharvesting',
  scorecard = 'scorecard',
  request_text = 'extractedText'
}

export interface CheckingCapabilities {
  guidanceProfiles: GuidanceProfile[];
  contentFormats: ContentFormat[];
  contentEncodings: ContentEncoding[];
  checkTypes: CheckType[];
  reportTypes: ReportType[];
  referencePattern: string;
}

