import fetch from 'cross-fetch';
import {
  AcrolinxEndpoint,
  CheckingCapabilities,
  CheckRequest,
  CheckResult,
  CheckType,
  Progress,
} from '@acrolinx/sdk';
export class AcrolinxSDKDemo {

  private acrolinxUrl: string;
  private clientSignature: string;

  constructor(acrolinxUrl: string, clientSignature: string) {
    this.acrolinxUrl = acrolinxUrl;
    this.clientSignature = clientSignature;
  }
  
  public createEndpoint(): AcrolinxEndpoint {
    return new AcrolinxEndpoint({
      client: {
        version: '1.0.0',
        signature: this.clientSignature,
      },
      acrolinxUrl: this.acrolinxUrl,
      fetch: fetch,
    });
  }

  public createCheckRequest(): CheckRequest {
    return {
      content: 'This sentence containss intentional spellingg mistakess.',
      checkOptions: {
        batchId: '',
        contentFormat: 'TEXT',
        languageId: 'en',
        checkType: CheckType.batch,
      },
      document: {
        reference: '',
        id: '',
      },
    };
  }

  public async getPlatformCapabilities(endpoint: AcrolinxEndpoint, accessToken: string): Promise<CheckingCapabilities> {
    return await endpoint.getCheckingCapabilities(accessToken);
  }

  public async checkWithAcrolinx(
    endpoint: AcrolinxEndpoint,
    checkRequest: CheckRequest,
    accessToken: string,
  ): Promise<CheckResult> {
    const checkResponse = endpoint.checkAndGetResult(
      accessToken,
      checkRequest,
      {
        onProgress: (progress: Progress) => {
          console.log(progress);
        },
      },
    );

    console.log('Check in progress: ' + checkResponse.getId());
    const checkResult = await checkResponse.promise;

    console.log('Check Completed');
    return checkResult;
  }
}
