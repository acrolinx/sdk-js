/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint} from '../src/index';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';

export function waitMs(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function checkExample() {
  const authToken = process.argv[2];

  if (!authToken) {
    console.error('Missing AuthToken');
  }

  const acrolinxEndpoint = new AcrolinxEndpoint({
    ...EXAMPLE_ACROLINX_ENDPOINT_PROPS,
    serverAddress: 'http://localhost:3000'
  });

  const check = await acrolinxEndpoint.check(authToken, {content: 'Testt Textt'});

  let checkingStatus;
  do {
    await waitMs(1000);
    checkingStatus = await acrolinxEndpoint.getCheckingStatus(authToken, check);
    console.log('checkingStatus:', JSON.stringify(checkingStatus, null, 2));
  } while (checkingStatus.state !== 'done');

  const checkResult = await acrolinxEndpoint.getCheckResult(authToken, check);

  console.log('checkResult:', JSON.stringify(checkResult, null, 2));

}

checkExample().catch(error => {
  console.error(error);
});
