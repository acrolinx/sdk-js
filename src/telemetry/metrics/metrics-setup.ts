import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { Counter, Histogram, ValueType } from '@opentelemetry/api';
import { TelemetryConfig } from '../acrolinxInstrumentation';
import { IntegrationDetails } from '../interfaces/integration';
import {
  checkRequestMetric,
  counterUnit,
  durationUnit,
  EXPORT_INTERVAL_MS,
  meterName,
  meterVersion,
  metricPrefix,
  suggestionMetric,
} from './metric-constants';

export const setupMetrics = (config: TelemetryConfig): MeterProvider => {
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

  return new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: EXPORT_INTERVAL_MS,
      }),
    ],
    resource,
  });
};

export const createDefaultMeters = (integrationDetails: IntegrationDetails, meterProvider: MeterProvider): Meters => {
  const { type: integrationType } = integrationDetails;
  const defaultMeter = meterProvider.getMeter(meterName, meterVersion);

  const prefix = `${metricPrefix}.${integrationType}`;

  const checkRequestCounterName = `${prefix}.${checkRequestMetric}.counter`;
  const checkRequestPollingTimeName = `${prefix}.${checkRequestMetric}.polling-time`;
  const checkRequestSubmitTimeName = `${prefix}.${checkRequestMetric}.submit-time`;
  const suggestionCounterName = `${prefix}.${suggestionMetric}.counter`;
  const suggestionResponseTimeName = `${prefix}.${suggestionMetric}.response-time`;

  return {
    checkRequestCounter: defaultMeter.createCounter(checkRequestCounterName, {
      unit: counterUnit,
      valueType: ValueType.INT,
    }),
    checkRequestPollingTime: defaultMeter.createHistogram(checkRequestPollingTimeName, {
      unit: durationUnit,
      valueType: ValueType.DOUBLE,
    }),
    checkRequestSubmitTime: defaultMeter.createHistogram(checkRequestSubmitTimeName, {
      unit: durationUnit,
      valueType: ValueType.DOUBLE,
    }),
    suggestionCounter: defaultMeter.createCounter(suggestionCounterName, {
      unit: counterUnit,
      valueType: ValueType.INT,
    }),
    suggestionResponseTime: defaultMeter.createHistogram(suggestionResponseTimeName, {
      unit: counterUnit,
      valueType: ValueType.DOUBLE,
    }),
  };
};

export type Meters = {
  checkRequestCounter: Counter;
  suggestionCounter: Counter;
  checkRequestSubmitTime: Histogram;
  checkRequestPollingTime: Histogram;
  suggestionResponseTime: Histogram;
};
