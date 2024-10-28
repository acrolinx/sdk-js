import { LogBuffer, LogEntry, LogEntryType, LoggingConfig, LogTarget } from '../../src/utils/logging-buffer';
import * as fetchUtils from '../../src/utils/fetch';

const TEST_LOG_MESSAGE = 'Test log message';
import { describe, afterEach, expect, beforeEach, vi, test } from 'vitest';
import { AcrolinxEndpoint, IntService } from '../../src';

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
    const mockSendLogs = vi.spyOn(IntService.prototype, 'sendLogs').mockResolvedValue(undefined);

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

  test('should retry sending logs on failure', async () => {
    const serverError = {
      response: { status: 500 },
    };

    const mockSendLogs = vi
      .spyOn(IntService.prototype, 'sendLogs')
      .mockRejectedValueOnce(serverError)
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce(undefined);

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
    const mockSendLogs = vi.spyOn(IntService.prototype, 'sendLogs').mockResolvedValue(undefined);

    const errorLogEntry: LogEntry = {
      type: LogEntryType.error,
      message: 'Error log message',
      details: [],
      target: LogTarget.Cloud,
    };

    logBuffer.log(errorLogEntry);

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(mockSendLogs).toHaveBeenCalledTimes(1);
    expect(logBuffer['buffer']).toHaveLength(0);
  });
});
