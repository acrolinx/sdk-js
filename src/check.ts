import {Addon, AddonId} from './addons';
import {
  Goal,
  GoalId,
  CheckType,
  ContentEncoding,
  ContentFormatId,
  GuidanceProfileId,
  ReportType,
} from './capabilities';
import {AsyncApiResponse, LanguageId, SuccessResponse, URL} from './common-types';
import {CustomField} from './custom-fields';
import {DictionaryScope} from './dictionary';

export interface CheckRange {
  begin: number;
  end: number;
}

export type DocumentId = string;

export interface CheckRequest {
  content: string;
  contentEncoding?: ContentEncoding;
  checkOptions?: CheckOptions;
  document?: Partial<DocumentDescriptor>;
  // clientInfo ???
}

export interface CheckOptions {
  guidanceProfileId?: GuidanceProfileId;
  reportTypes?: ReportType[];
  checkType?: CheckType;
  addons?: AddonId[];
  partialCheckRanges?: CheckRange[];
  contentFormat?: ContentFormatId;
  languageId?: LanguageId;
  batchId?: string;
  disableCustomFieldValidation?: boolean;
}

export interface DocumentDescriptor {
  id: DocumentId;
  reference: string;
  author: string;
  mimeType: string;
  contentType: string;
  metadata: MetaData[];
  displayInfo: {
    reference?: string;
  };
  customFields: CustomField[];
}

export interface MetaData {
  displayName: string;
  key: string;
  value: string;
  required: boolean;
}

export type CheckId = string;

export interface CheckResponseData {
  id: CheckId;
}

export interface CheckResponse extends SuccessResponse<CheckResponseData> {
  links: {
    result: URL;
    cancel: URL;
  };
  // Lots of stuff that looks similar to CheckRequest
}

export type CheckResultResponse  = AsyncApiResponse<CheckResult>;

export interface CheckResult {
  id: CheckId;
  checkOptions: CheckOptions;
  dictionaryScopes: DictionaryScope[];
  document: DocumentDescriptor;
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
  keywords?: KeywordsSection; //  Can be empty for check selection (partialCheckRanges)
  links: {
    termContribution: URL
    deleteScorecard: URL
  };
  reports:
    {
      [key: string]: Report;
      legacyJson: Report;
      scorecard: Report;
    };
  embed?: KeyValuePair[];
  addons?: Addon[];
}

export interface AnalysisResult {
  reportContentHtml: string;
}

export interface AnalysisResultMap {
  [analysisType: string]: AnalysisResult;
}

export interface Report {
  linkAuthenticated: URL;
  link: URL;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface AggregatedReportLinkResult {
  reports: Array<{
      reportType: string
      link: URL
  }>;
}

export interface KeywordsSection {
  links: KeywordsSectionLinks;
  discovered: DiscoveredKeyword[];
  target: Keyword[];
}

export interface KeywordsSectionLinks {
  getTargetKeywords?: URL;
  putTargetKeywords?: URL;
}

export interface Keyword {
  keyword: string;
  sortKey?: string;
}

export interface DiscoveredKeyword extends Keyword {
  density?: number;
  count?: number;
  prominence?: number;
  warnings?: KeywordWarning[];
}


export enum KeywordWarningType {
  RankMismatch = 'rankMismatch',
  Occurrence = 'occurrence'
}

export interface KeywordWarning {
  type: KeywordWarningType;
  severity: 1 | 2;
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
  iconId?: SuggestionIconId;
  replacements: Array<string | null>;
}

export enum SuggestionIconId {
  admitted = 'admitted',
  preferred = 'preferred'
}

export interface CommonIssue {
  issueId: string; // TODO: https://3.basecamp.com/3815263/buckets/5979286/todos/923856228
  internalName: string; // Why?
  displayNameHtml: Html;
  guidanceHtml: Html;
  displaySurface: string;
  positionalInformation: {
    hashes: IssueHashes;
    matches: Match[];
  };
  readonly: boolean;
  issueLocations: IssueLocation[];
  suggestions: Suggestion[];

  links?: IssueLinks;
  debug?: any;
  canAddToDictionary: boolean;
  subIssues?: SubIssue[];
  goalId?: GoalId;
}

export interface Issue extends CommonIssue {
  goalId: GoalId;
}

// tslint:disable-next-line no-empty-interface
export interface SubIssue extends CommonIssue {
}

export interface IssueHashes {
  issue: string;
  environment: string;
  index: string;
}

export interface IssueLocation {
  locationId: string;
  displayName: string;
  values: { [id: string]: string };
}

export interface IssueLinks {
  help?: URL;
  termContribution?: URL;
  termContributionInteractive?: URL;
  addToDictionary?: URL;
  [linkId: string]: URL | undefined;
}


export type Html = string;

export interface GoalWithIssueCount extends Goal {
  issueCount: number;
}

export enum DocumentQualityStatus {
  red = 'red',
  yellow = 'yellow',
  green = 'green'
}

export interface CancelCheckResponseData {
  id: CheckId;
}

export type CancelCheckResponse = SuccessResponse<CancelCheckResponseData>;

// TODO: Might be unnecessary in the near future
export function sanitizeDocumentDescriptor(d: DocumentDescriptor): DocumentDescriptor {
  return {...d, customFields: d.customFields || []};
}
