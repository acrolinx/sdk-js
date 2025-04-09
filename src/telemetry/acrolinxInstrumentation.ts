import { setupLogging } from './logs/logs-setup';
import { Meters, createDefaultMeters, setupMetrics } from './metrics/metrics-setup';
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
    const defaultCounters = createDefaultMeters(this.config.endpointProps.client.integrationDetails, meterProvider);
    const logger = setupLogging(this.config);

    return {
      metrics: {
        meterProvider,
        meters: defaultCounters,
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

export const getTelemetryInstruments = async (
  endpointProps: AcrolinxEndpointProps,
  accessToken: AccessToken,
): Promise<Instruments | undefined> => {
  try {
    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance({
      endpointProps,
      accessToken: accessToken,
    });
    return await acrolinxInstrumentation.getInstruments();
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

export type TelemetryConfig = {
  endpointProps: AcrolinxEndpointProps;
  accessToken: AccessToken;
};

export type Instruments = {
  metrics: MetricInstruments;
  logging: LoggingInstruments;
};

export type MetricInstruments = {
  meterProvider: MeterProvider;
  meters: Meters;
};

export type LoggingInstruments = {
  logger: Logger;
};
