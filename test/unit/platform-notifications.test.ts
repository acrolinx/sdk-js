import {AcrolinxEndpoint} from '../../src/index';
import {DUMMY_AUTH_TOKEN, mockAcrolinxServer, restoreOriginalFetch} from '../test-utils/mock-server';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

describe('platform-notifications', () => {
  let endpoint: AcrolinxEndpoint;

  beforeEach(() => {
    mockAcrolinxServer(DUMMY_SERVER_URL);
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  it('get notifications', async () => {
    const serverMessages = await endpoint.getServerNotifications(DUMMY_AUTH_TOKEN, 0);
    expect(Array.isArray(serverMessages.data.platformNotifications)).toBe(true);
    expect(serverMessages.data.requestTimeInMilliseconds).toBeGreaterThan(0);
  });
});
