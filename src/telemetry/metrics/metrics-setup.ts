import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { Counter, Histogram } from '@opentelemetry/api';
import { TelemetryConfig } from '../acrolinxInstrumentation';
import { IntegrationDetails } from '../interfaces/integration';
import { checkRequestMetric, metricPrefix, suggestionMetric } from './metric-constants';

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

export const createDefaultMeters = (integrationDetails: IntegrationDetails, meterProvider: MeterProvider): Meters => {
  const defaultMeter = meterProvider.getMeter(metricPrefix);
  const integrationType = integrationDetails.type;
  const integrationName = integrationDetails.name;

  return {
    checkRequestCounter: defaultMeter.createCounter(
      `${metricPrefix}.${integrationType}.${integrationName}.${checkRequestMetric}.counter`,
    ),
    checkRequestPollingTime: defaultMeter.createHistogram(
      `${metricPrefix}.${integrationType}.${integrationName}.${checkRequestMetric}.polling-time`,
    ),
    checkRequestSubmitTime: defaultMeter.createHistogram(
      `${metricPrefix}.${integrationType}.${integrationName}.${checkRequestMetric}.submit-time`,
    ),
    suggestionCounter: defaultMeter.createCounter(
      `${metricPrefix}.${integrationType}.${integrationName}.${suggestionMetric}.counter`,
    ),
    suggestionResponseTime: defaultMeter.createHistogram(
      `${metricPrefix}.${integrationType}.${integrationName}.${suggestionMetric}.response-time`,
    ),
  };
};

export type Meters = {
  checkRequestCounter: Counter;
  suggestionCounter: Counter;
  checkRequestSubmitTime: Histogram;
  checkRequestPollingTime: Histogram;
  suggestionResponseTime: Histogram;
};
