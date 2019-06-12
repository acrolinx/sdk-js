import {ContentFormatId} from './capabilities';
import {CheckOptions, DocumentDescriptorRequest} from './check';
import {LanguageId, UrlString} from './common-types';

export interface ExtractionRequest  {
  content: string;
  options?: CheckOptions;
  document?: DocumentDescriptorRequest;
}

export interface ExtractionResult  {
  options: {
    contentFormat: ContentFormatId;
    languageId: LanguageId;
  };
  extracted: {
    link: UrlString;
    linkAuthenticated: UrlString;
  };
}
