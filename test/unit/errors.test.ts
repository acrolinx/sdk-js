import {CheckCancelledByClientError, ErrorType} from '../../src/errors';
import {AcrolinxEndpoint} from '../../src/index';
import {mockAcrolinxServer, mockBrokenJsonServer, restoreOriginalFetch} from '../test-utils/mock-server';
import {DUMMY_ENDPOINT_PROPS, DUMMY_SERVER_URL} from './common';

const BROKEN_JSON_SERVER = 'http://broken-json-server';

describe('errors', () => {
  beforeEach(() => {
    mockAcrolinxServer(DUMMY_SERVER_URL);
    mockBrokenJsonServer(BROKEN_JSON_SERVER);
  });

  afterEach(() => {
    restoreOriginalFetch();
  });

  it('should return an failing promise for broken json', async () => {
    const api = new AcrolinxEndpoint({...DUMMY_ENDPOINT_PROPS, acrolinxUrl: BROKEN_JSON_SERVER});
    try {
      await api.getJsonFromUrl(BROKEN_JSON_SERVER);
    } catch (e) {
      expect(e.type).toEqual(ErrorType.InvalidJson);
    }
    expect.hasAssertions();
  });

  it('should return an api error for invalid signin poll address', async () => {
    const api = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
    try {
      await api.pollForSignin({
        data: {interactiveLinkTimeout: 0},
        links: {
          interactive: 'dummy',
          poll: DUMMY_ENDPOINT_PROPS.acrolinxUrl + '/api/v1/auth/sign-ins/0ddece9c-464a-442b-8a5d-d2f242d54c81'
        }
      });
    } catch (e) {
      expect(e.type).toEqual(ErrorType.Client);
    }
    expect.hasAssertions();
  });

  describe('custom errors and instanceof', () => {
    // Needed because of https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    it('CheckCancelledByClientError should support instanceof', () => {
      const error = new CheckCancelledByClientError({
        detail: 'The check was cancelled. No result is available.',
        type: ErrorType.CheckCancelled,
        title: 'Check cancelled',
        status: 400
      });
      expect(error).toBeInstanceOf(CheckCancelledByClientError);
    });
  });
});
