/*
 * Copyright 2018-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Addon, AddonId } from './addons';
import {
  CheckType,
  ContentEncoding,
  ContentFormatId,
  Goal,
  GoalId,
  GoalScoring,
  GuidanceProfileId,
  ReportType,
} from './capabilities';
import { AsyncApiResponse, AsyncStartedProcessLinks, LanguageId, SuccessResponse, URL } from './common-types';
import { DictionaryScope } from './dictionary';
import { DocumentDescriptor } from './document-descriptor';
import { Integration } from './integration';

export interface CheckRange {
  begin: number;
  end: number;
}

export interface ExternalContentField {
  id: string;
  content: string;
}

export interface ExternalContent {
  textReplacements?: ExternalContentField[];
  entities?: ExternalContentField[];
  ditaReferences?: ExternalContentField[];
  xincludeReferences?: ExternalContentField[];
}

export interface CheckRequest {
  content: string;
  contentEncoding?: ContentEncoding;
  checkOptions?: CheckOptions;
  document?: DocumentDescriptorRequest;
  externalContent?: ExternalContent;
  integration?: Integration;
}

export interface LiveSearchRequest {
  requestId: string;
  target: string;
  phrase: string;
}

export interface LiveSuggestion {
  preferredPhrase: string;
  description: string;
}
export interface LiveSearchResponse {
  requestId: string;
  results: LiveSuggestion[];
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
}

export interface DocumentDescriptorRequest extends Partial<DocumentDescriptor> {
  reference?: string;
}

export type CheckId = string;

export interface CheckResponseData {
  id: CheckId;
}

export type CheckResponse = SuccessResponse<CheckResponseData, AsyncStartedProcessLinks>;

export type CheckResultResponse = AsyncApiResponse<CheckResult>;

export interface ScoreByGoal {
  id: string;
  score: number;
}

export interface Metric {
  id: string;
  score: number;
}

export interface CheckResult {
  id: CheckId;
  checkOptions: CheckOptions;
  dictionaryScopes: DictionaryScope[];
  document: DocumentDescriptor;
  quality: {
    score: number;
    status: DocumentQualityStatus;
    scoresByGoal?: ScoreByGoal[];
    metrics?: Metric[];
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

type AggregatedReport = {
  reportType: string;
  link: URL;
};

export interface AggregatedReportLinkResult {
  reports: AggregatedReport[];
}

type ContentAnalysisDashboardLink = {
  linkType: string;
  link: URL;
};

export interface ContentAnalysisDashboardResult {
  links: ContentAnalysisDashboardLink[];
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
  density: number;
  count: number;
  prominence: number;
  warnings?: KeywordWarning[];
}

export enum KeywordWarningType {
  RankMismatch = 'rankMismatch',
  Occurrence = 'occurrence',
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
  externalContentMatches?: ExternalContentMatch[];
}

export interface ExternalContentMatch {
  id: string;
  type: string;
  originalBegin: number;
  originalEnd: number;
  externalContentMatches?: ExternalContentMatch[];
}

export interface RewriteContextPart {
  sourceId?: string;
  sourceType?: string;
  begin: number;
  end: number;
  externalContent?: RewriteContextPart[];
}

export interface Suggestion {
  surface: string;
  groupId: string;
  iconId?: SuggestionIconId | null;
  replacements: (string | null)[];
}

export enum SuggestionIconId {
  admitted = 'admitted',
  preferred = 'preferred',
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

  /**
   * Since Acrolinx platform 2021.2
   */
  issueType: IssueType;

  /**
   * Since Acrolinx platform 2021.4
   * Only available if the server runs in Targets mode.
   */
  scoring?: GoalScoring;
  aiRephraseHint?: string;
  aiRewriteContext?: RewriteContextPart[];
}

export interface PositionalInformation {
  hashes: IssueHashes;
  matches: Match[];
}

export enum IssueType {
  analytical = 'analytical',
  actionable = 'actionable',
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
  green = 'green',
}

export interface CancelCheckResponseData {
  id: CheckId;
}

export type CancelCheckResponse = SuccessResponse<CancelCheckResponseData>;

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
