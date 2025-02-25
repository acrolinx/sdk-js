import { SeverityNumber } from '@opentelemetry/api-logs';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OPENTELEMETRY_LOGS_ENDPOINT, SERVICE_NAME } from '../config';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export const setupLogging = () => {
  const collectorOptions = {
    url: OPENTELEMETRY_LOGS_ENDPOINT,
    headers: {},
    concurrencyLimit: 1,
  };
  const logExporter = new OTLPLogExporter(collectorOptions);
  const loggerProvider = new LoggerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
    }),
  });

  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

  const logger = loggerProvider.getLogger(SERVICE_NAME, '1.0.0');
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'info',
    body: 'Logger initialized',
    attributes: { 'log.type': 'custom' },
  });

  return logger;
};
