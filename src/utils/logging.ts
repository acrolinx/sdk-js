/*
 * Copyright 2018-present Acrolinx GmbH
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

/* tslint:disable:no-console */
let LOGGING_ENABLED = false;

export function log(...args: any[]) {
  if (!LOGGING_ENABLED) {
    return;
  }
  try {
    console.log(...args);
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  } catch (e) {
    // What should we do, log the problem ? :-)
  }
}

export function setLoggingEnabled(enabled: boolean) {
  LOGGING_ENABLED = enabled;
}
