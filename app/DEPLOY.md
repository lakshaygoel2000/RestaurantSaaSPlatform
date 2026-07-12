# RestaurantOS — cPanel / Shared-Hosting Deployment

This guide covers deploying the production build to a cPanel or generic shared-hosting Node.js environment.

## Prerequisites

- A MySQL database created in cPanel (note the DB name, user, and password).
- cPanel "Setup Node.js App" or equivalent enabled.
- The production env vars ready:
  - `NODE_ENV=production`
  - `DATABASE_URL`
  - `APP_ID`
  - `APP_SECRET`
  - `PORT` (usually assigned by cPanel)
  - `ALLOWED_ORIGIN` (your domain, e.g. `https://yourdomain.com`)
  - `DB_SSL_MODE=disabled` (recommended for cPanel MySQL)
  - `DB_CONNECTION_LIMIT=5` (optional, lower than default for shared hosting)

## Build locally

From the `app/` directory:

```bash
pnpm install
pnpm run build
```

This produces:

- `app/dist/server.js` — bundled backend
- `app/dist/public/` — static frontend
- `app/server.js` — thin wrapper that loads `dist/server.js`

## Upload to cPanel

Upload the following into your Node.js application root (the folder configured in cPanel "Setup Node.js App"):

```
server.js
dist/
  server.js
  public/
    index.html
    assets/
package.json
pnpm-lock.yaml
node_modules/
```

**If your host provides a terminal and `pnpm`:**
Upload `package.json` + `pnpm-lock.yaml` and run `pnpm install --prod` instead of uploading `node_modules`.

**If you must upload `node_modules`:**
Run `pnpm install --prod` locally first, then upload the resulting `node_modules` folder.

> Only `drizzle-orm`, `mysql2`, and their dependencies are required at runtime. Everything else is bundled into `dist/server.js`.

## cPanel Node.js App settings

1. Open **cPanel → Setup Node.js App**.
2. Set **Application root** to the folder containing `server.js`.
3. Set **Application URL** to your domain/subdomain.
4. Set **Application startup file** to `server.js`.
5. Add the environment variables listed in Prerequisites.
6. Save and restart.

## Database setup

After the first deploy (or whenever the schema changes), push the schema and seed demo data from any machine with `DATABASE_URL` set:

```bash
# Push schema
pnpm exec drizzle-kit push --force

# Seed demo restaurants / staff / owner accounts
npx tsx db/seed.ts
```

> **Warning:** `push --force` can drop or alter tables. Back up production data before running on a live database.

## Post-deploy checks

Open these URLs in a browser:

- `https://yourdomain.com/api/health` → should return `{"status":"ok","database":"connected"}`
- `https://yourdomain.com/` → should load the login/registration SPA

Demo credentials (from seed):

- **Owner login:** `owner@spice-garden.com` / `owner@spice-garden`
- **Staff login:** `manager@spice-garden` / `manager@spice-garden`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Database connection fails | Use `localhost` or the cPanel MySQL host, set `DB_SSL_MODE=disabled`, and verify the DB user has privileges. |
| `Cannot find module 'drizzle-orm'` or `mysql2` | Ensure `node_modules` is uploaded or `pnpm install --prod` ran successfully. |
| Frontend shows 404 on refresh | The SPA fallback is handled by `dist/server.js`. Make sure `dist/public/index.html` exists. |
| bcrypt native build errors | The app now uses `bcryptjs` (pure JS). Rebuild with `pnpm run build` and re-upload `dist/server.js`. |
