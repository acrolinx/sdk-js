import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { Meter } from '@opentelemetry/api';

export const initMetrics = (url: string, applicationName: string): Meter => {
  const collectorOptions = {
    url,
    headers: {},
    concurrencyLimit: 1,
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const metricExporter = new OTLPMetricExporter(collectorOptions);
  const meterProvider = new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 1000,
      }),
    ],
  });
  return meterProvider.getMeter(applicationName);
};
