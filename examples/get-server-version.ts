/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint} from '../src/index';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';

const acrolinxEndpoint = new AcrolinxEndpoint(EXAMPLE_ACROLINX_ENDPOINT_PROPS);

acrolinxEndpoint.getServerVersion().then((result) => {
  console.log(result);
}, error => {
  console.error('Error while trying to get the server version', error);
});
