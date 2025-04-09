import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { Counter } from '@opentelemetry/api';
import { TelemetryConfig } from '../acrolinxInstrumentation';

export const setupMetrics = (config: TelemetryConfig) => {
  const collectorOptions = {
    url: `${config.endpointProps.acrolinxUrl}/otlp/metrics`,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  };
  const metricExporter = new OTLPMetricExporter(collectorOptions);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.endpointProps.client.integrationDetails.name,
    [ATTR_SERVICE_VERSION]: config.endpointProps.client.integrationDetails.version,
  });

  const meterProvider = new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 60000, // Every 60 seconds
      }),
    ],
    resource,
  });

  return meterProvider;
};

export const createDefaultCounters = (meterProvider: MeterProvider): Counters => {
  const defaultMeter = meterProvider.getMeter('integrations');

  return {
    check: defaultMeter.createCounter('check-requested'),
  };
};

export type Counters = {
  check: Counter;
};
