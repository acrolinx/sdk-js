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

import { describe, expect, test } from 'vitest';
import { ErrorType, HttpRequest } from '../../src/errors';

export function testIf(condition: boolean | string | undefined, testName: string, testFn: (done: () => void) => void) {
  if (condition) {
    test(testName, testFn);
  } else {
    test.skip(testName, testFn);
  }
}

export function describeIf(condition: boolean | string | undefined, testName: string, f: () => void) {
  if (condition) {
    describe(testName, f as any);
  } else {
    describe.skip(testName, f as any);
  }
}

export async function expectFailingPromise<E = any>(
  promise: Promise<any>,
  expectedErrorType: ErrorType,
  expectedHttpRequest?: HttpRequest,
): Promise<E> {
  let unexpectedSuccessfulResult: any;
  try {
    unexpectedSuccessfulResult = await promise;
  } catch (e) {
    expect(e.type).toEqual(expectedErrorType);
    if (expectedHttpRequest) {
      expect(e.httpRequest).toEqual(expectedHttpRequest);
    }
    return e;
  }

  throw new Error('Unexpected success ' + JSON.stringify(unexpectedSuccessfulResult));
}
