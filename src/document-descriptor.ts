/*
 * Copyright 2019-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CustomField } from './custom-fields';

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
  return { ...d, customFields: d.customFields || [] };
}
