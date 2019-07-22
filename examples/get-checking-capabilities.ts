/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint} from '../src/index';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';

async function getCheckingCapabilitiesExample() {
  const accessToken = process.argv[2];

  if (!accessToken) {
    console.error('Missing AccessToken');
  }

  const acrolinxEndpoint = new AcrolinxEndpoint({
    ...EXAMPLE_ACROLINX_ENDPOINT_PROPS,
    acrolinxUrl: 'http://localhost:3000'
  });

  const capabilities = await acrolinxEndpoint.getCheckingCapabilities(accessToken);
  console.log(JSON.stringify(capabilities, null, 2));
}

getCheckingCapabilitiesExample().catch(error => {
  console.error(error);
});
