# Blog de verano

PWA para dos personas: Mendoza ↔ Hawái, del 26/11/2026 al 15/03/2027.

- Relojes en vivo de Mendoza y Hawái, con el día del viaje y la cuenta regresiva al 15 de marzo
- Feed por día con mensajitos, canciones (link de Spotify con reproductor embebido), lugares y fotos
- **Foto del día**: una vez por día, a una hora al azar, les llega una notificación a los dos al mismo tiempo y las fotos quedan lado a lado
- **Pienso en vos**: un botón que le manda una notificación al otro
- **Mapa** con el recorrido (Leaflet + OpenStreetMap)
- Notificaciones push cuando el otro publica algo

Stack: Vite + React + TypeScript, `vite-plugin-pwa` y Firebase (Auth, Firestore, Storage, Cloud Messaging, Functions y Hosting).

## Setup (una sola vez)

1. **Crear el proyecto** en [console.firebase.google.com](https://console.firebase.google.com) y pasarlo al **plan Blaze**. Storage y las Functions programadas lo necesitan, pero con el uso de dos personas el costo queda en USD 0. Conviene poner una alerta de presupuesto de USD 1.
2. **Authentication** → Sign-in method → activar **Correo electrónico/contraseña**. Después, en Users, crear las dos cuentas a mano. La app no tiene registro.
3. **Firestore Database** → crear la base (en modo producción).
4. **Storage** → crear el bucket.
5. **Configuración del proyecto → Tus apps** → agregar una app web y copiar la config.
6. **Configuración del proyecto → Cloud Messaging → Certificados push web** → generar el par de claves y copiar la clave (VAPID).
7. En el repo:
   ```bash
   cp .env.example .env          # pegar la config y la VAPID key
   ```
   - En `.firebaserc`, reemplazar `TU-PROJECT-ID`.
   - En `firestore.rules` **y** `storage.rules`, reemplazar los dos emails.
8. Instalar y deployar:
   ```bash
   npm i -g firebase-tools
   firebase login
   npm install && (cd functions && npm install)
   npm run deploy
   ```
   El deploy sube Hosting, reglas, Storage y Functions. La URL queda en `https://TU-PROJECT-ID.web.app`.

## Instalar en el celular

**iPhone** (iOS 16.4 o más nuevo): abrir la URL en **Safari** → Compartir → **Agregar a inicio**. Después hay que abrirla **desde el ícono** (no desde Safari), entrar, tocar "Activá las notificaciones" y aceptar. En iOS, las notificaciones solo funcionan con la app instalada.

**Android**: abrir la URL en Chrome → "Instalar app" → entrar y activar las notificaciones.

La primera vez que entran, cada uno pone su nombre y elige si está en Mendoza o en Hawái.

## Ajustes

- **Fechas**: `src/config.ts` (`TRIP_START`, `TRIP_END`).
- **Ventana de la foto del día**: `functions/src/index.ts` (`DAILY_FROM_HOUR` / `DAILY_TO_HOUR`, en hora de Mendoza). Por defecto es de 15 a 22 h en Mendoza, que en Hawái son de 8 a 15 h.
- **Colores**: variables al principio de `src/styles.css`.

Las actualizaciones se hacen con `npm run deploy`. La PWA se actualiza sola la próxima vez que la abren, sin reinstalar.

## Desarrollo

```bash
npm run dev
```

Usa el mismo proyecto de Firebase que producción.
