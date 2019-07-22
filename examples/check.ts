/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {CheckResultResponse} from '../src/check';
import {AcrolinxEndpoint} from '../src/index';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';

function waitMs(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function checkExample() {
  const acrolinxAddress = process.argv[2];
  const authToken = process.argv[3];

  if (!authToken) {
    console.error('Missing AuthToken');
  }

  const acrolinxEndpoint = new AcrolinxEndpoint({
    ...EXAMPLE_ACROLINX_ENDPOINT_PROPS,
    acrolinxUrl: acrolinxAddress,
    // enableHttpLogging: true,
  });

  const capabilities = await acrolinxEndpoint.getCheckingCapabilities(authToken);
  console.log(capabilities);

  const check = await acrolinxEndpoint.check(authToken, {
    checkOptions: {
      guidanceProfileId: capabilities.guidanceProfiles[0].id,
    },
    document: {
      reference: 'filename.txt'
    },
    content: 'Testt Textt'
  });
  console.log('check', check);

  let checkResultOrProgress: CheckResultResponse;
  do {
    checkResultOrProgress = await acrolinxEndpoint.pollForCheckResult(authToken, check);
    console.log('checkResultOrProgress:', JSON.stringify(checkResultOrProgress, null, 2));
    if ('progress' in checkResultOrProgress) {
      await waitMs(checkResultOrProgress.progress.retryAfter * 1000);
    }
  } while ('progress' in checkResultOrProgress);

  console.log('checkResult:', JSON.stringify(checkResultOrProgress, null, 2));

}

checkExample().catch(error => {
  console.error(error);
});
