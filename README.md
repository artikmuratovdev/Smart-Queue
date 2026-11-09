# Navbat — Neon-backed electronic queue

The app uses Neon PostgreSQL for durable tickets, a Neon Function (`hello`) for the queue API, and Neon Realtime for live updates. The first API request creates the queue table and its uniqueness indexes. Each browser profile keeps a persistent device ID; the backend allows one active ticket per device ID.

## Run locally

```sh
npm install
npm run build
npm start
```

Open `http://localhost:3000`. If port 3000 is already taken in PowerShell, run `$env:PORT=3001; npm start`. `.env.local` is created by Neon CLI and contains secrets; it is gitignored. The Vite build embeds only the public Function URL and Realtime URL.

## Neon setup

Project `plain-bread-81629763`, branch `production`. `neon.ts` declares Postgres, Realtime origins for localhost ports 3000/3001, and the `hello` queue API Function. Run `neon deploy --env .env.local` after code/config changes. For another frontend domain, add that exact origin to `preview.realtime.allowedOrigins` and the Function CORS origins, then redeploy.

For a hosted static frontend, configure `VITE_QUEUE_API_URL` and `VITE_NEON_REALTIME_URL` as build environment variables. Never expose `DATABASE_URL`, `NEON_REALTIME_SECRET`, or `NAVBAT_REALTIME_SECRET` to the browser.

## API

- `GET /api/state` reads the queue from Postgres.
- `POST /api/tickets` accepts `{ "service": "admission", "deviceId": "..." }`.
- `POST /api/live` seals the read-only queue query for Neon Realtime.
- `POST /api/call`, `/api/finish`, `/api/cancel`, `/api/reset` update the queue.

The current demo does not authenticate operators; protect operator routes before public production use.
