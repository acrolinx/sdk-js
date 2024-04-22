import { io, Socket } from 'socket.io-client';

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
  serverUrl: string;
  batchSize: number;
  dispatchInterval: number;
  maxRetries: number;
  retryDelay: number;
  logLevel: LogEntryType | null;
}

export class LogBuffer {
  private buffer: LogEntry[] = [];
  private socket: Socket;
  private retries = 0;

  constructor(private config: LoggingConfig) {
    this.socket = io(config.serverUrl);
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  public add(logObj: LogEntry) {
    if (this.config.logLevel && this.isLoggable(logObj.type)) {
      this.buffer.push(logObj);
      if (logObj.type === LogEntryType.error) {
        this.flush();
      } else {
        this.scheduleFlush();
      }
    }
  }

  private isLoggable(entryType: LogEntryType): boolean {
    if (this.config.logLevel === null) {
      return false; // Do not log anything if logLevel is null
    }
    return LogEntryType[entryType] <= LogEntryType[this.config.logLevel];
  }

  private flush() {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    this.socket.emit('logs', {
      serviceName: 'sidebar-client-app',
      logs: logsToSend,
    }, (error: Error | null) => {
      if (error) {
        console.error('Failed to send logs to the server');
        this.handleRetry(logsToSend);
      } else {
        console.log('Logs successfully sent to the server');
        this.retries = 0;
      }
    });
  }

  private handleRetry(logsToSend: LogEntry[]) {
    if (this.retries < this.config.maxRetries) {
      this.buffer.unshift(...logsToSend);
      this.retries++;
      const delay = this.getAdaptiveDelay();
      setTimeout(() => {
        this.flush();
      }, delay);
    } else {
      console.error('Max retries reached. Discarding logs.');
      this.retries = 0;
    }
  }

  private scheduleFlush() {
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private getAdaptiveDelay(): number {
    const baseDelay = this.config.dispatchInterval;
    const adaptiveDelay = baseDelay * Math.pow(2, this.retries);
    return Math.min(adaptiveDelay, this.config.maxRetries * this.config.retryDelay);
  }
}