import { AcrolinxEndpoint, IntService } from '..';

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
  enableCloudLogging: boolean;
}

export class LogBuffer {
  private buffer: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private retries = 0;
  private config: LoggingConfig;
  private readonly intService: IntService;

  constructor(
    private readonly endpoint: AcrolinxEndpoint,
    private readonly accessToken: string,
    private readonly appName: string,
    config?: Partial<LoggingConfig>,
  ) {
    this.config = this.createLoggingConfig(config);
    this.intService = new IntService(endpoint);
  }

  public log(logObj: LogEntry) {
    this.consoleLog(logObj);
    if (this.config.logLevel && this.isLoggable(logObj.type)) {
      this.buffer.push(logObj);
      this.manageBuffer(logObj);
    }
  }
  private consoleLog(logObj: LogEntry): void {
    switch (logObj.type) {
      case LogEntryType.info:
        console.log(logObj.message, ...logObj.details);
        break;
      case LogEntryType.warning:
        console.warn(logObj.message, ...logObj.details);
        break;
      case LogEntryType.error:
        console.error(logObj.message, ...logObj.details);
        break;
    }
  }
  private createLoggingConfig(config: Partial<LoggingConfig> = {}): LoggingConfig {
    const defaultConfig: LoggingConfig = {
      batchSize: 50,
      dispatchInterval: 10000,
      maxRetries: 3,
      retryDelay: 2000,
      logLevel: LogEntryType.info,
      enableCloudLogging: false,
    };
    return { ...defaultConfig, ...config };
  }

  private isLoggable(entryType: LogEntryType): boolean {
    if (this.config.logLevel === null) {
      return false; // Do not log anything if logLevel is null
    }
    return this.config.enableCloudLogging && LogEntryType[entryType] <= LogEntryType[this.config.logLevel];
  }

  private manageBuffer(logObj: LogEntry): void {
    if (logObj.type === LogEntryType.error || this.buffer.length >= this.config.batchSize) {
      void this.flush();
    } else if (!this.timer) {
      this.scheduleFlush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      await this.intService.sendLogs(this.appName, logsToSend, this.accessToken);
      console.log('Logs successfully sent to the server');
      this.retries = 0;
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
