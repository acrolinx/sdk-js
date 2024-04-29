import * as mockFetch from 'fetch-mock';
import { AcrolinxEndpoint, IntService } from '../../src/index';
import { DUMMY_ACCESS_TOKEN, DUMMY_CLIENT_SIGNATURE } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS } from './common';

describe('Integration-service', () => {
  let endpoint: AcrolinxEndpoint;
  let intService: IntService;

  beforeEach(() => {
    endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
    intService = new IntService(endpoint, DUMMY_CLIENT_SIGNATURE);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  describe('/config', () => {
    const configEndpointMatcher = 'end:/int-service/api/v1/config';

    it('truthy response for correct client signature', async () => {
      // Mock the endpoint with expected headers check and updated response property
      mockFetch.mock(configEndpointMatcher, (_url, opts) => {
        const headers = opts.headers as Record<string, string>; // Asserting headers to be of type Record<string, string>
        if (headers['X-Client-Signature'] === DUMMY_CLIENT_SIGNATURE) {
          return {
            status: 200,
            body: { activateGetSuggestionReplacement: true }, // Updated property name
          };
        } else {
          return { status: 401 }; // Unauthorized if the signature is wrong
        }
      });

      const response = await intService.getConfig(DUMMY_ACCESS_TOKEN);
      expect(response.activateGetSuggestionReplacement).toBe(true); // Assertion updated to check new property name
    });

    it('should fail without correct client signature', async () => {
      // Test to ensure that the API responds correctly when the signature is missing or incorrect
      mockFetch.mock(configEndpointMatcher, {
        status: 401,
      });

      await expect(intService.getConfig(DUMMY_ACCESS_TOKEN)).rejects.toThrow();
    });
  });
});
