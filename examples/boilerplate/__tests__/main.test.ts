import { ContentFormat } from '@acrolinx/sdk';
import { AcrolinxSDKDemo } from '../src/main.js';

describe('SDKDemo tests', () => {
  // Token generated from the Acrolinx dashboard.
  const accessToken = 'access token';

  // URL of the Acrolinx platform.
  const acrolinxUrl = 'acrolinx-platform-url';

  // Unique signature provided by Acrolinx for the integration.
  const clientSignature = 'signature-provided-by-acrolinx';

  it('test endpoint creation', () => {
    const demo = new AcrolinxSDKDemo(acrolinxUrl, clientSignature);
    const endpoint = demo.createEndpoint();
    expect(endpoint).not.toBeNull();
  });

  it('test check request creation', () => {
    const demo = new AcrolinxSDKDemo(acrolinxUrl, clientSignature);
    const checkRequest = demo.createCheckRequest();

    expect(checkRequest).not.toBeNull();
    expect(checkRequest.content).not.toBeNull();
    expect(checkRequest.checkOptions).not.toBeNull();
    expect(checkRequest.checkOptions.checkType).not.toBeNull();
    expect(checkRequest.checkOptions.contentFormat).not.toBeNull();
  });

  it('test running check', async () => {
    const demo = new AcrolinxSDKDemo(acrolinxUrl, clientSignature);
    const endpoint = demo.createEndpoint();
    const checkRequest = demo.createCheckRequest();

    const checkResult = await demo.checkWithAcrolinx(
      endpoint,
      checkRequest,
      accessToken,
    );
    expect(checkResult).not.toBeNull();
    expect(checkResult.quality.score).not.toBeNull();

    console.log('Acrolinx Score: ' + checkResult.quality.score);
  });

  it('test fetching platform capabilities', async () => {
    const demo = new AcrolinxSDKDemo(acrolinxUrl, clientSignature);
    const endpoint = demo.createEndpoint();

    const capabilities = await demo.getPlatformCapabilities(
      endpoint,
      accessToken,
    );
    expect(capabilities).not.toBeNull();
    expect(capabilities.contentFormats).not.toBeNull();
    
    capabilities.contentFormats.forEach( (format: ContentFormat) => {
      console.log('Format: ' + format.displayName + ' id: ' + format.id);
    })
    
  });
});
