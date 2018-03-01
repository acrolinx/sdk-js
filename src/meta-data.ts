export interface MetaDataFieldDefinition {
  id: string;
  name: string;
  type: MetaDataFieldType;
  options: string[];
  required: boolean;
}

export enum MetaDataFieldType  {
  selection = 'selection',
  text = 'text'
}

export interface MetaDataResponse {
  fieldDefinitions: MetaDataFieldDefinition[];
  metaData: MetaDataValueMap;
}

export interface MetaDataValueMap {
  [index: string]: string;
}
