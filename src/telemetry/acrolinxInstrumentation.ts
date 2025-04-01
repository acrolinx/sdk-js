import { setupLogging } from './logs/logs-setup';
import { Counters, createDefaultCounters, setupMetrics } from './metrics/metrics-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Logger } from '@opentelemetry/api-logs';
import { AccessToken } from 'src/common-types';

export class AcrolinxInstrumentation {
  private static acrolinxInstrumentation: AcrolinxInstrumentation;
  public instruments: Instruments;

  private constructor(config: TelemetryConfig) {
    const meterProvider = setupMetrics(config);
    const defaultCounters = createDefaultCounters(meterProvider);
    const logger = setupLogging(config);

    this.instruments = {
      metrics: {
        meterProvider,
        defaultCounters,
      },
      traces: {},
      logging: {
        logger,
      },
    };
  }

  public static getInstance(config: TelemetryConfig): AcrolinxInstrumentation {
    if (!AcrolinxInstrumentation.acrolinxInstrumentation) {
      AcrolinxInstrumentation.acrolinxInstrumentation = new AcrolinxInstrumentation(config);
    }
    return AcrolinxInstrumentation.acrolinxInstrumentation;
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
  traces: TracingInstrumentation;
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
