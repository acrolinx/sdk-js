import { AcrolinxEndpoint, DEVELOPMENT_SIGNATURE } from 'src';
import { AcrolinxInstrumentation, TelemetryConfig } from 'src/telemetry/acrolinxInstrumentation';
import { ACROLINX_API_TOKEN, ACROLINX_DEV_SIGNATURE, TEST_SERVER_URL } from 'test/integration-server/constants';
import { beforeEach, describe, expect, it } from 'vitest';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Telemtry initialization', () => {
  let acrolinxEndpoint: AcrolinxEndpoint;
  let props: TelemetryConfig;

  beforeEach(() => {
    acrolinxEndpoint = new AcrolinxEndpoint({
      acrolinxUrl: TEST_SERVER_URL,
      enableHttpLogging: true,
      client: {
        signature: ACROLINX_DEV_SIGNATURE || DEVELOPMENT_SIGNATURE,
        version: '1.2.3.666',
      },
    });

    props = {
      accessToken: ACROLINX_API_TOKEN,
      acrolinxUrl: acrolinxEndpoint.props.acrolinxUrl,
      serviceName: 'sdk-js',
      serviceVersion: '1.0.0',
    };
  });

  it('should create a new instance', () => {
    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(acrolinxEndpoint, props);
    expect(acrolinxInstrumentation).toBeDefined();
  });

  it('should not create multiple instances', () => {
    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(acrolinxEndpoint, props);
    const acrolinxInstrumentation2 = AcrolinxInstrumentation.getInstance(acrolinxEndpoint, props);
    const acrolinxInstrumentation3 = AcrolinxInstrumentation.getInstance(acrolinxEndpoint, props);

    expect(acrolinxInstrumentation).toBe(acrolinxInstrumentation2);
    expect(acrolinxInstrumentation).toBe(acrolinxInstrumentation3);
  });

  it('should return telemtry instrumnents', async () => {
    const acrolinxInstrumentation = AcrolinxInstrumentation.getInstance(acrolinxEndpoint, props);
    const instruments = await acrolinxInstrumentation.getInstruments();
    expect(instruments?.metrics).toBeDefined();
    expect(instruments?.metrics.meterProvider).toBeDefined();
    expect(instruments?.logging).toBeDefined();
    expect(instruments?.logging.logger).toBeDefined();
  });
});
