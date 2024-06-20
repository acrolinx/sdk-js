# LogBuffer

The `LogBuffer` class is a generic logging mechanism that provides buffering and sending of log entries to a specified server. It is designed to be used in JavaScript/TypeScript applications, such as the Acrolinx Sidebar, to efficiently manage and send logs to a remote server.

## Features

- Buffers log entries of different types (info, warning, error) until a certain threshold is reached or a specific condition is met.
- Sends buffered logs to a specified server endpoint using a POST request.
- Configurable batch size, dispatch interval, retry mechanism, and log levels.
- Adaptive retry delay for failed log sending attempts.
- Local console logging for debugging and monitoring purposes.

## Installation

To use the `LogBuffer` class in your project, you need to install the `@acrolinx/sdk-js` package:

```bash
npm install @acrolinx/sdk-js
```

### Configuration

The `LogBuffer` class accepts an optional configuration object with the following properties:

| Property           | Type                  | Default            | Description                                                                                      |
|--------------------|-----------------------|--------------------|--------------------------------------------------------------------------------------------------|
| `batchSize`        | number                | 50                 | The maximum number of log entries to buffer before sending them to the server.                   |
| `dispatchInterval` | number                | 10000              | The interval (in milliseconds) at which the buffer should be flushed and logs sent to the server.|
| `maxRetries`       | number                | 3                  | The maximum number of retries to attempt when sending logs to the server fails.                  |
| `retryDelay`       | number                | 2000               | The base delay (in milliseconds) between retries when sending logs fails.                        |
| `logLevel`         | LogEntryType or null  | LogEntryType.info  | The minimum log level to buffer and send to the server. Logs with a lower level will be ignored.  |
| `enableCloudLogging` | boolean             | false              | Flag to enable or disable sending logs to the Acrolinx server.                                   |

### Log Entry Types

The LogBuffer class supports the following log entry types:

- `LogEntryType.info`: Informational log entries.
- `LogEntryType.warning`: Warning log entries.
- `LogEntryType.error`: Error log entries.

### Buffering and Sending Logs

The `LogBuffer` class buffers the log entries until one of the following conditions is met:
- The number of buffered log entries reaches the configured `batchSize`.
- An `error` log entry is added to the buffer.
- The configured `dispatchInterval` has elapsed.

When any of these conditions is met, the LogBuffer will flush the buffer and send the logs to the Acrolinx server.


### Retry Mechanism

If sending logs to the server fails, the LogBuffer class will retry the operation up to the configured maxRetries. The retry delay is adaptive and increases exponentially with each retry attempt, up to a maximum of maxRetries * retryDelay.

If the maximum number of retries is reached and the logs still cannot be sent, the logs are discarded, and an error message is logged to the console.

### Local Console Logging

In addition to sending logs to the server, the LogBuffer class also logs the messages to the local console based on their log level:

- info logs are logged using `console.log`.
- warning logs are logged using `console.warn`.
- error logs are logged using `console.error`.

This allows for local debugging and monitoring of the logged messages.

### Example

Here's an example of how to use the LogBuffer class in an application:

```typescript
import { LogBuffer, LogEntryType } from '@acrolinx/sdk-js';

const logBuffer = new LogBuffer('https://example.com/api/logs', {
  batchSize: 20,
  dispatchInterval: 150000, // 2.5 min
  maxRetries: 3,
  retryDelay: 50000,
  logLevel: LogEntryType.error,
  enableCloudLogging: false,
});

// Log an informational message
logBuffer.log({
  type: LogEntryType.info,
  message: 'Application started',
  details: [],
});

// Log an error message
logBuffer.log({
  type: LogEntryType.error,
  message: 'Database connection failed',
  details: [{ error: 'Connection timed out' }],
});
```