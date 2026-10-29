import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { HealthResponseSchema, IdentityResponseSchema, ProblemSchema } from '@strongerfit/contracts';
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
