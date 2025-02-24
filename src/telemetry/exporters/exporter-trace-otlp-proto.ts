import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

export const initTraceExporter = (url: string): OTLPTraceExporter => {
  const collectorOptions = {
    url,
    headers: {},
    concurrencyLimit: 10,
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return new OTLPTraceExporter(collectorOptions);
};
