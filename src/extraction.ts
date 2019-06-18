import {ContentFormatId} from './capabilities';
import {CheckOptions, DocumentDescriptorRequest} from './check';
import {LanguageId, UrlString} from './common-types';

export enum AnalysisType {
  extractedText = 'extractedText',
  offsets = 'offsets'
}

export interface AnalysisRequestOptions extends CheckOptions {
  analysisTypes: AnalysisType[];
}

export interface AnalysisRequest {
  content: string;
  options?: AnalysisRequestOptions;
  document?: DocumentDescriptorRequest;
}

export interface ExtractionResult {
  options: {
    contentFormat: ContentFormatId;
    languageId: LanguageId;
  };
  extracted: {
    link: UrlString;
    linkAuthenticated: UrlString;
  };
  offsets?: {
    link: UrlString;
    linkAuthenticated: UrlString;
  };
}

export interface OffsetReport {
  ranges: readonly MappedOffsetRange[];
}

export interface MappedOffsetRange {
  original: OffsetRange;
  extracted: OffsetRange;
}

export interface OffsetRange {
  begin: number;
  end: number;
}
