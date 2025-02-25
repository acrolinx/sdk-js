import { setupLogging } from './logs/logs-setup';
import { Counters, createDefaultCounters, setupMetrics } from './metrics/metrics-setup';
import { setupTraces } from './traces/traces-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Logger } from '@opentelemetry/api-logs';

export const setupTelemetry = (): AcrolinxInstrumentaion => {
  setupTraces();
  const meterProvider = setupMetrics();
  const defaultCounters = createDefaultCounters(meterProvider);
  const logger = setupLogging();

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

export type AcrolinxInstrumentaion = {
  metrics: MetricInstrumentaion;
  traces: TracingInstrumentaion;
  logging: LoggingInstrumenation;
};

export type MetricInstrumentaion = {
  meterProvider: MeterProvider;
  defaultCounters: Counters;
};

export type LoggingInstrumenation = {
  logger: Logger;
};

export type TracingInstrumentaion = {};
