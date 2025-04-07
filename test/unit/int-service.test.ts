import fetchMock from 'fetch-mock';
import { AcrolinxEndpoint, IntService } from '../../src/index';
import { DUMMY_ACCESS_TOKEN } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS } from './common';
import { describe, afterEach, expect, test, beforeEach } from 'vitest';
import { LogBufferEntry, LogEntryType } from '../../src/utils/logging-buffer';

describe('Integration-service', () => {
  let endpoint: AcrolinxEndpoint;
  let intService: IntService;

  afterEach(() => {
    fetchMock.restore();
  });

  describe('/config', () => {
    const configEndpointMatcher = 'end:/int-service/api/v1/config';

    test('truthy response for correct client signature', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      intService = new IntService(endpoint.props);
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

    test('Default config response for unavailable client signature', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      intService = new IntService(endpoint.props);
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

  describe('/logs', () => {
    const logsEndpointMatcher = 'end:/int-service/api/v1/logs';

    beforeEach(() => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      intService = new IntService(endpoint.props);
    });

    test('should send logs successfully', async () => {
      const appName = 'test-app';
      const logs: LogBufferEntry[] = [
        {
          type: LogEntryType.info,
          message: 'Test log message',
          details: [],
        },
      ];

      fetchMock.mock(logsEndpointMatcher, {
        status: 200,
        body: {},
      });

      await intService.sendLogs(appName, logs, DUMMY_ACCESS_TOKEN);

      const lastCall = fetchMock.lastCall(logsEndpointMatcher);

      expect(lastCall).toBeDefined();
      const [url, request] = lastCall!;
      const requestBody = JSON.parse(request?.body as string);

      expect(url).toContain('/int-service/api/v1/logs');
      expect(request?.method).toBe('POST');
      expect(requestBody).toEqual({
        appName,
        logs,
      });
      const headers = request?.headers as Record<string, string>;

      expect(headers).toMatchObject({
        'Content-Type': 'application/json',
        'X-Acrolinx-Client': expect.any(String),
        Authorization: `Bearer ${DUMMY_ACCESS_TOKEN}`,
      });
    });

    test('should handle server errors gracefully', async () => {
      const appName = 'test-app';
      const logs: LogBufferEntry[] = [
        {
          type: LogEntryType.error,
          message: 'Error log message',
          details: [],
        },
      ];

      fetchMock.mock(logsEndpointMatcher, {
        status: 500,
        body: { message: 'Internal Server Error' },
      });

      await expect(intService.sendLogs(appName, logs, DUMMY_ACCESS_TOKEN)).rejects.toThrow('Unknown HTTP Error');

      const lastCall = fetchMock.lastCall(logsEndpointMatcher);

      expect(lastCall).toBeDefined();
      const [url, request] = lastCall!;

      expect(url).toContain('/int-service/api/v1/logs');
      expect(request?.method).toBe('POST');
    });

    test('should throw error on network failure', async () => {
      const appName = 'test-app';
      const logs: LogBufferEntry[] = [
        {
          type: LogEntryType.warning,
          message: 'Warning log message',
          details: [],
        },
      ];

      fetchMock.mock(logsEndpointMatcher, { throws: new TypeError('Network Error') });

      await expect(intService.sendLogs(appName, logs, DUMMY_ACCESS_TOKEN)).rejects.toThrow('Http Connection Problem');

      const lastCall = fetchMock.lastCall(logsEndpointMatcher);

      expect(lastCall).toBeDefined();
      const [url, request] = lastCall!;

      expect(url).toContain('/int-service/api/v1/logs');
      expect(request?.method).toBe('POST');
    });
  });
});
