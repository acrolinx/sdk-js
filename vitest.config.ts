/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  test: {
    hookTimeout: 60000,
    testTimeout: 60000,
    coverage: {
      include: ['src'],
      thresholds: {
        lines: 90,
        functions: 86,
        branches: 81,
        statements: 90,
      },
    },
  },
});
