import { DeviceGrantUserActionInfo, SignInDeviceGrant } from '../../src/signin-device-grant';
import { AcrolinxEndpoint, DEVELOPMENT_SIGNATURE } from '../../src';
import * as dotenv from 'dotenv';

dotenv.config();

const ACROLINX_ONE_SERVER_URL = process.env.ACROLINX_ONE_SERVER_URL || '';
const KEYCLOAK_TENANT_ID = process.env.KEYCLOAK_TENANT_ID;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || '';
const KEYCLOAK_REFRESH_TOKEN = process.env.KEYCLOAK_REFRESH_TOKEN;
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

  const verifyDeviceGrantUserActionInfo = (deviceGrantUserAction: DeviceGrantUserActionInfo) => {
    expect(deviceGrantUserAction.verificationUrl).toBeDefined();
    expect(deviceGrantUserAction.verificationUrlComplete).toBeDefined();
    expect(deviceGrantUserAction.userCode).toBeDefined();
    expect(deviceGrantUserAction.pollingUrl).toBeDefined();
    expect(deviceGrantUserAction.deviceCode).toBeDefined();
    expect(deviceGrantUserAction.expiresInSeconds).toBeDefined();
    expect(deviceGrantUserAction.pollingIntervalInSeconds).toBeDefined();
  };

  const verifySignInDeviceGrantSuccess = (signInDeviceGrant: SignInDeviceGrant) => {
    expect(signInDeviceGrant.accessToken).toBeDefined();
    expect(signInDeviceGrant.refreshToken).toBeDefined();
    expect(signInDeviceGrant.refreshToken).not.toEqual(KEYCLOAK_REFRESH_TOKEN);
    expect(signInDeviceGrant.accessTokenExpiryInSeconds).toBeDefined();
    expect(signInDeviceGrant.refreshTokenExpiryInSeconds).toBeDefined();
    expect(signInDeviceGrant.scope).toBeDefined();
    expect(signInDeviceGrant.sessionState).toBeDefined();
    expect(signInDeviceGrant.tokenType).toBeDefined();
    expect(signInDeviceGrant.tokenType.toLowerCase()).toEqual('bearer');
  };

  beforeEach(() => {
    endpoint = createEndpoint(ACROLINX_ONE_SERVER_URL);
  });
  describe('Sign in with device grant', () => {
    it('get device verification url', async () => {
      const deviceGrantUserAction = (await endpoint.deviceAuthSignIn({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
      })) as DeviceGrantUserActionInfo;
      console.log(deviceGrantUserAction);

      verifyDeviceGrantUserActionInfo(deviceGrantUserAction);
    });

    it('validate refresh token', async () => {
      const signInDeviceGrant = (await endpoint.deviceAuthSignIn({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
        refreshToken: KEYCLOAK_REFRESH_TOKEN,
      })) as SignInDeviceGrant;

      console.log(signInDeviceGrant);
      verifySignInDeviceGrantSuccess(signInDeviceGrant);
    });

    it('invalid refresh token triggers new device grant', async () => {
      const deviceGrantUserAction = (await endpoint.deviceAuthSignIn({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
        refreshToken: 'invalid',
      })) as DeviceGrantUserActionInfo;
      console.log(deviceGrantUserAction);

      verifyDeviceGrantUserActionInfo(deviceGrantUserAction);
    });

    it('poll for sign in result', async () => {
      const deviceGrantUserAction = (await endpoint.deviceAuthSignIn({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
      })) as DeviceGrantUserActionInfo;
      console.log(deviceGrantUserAction);

      verifyDeviceGrantUserActionInfo(deviceGrantUserAction);

      deviceGrantUserAction.expiresInSeconds = 10;
      await expect(endpoint.pollDeviceSignInCompletion(KEYCLOAK_CLIENT_ID, deviceGrantUserAction)).rejects.toThrow();
    }, 30000);
  });
});
