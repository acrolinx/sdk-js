import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Counter } from '@opentelemetry/api';
import { TelemetryConfig } from '../setup';

export const setupMetrics = (config: TelemetryConfig) => {
  const collectorOptions = {
    url: `${config.acrolinxUrl}/otlp/metrics`,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
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
      [ATTR_SERVICE_NAME]: config.serviceName,
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
