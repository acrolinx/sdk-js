import { AcrolinxEndpoint, DEVELOPMENT_SIGNATURE } from '../../src';
import * as dotenv from 'dotenv';

dotenv.config();

const ACROLINX_ONE_SERVER_URL = process.env.ACROLINX_ONE_SERVER_URL || '';
const KEYCLOAK_TENANT_ID = process.env.KEYCLOAK_TENANT_ID;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
export const ACROLINX_DEV_SIGNATURE = process.env.ACROLINX_DEV_SIGNATURE;

function createEndpoint(acrolinxUrl: string) {
  return new AcrolinxEndpoint({
    acrolinxUrl,
    enableHttpLogging: true,
    client: {
      signature: ACROLINX_DEV_SIGNATURE || DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666',
    },
  });
}

describe('Acrolinx One E2E Tests', () => {
  let endpoint: AcrolinxEndpoint;

  beforeEach(() => {
    endpoint = createEndpoint(ACROLINX_ONE_SERVER_URL);
  });
  describe('Sign in with device grant', () => {
    it('get device verification url', async () => {
      const deviceGrantUserAction = await endpoint.signInDeviceGrant({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
      });
      console.log(deviceGrantUserAction);

      expect(deviceGrantUserAction.verificationUrl).toBeDefined();
      expect(deviceGrantUserAction.verificationUrlComplete).toBeDefined();
      expect(deviceGrantUserAction.userCode).toBeDefined();
      expect(deviceGrantUserAction.pollingUrl).toBeDefined();
      expect(deviceGrantUserAction.deviceCode).toBeDefined();
      expect(deviceGrantUserAction.expiresInSeconds).toBeDefined();
      expect(deviceGrantUserAction.pollingIntervalInSeconds).toBeDefined();
    });
  });
});
