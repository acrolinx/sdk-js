import {CheckingCapabilities} from './capabilities';
import {CustomField} from './custom-fields';

export interface PlatformCapabilities {
  checking: CheckingCapabilities;
  document: {
    customFields: CustomField[];
  };
}
