import { BrowserEngine, BrowserNames, IntegrationDetails } from '../interfaces/integration';

export const getCommonMetricAttributes = (integrationDetails: IntegrationDetails) => {
  return {
    'sidebar-version': integrationDetails.systemInfo.sidebarInfo?.version ?? 'unknown',
    'browser-name': integrationDetails.systemInfo.browserInfo?.name ?? BrowserNames.other,
    'browser-engine': integrationDetails.systemInfo.browserInfo?.engine ?? BrowserEngine.other,
  };
};
