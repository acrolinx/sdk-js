import { setupLogging } from './logs/logs-setup';
import { Counters, createDefaultCounters, setupMetrics } from './metrics/metrics-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Logger } from '@opentelemetry/api-logs';
import { AccessToken } from 'src/common-types';
import { AcrolinxEndpoint } from 'src';

export class AcrolinxInstrumentation {
  private static acrolinxInstrumentation: AcrolinxInstrumentation;
  public instruments: Instruments | undefined = undefined;
  private lastAccessChecked: number = 0;
  private intervalInMs = 60000; // 1 minute = 1 * 60 * 1000
  private isTelemetryAllowed = false;
  private config: TelemetryConfig;

  private constructor(_endpoint: AcrolinxEndpoint, config: TelemetryConfig) {
    this.config = config;
  }

  public static getInstance(endpoint: AcrolinxEndpoint, config: TelemetryConfig): AcrolinxInstrumentation {
    if (!AcrolinxInstrumentation.acrolinxInstrumentation) {
      AcrolinxInstrumentation.acrolinxInstrumentation = new AcrolinxInstrumentation(endpoint, config);
      return AcrolinxInstrumentation.acrolinxInstrumentation;
    }
    return AcrolinxInstrumentation.acrolinxInstrumentation;
  }

  public async getInstruments(): Promise<Instruments | undefined> {
    if (await this.isAllowed(this.config.accessToken)) {
      const meterProvider = setupMetrics(this.config);
      const defaultCounters = createDefaultCounters(meterProvider);
      const logger = setupLogging(this.config);

      return {
        metrics: {
          meterProvider,
          defaultCounters,
        },
        logging: {
          logger,
        },
      };
    }
    return undefined;
  }

  private async isAllowed(_accessToken: AccessToken): Promise<boolean> {
    // TODO: Add launch darkly flag
    if (Date.now() - this.lastAccessChecked <= this.intervalInMs) {
      return this.isTelemetryAllowed;
    }
    return new Promise((resolve) => {

      resolve(true);
    });
    // const config = await this.integrationService.getConfig(accessToken);
    // if (config) {
    //   this.isTelemetryAllowed = true;
    //   return true;
    // }
  }
}

export type TelemetryConfig = {
  acrolinxUrl: string;
  accessToken: AccessToken;
  serviceName: string;
  serviceVersion: string;
};

export type Instruments = {
  metrics: MetricInstrumentation;
  logging: LoggingInstrumentation;
};

export type MetricInstrumentation = {
  meterProvider: MeterProvider;
  defaultCounters: Counters;
};

export type LoggingInstrumentation = {
  logger: Logger;
};

export type TracingInstrumentation = {};
