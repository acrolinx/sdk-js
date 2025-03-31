import { setupLogging } from './logs/logs-setup';
import { Counters, createDefaultCounters, setupMetrics } from './metrics/metrics-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Logger } from '@opentelemetry/api-logs';
import { AccessToken } from 'src/common-types';

export type TelemetryConfig = {
  acrolinxUrl: string;
  accessToken: AccessToken;
  serviceName: string;
  serviceVersion: string;
}

export const setupTelemetry = (config: TelemetryConfig): AcrolinxInstrumentation => {
  const meterProvider = setupMetrics(config);
  const defaultCounters = createDefaultCounters(meterProvider);
  const logger = setupLogging(config);

  return {
    metrics: {
      meterProvider,
      defaultCounters,
    },
    traces: {},
    logging: {
      logger,
    },
  };
};

export type AcrolinxInstrumentation = {
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
