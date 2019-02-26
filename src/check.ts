import {Addon, AddonId} from './addons';
import {
  CheckType,
  ContentEncoding,
  ContentFormatId,
  Goal,
  GoalId,
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
  partialCheckRanges?: CheckRange[] | null;
  contentFormat?: ContentFormatId;
  languageId?: LanguageId;
  batchId?: string;
  disableCustomFieldValidation?: boolean;
}

export interface DocumentDescriptor {
  id: DocumentId;
  reference?: string;
  author?: string;
  mimeType?: string;
  contentType?: string;
  metadata?: MetaData[];
  displayInfo?: {
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

export type CheckResultResponse = AsyncApiResponse<CheckResult>;

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
  reports: CheckResultReports;
  embed?: KeyValuePair[];
  addons?: Addon[];
}

export interface HasTermHarvestingReport {
  [ReportType.termHarvesting]: Report;
}

export type CheckResultReports = {
  [P in ReportType]?: Report;
};

export function hasTermHarvestingReport(reports: CheckResultReports): reports is HasTermHarvestingReport {
  return !!reports.termHarvesting;
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
  iconId?: SuggestionIconId | null;
  replacements: Array<string | null>;
}

export enum SuggestionIconId {
  admitted = 'admitted',
  preferred = 'preferred'
}

export interface CommonIssue {
  internalName: string;
  displayNameHtml: Html;
  guidanceHtml: Html;
  displaySurface: string;
  positionalInformation: PositionalInformation;
  readOnly: boolean;
  issueLocations: IssueLocation[];
  suggestions: Suggestion[];

  links?: IssueLinks;
  debug?: any;
  canAddToDictionary: boolean;
  subIssues?: SubIssue[];
  goalId?: GoalId;
}

export interface PositionalInformation {
  hashes: IssueHashes;
  matches: Match[];
}

export interface Issue extends CommonIssue {
  goalId: GoalId;
}

type SubIssue = CommonIssue;

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

export interface TermContributionLinks {
  termContribution?: URL;
  termContributionInteractive?: URL;
}


export interface IssueLinks extends TermContributionLinks {
  help?: URL;
  addToDictionary?: URL;

  [linkId: string]: URL | undefined;
}


export type Html = string;

export interface GoalWithIssueCount extends Goal {
  issues: number;
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


export interface TermHarvestingReport {
  terms: HarvestedTerm[];
}

export interface HarvestedTerm {
  displaySurface: string;
  occurrences: HarvestedTermOccurrence[];
  links: TermContributionLinks;
}

export interface HarvestedTermOccurrence {
  context: string;
  displayContextHtml: string;
  positionalInformation: PositionalInformation;
  locations: IssueLocation[];
}
