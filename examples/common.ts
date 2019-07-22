import {AcrolinxEndpointProps, DEVELOPMENT_SIGNATURE} from '../src';

export const EXAMPLE_ACROLINX_ENDPOINT_PROPS: AcrolinxEndpointProps = {
  client: {
    signature: DEVELOPMENT_SIGNATURE,
    version: '1.2.3.666'
  },
  serverAddress: 'https://test-latest-ssl.acrolinx.com'
};
