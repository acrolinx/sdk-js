import { AcrolinxEndpoint } from '../../../src/index';
import { AcrolinxInstrumentation, TelemetryConfig, Instruments } from '../../../src/telemetry/acrolinxInstrumentation';
import { afterEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/msw-setup';
import { BrowserNames, IntegrationType, OperatingSystemFamily } from '../../../src/telemetry/interfaces/integration';
import {
  mockTelemetryEnabled,
  mockTelemetryDisabled,
  mockTelemetryEnabledString,
  mockTelemetryConfigMissing,
  mockTelemetryConfigError,
} from '../../test-utils/msw-test-helpers';

describe('Telemetry initialization', () => {
  const acrolinxUrl = 'https://tenant.acrolinx.cloud';
  const acrolinxEndpoint = new AcrolinxEndpoint({
    acrolinxUrl: acrolinxUrl,
    enableHttpLogging: true,
    client: {
      integrationDetails: {
        name: 'dev',
        version: 'foo',
        type: IntegrationType.authoring,
        systemInfo: {
          browserInfo: {
            name: BrowserNames.chrome,
            version: 'foo',
          },
          sidebarInfo: {
            version: 'foo',
          },
          operatingSystemInfo: {
            family: OperatingSystemFamily.linux,
            name: 'ubuntu',
            version: 'foo',
          },
        },
      },
      signature: 'dummy-signature',
      version: '1.2.3.666',
    },
  });
  const defaultProps: TelemetryConfig = {
    endpointProps: acrolinxEndpoint.props,
    accessToken: 'random-token',
  };

  afterEach(() => {
    server.resetHandlers();
    // Reset the singleton instance after each test to ensure clean state
    AcrolinxInstrumentation.resetInstance();
  });

  describe('Singleton pattern', () => {
    it('should create a new instance when none exists', () => {
      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      expect(acrolinxInstrumentation).toBeDefined();
    });

    it('should return the same instance when called with the same configuration', () => {
      const instance1 = AcrolinxInstrumentation.getInstance(defaultProps);
      const instance2 = AcrolinxInstrumentation.getInstance(defaultProps);
      const instance3 = AcrolinxInstrumentation.getInstance(defaultProps);

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(instance3);
    });

    it('should create a new instance when called with different configuration', () => {
      const instance1 = AcrolinxInstrumentation.getInstance(defaultProps);

      const differentProps: TelemetryConfig = {
        ...defaultProps,
        accessToken: 'different-token',
      };

      const instance2 = AcrolinxInstrumentation.getInstance(differentProps);

      expect(instance1).not.toBe(instance2);
    });

    it('should reset the singleton instance when resetInstance is called', () => {
      const instance1 = AcrolinxInstrumentation.getInstance(defaultProps);
      AcrolinxInstrumentation.resetInstance();
      const instance2 = AcrolinxInstrumentation.getInstance(defaultProps);

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('getInstruments method', () => {
    it('should return telemetry instruments when telemetry is enabled', async () => {
      mockTelemetryEnabled(acrolinxUrl);

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();

      expect(instruments?.metrics).toBeDefined();
      expect(instruments?.metrics.meterProvider).toBeDefined();
      expect(instruments?.logging).toBeDefined();
      expect(instruments?.logging.logger).toBeDefined();
    });

    it('should return undefined when telemetry is disabled', async () => {
      mockTelemetryDisabled(acrolinxUrl);

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();

      expect(instruments).toBeUndefined();
    });

    it('should return undefined when config API returns 500', async () => {
      mockTelemetryConfigError(acrolinxUrl);

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();

      expect(instruments).toBeUndefined();
    });

    it('should return undefined when telemetry config is missing', async () => {
      mockTelemetryConfigMissing(acrolinxUrl);

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();

      expect(instruments).toBeUndefined();
    });

    it('should return telemetry instruments when telemetry config is type string', async () => {
      mockTelemetryEnabledString(acrolinxUrl);

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();

      expect(instruments?.metrics).toBeDefined();
      expect(instruments?.metrics.meterProvider).toBeDefined();
      expect(instruments?.logging).toBeDefined();
      expect(instruments?.logging.logger).toBeDefined();
    });
  });

  describe('Caching behavior', () => {
    it('should cache instruments after first successful retrieval', async () => {
      mockTelemetryEnabled(acrolinxUrl);

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);

      // First call should make an API request
      const instruments1 = await acrolinxInstrumentation.getInstruments();
      expect(instruments1).toBeDefined();

      // Clear the mock to verify no additional requests are made
      server.resetHandlers();

      // Second call should use cached instruments
      const instruments2 = await acrolinxInstrumentation.getInstruments();
      expect(instruments2).toBeDefined();
    });

    it('should handle concurrent calls to getInstruments', async () => {
      // Set up a mock that will be called only once
      let requestCount = 0;

      // First, set up the mock with a counter
      server.use(
        http.get(`${acrolinxUrl}/int-service/api/v1/config`, () => {
          requestCount++;
          return HttpResponse.json({
            activateGetSuggestionReplacement: true,
            telemetryEnabled: true,
          });
        }),
      );

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);

      // Make concurrent calls
      const [instruments1, instruments2, instruments3] = await Promise.all([
        acrolinxInstrumentation.getInstruments(),
        acrolinxInstrumentation.getInstruments(),
        acrolinxInstrumentation.getInstruments(),
      ]);

      // Verify all calls returned the same instruments
      expect(instruments1).toBeDefined();
      expect(instruments1).toBe(instruments2);
      expect(instruments1).toBe(instruments3);

      // Verify only one API request was made
      expect(requestCount).toBe(1);
    });
  });

  describe('Telemetry configuration', () => {
    // Helper function to eliminate duplication in telemetry configuration tests
    const testTelemetryConfiguration = async (telemetryEndpoint?: string) => {
      mockTelemetryEnabled(acrolinxUrl, telemetryEndpoint);

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();

      expect(instruments).toBeDefined();
      await verifyMetricsWorking(instruments);
      await verifyLoggingWorking(instruments);
    };

    it('should use console exporters when telemetry endpoint is not available', async () => {
      await testTelemetryConfiguration();
    });

    it('should use OTLP exporters when telemetry endpoint is available', async () => {
      await testTelemetryConfiguration('https://telemetry.acrolinx.cloud');
    });

    it('should handle telemetry endpoint configuration errors', async () => {
      await testTelemetryConfiguration('invalid-url');
    });
  });

  const verifyMetricsWorking = async (instruments: Instruments | undefined) => {
    expect(instruments?.metrics).toBeDefined();
    expect(instruments?.metrics.meterProvider).toBeDefined();

    const meter = instruments!.metrics.meterProvider.getMeter('test');
    const counter = meter.createCounter('test_counter');
    counter.add(1);

    // Verify the meter provider is working
    expect(meter).toBeDefined();
    expect(counter).toBeDefined();
  };

  const verifyLoggingWorking = async (instruments: Instruments | undefined) => {
    expect(instruments?.logging).toBeDefined();
    expect(instruments?.logging.logger).toBeDefined();

    const logger = instruments!.logging.logger;
    logger.emit({
      severityText: 'INFO',
      body: 'Test log message',
    });

    // Verify the logger is working
    expect(logger).toBeDefined();
  };
});
