/*
 * Copyright 2024-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export interface LogBufferEntry {
  type: LogEntryType;
  message: string;
  details: unknown[];
}

export enum LogEntryType {
  info = 'info',
  warning = 'warning',
  error = 'error',
  debug = 'debug',
}

export interface LoggingConfig {
  batchSize: number;
  dispatchInterval: number;
  maxRetries: number;
  retryDelay: number;
  logLevel: LogEntryType | null;
}

export type LogCallBack = (logsToSend: LogBufferEntry[]) => Promise<void>;

export class LogBuffer {
  private buffer: LogBufferEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private retries = 0;
  private config: LoggingConfig;
  private logCallBack?: LogCallBack;

  constructor(config?: Partial<LoggingConfig>) {
    this.config = this.createLoggingConfig(config);
  }

  public setCallback(callback: LogCallBack) {
    this.logCallBack = callback;
  }

  public log(logObj: LogBufferEntry) {
    this.buffer.push(logObj);
    this.manageBuffer(logObj);
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

  private manageBuffer(logObj: LogBufferEntry): void {
    if (logObj.type === LogEntryType.error || this.buffer.length >= this.config.batchSize) {
      void this.flush();
    } else if (!this.timer) {
      this.scheduleFlush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0 || !this.logCallBack) {
      return;
    }
    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      await this.logCallBack(logsToSend);
      this.retries = 0;
    } catch {
      this.handleRetry(logsToSend);
    }
  }

  private handleRetry(logsToSend: LogBufferEntry[]) {
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
      if (this.timer) {
        clearTimeout(this.timer);
      }
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
