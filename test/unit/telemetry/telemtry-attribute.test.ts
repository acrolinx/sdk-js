import { expect, describe, it } from 'vitest';
import { getCommonMetricAttributes } from '../../../src/telemetry/metrics/attribute-utils';
import {
  BrowserEngine,
  BrowserNames,
  IntegrationDetails,
  IntegrationType,
} from '../../../src/telemetry/interfaces/integration';

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
          engine: BrowserEngine.blink,
        },
      },
    };

    const attributes = getCommonMetricAttributes(integrationDetails);

    expect(attributes).to.deep.equal({
      'sidebar-version': '2.0.0',
      'browser-name': BrowserNames.chrome,
      'browser-engine': BrowserEngine.blink,
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
          engine: BrowserEngine.blink,
        },
      },
    };

    const attributes = getCommonMetricAttributes(integrationDetails);

    expect(attributes).to.deep.equal({
      'sidebar-version': 'unknown',
      'browser-name': BrowserNames.chrome,
      'browser-engine': BrowserEngine.blink,
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
      'browser-engine': BrowserEngine.other,
    });
  });

  it('should handle different browser types correctly', () => {
    const testCases = [
      { name: BrowserNames.firefox, engine: BrowserEngine.gecko },
      { name: BrowserNames.safari, engine: BrowserEngine.webkit },
      { name: BrowserNames.edge, engine: BrowserEngine.blink },
      { name: BrowserNames.javafx, engine: BrowserEngine.webkit },
    ] as const;

    testCases.forEach(({ name, engine }) => {
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
            engine,
          } as any,
        },
      };

      const attributes = getCommonMetricAttributes(integrationDetails);

      expect(attributes).to.deep.equal({
        'sidebar-version': '2.0.0',
        'browser-name': name,
        'browser-engine': engine,
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
      'browser-engine': BrowserEngine.other,
    });
  });
});
