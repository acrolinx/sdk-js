import {AcrolinxEndpoint} from '../../src/index';
import {
  DUMMY_SERVER_INFO,
  mockAcrolinxServer,
  restoreOriginalFetch
} from '../test-utils/mock-server';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

describe('getServerVersion', () => {
  beforeEach(() => {
    mockAcrolinxServer(DUMMY_SERVER_URL);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  it('should return the server version', async () => {
    const api = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
    const result = await api.getServerVersion();
    expect(result.version).toBe(DUMMY_SERVER_INFO.version);
  });

});
