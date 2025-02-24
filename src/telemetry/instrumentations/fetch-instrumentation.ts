import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

export const initFetchInstrumentation = () => {
  const fetchInstrumentation = new FetchInstrumentation({
    clearTimingResources: false,
  });
  registerInstrumentations({
    instrumentations: [fetchInstrumentation],
  });
};
