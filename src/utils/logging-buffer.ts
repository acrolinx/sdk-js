export interface LogEntry {
  type: LogEntryType;
  message: string;
  details: unknown[];
}

export enum LogEntryType {
  info = 'info',
  warning = 'warning',
  error = 'error',
}

export interface LoggingConfig {
  batchSize: number;
  dispatchInterval: number;
  maxRetries: number;
  retryDelay: number;
  logLevel: LogEntryType | null;
}

export class LogBuffer {
  private buffer: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private retries = 0;
  private config: LoggingConfig;

  constructor(
    private readonly acrolinxUrl: string,
    config?: LoggingConfig,
  ) {
    this.config = this.createLoggingConfig(config);
  }

  public add(logObj: LogEntry) {
    if (this.config.logLevel && this.isLoggable(logObj.type)) {
      this.buffer.push(logObj);
      if (logObj.type === LogEntryType.error) {
        void this.flush();
      } else {
        this.scheduleFlush();
      }
    }
  }

  private createLoggingConfig(config: Partial<LoggingConfig> = {}): LoggingConfig {
    const defaultConfig: LoggingConfig = {
      batchSize: 50,
      dispatchInterval: 10000,
      maxRetries: 3,
      retryDelay: 2000,
      logLevel: LogEntryType.info,
    };
    return { ...defaultConfig, ...config };
  }

  private isLoggable(entryType: LogEntryType): boolean {
    if (this.config.logLevel === null) {
      return false; // Do not log anything if logLevel is null
    }
    return LogEntryType[entryType] <= LogEntryType[this.config.logLevel];
  }

  private async flush() {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch(`${this.acrolinxUrl}/int-service/api/v1/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: 'sidebar-client-app',
          logs: logsToSend,
        }),
      });

      if (response.ok) {
        console.log('Logs successfully sent to the server');
        this.retries = 0;
      } else {
        console.error('Failed to send logs to the server');
        this.handleRetry(logsToSend);
      }
    } catch (error) {
      console.error('Error sending logs to the server:', error);
      this.handleRetry(logsToSend);
    }
  }

  private handleRetry(logsToSend: LogEntry[]) {
    if (this.retries < this.config.maxRetries) {
      this.buffer.unshift(...logsToSend);
      this.retries++;
      const delay = this.getAdaptiveDelay();
      setTimeout(() => {
        void this.flush();
      }, delay);
    } else {
      console.error('Max retries reached. Discarding logs.');
      this.retries = 0;
    }
  }

  private scheduleFlush() {
    if (this.buffer.length >= this.config.batchSize) {
      void this.flush();
    } else if (!this.timer) {
      const delay = this.getAdaptiveDelay();
      this.timer = setTimeout(() => {
        void this.flush();
        this.timer = null;
      }, delay);
    }
  }

  private getAdaptiveDelay(): number {
    const baseDelay = this.config.dispatchInterval;
    const adaptiveDelay = baseDelay * Math.pow(2, this.retries);
    return Math.min(adaptiveDelay, this.config.maxRetries * this.config.retryDelay);
  }
}
