#!/usr/bin/env node
// CA-30 / RNF-29: the production bundle must not ship sample data, task identifiers, the
// development screen or local backend addresses. Run after `expo export` (frontend/dist).
// Files are read as latin1 so ASCII strings are also found inside Hermes bytecode (.hbc).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const forbidden = [
  { label: 'sample profile name', pattern: /Camila Santander/ },
  { label: 'sample avatar', pattern: /preview-avatar/ },
  { label: 'sample data toggle', pattern: /Mostrar datos de ejemplo/ },
  { label: 'development status screen', pattern: /Comprobando conexi/ },
  { label: 'local backend address', pattern: /10\.0\.2\.2|localhost:8000/ },
  { label: 'schedule task id', pattern: /\b(?:P|B|DB|AU|SY|CO|QA|BL|BE|EX|V1)-\d{2}\b|\bH-[1-5]\b/ },
];

const scanned = /\.(?:js|hbc|html|json|map)$/;
const marker = 'StrongerFit';

export function findViolations(text, file) {
  return forbidden.flatMap(({ label, pattern }) => {
    const match = pattern.exec(text);
    return match ? [{ file, label, match: match[0] }] : [];
  });
}

function filesUnder(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

export function scanDirectory(dir) {
  const files = filesUnder(dir).filter((path) => scanned.test(path));
  let sawMarker = false;
  const violations = files.flatMap((path) => {
    const text = readFileSync(path, 'latin1');
    if (text.includes(marker)) sawMarker = true;
    return findViolations(text, relative(dir, path));
  });
  return { files: files.length, sawMarker, violations };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ?? 'frontend/dist';
  let result;
  try {
    result = scanDirectory(dir);
  } catch (error) {
    console.error(`scan-bundle: cannot read ${dir} (${error.message}). Run the export first.`);
    process.exit(1);
  }
  if (!result.files || !result.sawMarker) {
    console.error(`scan-bundle: ${dir} has no app bundle (${result.files} files, marker "${marker}" missing).`);
    process.exit(1);
  }
  for (const v of result.violations) console.error(`${v.file}: ${v.label} (${v.match})`);
  if (result.violations.length) process.exit(1);
  console.log(`scan-bundle: ${result.files} files clean.`);
}
