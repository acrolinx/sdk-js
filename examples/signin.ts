/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint, isSigninSuccessResult} from '../src/index';
import {isSigninLinksResult} from '../src/signin';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';

async function signInExample() {
  const authToken = process.argv[2];

  const acrolinxEndpoint = new AcrolinxEndpoint(EXAMPLE_ACROLINX_ENDPOINT_PROPS);

  const loginResult = await acrolinxEndpoint.signin({authToken});

  if (isSigninLinksResult(loginResult)) {
    if (authToken) {
      console.log('Authtoken was invalid');
    }

    console.log(`Please signin at "${loginResult.links.interactive}"
     within ${loginResult.data.interactiveLinkTimeout} seconds!`);
    let pollResult = await acrolinxEndpoint.pollForSignin(loginResult);

    while (!isSigninSuccessResult(pollResult)) {
      console.log('Polling...', pollResult.progress.retryAfter);
      pollResult = await acrolinxEndpoint.pollForSignin(loginResult, pollResult);
    }

    console.log('Success:', pollResult);
    console.log('authToken:', pollResult.data.accessToken);
    console.log('User:', pollResult.data.user.id);
  } else {
    console.log('loginResult', loginResult);
    console.log(`Your are already signed as "${loginResult.data.user.id}"`);
  }
}

signInExample().catch(error => {
  console.error(error);
});
