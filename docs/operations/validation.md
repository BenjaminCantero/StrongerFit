    # Validación de la base inicial

29 de octubre de 2026.

- `npm run check`: TypeScript, Deno y lint aprobados; 12 pruebas Vitest aprobadas.
- Expo Doctor: 21 de 21 verificaciones aprobadas.
- Exportación de bundles Android y web: aprobada.
- Navegador Chromium a 390 × 844 y 1440 × 900: interfaz revisada visualmente,
  navegación a Entrenar comprobada y sin excepciones de ejecución.
- Pantalla de conexión: solicitud real desde la app web a Deno en el puerto 8000,
  respuesta del contrato de health y estado de éxito visibles.
- `npm ci --dry-run --ignore-scripts`: lockfile consistente.

No se ejecutó un APK/emulador Android, Supabase local completo ni un proyecto
remoto. No hay credenciales configuradas ni migraciones de dominio aplicadas.
La validación de Auth en Vitest usa mocks; faltan las pruebas reales de sesión y
RLS cuando se implemente el primer flujo persistente.

Avisos de paquetes pendientes: [dependencias](dependencies.md).
