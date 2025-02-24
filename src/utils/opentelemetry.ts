import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const collectorOptions = {
  url: 'http://localhost:4318/v1/traces',
  headers: {},
  concurrencyLimit: 10,
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const exporter = new OTLPTraceExporter(collectorOptions);
const provider = new WebTracerProvider({
  spanProcessors: [
    new BatchSpanProcessor(exporter, {
      maxQueueSize: 100,
      maxExportBatchSize: 10,
      scheduledDelayMillis: 500,
      exportTimeoutMillis: 30000,
    }),
  ],
});

provider.register();
