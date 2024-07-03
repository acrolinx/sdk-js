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

import 'cross-fetch/polyfill';
import { CheckResultResponse } from '../src/check';
import { AcrolinxEndpoint } from '../src/index';
import { EXAMPLE_ACROLINX_ENDPOINT_PROPS } from './common';

function waitMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkExample() {
  const acrolinxAddress = process.argv[2];
  const accessToken = process.argv[3];

  if (!accessToken) {
    console.error('Missing AccessToken');
  }

  const acrolinxEndpoint = new AcrolinxEndpoint({
    ...EXAMPLE_ACROLINX_ENDPOINT_PROPS,
    acrolinxUrl: acrolinxAddress,
    // enableHttpLogging: true,
  });

  const capabilities = await acrolinxEndpoint.getCheckingCapabilities(accessToken);
  console.log(capabilities);

  const check = await acrolinxEndpoint.check(accessToken, {
    checkOptions: {
      guidanceProfileId: capabilities.guidanceProfiles[0].id,
    },
    document: {
      reference: 'filename.txt',
    },
    content: 'Testt Textt',
  });
  console.log('check', check);

  let checkResultOrProgress: CheckResultResponse;
  do {
    checkResultOrProgress = await acrolinxEndpoint.pollForCheckResult(accessToken, check);
    console.log('checkResultOrProgress:', JSON.stringify(checkResultOrProgress, null, 2));
    if ('progress' in checkResultOrProgress) {
      await waitMs(checkResultOrProgress.progress.retryAfter * 1000);
    }
  } while ('progress' in checkResultOrProgress);

  console.log('checkResult:', JSON.stringify(checkResultOrProgress, null, 2));
}

checkExample().catch((error) => {
  console.error(error);
});
