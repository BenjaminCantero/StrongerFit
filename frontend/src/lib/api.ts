import { HealthResponseSchema } from '@strongerfit/contracts';

export async function fetchHealth(baseUrl: string, signal?: AbortSignal) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/health`, { signal });
  if (!response.ok) throw new Error(`La API respondió con estado ${response.status}.`);
  return HealthResponseSchema.parse(await response.json());
}
