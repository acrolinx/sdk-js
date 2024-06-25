/*
 * Copyright 2018-present Acrolinx GmbH
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

import { AcrolinxEndpointProps, DEVELOPMENT_SIGNATURE } from '../src';

export const EXAMPLE_ACROLINX_ENDPOINT_PROPS: AcrolinxEndpointProps = {
  client: {
    signature: DEVELOPMENT_SIGNATURE,
    version: '1.2.3.666',
  },
  acrolinxUrl: 'https://test-ssl.acrolinx.com' /* Add here your own test server URL */,
};
