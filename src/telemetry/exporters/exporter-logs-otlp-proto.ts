import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';

export const initLogExporter = (url: string) => {
  const collectorOptions = {
    url,
    headers: {},
    concurrencyLimit: 1,
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const logExporter = new OTLPLogExporter(collectorOptions);
  const loggerProvider = new LoggerProvider();

  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

  return loggerProvider.getLogger('sdk-js', '9.9.9');
};
