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

  try {
    const metricExporter = new OTLPMetricExporter(collectorOptions);

    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.endpointProps.client.integrationDetails.name,
      [ATTR_SERVICE_VERSION]: config.endpointProps.client.integrationDetails.version,
    });

    const meterProvider = new MeterProvider({
      readers: [
        new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: EXPORT_INTERVAL_MS,
        }),
      ],
      resource,
    });

    return meterProvider;
  } catch (error) {
    console.error('Failed to setup metrics:', error);
    throw new Error(`Metrics setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
      description: 'Counts the number of check requests made to the Acrolinx platform',
    }),
    checkRequestPollingTime: defaultMeter.createHistogram(checkRequestPollingTimeName, {
      unit: durationUnit,
      valueType: ValueType.DOUBLE,
      description: 'Measures the time taken to poll for check results from the Acrolinx platform',
    }),
    checkRequestSubmitTime: defaultMeter.createHistogram(checkRequestSubmitTimeName, {
      unit: durationUnit,
      valueType: ValueType.DOUBLE,
      description: 'Measures the time taken to submit a check request to the Acrolinx platform',
    }),
    suggestionCounter: defaultMeter.createCounter(suggestionCounterName, {
      unit: counterUnit,
      valueType: ValueType.INT,
      description: 'Counts the number of suggestions requested from the Acrolinx platform',
    }),
    suggestionResponseTime: defaultMeter.createHistogram(suggestionResponseTimeName, {
      unit: counterUnit,
      valueType: ValueType.DOUBLE,
      description: 'Measures the time taken to receive suggestions from the Acrolinx platform',
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
