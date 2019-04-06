import {AcrolinxEndpoint} from '../../src/index';
import {SigninLinksResult} from '../../src/signin';
import {AcrolinxServerMock, mockAcrolinxServer, restoreOriginalFetch} from '../test-utils/mock-server';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

describe('corsWithCredentials', () => {
  let endpoint: AcrolinxEndpoint;
  let mockedAcrolinxServer: AcrolinxServerMock;

  beforeEach(() => {
    mockedAcrolinxServer = mockAcrolinxServer(DUMMY_SERVER_URL);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  it('corsWithCredentials === true should set fetch option credentials to "include"', async () => {
    endpoint = new AcrolinxEndpoint({...DUMMY_ENDPOINT_PROPS, corsWithCredentials: true});

    const result = await endpoint.signin() as SigninLinksResult;

    expect(result).toBeDefined();
    expect(mockedAcrolinxServer.requests[0].opts.credentials).toEqual('include');
  });


  /**
   * Ensure credentials: 'same-origin' in old browsers: https://github.com/github/fetch#sending-cookies
   */
  it('corsWithCredentials !== true should set fetch option credentials to "same-origin"', async () => {
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);

    const result = await endpoint.signin() as SigninLinksResult;

    expect(result).toBeDefined();
    expect(mockedAcrolinxServer.requests[0].opts.credentials).toEqual('same-origin');
  });
});
