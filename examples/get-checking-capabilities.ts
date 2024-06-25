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

/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import { AcrolinxEndpoint } from '../src/index';
import { EXAMPLE_ACROLINX_ENDPOINT_PROPS } from './common';

async function getCheckingCapabilitiesExample() {
  const accessToken = process.argv[2];

  if (!accessToken) {
    console.error('Missing AccessToken');
  }

  const acrolinxEndpoint = new AcrolinxEndpoint({
    ...EXAMPLE_ACROLINX_ENDPOINT_PROPS,
  });

  const capabilities = await acrolinxEndpoint.getCheckingCapabilities(accessToken);
  console.log(JSON.stringify(capabilities, null, 2));
}

getCheckingCapabilitiesExample().catch((error) => {
  console.error(error);
});
