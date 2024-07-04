const fetchMock = require("fetch-mock");
import { AcrolinxEndpoint, IntService } from '../../src/index';
import { DUMMY_ACCESS_TOKEN } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS } from './common';

describe('Integration-service', () => {
  let endpoint: AcrolinxEndpoint;
  let intService: IntService;

  afterEach(() => {
    fetchMock.restore();
  });

  describe('/config', () => {
    const configEndpointMatcher = 'end:/int-service/api/v1/config';

    it('truthy response for correct client signature', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      intService = new IntService(endpoint);
      // Mock the endpoint with expected headers check and updated response property
      fetchMock.mock(configEndpointMatcher, (_url: any, opts: any) => {
        const headers = opts.headers as Record<string, string>; // Asserting headers to be of type Record<string, string>
        if (headers['X-Acrolinx-Client'].includes(DUMMY_ENDPOINT_PROPS.client.signature)) {
          return {
            status: 200,
            body: { activateGetSuggestionReplacement: true }, // Updated property name
          };
        } else {
          return {
            status: 200,
            body: { activateGetSuggestionReplacement: false },
          };
        }
      });

      const response = await intService.getConfig(DUMMY_ACCESS_TOKEN);
      expect(response.activateGetSuggestionReplacement).toBe(true); // Assertion updated to check new property name
    });

    it('Default config response for unavailable client signature', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      intService = new IntService(endpoint);
      // Mock the endpoint with expected headers check and updated response property
      fetchMock.mock(configEndpointMatcher, () => {
        return {
          status: 200,
          body: { activateGetSuggestionReplacement: false },
        };
      });

      const response = await intService.getConfig(DUMMY_ACCESS_TOKEN);
      expect(response.activateGetSuggestionReplacement).toBe(false); // Assertion updated to check new property name
    });
  });
});
