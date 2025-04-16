import { BrowserNames, IntegrationDetails } from '../interfaces/integration';

export const getCommonMetricAttributes = (integrationDetails: IntegrationDetails) => {
  return {
    'sidebar-version': integrationDetails.systemInfo.sidebarInfo?.version ?? 'unknown',
    'browser-name': integrationDetails.systemInfo.browserInfo?.name ?? BrowserNames.other,
    'integration-name': integrationDetails.name,
  };
};
