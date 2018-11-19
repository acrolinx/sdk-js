import {CustomField} from './custom-fields';

export interface User {
  id: string;
  username: string;
  fullName: string;
  tenantId: string;
  properties: {
    [key: string]: string;
  };
  customFields: CustomField[];
}

