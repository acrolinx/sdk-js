import { ZoneContextManager } from '@opentelemetry/context-zone';
import { BatchSpanProcessor, SpanExporter, WebTracerProvider } from '@opentelemetry/sdk-trace-web';

export const createWebTraceProvider = (exporter: SpanExporter): WebTracerProvider => {
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

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  return provider;
};
