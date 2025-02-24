import { Counter, Meter } from '@opentelemetry/api';
import { initMetrics } from './exporters/exporter-metrics-otlp-proto';

export const initializeTelemetry = (): Instruments => {
  // FIXME: Actual initialization
  const collectorApiMetrics = 'http://localhost:4318/v1/metrics';
  const appName = 'fav-integration';

  const meter = initMetrics(collectorApiMetrics, appName);
  return {
    meter,
  };
};

export type Instruments = {
  // TODO: More types to be added
  meter: Meter;
};

export type Counters = {
  checkCounter: Counter;
  getSuggestionCounter: Counter;
};

export const createCounters = (meter: Meter): Counters => {
  return {
    checkCounter: meter.createCounter('check'),
    getSuggestionCounter: meter.createCounter('get-suggestion'),
  };
};
