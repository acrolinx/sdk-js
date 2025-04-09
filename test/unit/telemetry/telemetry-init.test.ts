import { AcrolinxEndpoint } from '../../../src/index';
import { AcrolinxInstrumentation, TelemetryConfig } from '../../../src/telemetry/acrolinxInstrumentation';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FetchMocker, MockServer } from 'mentoss';
import { BrowserNames, IntegrationType, OperatingSystemFamily } from '../../../src/telemetry/interfaces/integration';

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

  const server = new MockServer(acrolinxUrl);
  const mocker = new FetchMocker({
    servers: [server],
  });

  beforeAll(() => {
    mocker.mockGlobal();
  });

  afterEach(() => {
    mocker.clearAll();
    // Reset the singleton instance after each test to ensure clean state
    AcrolinxInstrumentation.resetInstance();
  });

  afterAll(() => {
    mocker.unmockGlobal();
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
      server.get('/int-service/api/v1/config', {
        status: 200,
        body: {
          activateGetSuggestionReplacement: true,
          telemetryEnabled: true,
        },
      });

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();
      
      expect(instruments?.metrics).toBeDefined();
      expect(instruments?.metrics.meterProvider).toBeDefined();
      expect(instruments?.logging).toBeDefined();
      expect(instruments?.logging.logger).toBeDefined();
    });

    it('should return undefined when telemetry is disabled', async () => {
      server.get('/int-service/api/v1/config', {
        status: 200,
        body: {
          activateGetSuggestionReplacement: true,
          telemetryEnabled: false,
        },
      });

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();
      
      expect(instruments).toBeUndefined();
    });

    it('should return undefined when config API returns 500', async () => {
      server.get('/int-service/api/v1/config', {
        status: 500,
      });

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();
      
      expect(instruments).toBeUndefined();
    });

    it('should return undefined when telemetry config is missing', async () => {
      server.get('/int-service/api/v1/config', {
        status: 200,
        body: {
          activateGetSuggestionReplacement: true,
        },
      });

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      const instruments = await acrolinxInstrumentation.getInstruments();
      
      expect(instruments).toBeUndefined();
    });

    it('should return telemetry instruments when telemetry config is type string', async () => {
      server.get('/int-service/api/v1/config', {
        status: 200,
        body: {
          activateGetSuggestionReplacement: true,
          telemetryEnabled: 'true',
        },
      });

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
      server.get('/int-service/api/v1/config', {
        status: 200,
        body: {
          activateGetSuggestionReplacement: true,
          telemetryEnabled: true,
        },
      });

      const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(defaultProps);
      
      // First call should make an API request
      const instruments1 = await acrolinxInstrumentation.getInstruments();
      expect(instruments1).toBeDefined();
      
      // Clear the mock to verify no additional requests are made
      mocker.clearAll();
      
      // Second call should use cached instruments
      const instruments2 = await acrolinxInstrumentation.getInstruments();
      expect(instruments2).toBeDefined();
      
      // Verify the instruments are the same instance
      expect(instruments1).toBe(instruments2);
    });

    it('should handle concurrent calls to getInstruments', async () => {
      // Set up a mock that will be called only once
      let requestCount = 0;
      
      // First, set up the mock with a counter
      server.get('/int-service/api/v1/config', {
        status: 200,
        body: {
          activateGetSuggestionReplacement: true,
          telemetryEnabled: true,
        },
      });
      
      // Then, override the fetch to count requests
      const originalFetch = global.fetch;
      global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (typeof input === 'string' && input.includes('/int-service/api/v1/config')) {
          requestCount++;
        }
        return originalFetch(input, init);
      };
      
      try {
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
      } finally {
        // Restore the original fetch
        global.fetch = originalFetch;
      }
    });
  });
});
