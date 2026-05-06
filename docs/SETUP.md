# ⚙️ Setup & Execution Guide

> **Starting a new project from this template?**
> See **[docs/NEW_PROJECT.md](NEW_PROJECT.md)** first — it covers cloning, renaming, and verifying
> that all mandatory shared infrastructure is present before you write any code.

This guide covers how to run SS.TemplateFrontend locally and how to configure it against the companion API and Keycloak.

## Prerequisites

* [Node.js 20+](https://nodejs.org/) (LTS recommended)
* [Angular CLI 18+](https://angular.io/cli) (`npm install -g @angular/cli`)
* [SS.Template API](../../SS.Template/SS.Template/README.md) running locally or in Docker
* [Keycloak](https://www.keycloak.org/) instance (included in the API's `docker-compose.yml`)

---

## 💻 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Verify the environment file at `src/environments/environment.ts` points to your local API and Keycloak:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:5273/api/v1',
     keycloak: {
       url:      'https://keycloak.pinnacleaerospace.com',
       realm:    'pinnacle-dev',
       clientId: 'global-client-dev',
     },
   };
   ```

3. Start the development server:
   ```bash
   ng serve
   ```
   or
   ```bash
   npm start
   ```

4. Open your browser at: **[http://localhost:4200](http://localhost:4200)**

   > The app will immediately redirect to Keycloak login because `onLoad: 'login-required'` is configured in `KeycloakService`.

---

## 🐳 Running with Docker

The template includes three Docker Compose files for different scenarios.

### Option A — Full stack (recommended)

Starts everything: PostgreSQL, Keycloak, Jaeger, API and Frontend in a single command.
Both projects must be siblings in the same folder:

```
Templates/
├── SS.Template/SS.Template/   ← API
└── SS.TemplateFrontend/       ← Frontend (run commands from here)
```

```bash
docker-compose -f docker-compose.full.yml up -d --build
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:4200` |
| API + Swagger | `http://localhost:8080/swagger` |
| Keycloak | `http://localhost:8081` |
| Jaeger UI | `http://localhost:16686` |

### Option B — Frontend only (API already running)

Use this when the API stack is already up via the API project's `docker-compose.yml`.

```bash
docker-compose up -d --build
# → http://localhost:4200
```

### Option C — Hot-reload development inside Docker

Mounts the local source code into a Node container and runs `ng serve`. Every file save triggers an instant recompile without rebuilding the image.

```bash
# With frontend only
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# With full stack
docker-compose -f docker-compose.full.yml -f docker-compose.dev.yml up
```

### 🔄 Development without Docker

Run the Angular dev server directly on the host (fastest option):

```bash
npm install
ng serve
# → http://localhost:4200
```

Make sure the API stack is running first (Docker or local .NET).

---

## 🔐 Keycloak Setup (Authentication)

The frontend uses **Keycloak** (OpenID Connect) with PKCE flow — no client secret required.
The project uses **Keycloak at `https://keycloak.pinnacleaerospace.com`** with realm `pinnacle-dev`.

### Step-by-step

1. Open [https://keycloak.pinnacleaerospace.com](https://keycloak.pinnacleaerospace.com) and log in as administrator.
2. Select the **`pinnacle-dev`** realm.
3. Verify that the frontend **Client** exists:
   - **Client ID:** `global-client-dev`
   - **Client type:** `OpenID Connect`
   - **Client authentication:** `OFF` (public client — no secret needed for PKCE)
   - **Standard flow:** `ON`
   - **Direct access grants:** `ON` (useful for testing with curl / Postman)
   - **Valid redirect URIs:** `http://localhost:4200/*`
   - **Web origins:** `http://localhost:4200`
5. Add an **Audience mapper** so the JWT includes `account` in its audience (required by the API):
   - Go to the client → **Client scopes** tab → click `global-client-dev-dedicated`
   - Click **Add mapper** → **By configuration** → **Audience**
   - **Name:** `account-audience`
   - **Included Client Audience:** `account`
   - **Add to access token:** `ON`
   - Save
6. Create realm roles (`it`, `supervisor`, `standard`) under **Realm roles** if they don't exist.
7. Create at least one test user:
   - Set a password in *Credentials* tab (turn off "Temporary").
   - Assign the desired realm roles in *Role mappings* tab.

The app will redirect to Keycloak on first access and return with a JWT after login.

> **Why the Audience mapper?** The API validates `JwtSettings.Audience = "account"`. A token issued to the `Store003Frontend` client won't include `account` as audience by default — the mapper adds it so the API accepts the token.

---

## 🌍 Environment Variables

The Angular app is configured through `src/environments/`. No runtime environment injection by default — values are baked in at build time.

### Development (`environment.ts`)

| Variable | Description | Value |
|---|---|---|
| `apiUrl` | Base URL of the SS.Template API | `http://localhost:8080/api/v1` (Docker) or `http://localhost:5273/api/v1` (local .NET run) |
| `keycloak.url` | Keycloak server URL | `https://keycloak.pinnacleaerospace.com` |
| `keycloak.realm` | Keycloak realm name | `pinnacle-dev` |
| `keycloak.clientId` | Keycloak client ID (public) | `global-client-dev` |
| `features.enableExport` | Show CSV export button on list pages | `true` |
| `features.enableNotifications` | Reserved for future notification panel | `false` |

### Production (`environment.prod.ts`)

Replace all values before building for production. Never commit real URLs or credentials in source control.

| Variable | Description |
|---|---|
| `apiUrl` | Production API base URL |
| `keycloak.url` | Production Keycloak URL |
| `keycloak.realm` | Production realm name |
| `keycloak.clientId` | Production client ID |
| `features.enableExport` | Set to `false` to hide CSV export in production if not desired |
| `features.enableNotifications` | Set to `true` when the notification panel feature is ready |

---

## 🏗️ Production Build

1. Update `src/environments/environment.prod.ts` with real production values.
2. Run the production build:
   ```bash
   npm run build:prod
   ```
   or
   ```bash
   ng build --configuration production
   ```

3. The output is placed in `dist/Store003Frontend/browser/`. Serve it with any static file server (nginx, Apache, Azure Static Web Apps, AWS S3 + CloudFront).

### nginx configuration example

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Required for Angular's HTML5 routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|ico|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

---

## 🧪 Running Tests

### Unit Tests

```bash
ng test
```

Opens Karma test runner in a browser. Tests use Jasmine. Coverage reports are generated in `coverage/`.

### Single run (CI mode)

```bash
ng test --watch=false --browsers=ChromeHeadless
```

---

## 🚀 CI/CD — GitLab CI

The template includes a ready-to-use GitLab CI pipeline at `.gitlab-ci.yml`. It runs automatically on every push and merge request to `main`, `master`, or `develop`.

**Pipeline stages and jobs:**

| Job | Stage | What it does |
|---|---|---|
| `install` | install | `npm ci` — reproducible dependency installation |
| `lint` | lint | `ng lint` — enforces ESLint rules |
| `build` | build | `ng build --configuration production` — validates the app compiles without errors |
| `test` | test | `ng test --watch=false --browsers=ChromeHeadless` — runs Karma in headless mode |
| `docker-build` | docker | Builds an nginx image with the compiled app. Uncomment the push lines to publish to the GitLab Container Registry. |

**Requisitos del GitLab Runner:**
- `install`, `lint`, `build`, `test` requieren un runner con executor **Docker** estándar y la imagen `node:20-alpine`.
- `docker-build` requiere soporte de **Docker-in-Docker** (`privileged = true` en la config del runner).

---

## 🏭 Production Deployment Checklist

Before deploying to production, verify the following:

| Item | Description |
|---|---|
| `environment.prod.ts → apiUrl` | Full production API URL |
| `environment.prod.ts → keycloak.url` | Production Keycloak URL |
| `environment.prod.ts → keycloak.realm` | Production realm name |
| `environment.prod.ts → keycloak.clientId` | Production client ID |
| Keycloak client redirect URIs | Include all production frontend URLs |
| Keycloak web origins | Include all production frontend origins (for CORS) |
| API `CorsSettings.AllowedOrigins` | Include the production frontend URL |
| nginx / hosting `try_files` | Configured for Angular HTML5 routing (fallback to `index.html`) |
| HTTPS | All production traffic served over HTTPS |

**Never** commit real credentials or production URLs to source control. Use environment variables in your CI/CD pipeline or a secrets manager to inject values at build time.
