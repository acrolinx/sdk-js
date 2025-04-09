import { SeverityNumber } from '@opentelemetry/api-logs';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { TelemetryConfig } from '../acrolinxInstrumentation';

export const setupLogging = (config: TelemetryConfig) => {
  const collectorOptions = {
    url: `${config.endpointProps.acrolinxUrl}/otlp/logs`,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
    concurrencyLimit: 1,
  };
  const logExporter = new OTLPLogExporter(collectorOptions);
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.endpointProps.client.integrationDetails.name,
    [ATTR_SERVICE_VERSION]: config.endpointProps.client.integrationDetails.version,
  });
  const loggerProvider = new LoggerProvider({
    resource,
  });

  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

  const logger = loggerProvider.getLogger(config.endpointProps.client.integrationDetails.name, '1.0.0');
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'info',
    body: 'Logger initialized',
  });

  return logger;
};
