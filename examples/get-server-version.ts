/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint} from '../src/index';

const acrolinxEndpoint = new AcrolinxEndpoint({
  clientName: 'TestClient',
  serverAddress: 'https://test-latest-ssl.acrolinx.com',
});

acrolinxEndpoint.getServerVersion().then((result) => {
  console.log(result);
}, error => {
  console.error('Error while trying to get the server version', error);
});
