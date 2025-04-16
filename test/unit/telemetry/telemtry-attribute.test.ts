import { expect, describe, it } from 'vitest';
import { getCommonMetricAttributes } from '../../../src/telemetry/metrics/attribute-utils';
import { BrowserNames, IntegrationDetails, IntegrationType } from '../../../src/telemetry/interfaces/integration';

describe('getCommonMetricAttributes', () => {
  it('should return correct attributes when all information is provided', () => {
    const integrationDetails: IntegrationDetails = {
      name: 'test-integration',
      version: '1.0.0',
      type: IntegrationType.authoring,
      systemInfo: {
        sidebarInfo: {
          version: '2.0.0',
        },
        browserInfo: {
          name: BrowserNames.chrome,
          version: '120.0.0',
        },
      },
    };

    const attributes = getCommonMetricAttributes(integrationDetails);

    expect(attributes).to.deep.equal({
      'sidebar-version': '2.0.0',
      'browser-name': BrowserNames.chrome,
      'integration-name': 'test-integration',
    });
  });

  it('should return default values when sidebar information is missing', () => {
    const integrationDetails: IntegrationDetails = {
      name: 'test-integration',
      version: '1.0.0',
      type: IntegrationType.authoring,
      systemInfo: {
        browserInfo: {
          name: BrowserNames.chrome,
          version: '120.0.0',
        },
      },
    };

    const attributes = getCommonMetricAttributes(integrationDetails);

    expect(attributes).to.deep.equal({
      'sidebar-version': 'unknown',
      'browser-name': BrowserNames.chrome,
      'integration-name': 'test-integration',
    });
  });

  it('should return default values when browser information is missing', () => {
    const integrationDetails: IntegrationDetails = {
      name: 'test-integration',
      version: '1.0.0',
      type: IntegrationType.authoring,
      systemInfo: {
        sidebarInfo: {
          version: '2.0.0',
        },
      },
    };

    const attributes = getCommonMetricAttributes(integrationDetails);

    expect(attributes).to.deep.equal({
      'sidebar-version': '2.0.0',
      'browser-name': BrowserNames.other,
      'integration-name': 'test-integration',
    });
  });

  it('should handle different browser types correctly', () => {
    const testCases = [
      { name: BrowserNames.firefox },
      { name: BrowserNames.safari },
      { name: BrowserNames.edge },
      { name: BrowserNames.javafx },
    ] as const;

    testCases.forEach(({ name }) => {
      const integrationDetails: IntegrationDetails = {
        name: 'test-integration',
        version: '1.0.0',
        type: IntegrationType.authoring,
        systemInfo: {
          sidebarInfo: {
            version: '2.0.0',
          },
          browserInfo: {
            name,
            version: '120.0.0',
          } as any,
        },
      };

      const attributes = getCommonMetricAttributes(integrationDetails);

      expect(attributes).to.deep.equal({
        'sidebar-version': '2.0.0',
        'browser-name': name,
        'integration-name': 'test-integration',
      });
    });
  });

  it('should handle empty system object', () => {
    const integrationDetails: IntegrationDetails = {
      name: 'test-integration',
      version: '1.0.0',
      type: IntegrationType.authoring,
      systemInfo: {},
    };

    const attributes = getCommonMetricAttributes(integrationDetails);

    expect(attributes).to.deep.equal({
      'sidebar-version': 'unknown',
      'browser-name': BrowserNames.other,
      'integration-name': 'test-integration',
    });
  });
});
