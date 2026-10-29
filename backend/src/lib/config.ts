export type ApiConfig = {
  basePath?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  allowedOrigins?: string[];
};

export function readConfig(get: (key: string) => string | undefined): ApiConfig {
  return {
    supabaseUrl: get('SUPABASE_URL'),
    supabaseAnonKey: get('SUPABASE_ANON_KEY'),
    allowedOrigins: (get('ALLOWED_ORIGINS') ?? 'http://localhost:8081')
      .split(',').map((origin) => origin.trim()).filter(Boolean),
  };
}
