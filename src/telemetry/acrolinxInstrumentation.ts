import { setupLogging } from './logs/logs-setup';
import { Counters, createDefaultCounters, setupMetrics } from './metrics/metrics-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Logger } from '@opentelemetry/api-logs';
import { AccessToken } from 'src/common-types';
import { AcrolinxEndpoint, IntService } from 'src';

export class AcrolinxInstrumentation {
  private static acrolinxInstrumentation: AcrolinxInstrumentation;
  public instruments: Instruments | undefined = undefined;
  private readonly config: TelemetryConfig;
  private readonly intService: IntService;

  private constructor(endpoint: AcrolinxEndpoint, config: TelemetryConfig) {
    this.intService = new IntService(endpoint);
    this.config = config;
  }

  public static getInstance(endpoint: AcrolinxEndpoint, config: TelemetryConfig): AcrolinxInstrumentation {
    if (!AcrolinxInstrumentation.acrolinxInstrumentation) {
      AcrolinxInstrumentation.acrolinxInstrumentation = new AcrolinxInstrumentation(endpoint, config);
      return AcrolinxInstrumentation.acrolinxInstrumentation;
    }
    return AcrolinxInstrumentation.acrolinxInstrumentation;
  }

  public async getInstruments(): Promise<Instruments | undefined> {
    if (!(await this.isAllowed(this.config.accessToken))) {
      return undefined;
    }
    const meterProvider = setupMetrics(this.config);
    const defaultCounters = createDefaultCounters(meterProvider);
    const logger = setupLogging(this.config);

    return {
      metrics: {
        meterProvider,
        defaultCounters,
      },
      logging: {
        logger,
      },
    };
  }

  private async isAllowed(accessToken: AccessToken): Promise<boolean> {
    const config = await this.intService.getConfig(accessToken);
    return config?.telemetryEnabled;
  }
}

export type TelemetryConfig = {
  acrolinxUrl: string;
  accessToken: AccessToken;
  serviceName: string;
  serviceVersion: string;
};

export type Instruments = {
  metrics: MetricInstrumentation;
  logging: LoggingInstrumentation;
};

export type MetricInstrumentation = {
  meterProvider: MeterProvider;
  defaultCounters: Counters;
};

export type LoggingInstrumentation = {
  logger: Logger;
};

export type TracingInstrumentation = {};
