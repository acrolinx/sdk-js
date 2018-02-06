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
