import { defineConfig } from 'vitest/config';

// Pruebas de repositorios contra el stack local de Supabase (RLS real). Requiere
// `npm run supabase:start`; las claves se leen de `supabase status` en globalSetup.
export default defineConfig({
  test: {
    include: ['frontend/src/**/*.integration.test.ts'],
    environment: 'node',
    globalSetup: ['frontend/test/integration/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
