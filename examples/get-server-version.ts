/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint, DEVELOPMENT_SIGNATURE} from '../src/index';

const acrolinxEndpoint = new AcrolinxEndpoint({
  client: {
    name: 'TestClient',
    signature: DEVELOPMENT_SIGNATURE,
    version: '1.2.3.666'
  },
  serverAddress: 'https://test-latest-ssl.acrolinx.com',
});

acrolinxEndpoint.getServerVersion().then((result) => {
  console.log(result);
}, error => {
  console.error('Error while trying to get the server version', error);
});
