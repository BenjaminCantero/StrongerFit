# Dependencias iniciales

Verificación del 29 de octubre de 2026: Expo SDK 57.0.31 y NativeWind 4.2.7 pasan
Expo Doctor. La elección sigue el soporte explícito de SDK 57 en la documentación
de NativeWind: https://www.nativewind.dev/docs/getting-started/installation

`npm audit` informa avisos transitivos para `zod` 3 usado por Expo CLI, `deepmerge`
usado por la configuración de Expo y `decode-uri-component` en la cadena de
navegación. Revisar con `npm audit` al actualizar; el conteo incluye paquetes padres
y no equivale al número de fallos diferentes.

Los contratos y la API usan Zod 4.6.7, fuera del rango afectado de ese aviso. No se
fuerza Zod 4 dentro de Expo CLI, que declara Zod 3, ni se usa `npm audit fix --force`,
que propone cambiar la versión mayor de Expo. La actualización de estas cadenas
queda pendiente de versiones compatibles del proveedor antes de publicar una beta.

Avisos identificados:
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- https://github.com/advisories/GHSA-gcqx-w48m-w2h4
- https://github.com/advisories/GHSA-vcc3-ghjq-m6fr
