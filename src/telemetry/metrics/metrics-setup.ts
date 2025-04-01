import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { Counter } from '@opentelemetry/api';
import { TelemetryConfig } from '../acrolinxInstrumentation';

export const setupMetrics = (config: TelemetryConfig) => {
  const collectorOptions = {
    url: `${config.acrolinxUrl}/otlp/metrics`,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  };
  const metricExporter = new OTLPMetricExporter(collectorOptions);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion,
  });

  const meterProvider = new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 5000,
      }),
    ],
    resource,
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
