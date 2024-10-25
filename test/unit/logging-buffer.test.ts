import { LogBuffer, LogEntry, LogEntryType, LoggingConfig } from '../../src/utils/logging-buffer';
import * as fetchUtils from '../../src/utils/fetch';

const TEST_LOG_MESSAGE = 'Test log message';
const NETWORK_ERROR_MESSAGE = 'Network error';
import { describe, afterEach, expect, beforeEach, vi, test } from 'vitest';
import { AcrolinxEndpoint, ServiceType } from '../../src';

vi.mock('./utils/fetch', async () => {
  const actual = await vi.importActual<typeof fetchUtils>('./utils/fetch');
  return {
    ...actual,
    post: vi.fn(),
  };
});

describe('LogBuffer', () => {
  let logBuffer: LogBuffer;
  let mockConfig: LoggingConfig;
  let mockEndpoint: AcrolinxEndpoint;
  const mockAccessToken = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();

    mockEndpoint = {
      props: {
        acrolinxUrl: 'http://example.com',
        client: { signature: 'test', version: '1.0.0' },
      },
    } as AcrolinxEndpoint;

    mockConfig = {
      batchSize: 10,
      dispatchInterval: 1000,
      maxRetries: 3,
      retryDelay: 500,
      logLevel: LogEntryType.info,
      enableCloudLogging: true,
    };

    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, mockConfig);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should flush logs to server when buffer reaches batch size', async () => {
    const mockPost = vi.spyOn(fetchUtils, 'post').mockResolvedValue({});

    for (let i = 0; i < mockConfig.batchSize; i++) {
      const logEntry: LogEntry = {
        type: LogEntryType.info,
        message: `${TEST_LOG_MESSAGE} ${i}`,
        details: [],
      };
      logBuffer.log(logEntry);
    }

    // Use a longer timeout to ensure async operations complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockPost).toHaveBeenCalledWith(
      '/int-service/api/v1/logs',
      {
        appName: 'sidebar-client-app',
        logs: expect.any(Array),
      },
      {},
      mockEndpoint.props,
      mockAccessToken,
      ServiceType.ACROLINX_ONE,
    );
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should retry sending logs on failure', async () => {
    const mockPost = vi
      .spyOn(fetchUtils, 'post')
      .mockRejectedValueOnce(new Error(NETWORK_ERROR_MESSAGE))
      .mockRejectedValueOnce(new Error(NETWORK_ERROR_MESSAGE))
      .mockResolvedValueOnce({});

    // Set small values for testing
    mockConfig = {
      ...mockConfig,
      dispatchInterval: 100,
      maxRetries: 3,
      retryDelay: 100,
      batchSize: 1, // Force immediate flush
      enableCloudLogging: true,
      logLevel: LogEntryType.warning,
    };

    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, mockConfig);

    const logEntry: LogEntry = {
      type: LogEntryType.warning,
      message: TEST_LOG_MESSAGE,
      details: [],
    };

    // Log the entry which should trigger immediate flush due to batchSize: 1
    logBuffer.log(logEntry);

    // Wait for initial attempt + all retries
    await new Promise((resolve) => {
      setTimeout(resolve, 1000); // Give enough time for all retries
    });

    console.log('Mock post calls:', mockPost.mock.calls.length);
    console.log('Buffer length:', logBuffer['buffer'].length);
    console.log('Retries count:', logBuffer['retries']);

    expect(mockPost).toHaveBeenCalledTimes(mockConfig.maxRetries);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should not add log entry to buffer if logLevel is null', () => {
    const logEntry: LogEntry = {
      type: LogEntryType.info,
      message: TEST_LOG_MESSAGE,
      details: [],
    };
    mockConfig.logLevel = null;
    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, mockConfig);
    logBuffer.log(logEntry);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should handle failed server response', async () => {
    const mockPost = vi.spyOn(fetchUtils, 'post').mockRejectedValue(new Error('Server Error'));

    const logEntry: LogEntry = {
      type: LogEntryType.error,
      message: TEST_LOG_MESSAGE,
      details: [],
    };
    logBuffer.log(logEntry);

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(logBuffer['retries']).toBe(1);
    expect(logBuffer['buffer']).toContain(logEntry);
  });

  test('should flush logs immediately when log type is error and cloud logging is enabled', async () => {
    const mockPost = vi.spyOn(fetchUtils, 'post').mockResolvedValue({});

    const errorLogEntry: LogEntry = {
      type: LogEntryType.error,
      message: 'Error log message',
      details: [],
    };

    mockConfig.enableCloudLogging = true;
    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, mockConfig);
    logBuffer.log(errorLogEntry);

    // Increase timeout to ensure async operations complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(logBuffer['buffer']).toHaveLength(0);
  });
});
