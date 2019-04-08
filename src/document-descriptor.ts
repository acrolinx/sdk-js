import {CustomField} from './custom-fields';

export type DocumentId = string;

export interface DocumentDescriptor {
  id: DocumentId;
  customFields: CustomField[];
  displayInfo?: {
    reference?: string;
  };
}

// TODO: Might be unnecessary in the near future
export function sanitizeDocumentDescriptor(d: DocumentDescriptor): DocumentDescriptor {
  return {...d, customFields: d.customFields || []};
}
