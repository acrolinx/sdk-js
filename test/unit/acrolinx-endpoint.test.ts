import {DEVELOPMENT_SIGNATURE} from '../../src';
import {AcrolinxEndpoint} from '../../src/index';

function createEndpoint(acrolinxUrl: string) {
  return new AcrolinxEndpoint({
    acrolinxUrl,
    enableHttpLogging: true,
    client: {
      signature: DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666'
    }
  });
}

describe('AcrolinxEndpoint', () => {
  describe('sanitize acrolinxUrl', () => {
    it('trim and remove training slash', () => {
      expect(createEndpoint(' http://host/ ').props.acrolinxUrl).toEqual('http://host');
      expect(createEndpoint(' http://host/path/ ').props.acrolinxUrl).toEqual('http://host/path');

      expect(createEndpoint(' http://host/path ').props.acrolinxUrl).toEqual('http://host/path');
    });
  });
});
