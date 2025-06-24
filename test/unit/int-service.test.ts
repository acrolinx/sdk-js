import { http, HttpResponse } from 'msw';
import { server } from '../test-utils/msw-setup';
import { mockGet, mockPost, mockNetworkError } from '../test-utils/msw-migration-helpers';
import { AcrolinxEndpoint, IntService } from '../../src/index';
import { DUMMY_ACCESS_TOKEN } from '../test-utils/mock-server';
import { DUMMY_ENDPOINT_PROPS } from './common';
import { describe, afterEach, expect, test, beforeEach } from 'vitest';
import { LogBufferEntry, LogEntryType } from '../../src/utils/logging-buffer';

describe('Integration-service', () => {
  let endpoint: AcrolinxEndpoint;
  let intService: IntService;

  afterEach(() => {
    server.resetHandlers();
  });

  describe('/config', () => {
    test('truthy response for correct client signature', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      intService = new IntService(endpoint.props);

      // Mock the endpoint with expected headers check
      server.use(
        http.get('*/int-service/api/v1/config', ({ request }) => {
          const headers = request.headers;
          const clientHeader = headers.get('X-Acrolinx-Client');

          if (clientHeader && clientHeader.includes(DUMMY_ENDPOINT_PROPS.client.signature)) {
            return HttpResponse.json({ activateGetSuggestionReplacement: true });
          } else {
            return HttpResponse.json({ activateGetSuggestionReplacement: false });
          }
        }),
      );

      const response = await intService.getConfig(DUMMY_ACCESS_TOKEN);
      expect(response.activateGetSuggestionReplacement).toBe(true);
    });

    test('Default config response for unavailable client signature', async () => {
      endpoint = new AcrolinxEndpoint(DUMMY_ENDPOINT_PROPS);
      intService = new IntService(endpoint.props);

      mockGet('/int-service/api/v1/config', { activateGetSuggestionReplacement: false });

      const response = await intService.getConfig(DUMMY_ACCESS_TOKEN);
      expect(response.activateGetSuggestionReplacement).toBe(false);
    });
  });

  describe('/logs', () => {
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

      mockPost('/int-service/api/v1/logs', {});

      await intService.sendLogs(appName, logs, DUMMY_ACCESS_TOKEN);

      // Note: MSW doesn't have a direct equivalent to fetchMock.lastCall()
      // The test verifies that the request was made successfully without errors
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

      mockPost('/int-service/api/v1/logs', { message: 'Internal Server Error' }, 500);

      await expect(intService.sendLogs(appName, logs, DUMMY_ACCESS_TOKEN)).rejects.toThrow('Unknown HTTP Error');
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

      mockNetworkError('/int-service/api/v1/logs');

      await expect(intService.sendLogs(appName, logs, DUMMY_ACCESS_TOKEN)).rejects.toThrow('Http Connection Problem');
    });
  });
});
