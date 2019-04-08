import {ErrorType, HttpRequest} from '../../src/errors';

export function testIf(condition: boolean | string | undefined, testName: string, test: (done: () => void) => void) {
  if (condition) {
    it(testName, test);
  } else {
    it.skip(testName, test);
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
  expectedHttpRequest?: HttpRequest
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

  throw(new Error('Unexpected success ' + JSON.stringify(unexpectedSuccessfulResult)));
}
