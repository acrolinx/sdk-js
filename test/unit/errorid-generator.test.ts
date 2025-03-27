import { expect, test } from 'vitest';
import { ErrorIdGenerator } from '../../src/utils/errorid-generator';

test('ErrorIdGenerator generates unique 6-digit IDs', () => {
  const generator = new ErrorIdGenerator();
  const ids: string[] = [];

  for (let i = 0; i < 1000; i++) {
    const id = generator.generateUniqueErrorIdString();
    expect(id.length).toBe(6);
    expect(ids.includes(id)).toBe(false); // Check uniqueness
    ids.push(id);
  }
});

test('ErrorIdGenerator generates IDs without zeros', () => {
  const generator = new ErrorIdGenerator();

  for (let i = 0; i < 100; i++) {
    const id = generator.generateUniqueErrorIdString();
    expect(id).toMatch(/^[1-9]{6}$/); // Regex to check for 6 digits, 1-9
  }
});

test('ErrorIdGenerator reset() method clears generated IDs', () => {
  const generator = new ErrorIdGenerator();

  generator.generateUniqueErrorIdString();
  generator.generateUniqueErrorIdString();
  generator.reset();

  const ids = generator.getGeneratedIds();
  expect(ids.length).toBe(0);

  // Ensure that after reset, the same ID can be generated again.
  const newId = generator.generateUniqueErrorIdString();
  expect(newId.length).toBe(6);
});

test('ErrorIdGenerator getGeneratedIds() returns the correct array', () => {
  const generator = new ErrorIdGenerator();
  const id1 = generator.generateUniqueErrorId();
  const id2 = generator.generateUniqueErrorId();
  const id3 = generator.generateUniqueErrorId();

  const generatedIds = generator.getGeneratedIds();
  expect(generatedIds).toEqual([id1, id2, id3]);
});

test('ErrorIdGenerator generates the correct amount of numbers', () => {
  const generator = new ErrorIdGenerator();
  let counter = 0;
  while (generator.getGeneratedIds().length < 500) {
    generator.generateUniqueErrorId();
    counter++;
  }
  expect(counter).toBe(500);
});

test('ErrorIdGenerator generates string ids', () => {
  const generator = new ErrorIdGenerator();
  const id = generator.generateUniqueErrorIdString();
  expect(typeof id).toBe('string');
});
