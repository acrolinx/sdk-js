import { DeviceAuthResponse, DeviceSignInSuccessResponse } from '../../src/signin-device-grant';
import { AcrolinxEndpoint, CommonIssue, DEVELOPMENT_SIGNATURE, StringMap } from '../../src';
import * as dotenv from 'dotenv';
import 'cross-fetch/polyfill';

dotenv.config();

const ACROLINX_ONE_SERVER_URL = process.env.ACROLINX_ONE_SERVER_URL || '';
const KEYCLOAK_TENANT_ID = process.env.KEYCLOAK_TENANT_ID;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || '';
const KEYCLOAK_REFRESH_TOKEN = process.env.KEYCLOAK_REFRESH_TOKEN;
const KEYCLOAK_ACCESS_TOKEN = process.env.KEYCLOAK_ACCESS_TOKEN;
export const ACROLINX_DEV_SIGNATURE = process.env.ACROLINX_DEV_SIGNATURE;

function createEndpoint(acrolinxUrl: string, headers?: StringMap) {
  return new AcrolinxEndpoint({
    acrolinxUrl,
    enableHttpLogging: true,
    client: {
      signature: ACROLINX_DEV_SIGNATURE || DEVELOPMENT_SIGNATURE,
      version: '1.2.3.666',
    },
    additionalHeaders: headers,
  });
}

describe('Acrolinx One E2E Tests', () => {
  let endpoint: AcrolinxEndpoint;

  const verifyDeviceGrantUserActionInfo = (deviceGrantUserAction: DeviceAuthResponse) => {
    expect(deviceGrantUserAction.verificationUrl).toBeDefined();
    expect(deviceGrantUserAction.verificationUrlComplete).toBeDefined();
    expect(deviceGrantUserAction.userCode).toBeDefined();
    expect(deviceGrantUserAction.pollingUrl).toBeDefined();
    expect(deviceGrantUserAction.deviceCode).toBeDefined();
    expect(deviceGrantUserAction.expiresInSeconds).toBeDefined();
    expect(deviceGrantUserAction.pollingIntervalInSeconds).toBeDefined();
  };

  const verifySignInDeviceGrantSuccess = (signInDeviceGrant: DeviceSignInSuccessResponse) => {
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
      })) as DeviceAuthResponse;
      console.log(deviceGrantUserAction);

      verifyDeviceGrantUserActionInfo(deviceGrantUserAction);
    });

    // This test requires valid refresh token
    it.skip('validate refresh token', async () => {
      const signInDeviceGrant = (await endpoint.deviceAuthSignIn({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
        refreshToken: KEYCLOAK_REFRESH_TOKEN,
      })) as DeviceSignInSuccessResponse;

      console.log(signInDeviceGrant);
      verifySignInDeviceGrantSuccess(signInDeviceGrant);
    });

    it('invalid refresh token triggers new device grant', async () => {
      const deviceGrantUserAction = (await endpoint.deviceAuthSignIn({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
        refreshToken: 'invalid',
      })) as DeviceAuthResponse;
      console.log(deviceGrantUserAction);

      verifyDeviceGrantUserActionInfo(deviceGrantUserAction);
    });

    it('poll for sign in result', async () => {
      const deviceGrantUserAction = (await endpoint.deviceAuthSignIn({
        tenantId: KEYCLOAK_TENANT_ID,
        clientId: KEYCLOAK_CLIENT_ID,
      })) as DeviceAuthResponse;
      console.log(deviceGrantUserAction);

      verifyDeviceGrantUserActionInfo(deviceGrantUserAction);

      deviceGrantUserAction.expiresInSeconds = 10;
      await expect(endpoint.pollDeviceSignInCompletion(KEYCLOAK_CLIENT_ID, deviceGrantUserAction)).rejects.toThrow();
    }, 30000);

    // This test requires valid keycloak access token
    it.skip('sign-in with auth header', async () => {
      const headers: StringMap = {
        Authorization: `Bearer ${KEYCLOAK_ACCESS_TOKEN!}`,
      };
      const ep = createEndpoint(ACROLINX_ONE_SERVER_URL, headers);
      const result = await ep.signInWithHeaders();

      expect(result).toBeDefined();
      expect(result.data.accessToken).toBeDefined();
    });
  });

  // This test requires valid keycloak access token
  it.skip('check if the ai service is activated', async () => {
    const headers: StringMap = {
      Authorization: `Bearer ${KEYCLOAK_ACCESS_TOKEN!}`,
    };
    const ep = createEndpoint(ACROLINX_ONE_SERVER_URL, headers);

    const aiResult = await ep.getAIEnabled(KEYCLOAK_ACCESS_TOKEN!);
    expect(aiResult.tenant).toBeDefined();
    expect(aiResult.value).toBeDefined();
    expect(aiResult.userHasPrivilege).toBeDefined();
  });

  // This test requires valid keycloak access token
  it.skip('get a chat completion from the ai service', async () => {
    const headers: StringMap = {
      Authorization: `Bearer ${KEYCLOAK_ACCESS_TOKEN!}`,
    };
    const ep = createEndpoint(ACROLINX_ONE_SERVER_URL, headers);
    const aiResult = await ep.getAIChatCompletion(
      {
        issue: {
          aiRephraseHint:
            '[{"role": "system", "content": "Rewrite this content so that it mentions between 3 and 5 of the seven dwarfs"}]',
          internalName: 'simplify',
        } as unknown as CommonIssue,
        count: 1,
      },
      KEYCLOAK_ACCESS_TOKEN!,
    );
    expect(aiResult.response).toBeDefined();
  }, 100000);
});
