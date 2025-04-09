import { setupLogging } from './logs/logs-setup';
import { Counters, createDefaultCounters, setupMetrics } from './metrics/metrics-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Logger } from '@opentelemetry/api-logs';
import { AccessToken } from '../common-types';
import { AcrolinxEndpointProps, IntService } from '../index';

export class AcrolinxInstrumentation {
  private static acrolinxInstrumentation: AcrolinxInstrumentation;
  public instruments: Instruments | undefined = undefined;
  private readonly config: TelemetryConfig;
  private readonly intService: IntService;

  private constructor(config: TelemetryConfig) {
    this.intService = new IntService(config.endpointProps);
    this.config = config;
  }

  public static getInstance(config: TelemetryConfig): AcrolinxInstrumentation {
    if (!AcrolinxInstrumentation.acrolinxInstrumentation) {
      AcrolinxInstrumentation.acrolinxInstrumentation = new AcrolinxInstrumentation(config);
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
    try {
      const config = await this.intService.getConfig(accessToken);
      return config?.telemetryEnabled;
    } catch (e) {
      console.log(e);
    }
    return false;
  }
}

export type TelemetryConfig = {
  endpointProps: AcrolinxEndpointProps;
  accessToken: AccessToken;
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
