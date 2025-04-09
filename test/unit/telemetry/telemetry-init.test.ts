import { AcrolinxEndpoint } from '../../../src/index';
import { AcrolinxInstrumentation, TelemetryConfig } from '../../../src/telemetry/acrolinxInstrumentation';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FetchMocker, MockServer } from 'mentoss';
import {
  BrowserEngine,
  BrowserNames,
  IntegrationType,
  OperatingSystemFamily,
} from '../../../src/telemetry/interfaces/integration';

describe('Telemtry initialization', () => {
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
            engine: BrowserEngine.blink,
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
  const props: TelemetryConfig = {
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
  });

  afterAll(() => {
    mocker.unmockGlobal();
  });

  it('should create a new instance', () => {
    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(props);
    expect(acrolinxInstrumentation).toBeDefined();
  });

  it('should not create multiple instances', () => {
    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(props);
    const acrolinxInstrumentation2 = AcrolinxInstrumentation.getInstance(props);
    const acrolinxInstrumentation3 = AcrolinxInstrumentation.getInstance(props);

    expect(acrolinxInstrumentation).toBe(acrolinxInstrumentation2);
    expect(acrolinxInstrumentation).toBe(acrolinxInstrumentation3);
  });

  it('should return telemtry instrumnents if telemetry in enabled', async () => {
    server.get('/int-service/api/v1/config', {
      status: 200,
      body: {
        activateGetSuggestionReplacement: true,
        telemetryEnabled: true,
      },
    });

    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(props);
    const instruments = await acrolinxInstrumentation.getInstruments();
    expect(instruments?.metrics).toBeDefined();
    expect(instruments?.metrics.meterProvider).toBeDefined();
    expect(instruments?.logging).toBeDefined();
    expect(instruments?.logging.logger).toBeDefined();
  });

  it('should return undefined if telemetry is disabled', async () => {
    server.get('/int-service/api/v1/config', {
      status: 200,
      body: {
        activateGetSuggestionReplacement: true,
        telemetryEnabled: false,
      },
    });

    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(props);
    const instruments = await acrolinxInstrumentation.getInstruments();
    expect(instruments).toBeUndefined();
  });

  it('should return undefined if config api returns 500', async () => {
    server.get('/int-service/api/v1/config', {
      status: 500,
    });

    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(props);
    const instruments = await acrolinxInstrumentation.getInstruments();
    expect(instruments).toBeUndefined();
  });

  it('should return undefined if telemetry config is missing', async () => {
    server.get('/int-service/api/v1/config', {
      status: 200,
      body: {
        activateGetSuggestionReplacement: true,
      },
    });

    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(props);
    const instruments = await acrolinxInstrumentation.getInstruments();
    expect(instruments).toBeUndefined();
  });

  it('should return telemtry instrumnents if telemetry config is type string', async () => {
    server.get('/int-service/api/v1/config', {
      status: 200,
      body: {
        activateGetSuggestionReplacement: true,
        telemetryEnabled: 'true',
      },
    });

    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(props);
    const instruments = await acrolinxInstrumentation.getInstruments();
    expect(instruments?.metrics).toBeDefined();
    expect(instruments?.metrics.meterProvider).toBeDefined();
    expect(instruments?.logging).toBeDefined();
    expect(instruments?.logging.logger).toBeDefined();
  });
});
