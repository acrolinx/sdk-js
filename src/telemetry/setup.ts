import { Counters, createDefaultCounters, setupMetrics } from './metrics/metrics-setup';
import { setupTraces } from './traces/traces-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';

export const setupTelemetry = (): AcrolinxInstrumentaion => {
  setupTraces();
  const meterProvider = setupMetrics();
  const defaultCounters = createDefaultCounters(meterProvider);

  return {
    metrics: {
      meterProvider,
      defaultCounters,
    },
    traces: {},
  };
};

export type AcrolinxInstrumentaion = {
  metrics: MetricInstrumentaion;
  traces: TracingInstrumentaion;
};

export type MetricInstrumentaion = {
  meterProvider: MeterProvider;
  defaultCounters: Counters;
};

export type TracingInstrumentaion = {};
