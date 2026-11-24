import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['backend/tests/**/*.test.ts', 'packages/**/*.test.ts', 'frontend/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
});
