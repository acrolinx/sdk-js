import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OPENTELEMETRY_METRICS_ENDPOINT, SERVICE_NAME } from '../config';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Counter } from '@opentelemetry/api';

export const setupMetrics = () => {
  const collectorOptions = {
    url: OPENTELEMETRY_METRICS_ENDPOINT,
  };
  const metricExporter = new OTLPMetricExporter(collectorOptions);

  const meterProvider = new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 5000,
      }),
    ],
    resource: new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
    }),
  });

  return meterProvider;
};

export const createDefaultCounters = (meterProvider: MeterProvider): Counters => {
  const defaultMeter = meterProvider.getMeter('default');

  return {
    check: defaultMeter.createCounter('check'),
    getSuggestion: defaultMeter.createCounter('get-suggestion'),
  };
};

export type Counters = {
  check: Counter;
  getSuggestion: Counter;
};
