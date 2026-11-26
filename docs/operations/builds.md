# Builds de Android con EAS (BL-01)

Requisitos SRS: RNF-11, RNF-26 y CA-20. Expo Go no sirve para medir el aviso del
temporizador ni las restricciones nativas, por eso hay builds propios. Se compilan en
la **nube de EAS** (servidores de Expo); la firma la gestiona EAS. El build local
(`eas build --local`) queda como opción secundaria (ver "Build local (opcional)").

## Cómo funciona el build en la nube

1. `npm run -w frontend build:android:preview` (o `:dev` / `:prod`) sube el proyecto a
   EAS. El archivo se arma respetando `.gitignore`, así que `frontend/.env` no se sube.
2. EAS compila en servidores de Expo y entrega un enlace y un QR para descargar el APK
   (`preview`/`development`) o el AAB (`production`).
3. Estado de los builds: `npx eas-cli@27.11.0 build:list --platform android --limit 5`
   o en expo.dev, proyecto `@beeinx/strongerfit`, sección Builds.
4. Plan gratuito: hay cola de espera y un cupo mensual de builds. No lances builds
   innecesarios.
5. La firma sigue gestionada por EAS (ya existe el keystore "Build Credentials (default)").

## Requisitos

- Cuenta Expo (gratuita) con acceso al proyecto `strongerfit`.
- Dependencias instaladas con `npm ci` en la raíz. `eas-cli` no es dependencia del
  proyecto (expo-doctor lo desaconseja): los scripts lo ejecutan con
  `npx --yes eas-cli@27.11.0`.
- Un teléfono Android 10 o superior (API 29, el `minSdkVersion` de la app). Para instalar
  desde el PC, depuración USB y `adb`.
- Solo para el build local: Android SDK y Java 17 (ver "Build local (opcional)").

## Pasos únicos (los hace la persona dueña de la cuenta Expo)

```sh
cd frontend
npx eas-cli@27.11.0 login
npx eas-cli@27.11.0 init
```

1. `eas init` crea el proyecto en Expo. Como la configuración es dinámica
   (`app.config.ts`), no puede escribir el `projectId`: imprime el ID y las
   instrucciones. Pega el ID en la constante `EAS_PROJECT_ID` de
   `frontend/app.config.ts` y haz commit (no es secreto). No sirve `frontend/.env`:
   está en `.gitignore` y no entra al archivo que se sube a EAS.
2. La primera `npm run build:android:preview` (o `:prod`) pregunta si EAS genera el
   keystore de Android: responde que sí. EAS lo guarda en tu cuenta (credenciales
   gestionadas). Revisa con `npx eas-cli@27.11.0 credentials` (no hace falta nada más).
3. `eas.json` usa `appVersionSource: "remote"`: el `versionCode` vive en EAS y
   `production` lo incrementa solo (`autoIncrement`).

> **Advertencia:** no pierdas el acceso a la cuenta Expo. La clave de firma de la app
> publicada en Google Play no se puede cambiar después de publicar (solo existe la
> rotación de la clave de subida). Activa 2FA y guarda un respaldo del keystore
> (`npx eas-cli@27.11.0 credentials` permite descargarlo; no lo versiones: `*.jks`, `*.keystore` y
> `credentials.json` están en `.gitignore`).

## Perfiles

Todos se ejecutan desde la raíz con `npm run -w frontend <script>` o desde `frontend/`.
En la nube, el artefacto se descarga desde el enlace de EAS. Las variantes `:local`
(p. ej. `build:android:preview:local`) dejan la salida en `dist-builds/` (fuera de git).

| Perfil | Script | Paquete | Nombre | Backend | Tipo | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| `development` | `build:android:dev` | `cl.strongerfit.app.dev` | StrongerFit Dev | El de `frontend/.env` (stack local por LAN) | APK, dev client, interno | Desarrollo con Metro; permite HTTP (`usesCleartextTraffic`) |
| `preview` | `build:android:preview` | `cl.strongerfit.app.preview` | StrongerFit Preview | Supabase alojado | APK, interno | Pruebas reales y checklist BL-01 |
| `production` | `build:android:prod` | `cl.strongerfit.app` | StrongerFit | Supabase alojado | AAB, `autoIncrement` | Google Play |

Los tres paquetes distintos permiten tenerlos instalados a la vez en el mismo teléfono.
`allowBackup: false` en todos; HTTP en claro solo en `development`.

- **development** no fija URLs de Supabase en `eas.json`: en local toma `EXPO_PUBLIC_*`
  de `frontend/.env` (ver `.env.example`; en teléfono físico usa la IP de la LAN del PC,
  `http://IP_LAN_DE_TU_PC:54321` y `:8000`). Ejecuta el stack local antes.
  **Pendiente:** el build `development` en la nube sigue usando `APP_VARIANT=development`,
  pero como `.env` no se sube, para apuntar al stack local por la LAN hay que definir las
  variables `EXPO_PUBLIC_*` del perfil `development` en `eas.json` o como variables de
  entorno de EAS (environment `development`). Aún no está hecho; no se ha cambiado
  `eas.json`.
- **preview** y **production** fijan en `eas.json` la URL del backend alojado
  (`https://xwzpdaiaxmkcnepqxcky.supabase.co`, API en `/functions/v1/api`) y la clave
  publishable. Esa clave es pública (RLS protege los datos). NUNCA va `service_role` ni
  una clave secreta.

### Precedencia de variables

Revisado en `eas-cli` 27.11.0 (`node_modules/eas-cli/build/build/local.js`,
`evaluateConfigWithEnvVarsAsync.js`, `vcs/local.js`):

- En la nube, las `env` del perfil de `eas.json` se aplican sobre las variables de
  entorno de EAS (environment del perfil) y las del perfil ganan (el CLI lo avisa en la
  salida).
- El CLI empaqueta el proyecto con git y respeta `.gitignore`; `frontend/.env` está
  ignorado, así que **no se sube** y no puede filtrarse a `preview` ni `production`.
- Solo build local: `local.js` hace `{ ...env, ...process.env }`, es decir, las variables
  exportadas en tu shell **ganan** sobre `eas.json`. No tengas exportadas
  `EXPO_PUBLIC_*` ni `APP_VARIANT` al compilar `preview`/`production`
  (`env | grep -E 'EXPO_PUBLIC|APP_VARIANT'` debe salir vacío). En la nube no aplica.
- Si creas `frontend/.easignore`, deja de usarse `.gitignore`: repite allí `.env*`.
- Fuente: https://docs.expo.dev/eas/environment-variables/ y
  https://docs.expo.dev/build-reference/variables/ .

## Instalar

Opción A: abre el enlace del build (o escanea el QR) en el teléfono y descarga el APK.

Opción B: descarga el APK al PC e instala con `adb`:

```sh
adb devices
adb install -r <archivo>.apk
```

(En un build local, el archivo está en `dist-builds/strongerfit-preview.apk`.)

El `.aab` de producción no se instala con `adb`: se sube a Google Play (pista interna).

## Checklist BL-01 (Android 10+ real, perfil `preview`)

1. Instalar el APK `preview` y abrir la app (aparece como "StrongerFit Preview").
2. Recorrer todos los flujos del criterio 11.3 siguiendo los pasos de
   [H-2 en validation.md](validation.md#h-2--datos-que-sobreviven-a-reinstalar),
   incluida la reinstalación con la misma cuenta y el aislamiento entre cuentas.
3. Confirmar que no hay datos de ejemplo ni direcciones locales (el bundle se escanea con
   `npm run scan:bundle`).
4. Medición del aviso del temporizador (CA-20):
   1. Conceder el permiso de notificaciones y desactivar la optimización de batería
      para la app solo si ya viene así por defecto; anota el estado real.
   2. Iniciar un descanso de N segundos (por ejemplo 60 s) en una sesión.
   3. Pasar la app a segundo plano y apagar la pantalla.
   4. Medir con cronómetro el tiempo entre el fin teórico (N s) y la llegada del aviso
      (sonido, vibración o notificación). Repetir 3 veces y también con N = 90 y 180 s.
   5. Anotar el retraso en segundos; compararlo con el umbral de CA-20 del SRS.

### Registro de mediciones

| Dispositivo | Android | Perfil | N (s) | Retraso medido (s) | Resultado |
| --- | --- | --- | --- | --- | --- |
|  |  | preview |  |  |  |

## Build local (opcional)

Alternativa a la nube, con los scripts `build:android:dev:local`,
`build:android:preview:local` y `build:android:prod:local` (`eas build --local`, salida
en `dist-builds/`).

Requisitos: Android SDK y Java 17 (`ANDROID_HOME` y `JAVA_HOME` definidos).

> **Advertencia de RAM:** el build local compila C++ para 4 ABIs en paralelo; con 16 GB
> puede congelar el PC. Por eso el flujo principal es la nube.

Mitigación en `~/.gradle/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
org.gradle.workers.max=4
org.gradle.parallel=false
kotlin.daemon.jvmargs=-Xmx2g
# Solo para pruebas; NUNCA para el AAB de Play (necesita todas las ABIs):
reactNativeArchitectures=arm64-v8a
```

Nota: un `PATH` gigante (más de 128 KiB, p. ej. por exports duplicados en `~/.zshrc`)
hace que el `npx` anidado del build salga con código 249 sin mensaje. Revisa
`echo -n "$PATH" | wc -c`.
