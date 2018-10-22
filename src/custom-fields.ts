interface CustomFieldCommon {
  displayName: string;
  key: string;
  inputType: CustomFieldInputType;
  value?: string;
}

export interface CustomFieldList extends CustomFieldCommon {
  type: CustomFieldType.TYPE_LIST;
  possibleValues: string[];
}

export interface CustomFieldText extends CustomFieldCommon {
  type: CustomFieldType.TYPE_TEXT;
}

export type CustomField = CustomFieldList | CustomFieldText;

export enum CustomFieldType {
  TYPE_LIST = 'list',
  TYPE_TEXT = 'text'
}

export enum CustomFieldInputType {
  REQUIRED = 'required',
  EXTERNALLY_PROVIDED = 'externally_provided',
  OPTIONAL = 'optional'
}
