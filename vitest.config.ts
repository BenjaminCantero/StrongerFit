import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['backend/tests/**/*.test.ts', 'packages/**/*.test.ts', 'frontend/src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    // RNF-12: los motores y contratos compartidos mantienen al menos 80 % de cobertura.
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', 'packages/contracts/src/database.types.ts'],
      reporter: ['text-summary'],
      // CA-07: cada motor cumple el mínimo por separado, además del total.
      thresholds: {
        statements: 80, branches: 80, functions: 80, lines: 80,
        'packages/training-engine/src/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'packages/nutrition-engine/src/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
});
