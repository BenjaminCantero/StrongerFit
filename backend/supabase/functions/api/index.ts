import { createApp } from '../../../src/app.ts';
import { readConfig } from '../../../src/lib/config.ts';

// El gateway de Supabase conserva el nombre de la función en la ruta.
const app = createApp({ ...readConfig((key) => Deno.env.get(key)), basePath: '/api' });
Deno.serve(app.fetch);
