/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    hookTimeout: 60000,
    testTimeout: 60000,
    coverage: {
      thresholds: {
        lines: 93.7,
        functions: 86,
        branches: 81,
        statements: 93.5,
      },
    },
  }
});
