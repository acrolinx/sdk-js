import {CustomField} from './custom-fields';

export interface User {
  id: string;
  signIn: string;
  fullName: string;
  tenantId: string;
  properties: {
    [key: string]: string;
  };
  customFields: CustomField[];
}

