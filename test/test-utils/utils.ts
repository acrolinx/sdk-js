import {ErrorType} from '../../src/errors';

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

export async function expectFailingPromise(promise: Promise<any>, expectedErrorType: ErrorType) {
  let unexpectedSuccessfulResult: any;
  try {
    unexpectedSuccessfulResult = await promise;
  } catch (e) {
    expect(e.type).toEqual(expectedErrorType);
  }
  if (unexpectedSuccessfulResult) {
    throw(new Error('Unexpected success ' + JSON.stringify(unexpectedSuccessfulResult)));
  }
}
