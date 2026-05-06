# SS.TemplateFrontend

An enterprise-ready **Angular 18 Frontend Template** designed for scalability and maintainability, adhering to **Vertical Slice Architecture** and **CQRS** principles — mirroring the patterns from the [SS.Template API](../SS.Template/SS.Template/README.md).

---

## Core Features

* **CQRS** — Commands and Queries are strictly separated classes dispatched through a typed `MediatorService`. Each operation has its own Command/Query and Handler.
* **Vertical Slice Architecture** — Features organized by entity (`features/categories/`, `features/products/`) each with isolated `commands/`, `queries/`, `models/`, and `pages/` folders.
* **Result Pattern** — All API calls return `Observable<Result<T>>`. Components use `result.match(onSuccess, onFailure)` — no scattered `try/catch` blocks.
* **Keycloak Authentication** — Full OIDC integration via `keycloak-js`. Initialized via `APP_INITIALIZER` before the app renders. Token auto-refreshed every 60 seconds.
* **Role-Based Guards** — Functional route guards (`authGuard`, `roleGuard`) use Keycloak realm roles: `it`, `supervisor`, and `standard`.
* **Unsaved Changes Guard** — `unsavedChangesGuard` on all form routes shows an `NzModal` confirmation when navigating away from a dirty form.
* **Shared Components & Services** — A catalog of reusable UI components and services eliminates repeated boilerplate. Components: `<app-loading-container>`, `<app-status-tag>`, `<app-char-counter>`, `<app-page-header>`, `<app-detail-actions>`, `<app-form-actions>`, `<app-list-toolbar>`, `<app-empty-state>`. Services: `NotifyService`, `FormModalService`, `ConfirmService`, `CsvExportService`. See [docs/SHARED_COMPONENTS.md](docs/SHARED_COMPONENTS.md).
* **HTTP Interceptors** — Three functional interceptors: Bearer token injection (`authInterceptor`), `X-Correlation-ID` propagation (`correlationIdInterceptor`), and centralized error handling (`errorInterceptor`).
* **NG-Zorro UI** — Ant Design component library for Angular. Professional layout with collapsible sidebar, data tables, forms with validation feedback, confirmations, notifications, and breadcrumbs.
* **Angular Signals** — Reactive state using `signal()` and `computed()` throughout components — no RxJS state management overhead.
* **Standalone Components** — All components use the `standalone: true` API (no NgModules). Lazy-loaded routes for every feature.
* **Strict TypeScript** — `strict: true`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` enforced across the project.
* **LESS Styling** — Custom NG-Zorro theme via LESS variables. Scoped component styles.
* **Server-Side Tables** — All list pages use server-side pagination, sorting, and filtering via `NzTableQueryParams`. Column header filters for multi-select (status, category) and range inputs (price). Active filter tags with "Clear all" that visually resets column checkboxes.
* **Skeleton + Spinner Strategy** — First load shows a skeleton placeholder; subsequent reloads show a spinner overlay. Controlled via `initialLoad` signal.
* **Status Field** — All entities carry a `StatusDataPolicy` (Active / Inactive / Deleted) rendered as colored tags throughout list, detail, and form pages.
* **Pagination** — `PagedResponse<T>` mirrors the backend model exactly. All list pages use server-side pagination with configurable page size.
* **Correlation IDs** — `X-Correlation-ID` header attached to every HTTP request for end-to-end tracing with the API.
* **Path Aliases** — `@core/*`, `@features/*`, `@shared/*`, `@environments/*` for clean imports across the project.

---

## Application Routes

All protected routes require authentication. Write operations require `supervisor` or `it` role.

### Dashboard
| Route | Component | Access |
|---|---|---|
| `/dashboard` | `DashboardComponent` | Authenticated |

### Categories
| Route | Component | Operation | Required Role |
|---|---|---|---|
| `/categories` | `CategoryListComponent` | `GetAllCategoriesQuery` | Authenticated |
| `/categories/:id` | `CategoryDetailComponent` | `GetCategoryByIdQuery` | Authenticated |
| `/categories/new` | `CategoryFormComponent` | `CreateCategoryCommand` | supervisor (it) |
| `/categories/:id/edit` | `CategoryFormComponent` | `UpdateCategoryCommand` | supervisor (it) |
| DELETE action | — | `DeleteCategoryCommand` | it |

### Products
| Route | Component | Operation | Required Role |
|---|---|---|---|
| `/products` | `ProductListComponent` | `GetProductsQuery` (paginated) | Authenticated |
| `/products/:id` | `ProductDetailComponent` | `GetProductByIdQuery` | Authenticated |
| `/products/new` | `ProductFormComponent` | `CreateProductCommand` | supervisor (it) |
| `/products/:id/edit` | `ProductFormComponent` | `UpdateProductCommand` | supervisor (it) |
| DELETE action | — | `DeleteProductCommand` | it |

---

## Architecture Overview

```
src/app/
├── core/           ← Singleton services: auth, HTTP, mediator, models, layout
├── features/       ← Vertical slices organized by entity
│   ├── categories/ ← commands/, queries/, models/, pages/
│   └── products/   ← commands/, queries/, models/, pages/
└── shared/         ← Reusable components, pipes, validators, guards, services
    ├── guards/     ← CanDeactivateComponent interface + unsavedChangesGuard
    └── services/   ← NotifyService, FormModalService, ConfirmService
```

### Shared Components

| Component | Purpose |
|---|---|
| `<app-loading-container>` | Skeleton on first load, spinner on reload — used in every list and detail page |
| `<app-status-tag>` | Colored NzTag for `StatusDataPolicy`; em-dash when null |
| `<app-char-counter>` | Character count indicator for text inputs (`current / max`) |
| `<app-page-header>` | Page title + breadcrumbs + right-side action template slot |
| `<app-detail-actions>` | Back / Edit / Delete button group for detail page headers |
| `<app-form-actions>` | Save / Cancel button row for modal forms |
| `<app-list-toolbar>` | Search input + total count + clear/export bar for list pages |
| `<app-empty-state>` | Empty table state with optional "New entity" and "Clear filters" actions |

### Shared Services

| Service | Purpose |
|---|---|
| `NotifyService` | Semantic toast wrappers: `created()`, `updated()`, `deleted()`, `error()` |
| `FormModalService` | Lazy-loads a form component and opens it as an `NzModal`. Returns `Observable<boolean>` |
| `ConfirmService` | Reusable confirmation dialogs: `delete(name)`, `discardChanges()`, `confirm(options)` |
| `CsvExportService` | Generates and downloads a CSV file from headers + row data |

> Full catalog with inputs, outputs, and usage examples: **[docs/SHARED_COMPONENTS.md](docs/SHARED_COMPONENTS.md)**

Dependency rule — strictly inward: `pages → handlers → ApiService → Keycloak`

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Angular | 18.x | SPA framework (standalone components + signals) |
| NG-Zorro (Ant Design) | 18.x | UI component library |
| keycloak-js | 25.x | Keycloak OIDC client |
| RxJS | 7.8.x | Async/reactive streams |
| TypeScript | 5.5.x | Language (strict mode) |
| LESS | 4.x | Stylesheets + NG-Zorro theme customization |

---

## Documentation

1. [**Setup & Execution (SETUP.md)**](docs/SETUP.md) — Install, run locally, configure Keycloak, environment variables.
2. [**Project Rules (PROJECT_RULES.md)**](docs/PROJECT_RULES.md) — Architecture boundaries, coding guidelines, how to add a new feature.
3. [**Shared Components Catalog (SHARED_COMPONENTS.md)**](docs/SHARED_COMPONENTS.md) — Every reusable component and service with inputs, outputs, and usage examples. Read this before writing any list, form, or detail page.
4. [**Glossary (GLOSSARY.md)**](docs/GLOSSARY.md) — Definitions for every architectural concept used in this template.
5. [**Architecture Diagrams (ARCHITECTURE_DIAGRAM.md)**](docs/ARCHITECTURE_DIAGRAM.md) — Visual diagrams of the CQRS flow, mediator pipeline, auth flow, and component tree.
