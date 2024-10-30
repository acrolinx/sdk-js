import { LogBuffer, LogEntry, LogEntryType, LoggingConfig, LogTarget } from '../../src/utils/logging-buffer';
import * as fetchUtils from '../../src/utils/fetch';

const TEST_LOG_MESSAGE = 'Test log message';
import { describe, afterEach, expect, beforeEach, vi, test } from 'vitest';
import { AcrolinxEndpoint } from '../../src';
import { IntService } from '../../src/services/int-service/int-service';

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
    };

    const appName = 'test-app';

    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, appName, mockConfig);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should flush logs to server when buffer reaches batch size', async () => {
    const mockSendLogs = vi.spyOn(IntService.prototype, 'sendLogs').mockResolvedValue({ message: 'Test log success' });

    for (let i = 0; i < mockConfig.batchSize; i++) {
      const logEntry: LogEntry = {
        type: LogEntryType.info,
        message: `${TEST_LOG_MESSAGE} ${i}`,
        details: [],
        target: LogTarget.Cloud,
      };
      logBuffer.log(logEntry);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSendLogs).toHaveBeenCalledWith('test-app', expect.any(Array), mockAccessToken);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should not retry on non-retryable error', async () => {
    const nonRetryableError = {
      response: { status: 400 }, // 4XX errors are non-retryable
    };

    const mockSendLogs = vi.spyOn(IntService.prototype, 'sendLogs').mockRejectedValue(nonRetryableError);

    const logEntry: LogEntry = {
      type: LogEntryType.error,
      message: TEST_LOG_MESSAGE,
      details: [],
      target: LogTarget.Cloud,
    };

    logBuffer.log(logEntry);

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockSendLogs).toHaveBeenCalledTimes(1);
    expect(logBuffer['retries']).toBe(0);
    expect(logBuffer['buffer']).toHaveLength(0); // Logs should be discarded
  });

  test('should use default config when none is provided', () => {
    const defaultLogBuffer = new LogBuffer(mockEndpoint, mockAccessToken, 'test-app');

    expect(defaultLogBuffer['config']).toEqual({
      batchSize: 50,
      dispatchInterval: 10000,
      maxRetries: 3,
      retryDelay: 2000,
      logLevel: LogEntryType.info,
    });
  });

  test('should use console.error for error logs', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const logEntry: LogEntry = {
      type: LogEntryType.error,
      message: TEST_LOG_MESSAGE,
      details: [],
      target: LogTarget.Console,
    };

    logBuffer.log(logEntry);

    expect(consoleErrorSpy).toHaveBeenCalledWith(TEST_LOG_MESSAGE);
  });

  test('should increase delay exponentially with retries', () => {
    mockConfig = {
      ...mockConfig,
      dispatchInterval: 100,
      retryDelay: 800,
      maxRetries: 3,
    };

    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, 'test-app', mockConfig);

    const getAdaptiveDelaySpy = vi.spyOn(logBuffer as any, 'getAdaptiveDelay');

    // Simulate retries
    (logBuffer as any).retries = 1;
    (logBuffer as any).getAdaptiveDelay();

    expect(getAdaptiveDelaySpy).toReturnWith(200); // 100 * 2^1

    (logBuffer as any).retries = 2;
    (logBuffer as any).getAdaptiveDelay();

    expect(getAdaptiveDelaySpy).toReturnWith(400); // 100 * 2^2
  });

  test('should discard logs after max retries are reached', async () => {
    const serverError = {
      response: { status: 500 },
    };

    const mockSendLogs = vi.spyOn(IntService.prototype, 'sendLogs').mockRejectedValue(serverError);

    mockConfig = {
      ...mockConfig,
      dispatchInterval: 100,
      maxRetries: 2, // Set maxRetries to a small number for testing
      retryDelay: 100,
      batchSize: 1,
      logLevel: LogEntryType.warning,
    };

    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, 'test-app', mockConfig);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const logEntry: LogEntry = {
      type: LogEntryType.warning,
      message: TEST_LOG_MESSAGE,
      details: [],
      target: LogTarget.Cloud,
    };

    logBuffer.log(logEntry);

    // Wait enough time for all retries to occur
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(mockSendLogs).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
    expect(logBuffer['retries']).toBe(0);
    expect(logBuffer['buffer']).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Max retries reached. Discarding logs.');
  });

  test('should retry sending logs on failure', async () => {
    const serverError = {
      response: { status: 500 },
    };

    const mockSendLogs = vi
      .spyOn(IntService.prototype, 'sendLogs')
      .mockRejectedValueOnce(serverError)
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce({ message: 'Test log success' });

    mockConfig = {
      ...mockConfig,
      dispatchInterval: 100,
      maxRetries: 3,
      retryDelay: 100,
      batchSize: 1,
      logLevel: LogEntryType.warning,
    };

    logBuffer = new LogBuffer(mockEndpoint, mockAccessToken, 'test-app', mockConfig);

    const logEntry: LogEntry = {
      type: LogEntryType.warning,
      message: TEST_LOG_MESSAGE,
      details: [],
      target: LogTarget.Cloud,
    };

    logBuffer.log(logEntry);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(mockSendLogs).toHaveBeenCalledTimes(3);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should handle failed server response', async () => {
    const serverError = {
      response: { status: 500 },
    };

    const mockSendLogs = vi.spyOn(IntService.prototype, 'sendLogs').mockRejectedValue(serverError);

    const logEntry: LogEntry = {
      type: LogEntryType.error,
      message: TEST_LOG_MESSAGE,
      details: [],
      target: LogTarget.Cloud,
    };
    logBuffer.log(logEntry);

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockSendLogs).toHaveBeenCalledTimes(1);
    expect(logBuffer['retries']).toBe(1);
    expect(logBuffer['buffer']).toContain(logEntry);
  });

  test('should flush logs immediately when log type is error', async () => {
    const mockSendLogs = vi.spyOn(IntService.prototype, 'sendLogs').mockResolvedValue({ message: 'Test log success' });

    const errorLogEntry: LogEntry = {
      type: LogEntryType.info,
      message: 'test sdk-js log message',
      details: [],
      target: LogTarget.Cloud,
    };

    logBuffer.log(errorLogEntry);

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(mockSendLogs).toHaveBeenCalledTimes(1);
    expect(logBuffer['buffer']).toHaveLength(0);
  });
});
