import {DEVELOPMENT_SIGNATURE} from '../../src';
import {AcrolinxEndpoint} from '../../src/index';

function createEndpoint(serverAddress: string) {
  return new AcrolinxEndpoint({
    enableHttpLogging: true,
    client: {
      signature: DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666'
    }, serverAddress
  });
}

describe('AcrolinxEndpoint', () => {
  describe('sanitize serverAddress', () => {
    it('trim and remove training slash', () => {
      expect(createEndpoint(' http://host/ ').props.serverAddress).toEqual('http://host');
      expect(createEndpoint(' http://host/path/ ').props.serverAddress).toEqual('http://host/path');

      expect(createEndpoint(' http://host/path ').props.serverAddress).toEqual('http://host/path');
    });
  });
});
