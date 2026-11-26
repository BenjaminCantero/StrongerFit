import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findViolations, scanDirectory } from './scan-bundle.mjs';

describe('scan-bundle (CA-30)', () => {
  it('accepts a clean bundle', () => {
    expect(findViolations('var a="StrongerFit";var b="Vista previa";var c="RF-04 CA-24";', 'a.js')).toEqual([]);
  });

  it.each([
    ['Camila Santander', 'sample profile name'],
    ['assets/images/preview-avatar.jpg', 'sample avatar'],
    ['Mostrar datos de ejemplo', 'sample data toggle'],
    ['Comprobando conexión…', 'development status screen'],
    ['http://10.0.2.2:8000', 'local backend address'],
    ['http://localhost:8000', 'local backend address'],
    ['// SY-03 pendiente', 'schedule task id'],
    ['"P-01"', 'schedule task id'],
    ['"H-2"', 'schedule task id'],
  ])('rejects %s', (text, label) => {
    expect(findViolations(text, 'a.js')).toEqual([expect.objectContaining({ label })]);
  });

  it('does not flag ids embedded in longer tokens', () => {
    expect(findViolations('sha-1 "XSY-031" "B-1" "H-9" "AB-12"', 'a.js')).toEqual([]);
  });

  it('scans nested files and reports the marker', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scan-bundle-'));
    try {
      writeFileSync(join(dir, 'clean.js'), 'StrongerFit');
      writeFileSync(join(dir, 'font.ttf'), 'SY-03');
      writeFileSync(join(dir, 'bad.hbc'), Buffer.from('\u0000Camila Santander\u0000', 'latin1'));
      const result = scanDirectory(dir);
      expect(result.files).toBe(2);
      expect(result.sawMarker).toBe(true);
      expect(result.violations).toEqual([expect.objectContaining({ file: 'bad.hbc', label: 'sample profile name' })]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
