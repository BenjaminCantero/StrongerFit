import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { AccountDeletionSchema, HealthResponseSchema, IdentityResponseSchema, ProblemSchema } from '@strongerfit/contracts';
import { createClient } from '@supabase/supabase-js';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import type { ApiConfig } from './lib/config.ts';
import { problem } from './lib/problem.ts';
import { type AuthEnv, requireAuth } from './middleware/auth.ts';

export function createApp(config: ApiConfig = {}) {
  const app = new OpenAPIHono<AuthEnv>({
    defaultHook: (result, c) => {
      if (!result.success) return problem(c, 400, 'Solicitud inválida', 'Revisa los datos enviados.');
    },
  }).basePath(config.basePath ?? '');

  app.use('*', secureHeaders());
  app.use('*', cors({
    origin: config.allowedOrigins ?? ['http://localhost:8081'],
    allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }));
  app.use('*', bodyLimit({
    maxSize: 1024 * 1024,
    onError: (c) => problem(c, 413, 'Solicitud demasiado grande', 'El límite es 1 MiB.'),
  }));

  app.openapi(createRoute({
    method: 'get', path: '/v1/health', tags: ['Sistema'],
    summary: 'Comprobar que la API está disponible (sin consultar la base de datos)',
    responses: {
      200: { description: 'API disponible', content: { 'application/json': { schema: HealthResponseSchema } } },
    },
  }), (c) => c.json({ status: 'ok', service: 'strongerfit-api', version: '0.1.0' } as const, 200));

  app.use('/v1/me', requireAuth(config));
  app.openapi(createRoute({
    method: 'get', path: '/v1/me', tags: ['Identidad'],
    summary: 'Identidad autenticada; el perfil se implementará en la siguiente etapa',
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Usuario actual', content: { 'application/json': { schema: IdentityResponseSchema } } },
      401: { description: 'Sesión inválida', content: { 'application/problem+json': { schema: ProblemSchema } } },
      503: { description: 'Auth no configurado', content: { 'application/problem+json': { schema: ProblemSchema } } },
    },
  }), (c) => c.json({ id: c.get('userId') }, 200));

  // CU-08: la eliminación de la cuenta se programa con un plazo de gracia de 4 días y se puede
  // cancelar. Todo pasa por el cliente del usuario (RLS); el borrado real lo hace solo
  // process_account_deletions() desde el cron, nunca esta API.
  app.use('/v1/me/deletion', requireAuth(config));
  app.use('/v1/me/deletion/cancel', requireAuth(config));
  const userClient = (authorization: string | undefined) => createClient(config.supabaseUrl ?? '', config.supabaseAnonKey ?? '', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: authorization ?? '' } },
  });
  // @hono/zod-openapi solo tipa las respuestas 'application/json'; las de error se documentan
  // como problem+json, así que se devuelven como `never` para no chocar con el tipo del handler.
  const fail = (c: Parameters<typeof problem>[0], status: Parameters<typeof problem>[1], title: string, detail: string): never =>
    problem(c, status, title, detail) as never;
  const failure = (c: Parameters<typeof problem>[0]) =>
    fail(c, 502, 'No se pudo completar la solicitud', 'Inténtalo de nuevo más tarde.');
  const errorResponses = {
    401: { description: 'Sesión inválida', content: { 'application/problem+json': { schema: ProblemSchema } } },
    502: { description: 'Fallo al consultar la base de datos', content: { 'application/problem+json': { schema: ProblemSchema } } },
    503: { description: 'Servicio no configurado', content: { 'application/problem+json': { schema: ProblemSchema } } },
  } as const;

  app.openapi(createRoute({
    method: 'delete', path: '/v1/me', tags: ['Identidad'],
    summary: 'Solicitar la eliminación de la cuenta propia (se ejecuta en 4 días y se puede cancelar)',
    security: [{ bearerAuth: [] }],
    responses: {
      202: { description: 'Eliminación programada', content: { 'application/json': { schema: AccountDeletionSchema } } },
      ...errorResponses,
    },
  }), async (c) => {
    const { data, error } = await userClient(c.req.header('Authorization')).rpc('request_account_deletion');
    if (error || typeof data !== 'string') return failure(c);
    return c.json({ status: 'pending' as const, scheduledFor: new Date(data).toISOString() }, 202);
  });

  app.openapi(createRoute({
    method: 'get', path: '/v1/me/deletion', tags: ['Identidad'],
    summary: 'Estado de la solicitud de eliminación de la cuenta',
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Sin solicitud abierta o pendiente', content: { 'application/json': { schema: AccountDeletionSchema } } },
      ...errorResponses,
    },
  }), async (c) => {
    const { data, error } = await userClient(c.req.header('Authorization')).from('data_requests')
      .select('scheduled_for').eq('kind', 'delete').in('status', ['pending', 'processing']).maybeSingle();
    if (error) return failure(c);
    if (!data?.scheduled_for) return c.json({ status: 'none' as const }, 200);
    return c.json({ status: 'pending' as const, scheduledFor: new Date(data.scheduled_for).toISOString() }, 200);
  });

  app.openapi(createRoute({
    method: 'post', path: '/v1/me/deletion/cancel', tags: ['Identidad'],
    summary: 'Cancelar la eliminación de la cuenta dentro del plazo',
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Eliminación cancelada', content: { 'application/json': { schema: AccountDeletionSchema } } },
      404: { description: 'No había una solicitud abierta', content: { 'application/problem+json': { schema: ProblemSchema } } },
      ...errorResponses,
    },
  }), async (c) => {
    const { data, error } = await userClient(c.req.header('Authorization')).rpc('cancel_account_deletion');
    if (error) return failure(c);
    if (data !== true) return fail(c, 404, 'Sin solicitud', 'No hay una eliminación pendiente que cancelar.');
    return c.json({ status: 'none' as const }, 200);
  });

  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
  });
  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'StrongerFit API', version: '0.1.0', description: 'Base inicial del SRS v1.1.' },
  });
  app.notFound((c) => problem(c, 404, 'Recurso no encontrado', 'La ruta solicitada no existe.'));
  app.onError((_error, c) => problem(c, 500, 'Error interno', 'No se pudo completar la solicitud.'));
  return app;
}
