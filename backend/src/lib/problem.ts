import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function problem(c: Context, status: ContentfulStatusCode, title: string, detail: string) {
  return c.json({ type: 'about:blank', title, status, detail }, status, {
    'Content-Type': 'application/problem+json',
  });
}
