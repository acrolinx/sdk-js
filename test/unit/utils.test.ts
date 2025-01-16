import { isUrlEncoded } from 'src/utils/fetch';
import { describe, expect, test } from 'vitest';

describe('utils', () => {
  describe('fetch', () => {
    test('isURLEncoded', () => {
      const stringOne = 'afdafsdsadas';
      const stringTwo = '1sdfasd%/%%"';
      const stringThree = 'asdb1234"$§%&§23432asdafasd';

      expect(isUrlEncoded(stringOne)).toBe(false);
      expect(isUrlEncoded(encodeURIComponent(stringOne))).toBe(false); // is not encoded because encoding has no effect

      expect(isUrlEncoded(stringTwo)).toBe(false);
      expect(isUrlEncoded(encodeURIComponent(stringTwo))).toBe(true);

      expect(isUrlEncoded(stringThree)).toBe(false);
      expect(isUrlEncoded(encodeURIComponent(stringThree))).toBe(true);
    });
  });
});
