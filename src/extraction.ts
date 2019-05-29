import {CheckOptions, DocumentDescriptorRequest} from './check';
import {UrlString} from './common-types';

export interface ExtractionRequest  {
  content: string;
  options?: CheckOptions;
  document?: DocumentDescriptorRequest;
}

export interface ExtractionResult  {
  extracted: {
    link: UrlString;
    linkAuthenticated: UrlString;
  };
}
