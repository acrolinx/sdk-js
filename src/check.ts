import {AudienceId, CheckType, ContentEncoding, Goal, GoalId, ReportType, TermSetId} from './capabilities';
import {URL} from './common-types';

export interface CheckRange {
  begin: number;
  end: number;
}

export type DocumentId = string;

export interface CheckRequest {
  content: string;
  contentEncoding?: ContentEncoding;
  checkOptions?: CheckOptions;
  batchId?: string;
  document?: Document;
  // clientInfo ???
}

export interface CheckOptions {
  audienceId?: AudienceId;
  termSetIds?: TermSetId[];
  reportTypes?: ReportType[];
  checkType?: CheckType;
  partialCheckRanges?: CheckRange[];
}

export interface Document {
  id?: DocumentId;
  reference?: string;
  author?: string;
  mimeType?: string;
  contentType?: string;
  metaData?: MetaData;
  displayInfo?: {
    reference?: string;
  };
}

export interface MetaData {
  whatTheLuck?: any;
}

export type CheckId = string;

export interface CheckResponse {
  id: CheckId;
  links: {
    status: URL;
    cancel: URL;
  };
  // Lots of stuff that looks similar to CheckRequest
}

export interface CheckingStatus {
  id: CheckId;
  documentId: DocumentId;
  state: 'done' | '???';
  percent: number;
  message: string;
  links: {
    result: URL
  };
}

export interface CheckResult {
  id: CheckId;
  checkOptions: CheckOptions;
  document: Document;
  quality: {
    score: number;
    status: DocumentQualityStatus;
  };
  counts: {
    sentences: number;
    words: number;
    issues: number;
  };
  goals: GoalWithIssueCount[];
  issues: Issue[];
}

export interface Match {
  extractedPart: string;
  extractedBegin: number;
  extractedEnd: number;
  originalPart: string;
  originalBegin: number;
  originalEnd: number;
}

export interface Suggestion {
  surface: string;
  groupId: string;
  replacements: { [matchIndex: string]: string }; // Objects would be easier to extend
}

export interface Action {
  id: ActionId | string;
  url: URL;
  displayName: string;
  icon: ActionIcon | string;
  replacedBy: LinkId;
}

export type LinkId = string;

export enum ActionId {
  help = 'help',
  termContributionForm = 'termContributionForm'
}

export enum ActionIcon {
  help = 'help',
  termContribute = 'term-contribute'
}

export interface Issue {
  goalId: GoalId;
  internalName: string; // Why?
  displayName: string;
  guidance: Html;
  extractedSurface: string;
  positionalInformation: {
    hashes: {
      issue: string;
      environment: string;
      index: string;
    }
  };
  matches: Match[];
  readonly: boolean;
  issueLocations: {
    locationId: string;
    displayName: string;
    values: { [id: string]: string };
  };
  suggestions: Suggestion[];
  actions: Action[];
  links: { [linkId: string]: URL };
}


export type Html = string;

export interface GoalWithIssueCount extends Goal {
  issueCount: number;
}

export enum DocumentQualityStatus {
  red = 'red'
}
