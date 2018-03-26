export type GoalId = string;
export type AudienceId = string;
export type ContentFormatId = string;

export interface Audience {
  id: AudienceId;
  displayName: string;
  language: Language;
  goals: Goal[];
  termSets: TermSet[];
  status: AudienceStatus;
}

export enum AudienceStatus {
  ready = 'ready',
  loading = 'loading',
  unavailable = 'unavailable'
}

export interface Language {
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
  id: ContentFormatId | string;
  displayName: string;
  extensions: string[];
}

export enum CheckType {
  batch = 'batch',
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
  contentFormats: ContentFormat[];
  contentEncodings: ContentEncoding[];
  checkTypes: CheckType[];
  reportTypes: ReportType[];
}

