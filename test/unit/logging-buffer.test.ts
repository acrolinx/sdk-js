import { LogBuffer, LogEntry, LogEntryType, LoggingConfig } from '../../src/utils/logging-buffer';

const TEST_LOG_MESSAGE = 'Test log message';
const NETWORK_ERROR_MESSAGE = 'Network error';

describe('LogBuffer', () => {
  let logBuffer: LogBuffer;
  let mockConfig: LoggingConfig;
  const acrolinxUrl = 'http://example.com';

  beforeEach(() => {
    mockConfig = {
      batchSize: 10,
      dispatchInterval: 1000,
      maxRetries: 3,
      retryDelay: 500,
      logLevel: LogEntryType.info,
      enableCloudLogging: true,
    };
    logBuffer = new LogBuffer(acrolinxUrl, mockConfig);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should only add log entry to buffer if enableCloudLogging is true and log level is sufficient', () => {
    const logEntry: LogEntry = {
      type: LogEntryType.info,
      message: TEST_LOG_MESSAGE,
      details: [],
    };
    // Enable cloud logging and set sufficient log level
    mockConfig.enableCloudLogging = true;
    mockConfig.logLevel = LogEntryType.info;
    logBuffer = new LogBuffer(acrolinxUrl, mockConfig);

    logBuffer.log(logEntry);
    expect(logBuffer['buffer']).toContain(logEntry);

    // Disable cloud logging and repeat
    mockConfig.enableCloudLogging = false;
    logBuffer = new LogBuffer(acrolinxUrl, mockConfig);
    logBuffer.log(logEntry);
    expect(logBuffer['buffer']).not.toContain(logEntry);
  });

  test('should not add log entry to buffer if log level is insufficient', () => {
    const logEntry: LogEntry = {
      type: LogEntryType.warning,
      message: TEST_LOG_MESSAGE,
      details: [],
    };
    mockConfig.logLevel = LogEntryType.error;
    logBuffer = new LogBuffer(acrolinxUrl, mockConfig);
    logBuffer.log(logEntry);
    expect(logBuffer['buffer']).not.toContain(logEntry);
  });

  test('should flush logs to server when buffer reaches batch size', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    for (let i = 0; i < mockConfig.batchSize; i++) {
      const logEntry: LogEntry = {
        type: LogEntryType.info,
        message: `${TEST_LOG_MESSAGE} ${i}`,
        details: [],
      };
      logBuffer.log(logEntry);
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should retry sending logs on failure', async () => {
    const mockFetch = jest.fn();
    mockFetch
      .mockRejectedValueOnce(new Error(NETWORK_ERROR_MESSAGE))
      .mockRejectedValueOnce(new Error(NETWORK_ERROR_MESSAGE))
      .mockResolvedValueOnce({ ok: true });
    global.fetch = mockFetch;

    const logEntry: LogEntry = {
      type: LogEntryType.warning,
      message: TEST_LOG_MESSAGE,
      details: [],
    };
    logBuffer.log(logEntry);

    let totalDelay = 0;
    for (let i = 0; i < mockConfig.maxRetries; i++) {
      const delay = mockConfig.dispatchInterval * Math.pow(2, i);
      totalDelay += Math.min(delay, mockConfig.maxRetries * mockConfig.retryDelay);
    }
    totalDelay += 300;
    await new Promise((resolve) => setTimeout(resolve, totalDelay));

    expect(mockFetch).toHaveBeenCalledTimes(mockConfig.maxRetries);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should not add log entry to buffer if logLevel is null', () => {
    const logEntry: LogEntry = {
      type: LogEntryType.info,
      message: TEST_LOG_MESSAGE,
      details: [],
    };
    mockConfig.logLevel = null;
    logBuffer = new LogBuffer(acrolinxUrl, mockConfig);
    logBuffer.log(logEntry);
    expect(logBuffer['buffer']).toHaveLength(0);
  });

  test('should handle failed server response', async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({ ok: false });
    global.fetch = mockFetch;

    const logEntry: LogEntry = {
      type: LogEntryType.error,
      message: TEST_LOG_MESSAGE,
      details: [],
    };
    logBuffer.log(logEntry);

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(logBuffer['retries']).toBe(1);
    expect(logBuffer['buffer']).toContain(logEntry);
  });

  test('should flush logs immediately when log type is error and cloud logging is enabled', async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({ ok: true });
    global.fetch = mockFetch;

    const errorLogEntry: LogEntry = {
      type: LogEntryType.error,
      message: 'Error log message',
      details: [],
    };

    // Ensure cloud logging is enabled
    mockConfig.enableCloudLogging = true;
    logBuffer = new LogBuffer(acrolinxUrl, mockConfig);
    logBuffer.log(errorLogEntry);

    // Wait for a short delay to allow the flush to happen
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(logBuffer['buffer']).toHaveLength(0);
  });
});
