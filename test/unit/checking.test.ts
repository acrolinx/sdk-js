import {AcrolinxEndpoint} from '../../src/index';
import {DUMMY_ACCESS_TOKEN, mockAcrolinxServer, restoreOriginalFetch} from '../test-utils/mock-server';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

describe('checking', () => {
  let endpoint: AcrolinxEndpoint;

  beforeEach(() => {
    mockAcrolinxServer(DUMMY_SERVER_URL);
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });


  it('get checking capabilities', async () => {
    const capabilities = await endpoint.getCheckingCapabilities(DUMMY_ACCESS_TOKEN);
    expect(capabilities.guidanceProfiles.length).toBeGreaterThan(0);
  });


});
