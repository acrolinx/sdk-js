import { ContentFormat } from '@acrolinx/sdk';
import { AcrolinxSDKDemo } from '../src/main.js';
import { uuid } from 'uuidv4';

describe('SDKDemo tests', () => {
  // Token generated from the Acrolinx dashboard.
  const accessToken = 'access-token';

  // URL of the Acrolinx platform.
  const acrolinxUrl = 'https://partner-dev.internal.acrolinx.sh';

  // Unique signature provided by Acrolinx for the integration.
  const clientSignature = 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5';

  it('test endpoint creation', () => {
    const demo = new AcrolinxSDKDemo(acrolinxUrl, clientSignature);
    const endpoint = demo.createEndpoint();
    expect(endpoint).not.toBeNull();
  });

  it('test check request creation', () => {
    const demo = new AcrolinxSDKDemo(acrolinxUrl, clientSignature);
    const checkRequest = demo.createCheckRequest('gen.demo.' + uuid());

    expect(checkRequest).not.toBeNull();
    expect(checkRequest.content).not.toBeNull();
    expect(checkRequest.checkOptions).not.toBeNull();
    expect(checkRequest.checkOptions.checkType).not.toBeNull();
    expect(checkRequest.checkOptions.contentFormat).not.toBeNull();
  });

  it('test running check', async () => {
    const demo = new AcrolinxSDKDemo(acrolinxUrl, clientSignature);
    const endpoint = demo.createEndpoint();
    const checkRequest = demo.createCheckRequest('gen.demo.' + uuid());

    const checkResult = await demo.checkWithAcrolinx(
      endpoint,
      checkRequest,
      accessToken,
    );
    expect(checkResult).not.toBeNull();
    expect(checkResult.quality.score).not.toBeNull();

    console.log('Acrolinx Score: ' + checkResult.quality.score);
    console.log('Scorecard Url: ' + checkResult.reports.scorecard.link);

    const contentAnalysisDashboardLink = await demo.fetchContentAnalysisDashboardUrl(endpoint, accessToken, checkRequest.checkOptions.batchId);

    expect(contentAnalysisDashboardLink).not.toBeNull();
    console.log('Content Analysis Dashboard Link: ' + contentAnalysisDashboardLink);
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
