import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../../../backend/src/app';
import { fetchHealth } from './api';

afterEach(() => vi.unstubAllGlobals());

it('el cliente móvil consume la respuesta real de la API con el contrato compartido', async () => {
  const app = createApp();
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => app.request(url, init));
  expect(await fetchHealth('http://localhost:8000/')).toEqual({
    status: 'ok', service: 'strongerfit-api', version: '0.1.0',
  });
});

it('rechaza respuestas exitosas que incumplen el contrato', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'unexpected' })));
  await expect(fetchHealth('http://localhost:8000')).rejects.toThrow();
});

it('informa una respuesta HTTP fallida', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
  await expect(fetchHealth('http://localhost:8000')).rejects.toThrow('503');
});
