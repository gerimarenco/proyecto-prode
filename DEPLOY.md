# Deployment (monorepo)

| Part | Host | How it deploys |
|------|------|----------------|
| `prode-backend/` | Azure App Service (Node 22 LTS) | GitHub Actions → `.github/workflows/deploy-backend.yml` |
| Root static files (`index.html`, `js/`, …) | Vercel | Vercel dashboard (Git push to `main`) — **not** GitHub Actions |

There is **no** GitHub Pages deploy and **no** Azure Static Web Apps workflow in this repo anymore (frontend uses `vercel.json` to proxy `/api` to Azure).

Database: Azure PostgreSQL (`DATABASE_URL` with `?sslmode=require`).

---

## What is CORS? (App Service `CORS_ORIGINS`)

Browsers block a page on **site A** from calling an API on **site B** unless the API explicitly allows **site A**. That rule is **CORS**.

With **Vercel + `vercel.json`**, the browser only talks to `https://your-app.vercel.app/api/...`. Vercel forwards to Azure **on the server**, so the browser is **not** calling Azure directly → you usually **do not** need CORS for normal web use.

Set `CORS_ORIGINS` on App Service for:

- **Local dev** opening HTML on `http://localhost:8080` while the API is on port 3000
- **Capacitor** apps hitting Azure directly
- Calling `https://....azurewebsites.net` from the browser for debugging

Example (no quotes in Azure portal):

```text
http://localhost:8080,http://127.0.0.1:8080,capacitor://localhost,https://localhost
```

Add your Vercel URL only if something calls Azure **without** the `/api` proxy.

---

## App Service settings (portal)

**Configuration → Application settings** (no surrounding `"` in the portal):

| Name | Example / notes |
|------|------------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/once_metros_dev?sslmode=require` |
| `JWT_SECRET` | Long random string (can differ from local) |
| `GOOGLE_CLIENT_ID` | Same as `js/config.js` |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | See above (optional for Vercel-only web) |

**Configuration → General settings → Startup Command:** leave **empty** (Azure runs `npm start` from `prode-backend/package.json`).

Do **not** set `PORT` on Azure; the platform sets it automatically.

---

## Vercel (frontend)

- Connected to this GitHub repo; deploys on push to `main`.
- `vercel.json` rewrites `/api/*` → your App Service URL.
- `js/config.js` uses `http://localhost:3000/api` locally and `/api` on Vercel.

**Google OAuth:** add `https://<your-project>.vercel.app` under Authorized JavaScript origins.

---

## GitHub Actions — backend only

### Secrets required

Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|--------|
| `DATABASE_URL` | Same connection string as App Service |
| `AZURE_CLIENT_ID` | From app registration (OIDC) |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_WEBAPP_NAME` | Short App Service name only, e.g. `once-metros-api-gzhrhka4d4gac3cq` — **not** the full hostname |

`DATABASE_URL` must exist **before** `npm ci` runs, because `postinstall` runs `prisma generate` and `prisma.config.ts` reads `DATABASE_URL`.

You do **not** need `AZURE_STATIC_WEB_APPS_API_TOKEN` or `AZURE_BACKEND_HOST` (those were for the removed SWA workflow).

### OIDC setup (so GitHub can deploy to Azure)

This lets GitHub log into Azure **without** storing a password in secrets.

1. **Create an app registration**  
   Portal → **Microsoft Entra ID** → **App registrations** → **New registration** (e.g. `github-prode-deploy`).

2. **Copy IDs**  
   - Application (client) ID → `AZURE_CLIENT_ID`  
   - Directory (tenant) ID → `AZURE_TENANT_ID`  
   - Subscription ID → `AZURE_SUBSCRIPTION_ID` (Subscriptions blade)

3. **Federated credential**  
   App registration → **Certificates & secrets** → **Federated credentials** → **Add**  
   - Scenario: GitHub Actions deploying Azure resources  
   - Org/user, repo `proyecto-prode`, branch `main`

4. **Permission to deploy**  
   Resource group (or subscription) → **Access control (IAM)** → **Add role assignment**  
   - Role: **Website Contributor** (or **Contributor** on the resource group)  
   - Member: the app registration from step 1

5. Add the five secrets in GitHub, then run **Actions** → **Deploy backend** → **Run workflow** or push to `main` under `prode-backend/`.

---

## First-time checklist

1. PostgreSQL in Chile Central (or same region as App Service).  
2. App Service app settings filled in.  
3. GitHub secrets filled in (including `DATABASE_URL`).  
4. OIDC configured.  
5. Backend workflow green.  
6. Vercel project connected; `vercel.json` on `main`.  
7. Google OAuth origins include Vercel URL.  
8. Optional: `npm run seed` once against production `DATABASE_URL`.

---

## Troubleshooting

| Failure | Fix |
|---------|-----|
| `Cannot resolve environment variable: DATABASE_URL` on `npm ci` | Add `DATABASE_URL` to **GitHub Actions** secrets |
| `AZURE_BACKEND_HOST secret is required` | Remove/disable old SWA workflow (deleted in repo); use Vercel only |
| Azure login fails in Actions | Finish OIDC + IAM role |
| App Service 503 after deploy | Check App Service also has `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production` |
| API works locally, not on Vercel | Check `vercel.json` hostname matches App Service |
