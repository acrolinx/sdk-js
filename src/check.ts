import {AudienceId, CheckType, ContentEncoding, ReportType, TermSetId} from './capabilities';
import {URL} from './common-types';

export interface CheckRange {
  begin: number;
  end: number;
}

export interface CheckRequest {
  content: string;
  contentEncoding?: ContentEncoding;
  checkOptions?: {
    audienceId?: AudienceId;
    termSetIds?: TermSetId[];
    reportTypes?: ReportType[];
    checkType?: CheckType;
    partialCheckRanges?: CheckRange[];
  };
  batchId?: string;
  document?: {
    id?: string;
    reference?: string;
    author?: string;
    mimeType?: string;
    contentType?: string;
    metaData?: MetaData;
    displayInfo?: {
      reference?: string;
    }
  };
  // clientInfo ???
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
}


export interface CheckingStatus {
  id: CheckId;
  state: 'done' | '???';
  percent: number;
  links: {
    result: URL
  };
}
