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
  
  // Create Acrolinx Endpoint instance
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

  // Create a Check Request.
  public createCheckRequest(batchId: string | null): CheckRequest {
    return {
      content: 'This sentence containss intentional spellingg mistakess.',
      checkOptions: {
        // Define your own mechanism to generate batchId and assignment.
        // One batch of check should have one batchId
        batchId: batchId,
        contentFormat: 'TEXT',
        languageId: 'en',
        //   interactive =  human user checks own document
        //   batch       =  human user checks many own documents
        //   baseline    =  a repository of documents is checked, the user doesn't own the documents
        //   automated   =  check of a single document for automated scenarios as for example a git hook
        checkType: CheckType.batch,
      },
      document: {
        // Furnish correct reference path for the file.
        reference: 'C:\\docs\\file.txt',
      },
    };
  }

  // Get Content Analysis Dashboard Link
  public async fetchContentAnalysisDashboardUrl(endpoint: AcrolinxEndpoint, accessToken: string, batchId: string): Promise<string> {
    return await endpoint.getContentAnalysisDashboard(accessToken, batchId);
  }

  // Get Acrolinx Platform Checking Capabilities
  public async getPlatformCapabilities(endpoint: AcrolinxEndpoint, accessToken: string): Promise<CheckingCapabilities> {
    return await endpoint.getCheckingCapabilities(accessToken);
  }

  // Run a check with Acrolinx
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
