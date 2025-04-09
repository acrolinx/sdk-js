import { BrowserEngine, BrowserNames, IntegrationDetails } from '../interfaces/integration';

export const getCommonMetricAttributes = (integrationDetails: IntegrationDetails) => {
  return {
    'sidebar-version': integrationDetails.system.sidebar?.version ?? 'unknown',
    'browser-name': integrationDetails.system.browser?.name ?? BrowserNames.other,
    'browser-engine': integrationDetails.system.browser?.engine ?? BrowserEngine.other,
  };
};
