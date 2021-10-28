/*
 * Copyright 2021-present Acrolinx GmbH
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
import {CheckResultResponse} from '../src/check';
import {AcrolinxEndpoint} from '../src/index';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';
import { readFileSync } from 'fs';

function waitMs(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function checkExample() {
  const acrolinxAddress = process.argv[2];
  const accessToken = process.argv[3];
  const xliffDocument = process.argv[4];

  if (!accessToken) {
    console.error('Missing AccessToken');
  }

  if(!xliffDocument) {
    console.error('Missing xliff document');
  }

  const xliffDoc = readFileSync(xliffDocument).toString();

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
      contentFormat: 'XML',
    },
    document: {
      reference: 'filename.xlf'
    },
    content: xliffDoc
  });
  console.log('check', check);

  let checkResultOrProgress: CheckResultResponse;
  do {
    checkResultOrProgress = await acrolinxEndpoint.pollForCheckResult(accessToken, check); 
    if ('progress' in checkResultOrProgress) {
      console.log('checkResultOrProgress:', JSON.stringify(checkResultOrProgress, null, 2));
      await waitMs(checkResultOrProgress.progress.retryAfter * 1000);
    }
  } while ('progress' in checkResultOrProgress);

  checkResultOrProgress.data.issues.forEach(issue => {
    const matches = issue.positionalInformation.matches;
      const docUptoMatch = xliffDoc.substring(0, matches[matches.length - 1].originalEnd);

      // trans-unit is from xliff spec http://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#trans-unit
      const transationalUnitStart = docUptoMatch.lastIndexOf('<trans-unit');
      const transationalUnitEnd = docUptoMatch.indexOf('>', transationalUnitStart);
      const transationalUnitTag = docUptoMatch.substring(transationalUnitStart, transationalUnitEnd);

      const idRegex = new RegExp(/id="(.*?)"/g);
      const m = idRegex.exec(transationalUnitTag);
      if(!m) throw new Error('Id not found');

      // Get first group from match
      const id = m[1];

      console.log('Id for issue ' + issue.displaySurface + ' is: ' + id);

  });

}

checkExample().catch(error => {
  console.error(error);
});
