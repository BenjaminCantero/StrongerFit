import { execFileSync } from 'node:child_process';
import type { TestProject } from 'vitest/node';

export type SupabaseTestEnv = { url: string; anonKey: string; serviceKey: string };

declare module 'vitest' {
  export interface ProvidedContext { supabase: SupabaseTestEnv }
}

// Lee URL y claves del stack local. La clave de servicio solo vive en el proceso de prueba
// (para crear usuarios); el código de la app nunca la usa.
export default function setup(project: TestProject) {
  const output = execFileSync('npx', ['supabase', 'status', '--workdir', 'backend', '-o', 'env'], { encoding: 'utf8' });
  const env = Object.fromEntries(output.split('\n').map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter((match) => match !== null).map((match) => [match[1], match[2]]));
  if (!env.API_URL || !env.ANON_KEY || !env.SERVICE_ROLE_KEY) throw new Error('El stack local no está corriendo: npm run supabase:start');
  project.provide('supabase', { url: env.API_URL, anonKey: env.ANON_KEY, serviceKey: env.SERVICE_ROLE_KEY });
}
