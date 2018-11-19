import {
  AnalysisType,
  Aspect,
  AspectId,
  CheckType,
  ContentEncoding,
  ContentFormatId,
  ContentGoalId,
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
  contentGoalId?: ContentGoalId;
  reportTypes?: ReportType[];
  checkType?: CheckType;
  analysisTypes?: AnalysisType[];
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
  aspects: AspectWithIssueCount[];
  issues: Issue[];
  keywords: KeywordsSection;
  extraInfos: ExtraInfo[];
  actions: Action[];
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
  analysisResults: AnalysisResultMap;
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
  links: {
    getTargetKeywords: URL;
    putTargetKeywords: URL;
  };
  discovered: KeywordInfo[];
  target: KeywordInfo[];
}

export interface ExtraInfo {
  id: string;
  title: string;
  iconClass: string;
  iconUrl: URL;
  url: URL;
}

export interface KeywordInfo {
  keyword: string;
  sortKey: string;
  density: number;
  count: number;
  prominence: number;
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
  icon?: string; // URL or enum?
  replacements: Array<string | null>;
}

/**
 * @deprecated
 */
export interface Action {
  id: ActionId | string;
  url: URL;
  displayName: string;
  icon: ActionIcon | string;
  replacedBy?: LinkId;
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

export interface CommonIssue {
  issueId: string; // TODO: https://3.basecamp.com/3815263/buckets/5979286/todos/923856228
  internalName: string; // Why?
  displayNameHtml: Html;
  guidanceHtml: Html;
  extractedSurface: string;
  positionalInformation: {
    hashes: IssueHashes;
    matches: Match[];
  };
  readonly: boolean;
  issueLocations: IssueLocation[];
  suggestions: Suggestion[];

  /**
   * @deprecated
   */
  actions?: Action[];

  links?: IssueLinks;
  debug?: any;
  canAddToDictionary: boolean;
  subIssues?: SubIssue[];
  aspectId?: AspectId;
}

export interface Issue extends CommonIssue {
  aspectId: AspectId;
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
  termContribution?: URL;
  termContributionInteractive?: URL;
  addToDictionary?: URL;
  [linkId: string]: URL | undefined;
}


export type Html = string;

export interface AspectWithIssueCount extends Aspect {
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
