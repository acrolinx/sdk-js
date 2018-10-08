export interface User {
  id: string;
  signIn: string;
  fullName: string;
  tenantId: string;
  properties: {
    [key: string]: string;
  };
  customFields: UserCustomFields [];
}

export interface UserCustomFields {
  displayName: string;
  key: string;
  inputType: CustomFieldInputType;
  type: CustomFieldType;
  value?: string;
  possibleValues?: string [];
}

export enum CustomFieldType {
  TYPE_LIST = 'list',
  TYPE_TEXT = 'text'
}

export enum CustomFieldInputType {
  REQUIRED = 'required',
  EXTERNALLY_PROVIDED = 'externally_provided',
  OPTIONAL = 'optional'
}
