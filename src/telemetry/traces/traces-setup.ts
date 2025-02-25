import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { Resource } from '@opentelemetry/resources';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OPENTELEMETRY_TRACES_ENDPOINT, SERVICE_NAME } from '../config';

export const setupTraces = () => {
  const provider = new WebTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
    }),
    spanProcessors: [
      new SimpleSpanProcessor(
        new OTLPTraceExporter({
          url: OPENTELEMETRY_TRACES_ENDPOINT,
        }),
      ),
    ],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      new UserInteractionInstrumentation({
        shouldPreventSpanCreation: (_eventType, element, span) => {
          span.setAttribute('target_element_class_name', element.className);
          span.setAttribute('target_element_id', element.id);
          const testId = element.getAttribute('data-testid');
          if (testId) {
            span.setAttribute('target_element_testid', testId);
          }
          return false;
        },
      }),
    ],
  });
};
