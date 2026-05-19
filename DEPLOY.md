# Deployment (monorepo)

The repo deploys in two parts from GitHub Actions:

| Part | Host | Workflow |
|------|------|----------|
| `prode-backend/` | Azure App Service (Linux, Node 22 LTS) | `.github/workflows/deploy-backend.yml` |
| Root static files | Azure Static Web Apps | `.github/workflows/deploy-frontend.yml` |

Database: Azure PostgreSQL (already used locally via `DATABASE_URL`).

## 1. Azure resources

1. **PostgreSQL** – create `prode` (or prod) database; note connection string with `?sslmode=require`.
2. **App Service** – Linux, **Node 22 LTS** stack (22 or 24 both work; this repo targets 22), name e.g. `prode-api-xyz`.
   - Application settings (Configuration → Application settings):
     - `DATABASE_URL`
     - `JWT_SECRET` (long random string)
     - `GOOGLE_CLIENT_ID` (same as `js/config.js`)
     - `NODE_ENV` = `production`
     - `CORS_ORIGINS` = your SWA URL and Capacitor origins (see below)
   - General settings → Startup Command: leave empty (uses `npm start` from `package.json`).
3. **Static Web App** – connect to this GitHub repo when creating the resource (or add the deploy token manually).

## 2. GitHub secrets

Repository → Settings → Secrets and variables → Actions:

| Secret | Used by | Description |
|--------|---------|-------------|
| `DATABASE_URL` | Backend workflow | Same as App Service; used for `prisma migrate deploy` in CI |
| `AZURE_CLIENT_ID` | Backend workflow | Service principal (OIDC) |
| `AZURE_TENANT_ID` | Backend workflow | Azure AD tenant |
| `AZURE_SUBSCRIPTION_ID` | Backend workflow | Subscription |
| `AZURE_WEBAPP_NAME` | Backend workflow | App Service name (not full URL) |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Frontend workflow | From SWA → Manage deployment token |
| `AZURE_BACKEND_HOST` | Frontend workflow | App Service base URL, e.g. `https://prode-api-xyz.azurewebsites.net` (no trailing slash) |

### Federated credential for GitHub OIDC (backend)

In Azure Portal → App registrations → your deploy SP → Certificates & secrets → Federated credentials:

- Entity: GitHub Actions
- Repository: `your-org/proyecto-prode`
- Branch: `main`

Assign the SP **Website Contributor** (or equivalent) on the App Service resource group.

## 3. Google Sign-In origins

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth Web client, add **Authorized JavaScript origins**:

- `http://localhost:8080` (or whatever you use locally)
- `https://<your-static-web-app>.azurestaticapps.net`
- Custom domain if you add one to SWA

Keep `GOOGLE_CLIENT_ID` in sync in App Service and `js/config.js`.

## 4. How the frontend reaches the API

- **Production web (SWA):** `js/config.js` sets `API_BASE_URL` to `https://<swa-host>/api`. SWA proxies `/api/*` to App Service (`staticwebapp.config.json`, `__BACKEND_HOST__` replaced in CI).
- **Local web:** `http://localhost:3000/api`.
- **Capacitor (Android/iOS):** set `CAPACITOR_API_BASE_URL` in `js/config.js` to `https://<app-service>/api` before `npm run sync`, and add Capacitor origins to `CORS_ORIGINS` on the backend.

## 5. CORS

With the SWA proxy, browser calls from the hosted site are **same-origin** (`/api`), so CORS is not involved for normal web use.

Set `CORS_ORIGINS` on App Service when:

- You open the API URL directly from another site, or
- You use **Capacitor** / a local static server pointing at App Service.

Example:

```env
CORS_ORIGINS=https://your-app.azurestaticapps.net,http://localhost:8080,capacitor://localhost,https://localhost
```

## 6. First deploy

1. Push to `main` with backend changes → backend workflow runs migrations and deploys `prode-backend/`.
2. Push frontend changes → SWA workflow uploads the static app and injects the API host into `staticwebapp.config.json`.
3. Run seed once if needed: `npm run seed` locally against production `DATABASE_URL` (or a one-off job).

## 7. Manual workflow runs

Both workflows support **workflow_dispatch** from the Actions tab if you need to redeploy without a path-filtered push.
