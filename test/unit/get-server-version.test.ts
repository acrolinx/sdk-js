import {AcrolinxEndpoint} from '../../src/index';
import {
  DUMMY_SERVER_INFO,
  mockAcrolinxServer,
  mockBrokenJsonServer,
  restoreOriginalFetch
} from '../test-utils/mock-server';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

const BROKEN_JSON_SERVER = 'http://broken-json-server';

describe('getServerVersion', () => {
  beforeEach(() => {
    mockAcrolinxServer(DUMMY_SERVER_URL);
    mockBrokenJsonServer(BROKEN_JSON_SERVER);
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
