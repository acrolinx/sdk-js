import {ErrorType} from '../../src/errors';
import {AcrolinxEndpoint, AcrolinxEndpointProps} from '../../src/index';
import {
  DUMMY_SERVER_INFO, mockAcrolinxServer, mockBrokenJsonServer,
  restoreOriginalFetch
} from '../test-utils/mock-server';

const DUMMY_SERVER_URL = 'http://dummy-server';
const BROKEN_JSON_SERVER = 'http://broken-json-server';

const DUMMY_ENDPOINT_PROPS: AcrolinxEndpointProps = {
  clientLocale: 'en',
  clientName: 'TestClient',
  serverAddress: DUMMY_SERVER_URL,
};

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

  describe('errors', () => {
    it('should return an failing promise for broken json', async () => {
      const api = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      try {
        await api.getServerVersion();
      } catch (e) {
        expect(e.type).toEqual(ErrorType.invalidJson);
      }
    });

  });
});
