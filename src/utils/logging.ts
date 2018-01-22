/* tslint:disable:no-console */
let LOGGING_ENABLED = false;

export function log(...args: any[]) {
  if (!LOGGING_ENABLED) {
    return;
  }
  try {
    console.log(...args);
  } catch (e) {
    // What should we do, log the problem ? :-)
  }
}

export function error(...args: any[]) {
  if (!LOGGING_ENABLED) {
    return;
  }
  try {
    console.error(...args);
  } catch (e) {
    // What should we do, log the problem ? :-)
  }
}

export function setLoggingEnabled(enabled: boolean) {
  LOGGING_ENABLED = enabled;
}

