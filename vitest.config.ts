/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    hookTimeout: 60000,
    testTimeout: 60000,
    coverage: {
      include: ['src'],
      thresholds: {
        lines: 92,
        functions: 86,
        branches: 81,
        statements: 92,
      },
    },
  }
});
