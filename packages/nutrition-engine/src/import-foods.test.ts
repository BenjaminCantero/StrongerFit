/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('valida importación CSV, unidades, faltantes, identidad y determinismo', () => {
  const script = fileURLToPath(new URL('../../../scripts/test_import_foods.py', import.meta.url));
  expect(() => execFileSync('python3', [script], { stdio: 'pipe' })).not.toThrow();
});
