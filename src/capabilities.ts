export type GoalId = string;
export type TermSetId = string;
export type AudienceId = string;
export type LanguageId = string;
export type ContentFormatId = string;

export interface Audience {
  id: AudienceId;
  displayName: string;
  language: LanguageId;
  goals: GoalId[];
  termSets: TermSetId[];
  status: AudienceStatus;
}

export enum AudienceStatus {
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
  id: TermSetId;
  displayName: string;
}

export interface ContentFormat {
  id: ContentFormatId;
  displayName: string;
  extensions: string[];
}

export enum CheckType {
  batch = 'none',
  partial = 'partial',
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
}

export interface CheckingCapabilities {
  audiences: Audience[];
  languages: Language[];
  goals: Goal[];
  termSets: TermSet[];
  contentFormats: ContentFormat[];
  contentEncodings: ContentEncoding[];
  checkTypes: CheckType[];
  reportTypes: ReportType[];
}

