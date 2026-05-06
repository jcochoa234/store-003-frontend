# Creating a New Project from This Template

> **Critical:** This is a **complete project template** — it must be cloned or forked in its entirety.
> Do NOT run `ng new` and then copy files selectively. The `shared/` folder is mandatory infrastructure
> required by every feature — missing it will cause compilation errors and break the architecture.

---

## Mandatory folder structure

Every project derived from this template must include all of the following folders.
None of these are optional — they are the foundation on which every feature is built.

```
src/app/
├── core/              ← Auth, HTTP interceptors, MediatorService, shared models
│   ├── auth/
│   ├── http/
│   ├── layout/
│   ├── mediator/
│   └── models/
│
├── shared/            ← Reusable UI components, services, guards, pipes, validators
│   ├── components/
│   │   ├── char-counter/
│   │   ├── detail-actions/
│   │   ├── empty-state/
│   │   ├── form-actions/
│   │   ├── list-toolbar/
│   │   ├── loading-container/
│   │   ├── page-header/
│   │   ├── search-input/
│   │   ├── status-form-field/
│   │   ├── status-tag/
│   │   └── table-row-actions/
│   ├── guards/
│   │   ├── can-deactivate.interface.ts
│   │   └── unsaved-changes.guard.ts
│   ├── pipes/
│   │   └── status.pipe.ts
│   ├── services/
│   │   ├── confirm.service.ts
│   │   ├── csv-export.service.ts
│   │   ├── form-modal.service.ts
│   │   └── notify.service.ts
│   └── validators/
│       └── custom-validators.ts
│
└── features/          ← One subfolder per entity (you will add these)
    └── dashboard/
```

---

## Step-by-step: starting a new project

### Step 1 — Clone the template

```bash
git clone https://gitlab.com/pinnacleprojects/templates/Store003Frontend.git MyNewProject
cd MyNewProject
```

### Step 2 — Disconnect from the template remote

```bash
git remote remove origin
git remote add origin https://gitlab.com/pinnacleprojects/<your-new-repo>.git
```

### Step 3 — Rename the project

Find and replace all occurrences of `Store003Frontend` with your project name:

| File | What to change |
|---|---|
| `package.json` | `"name": "Store003Frontend"` |
| `angular.json` | Project name key + all `outputPath`, `index`, `main` references that use the old name |
| `index.html` | `<title>` tag |
| `README.md` | Project title and description |
| `.gitlab-ci.yml` | Image name in the `docker-build` job |
| `Dockerfile` / `docker-compose*.yml` | Service names and image names |

### Step 4 — Update environment files

Edit `src/environments/environment.ts` and `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:<YOUR_API_PORT>/api/v1',
  keycloak: {
    url:      'https://keycloak.pinnacleaerospace.com',
    realm:    'pinnacle-dev',
    clientId: '<YOUR_CLIENT_ID>',
  },
  features: {
    enableExport:        true,
    enableNotifications: false,
  },
};
```

### Step 5 — Update the page title

In `src/app/features/dashboard/` and every list/detail component that calls `titleService.setTitle(...)`,
replace `'Store 003'` with your project's display name.

### Step 6 — Install dependencies and verify

```bash
npm install
ng serve
```

The app should compile cleanly and redirect to Keycloak login.

### Step 7 — Remove example features

Once you have verified the project runs, delete the example feature slices that you don't need:

```bash
# Delete example features (keep dashboard/)
rm -rf src/app/features/categories
rm -rf src/app/features/products
```

Remove their routes from `app.routes.ts`, their nav links from `main-layout.component.html`,
and any orphaned icons from `app.config.ts`.

### Step 8 — Add your first feature

Follow the checklist in [PROJECT_RULES.md — Section 14](PROJECT_RULES.md) to add your first entity.
Refer to [SHARED_COMPONENTS.md](SHARED_COMPONENTS.md) before writing any UI code
to avoid reinventing components that already exist.

---

## What you must NOT do

| Anti-pattern | Why it breaks things |
|---|---|
| Run `ng new MyProject` and copy files manually | `shared/` gets skipped; 11 components and 4 services that every feature depends on are missing |
| Copy only `features/` and `core/` | `shared/` is a peer dependency of every page component |
| Delete `shared/` thinking it's example code | It is mandatory infrastructure, not sample code |
| Copy only one feature slice to "see how it works" | Feature pages import from `shared/`; they won't compile standalone |

---

## Verify your shared folder is complete

After cloning, run this check to confirm all shared components are present:

```bash
ls src/app/shared/components/
# Expected output (11 directories):
# char-counter       form-actions       loading-container  search-input       table-row-actions
# detail-actions     list-toolbar       page-header        status-form-field  status-tag
# empty-state

ls src/app/shared/services/
# Expected output (4 files):
# confirm.service.ts   csv-export.service.ts   form-modal.service.ts   notify.service.ts
```

If any folder or file is missing, copy it from the template repository before writing any feature code.

---

## Quick reference — shared catalog

For usage examples of every shared component and service, see:
**[docs/SHARED_COMPONENTS.md](SHARED_COMPONENTS.md)**
