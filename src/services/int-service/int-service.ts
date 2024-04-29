import { AcrolinxEndpoint } from '../../index';
import { IntegrationServiceConfigV1 } from './int-service.types';

export const integrationServiceDefaultConfig: IntegrationServiceConfigV1 = {
  activateGetSuggestionReplacement: false,
};

export class IntService {
  private readonly intServiceBasePath = '/int-service/api/v1';
  constructor(
    private readonly endpoint: AcrolinxEndpoint,
    private readonly _clientSignature?: string, // the sidebar might have not received a clientSignature
  ) {}

  getConfig(accessToken: string): Promise<IntegrationServiceConfigV1> {
    const headers = {
      'X-Client-Signature': this._clientSignature || '',
    };
    return this.endpoint.getJsonFromPath<IntegrationServiceConfigV1>(
      this.constructFullPath('/config'), 
      accessToken,
      { headers },
    );
  }

  private constructFullPath(path: string): string {
    return this.intServiceBasePath + path;
  }
}
