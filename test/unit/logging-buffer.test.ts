import { waitMs } from '../../src/utils/mixed-utils';
import { LogBuffer, LogBufferEntry, LogEntryType, LoggingConfig } from '../../src/utils/logging-buffer';

const TEST_LOG_MESSAGE = 'Test log message';
import { describe, afterEach, expect, vi, test } from 'vitest';

describe('LogBuffer', () => {
  let mockConfig: LoggingConfig = {
    batchSize: 10,
    dispatchInterval: 1000,
    maxRetries: 3,
    retryDelay: 500,
    logLevel: LogEntryType.info,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should flush logs when buffer reaches batch size', async () => {
    const entryList = [];
    const logBuffer = new LogBuffer(mockConfig);
    const mockFunction = vi.fn();
    logBuffer.setCallback(mockFunction);

    for (let i = 0; i < mockConfig.batchSize; i++) {
      const logEntry: LogBufferEntry = {
        type: LogEntryType.info,
        message: `${TEST_LOG_MESSAGE} ${i}`,
        details: [],
      };
      logBuffer.log(logEntry);
      entryList.push(logEntry);
    }
    expect(mockFunction).toHaveBeenCalled();
    expect(mockFunction).toHaveBeenCalledWith(entryList);
  });

  test('should use default config when none is provided', () => {
    const defaultLogBuffer = new LogBuffer();

    expect(defaultLogBuffer['config']).toEqual({
      batchSize: 50,
      dispatchInterval: 10000,
      maxRetries: 3,
      retryDelay: 2000,
      logLevel: LogEntryType.info,
    });
  });

  test('should increase delay exponentially with retries', () => {
    mockConfig = {
      ...mockConfig,
      dispatchInterval: 100,
      retryDelay: 800,
      maxRetries: 3,
    };

    const logBuffer = new LogBuffer(mockConfig);
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
    mockConfig = {
      ...mockConfig,
      dispatchInterval: 100,
      maxRetries: 2, // Set maxRetries to a small number for testing
      retryDelay: 100,
      batchSize: 1,
      logLevel: LogEntryType.warning,
    };

    const logBuffer = new LogBuffer(mockConfig);
    const mockSendLogs = vi.fn().mockRejectedValue({ message: 'error' });
    logBuffer.setCallback(mockSendLogs);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const logEntry: LogBufferEntry = {
      type: LogEntryType.warning,
      message: TEST_LOG_MESSAGE,
      details: [],
    };

    logBuffer.log(logEntry);

    // Wait enough time for all retries to occur
    await waitMs(1000);

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
      .fn()
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

    const logBuffer = new LogBuffer(mockConfig);
    logBuffer.setCallback(mockSendLogs);

    const logEntry: LogBufferEntry = {
      type: LogEntryType.warning,
      message: TEST_LOG_MESSAGE,
      details: [],
    };

    logBuffer.log(logEntry);

    await waitMs(1000);

    expect(mockSendLogs).toHaveBeenCalledTimes(3);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should flush logs immediately when log type is error', async () => {
    const logToconsole = vi.fn();
    const logBuffer = new LogBuffer(mockConfig);

    const errorLogEntry: LogBufferEntry = {
      type: LogEntryType.error,
      message: 'test sdk-js log message',
      details: [],
    };
    logBuffer.setCallback(logToconsole);
    logBuffer.log(errorLogEntry);

    await waitMs(200);

    expect(logToconsole).toHaveBeenCalledTimes(1);
    expect(logBuffer['buffer']).toHaveLength(0);
  });
});
