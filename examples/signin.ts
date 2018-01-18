/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint, isSigninSuccessResult} from '../src/index';
import {isSigninLinksResult} from '../src/signin';

async function signInExample() {
  const authToken = process.argv[2];

  const acrolinxEndpoint = new AcrolinxEndpoint({
    clientName: 'TestClient',
    serverAddress: 'https://test-latest-ssl.acrolinx.com',
  });

  const loginResult = await acrolinxEndpoint.signin({authToken});

  if (isSigninLinksResult(loginResult)) {
    if (authToken) {
      console.log('Authtoken was invalid');
    }

    console.log(`Please signin at "${loginResult.links.interactive}"
     within ${loginResult.interactiveLinkTimeout} seconds!`);
    let pollResult = await acrolinxEndpoint.pollForSignin(loginResult);

    while (!isSigninSuccessResult(pollResult)) {
      console.log('Polling...', pollResult.retryAfterSeconds);
      pollResult = await acrolinxEndpoint.pollForSignin(loginResult, pollResult);
    }

    console.log('Success:', pollResult);
    console.log('authToken:', pollResult.authToken);
    console.log('User:', pollResult.userId);
  } else {
    console.log('loginResult', loginResult);
    console.log(`Your are already signed as "${loginResult.userId}"`);
  }
}

signInExample().catch(error => {
  console.error(error);
});
