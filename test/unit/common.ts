import {AcrolinxEndpointProps, DEVELOPMENT_SIGNATURE} from '../../src';

export const DUMMY_SERVER_URL = 'http://dummy-server';

export const DUMMY_ENDPOINT_PROPS: AcrolinxEndpointProps = {
  client: {
    signature: DEVELOPMENT_SIGNATURE,
    version: '1.2.3.666'
  },
  serverAddress: DUMMY_SERVER_URL
};
