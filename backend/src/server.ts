import { createApp } from './app.ts';
import { readConfig } from './lib/config.ts';

const app = createApp(readConfig((key) => Deno.env.get(key)));
const port = Number(Deno.env.get('PORT') ?? 8000);
Deno.serve({ port, hostname: '0.0.0.0' }, app.fetch);
