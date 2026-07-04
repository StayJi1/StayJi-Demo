# Backend Connection Audit

Scope: backend connection issues only. Reviewed `localhost:3000`, env files, frontend API URLs, proxy config, Vercel rewrites, and backend CORS. Secret values were not copied into this document.

Audit date: June 3, 2026.

## Executive Summary

The local frontend is configured to call `http://localhost:3000`, and a backend process is currently listening there. A direct local request to `/` returned `200 OK` with `StayJi Backend Running Successfully`.

The biggest deployment risk is CORS drift. `pgfinder-backend/.env` defines `CORS_ORIGINS`, but `pgfinder-backend/app.js` does not read it. The backend uses a hardcoded origin list instead. As a result, `https://stayji-git-main-stayji.vercel.app` exists in `.env` but was rejected with `CORS_NOT_ALLOWED`.

There is no Vite proxy. All frontend API requests go directly through `VITE_API_BASE_URL` or the hardcoded production fallback in `axiosClient.js`.

## Localhost:3000

### Current Status

- `pgfinder-backend/.env` sets `PORT=3000`.
- `pgfinder-backend/app.js` uses `process.env.PORT || 3000`.
- `pgfinder-backend/package.json` starts the app with `node app.js`.
- A Node process is listening on TCP port `3000`.
- Outside the sandbox, this command returned `200 OK`:

```bash
curl -i http://localhost:3000/
```

Response body:

```text
StayJi Backend Running Successfully
```

### Observed Local API Check

Allowed origin test:

```bash
curl -i -H 'Origin: http://localhost:5173' http://localhost:3000/client/city-options
```

Result:

- Status: `200 OK`
- Header: `Access-Control-Allow-Origin: http://localhost:5173`
- Body: JSON success response with city options.

Rejected origin test:

```bash
curl -i -H 'Origin: https://stayji-git-main-stayji.vercel.app' http://localhost:3000/client/city-options
```

Result:

- Status: `403 Forbidden`
- Error code: `CORS_NOT_ALLOWED`
- Reason: origin exists in `.env`, but not in the hardcoded CORS list.

## Env Files

### Backend Env

File: `pgfinder-backend/.env`

Keys present:

- `DATABASE`: set
- `PORT`: set to `3000`
- `CORS_ORIGINS`: set
- `SESSION_SECRET`: set

Issue:

- `CORS_ORIGINS` is present but unused by `app.js`.
- The app currently ignores env-configured origins in favor of hardcoded values.

File: `pgfinder-backend/.env.example`

Keys documented:

- `DATABASE`
- `PORT`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `CORS_ORIGINS`

Issue:

- The example implies `CORS_ORIGINS` controls production CORS, but current app code does not consume it.

### Frontend Env

File: `pgfinder-frontend/.env`

Keys present:

- `VITE_API_BASE_URL`: set to `http://localhost:3000`

File: `pgfinder-frontend/.env.example`

Keys documented:

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_MAPS_API_KEY`

Local implication:

- If frontend runs on `http://localhost:5173`, API calls go to `http://localhost:3000`.
- This works only while the backend is running locally on port `3000`.

Production implication:

- Vercel must set `VITE_API_BASE_URL` to the deployed backend URL.
- If the env var is missing in production, the frontend falls back to `https://stayji.onrender.com`.

## API URL Resolution

Source: `pgfinder-frontend/src/api/axiosClient.js`

Current logic:

```js
const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const baseURL = import.meta.env.VITE_API_BASE_URL || (isLocalHost ? 'http://localhost:3000' : 'https://stayji.onrender.com')
```

Observed behavior:

- Localhost frontend without `VITE_API_BASE_URL`: uses `http://localhost:3000`.
- Localhost frontend with current `.env`: uses `http://localhost:3000`.
- Production frontend without `VITE_API_BASE_URL`: uses `https://stayji.onrender.com`.
- Production frontend with `VITE_API_BASE_URL`: uses that exact value.

Connection risks:

- The fallback production backend is hardcoded to `https://stayji.onrender.com`.
- If the real backend is deployed somewhere else, production breaks unless Vercel has the correct `VITE_API_BASE_URL`.
- The frontend error message always says to start Node on port `3000`, even for production failures.

## Proxy Config

Source: `pgfinder-frontend/vite.config.js`

Current config:

- Uses `@vitejs/plugin-react`.
- No `server.proxy` block exists.

Implication:

- Browser requests go directly to the backend origin.
- CORS must be correct because same-origin proxying is not used.
- Local frontend `localhost:5173` to backend `localhost:3000` is cross-origin and depends on backend CORS.

## Vercel Config

Root file: `vercel.json`

- Builds from `pgfinder-frontend`.
- Outputs `pgfinder-frontend/dist`.
- Rewrites all paths to `/index.html`.

Frontend file: `pgfinder-frontend/vercel.json`

- Also rewrites all paths to `/index.html`.

Implication:

- These rewrites support the React SPA.
- They do not proxy `/api` or `/client` to the backend.
- Backend connectivity still depends entirely on `VITE_API_BASE_URL` and CORS.

## CORS

Source: `pgfinder-backend/app.js`

Current hardcoded allowlist:

- `http://localhost:5173`
- `http://localhost:3000`
- `https://pg-finder-alpha.vercel.app`
- `https://stayji-stayji.vercel.app`
- `https://stayji.com`
- `https://www.stayji.com`

Current local-dev pattern:

- Allows `http://localhost:5170` through `http://localhost:5179`.
- Allows `http://127.0.0.1:5170` through `http://127.0.0.1:5179`.

Current behavior:

- Requests with no `Origin` are allowed.
- Allowed browser origins receive `Access-Control-Allow-Origin`.
- Unknown origins throw `CORS Not Allowed`, which now returns a structured `403` error.

Mismatch:

- `pgfinder-backend/.env` includes `https://stayji-git-main-stayji.vercel.app`.
- That origin is not in the hardcoded list.
- It was rejected during the audit.

## Likely Connection Failure Modes

### 1. Frontend Says Backend Is Not Reachable

Likely causes:

- Backend is not running on local port `3000`.
- `VITE_API_BASE_URL` points to the wrong URL.
- Production `VITE_API_BASE_URL` is missing and frontend falls back to `https://stayji.onrender.com`.
- Browser is blocked by CORS before the response reaches frontend code.

### 2. CORS Error From Vercel Preview URLs

Likely cause:

- Preview domain is not in the hardcoded CORS list.
- `CORS_ORIGINS` in `.env` does not help because the backend does not read it.

Affected example:

- `https://stayji-git-main-stayji.vercel.app`

### 3. Backend Starts Locally But Cannot Bind

Observed behavior:

- A second backend start attempt reported `Port 3000 is already in use`.
- One existing Node process was already listening on port `3000`.

Action:

- Stop the existing backend process or set a different `PORT`.
- If changing backend port, update `pgfinder-frontend/.env` to the same port.

### 4. Backend Starts But Database Fails In Sandboxed Runs

Observed behavior:

- In restricted sandbox execution, MongoDB DNS/network failed.
- Outside the sandbox, MongoDB connected.

Interpretation:

- This looked environment/network-permission related, not necessarily an application config failure.

## Required Fixes

1. Make backend CORS read `process.env.CORS_ORIGINS`.

Current `.env` already provides the intended mechanism, but code ignores it.

2. Add active frontend domains to CORS.

At minimum, align code/env with:

- local frontend: `http://localhost:5173`
- production frontend: `https://stayji-stayji.vercel.app`
- preview frontend, if used: `https://stayji-git-main-stayji.vercel.app`
- custom domains: `https://stayji.com`, `https://www.stayji.com`

3. Set production `VITE_API_BASE_URL` explicitly in Vercel.

Do not rely on the hardcoded fallback unless the backend is definitely deployed at:

```text
https://stayji.onrender.com
```

4. Keep local ports aligned.

For local dev:

```text
Backend:  http://localhost:3000
Frontend: http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000
```

5. Decide whether to use direct API calls or a Vite/dev proxy.

Current project uses direct API calls. That is fine, but CORS must stay correct.

## Verification Commands

Local backend health:

```bash
curl -i http://localhost:3000/
```

Local API with allowed CORS origin:

```bash
curl -i -H 'Origin: http://localhost:5173' http://localhost:3000/client/city-options
```

Check which process owns port `3000`:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Check frontend API base URL:

```bash
grep '^VITE_API_BASE_URL=' pgfinder-frontend/.env
```

Check backend port and CORS env:

```bash
grep -E '^(PORT|CORS_ORIGINS)=' pgfinder-backend/.env
```

## Final Assessment

Backend local connectivity is working when a server is running on `localhost:3000`. The main connection problem is configuration drift between `.env` and code:

- frontend local API URL expects `localhost:3000`;
- backend CORS allows local Vite origins;
- production/preview CORS is hardcoded;
- `CORS_ORIGINS` is documented and set but not actually used;
- there is no proxy layer to hide CORS mistakes.

Fixing CORS env consumption and setting the correct `VITE_API_BASE_URL` in Vercel should resolve the most likely backend connection failures.
