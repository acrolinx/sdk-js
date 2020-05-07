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
import {AcrolinxEndpoint, isSigninSuccessResult} from '../src/index';
import {isSigninLinksResult} from '../src/signin';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';

async function signInExample() {
  const accessToken = process.argv[2];

  const acrolinxEndpoint = new AcrolinxEndpoint(EXAMPLE_ACROLINX_ENDPOINT_PROPS);

  const loginResult = await acrolinxEndpoint.signin({accessToken});

  if (isSigninLinksResult(loginResult)) {
    if (accessToken) {
      console.log('AccessToken was invalid');
    }

    console.log(`Please signin at "${loginResult.links.interactive}"
     within ${loginResult.data.interactiveLinkTimeout} seconds!`);
    let pollResult = await acrolinxEndpoint.pollForSignin(loginResult);

    while (!isSigninSuccessResult(pollResult)) {
      console.log('Polling...', pollResult.progress.retryAfter);
      pollResult = await acrolinxEndpoint.pollForSignin(loginResult, pollResult);
    }

    console.log('Success:', pollResult);
    console.log('accessToken:', pollResult.data.accessToken);
    console.log('User:', pollResult.data.user.id);
  } else {
    console.log('loginResult', loginResult);
    console.log(`Your are already signed as "${loginResult.data.user.id}"`);
  }
}

signInExample().catch(error => {
  console.error(error);
});
