import { setupLogging } from './logs/logs-setup';
import { Meters, createDefaultMeters, setupMetrics } from './metrics/metrics-setup';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Logger } from '@opentelemetry/api-logs';
import { AccessToken } from '../common-types';
import { AcrolinxEndpointProps, IntService } from '../index';

export class AcrolinxInstrumentation {
  private static instance: AcrolinxInstrumentation | null = null;
  private static instanceConfig: TelemetryConfig | null = null;
  private instruments: Instruments | undefined = undefined;
  private readonly config: TelemetryConfig;
  private readonly intService: IntService;
  private instrumentsPromise: Promise<Instruments | undefined> | null = null;

  private constructor(config: TelemetryConfig) {
    this.intService = new IntService(config.endpointProps);
    this.config = config;
  }

  public static getInstance(config: TelemetryConfig): AcrolinxInstrumentation {
    if (
      AcrolinxInstrumentation.instance &&
      AcrolinxInstrumentation.instanceConfig &&
      this.configsMatch(AcrolinxInstrumentation.instanceConfig, config)
    ) {
      return AcrolinxInstrumentation.instance;
    }

    AcrolinxInstrumentation.instance = new AcrolinxInstrumentation(config);
    AcrolinxInstrumentation.instanceConfig = { ...config };
    return AcrolinxInstrumentation.instance;
  }

  public static resetInstance(): void {
    AcrolinxInstrumentation.instance = null;
    AcrolinxInstrumentation.instanceConfig = null;
  }

  private static configsMatch(config1: TelemetryConfig, config2: TelemetryConfig): boolean {
    return config1.accessToken === config2.accessToken && config1.endpointProps === config2.endpointProps;
  }

  public async getInstruments(): Promise<Instruments | undefined> {
    if (this.instruments) {
      return this.instruments;
    }

    if (this.instrumentsPromise) {
      return this.instrumentsPromise;
    }

    this.instrumentsPromise = this.createInstruments();

    try {
      this.instruments = await this.instrumentsPromise;
      return this.instruments;
    } finally {
      this.instrumentsPromise = null;
    }
  }

  private async createInstruments(): Promise<Instruments | undefined> {
    try {
      if (!(await this.isAllowed(this.config.accessToken))) {
        return undefined;
      }

      const meterProvider = await setupMetrics(this.config);
      const defaultCounters = createDefaultMeters(this.config.endpointProps.client.integrationDetails, meterProvider);
      const logger = await setupLogging(this.config);

      return {
        metrics: {
          meterProvider,
          meters: defaultCounters,
        },
        logging: {
          logger,
        },
      };
    } catch (error) {
      console.error('Failed to create instruments:', error);
      return undefined;
    }
  }

  private async isAllowed(accessToken: AccessToken): Promise<boolean> {
    try {
      const config = await this.intService.getConfig(accessToken);
      return config?.telemetryEnabled ?? false;
    } catch (error) {
      console.error('Failed to check if telemetry is allowed:', error);
      return false;
    }
  }
}

export const getTelemetryInstruments = async (
  endpointProps: AcrolinxEndpointProps,
  accessToken: AccessToken,
): Promise<Instruments | undefined> => {
  try {
    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance({
      endpointProps,
      accessToken,
    });
    return await acrolinxInstrumentation.getInstruments();
  } catch (error) {
    console.error('Failed to get telemetry instruments:', error);
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
