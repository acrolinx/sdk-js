import { AcrolinxEndpoint, ServiceType } from 'src';
import { IntegrationServiceConfigV1 } from './int-service.types';

export const integrationServiceDefaultConfig: IntegrationServiceConfigV1 = {
  activateGAIGetSuggestionReplaceButton: false,
};

export class IntService {
  private readonly intServiceBasePath = '/int-service/api/v1';
  constructor(private readonly endpoint: AcrolinxEndpoint) {}

  getConfig(accessToken: string): Promise<IntegrationServiceConfigV1> {
    return this.endpoint.getJsonFromPath<IntegrationServiceConfigV1>(this.constructFullPath('/config'), accessToken, {
      serviceType: ServiceType.ACROLINX_ONE,
    });
  }

  private constructFullPath(path: string): string {
    return this.intServiceBasePath + path;
  }
}
