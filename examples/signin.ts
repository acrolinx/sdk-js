/* tslint:disable:no-console */
import {AcrolinxEndpoint, isSigninSuccessResult} from '../src/index';
import {isSigninLinksResult} from '../src/login';

async function signInExample() {
  const authToken = process.argv[2];

  const acrolinxEndpoint = new AcrolinxEndpoint({
    clientName: 'TestClient',
    serverAddress: 'https://test-latest-ssl.acrolinx.com',
  });

  const loginResult = await acrolinxEndpoint.login({authToken});

  if (isSigninLinksResult(loginResult)) {
    if (authToken) {
      console.log('Authtoken was invalid');
    }

    console.log(`Please signin at "${loginResult.links.interactive}"!`);
    let pollResult = await acrolinxEndpoint.pollForSignin(loginResult);

    while (!isSigninSuccessResult(pollResult)) {
      console.log('Polling...');
      pollResult = await acrolinxEndpoint.pollForSignin(loginResult);
    }

    console.log('Success:', pollResult);
    console.log('authToken:', pollResult.authToken);
    console.log('User:', pollResult.userId);
  } else {
    console.log('loginResult', loginResult);
    console.log(`Your are already signed as "${loginResult.userId}"`);
  }
}

signInExample();
