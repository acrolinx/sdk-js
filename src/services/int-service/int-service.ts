/*
 * Copyright 2024-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AcrolinxEndpoint, ServiceType } from '../../index';
import { LogBufferEntry } from '../../utils/logging-buffer';
import { IntegrationServiceConfig, IntegrationServiceResponse } from './int-service.types';

export const integrationServiceDefaultConfig: IntegrationServiceConfig = {
  activateGetSuggestionReplacement: false,
  telemetryEnabled: false,
};

export class IntService {
  private readonly intServiceBasePath = '/int-service/api/v1';
  constructor(private readonly endpoint: AcrolinxEndpoint) {}

  getConfig(accessToken: string): Promise<IntegrationServiceConfig> {
    return this.endpoint.getJsonFromPath<IntegrationServiceConfig>(this.constructFullPath('/config'), accessToken, {
      serviceType: ServiceType.ACROLINX_ONE,
    });
  }

  sendLogs(appName: string, logs: LogBufferEntry[], accessToken: string): Promise<IntegrationServiceResponse> {
    return this.endpoint.postJsonToPath<IntegrationServiceResponse>(
      this.constructFullPath('/logs'),
      {
        appName,
        logs,
      },
      accessToken,
      { serviceType: ServiceType.ACROLINX_ONE },
    );
  }

  private constructFullPath(path: string): string {
    return this.intServiceBasePath + path;
  }
}
