# CLAUDE.md — SS.TemplateFrontend Architecture Reference

Enterprise-ready Angular 18 SPA template following **Vertical Slice Architecture** and **CQRS** with a custom built-in `MediatorService` — mirroring the patterns from the companion .NET API template (`SS.Template`).

---

## Architecture

**Vertical Slice Architecture** with a strict inward dependency flow:

```
pages → handlers → ApiService → Keycloak / HttpClient
```

- `core/` — Singleton services. Auth, HTTP layer, mediator, shared models. No business logic.
- `features/[entity]/` — Self-contained vertical slices. Each entity owns its commands, queries, handlers, models, and pages.
- `shared/` — Reusable UI primitives (pipes, validators, components) with no entity-specific knowledge.

Also follows **CQRS** with `Commands` (mutations) and `Queries` (reads) as discrete classes dispatched through `MediatorService`.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Angular | 18.x | SPA framework — standalone components, signals, functional guards |
| NG-Zorro (Ant Design) | 18.x | UI component library |
| keycloak-js | 25.x | Keycloak OIDC client (no keycloak-angular — deprecated) |
| RxJS | 7.8.x | Async streams |
| TypeScript | 5.5.x | Strict mode |
| LESS | 4.x | Stylesheets + NG-Zorro theme override |

> **No keycloak-angular.** Keycloak is integrated via a custom `KeycloakService` that wraps `keycloak-js` directly and exposes Angular signals.

---

## Project Structure

```
SS.TemplateFrontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts          ← Root shell (just <router-outlet>)
│   │   ├── app.config.ts             ← provideRouter, provideHttpClient, APP_INITIALIZER (Keycloak), NZ_ICONS
│   │   ├── app.routes.ts             ← Top-level routes (MainLayout + lazy feature routes)
│   │   │
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── keycloak.service.ts         ← KeycloakService (signals: isAuthenticated, profile, roles)
│   │   │   │   ├── keycloak-init.factory.ts    ← APP_INITIALIZER factory
│   │   │   │   ├── auth.guard.ts               ← Functional guard (requires authentication)
│   │   │   │   └── role.guard.ts               ← roleGuard('it'|'supervisor'|'standard') factory
│   │   │   ├── http/
│   │   │   │   ├── api.service.ts              ← Base HTTP service → Observable<Result<T>>
│   │   │   │   ├── auth.interceptor.ts         ← Injects Bearer token, refreshes if needed
│   │   │   │   ├── error.interceptor.ts        ← Maps HTTP errors to NzMessage + navigation
│   │   │   │   └── correlation-id.interceptor.ts ← Attaches X-Correlation-ID to every request
│   │   │   ├── mediator/
│   │   │   │   ├── interfaces.ts               ← IRequest, ICommand, IQuery, IRequestHandler
│   │   │   │   └── mediator.service.ts         ← MediatorService.send(request, HandlerClass)
│   │   │   ├── models/
│   │   │   │   ├── result.model.ts             ← Result<T> with .match(onSuccess, onFailure)
│   │   │   │   ├── paged-response.model.ts     ← PagedResponse<T>, PagedQuery
│   │   │   │   ├── error.model.ts              ← AppError, ErrorType, ProblemDetails
│   │   │   │   └── status-data-policy.enum.ts  ← Active | Inactive | Deleted
│   │   │   └── layout/
│   │   │       └── main-layout/                ← Top navigation bar, user menu, mobile drawer
│   │   │
│   │   ├── features/
│   │   │   ├── categories/
│   │   │   │   ├── models/
│   │   │   │   │   └── category.model.ts       ← CategoryDto, CreateCategoryRequest, UpdateCategoryRequest
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-category/        ← CreateCategoryCommand + CreateCategoryHandler
│   │   │   │   │   ├── update-category/        ← UpdateCategoryCommand + UpdateCategoryHandler
│   │   │   │   │   └── delete-category/        ← DeleteCategoryCommand + DeleteCategoryHandler
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-all-categories/     ← GetAllCategoriesQuery + GetAllCategoriesHandler
│   │   │   │   │   └── get-category-by-id/     ← GetCategoryByIdQuery + GetCategoryByIdHandler
│   │   │   │   ├── pages/
│   │   │   │   │   ├── category-list/          ← CategoryListComponent (table + filters + pagination)
│   │   │   │   │   ├── category-detail/        ← CategoryDetailComponent (descriptions + product count)
│   │   │   │   │   └── category-form/          ← CategoryFormComponent (create + edit)
│   │   │   │   └── categories.routes.ts
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── models/
│   │   │   │   │   └── product.model.ts        ← ProductDto, CreateProductRequest, GetProductsRequest
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-product/         ← CreateProductCommand + CreateProductHandler
│   │   │   │   │   ├── update-product/         ← UpdateProductCommand + UpdateProductHandler
│   │   │   │   │   └── delete-product/         ← DeleteProductCommand + DeleteProductHandler
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-products/           ← GetProductsQuery (paginated) + GetProductsHandler
│   │   │   │   │   └── get-product-by-id/      ← GetProductByIdQuery + GetProductByIdHandler
│   │   │   │   ├── pages/
│   │   │   │   │   ├── product-list/           ← ProductListComponent (table + filters + pagination)
│   │   │   │   │   ├── product-detail/         ← ProductDetailComponent (descriptions)
│   │   │   │   │   └── product-form/           ← ProductFormComponent (create + edit)
│   │   │   │   └── products.routes.ts
│   │   │   │
│   │   │   ├── dashboard/                      ← DashboardComponent (stats + quick actions)
│   │   │   └── unauthorized/                   ← UnauthorizedComponent (403 page)
│   │   │
│   │   └── shared/
│   │       ├── components/
│   │       │   └── page-header/                ← PageHeaderComponent (title + breadcrumbs + extra template)
│   │       ├── guards/
│   │       │   ├── can-deactivate.interface.ts ← CanDeactivateComponent { hasUnsavedChanges(): boolean }
│   │       │   └── unsaved-changes.guard.ts    ← unsavedChangesGuard (NzModal confirm on dirty navigation)
│   │       ├── pipes/
│   │       │   └── status.pipe.ts              ← StatusLabelPipe, StatusColorPipe
│   │       └── validators/
│   │           └── custom-validators.ts        ← positiveOrZero, notWhiteSpace, pageSize, guid
│   │
│   ├── environments/
│   │   ├── environment.ts                      ← Dev: apiUrl, keycloak config
│   │   └── environment.prod.ts                 ← Prod: replace placeholders before deploying
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.less                             ← NG-Zorro LESS theme variables + global utilities
│
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.spec.json
```

---

## Core — Auth (`core/auth/`)

### `KeycloakService`

Wraps `keycloak-js` and exposes reactive state via Angular signals:

| Signal | Type | Description |
|---|---|---|
| `isAuthenticated` | `Signal<boolean>` | Whether the user is logged in |
| `profile` | `Signal<UserProfile \| null>` | Full user profile (id, username, email, fullName, roles) |
| `fullName` | `Signal<string>` | Computed display name |
| `roles` | `Signal<string[]>` | Keycloak realm roles |

Key methods:

| Method | Description |
|---|---|
| `init()` | Called by `APP_INITIALIZER`. Initializes Keycloak with PKCE + `login-required`. |
| `getToken()` | Returns the current raw JWT string. |
| `refreshToken()` | Silently refreshes if token expires in < 30 s. |
| `login()` / `logout()` | Redirect-based Keycloak flows. |
| `hasRole(role)` | Checks a single realm role. |
| `canAccess(policy)` | `'it'` → solo `it`; `'supervisor'` → `it\|supervisor`; `'standard'` → `it\|supervisor\|standard` |

### `authGuard`

Functional guard. Calls `keycloak.isAuthenticated()`. If false, triggers `keycloak.login()`.

### `roleGuard(policy)`

Factory returning a `CanActivateFn`. Calls `keycloak.canAccess(policy)`. Redirects to `/unauthorized` on failure.

---

## Core — HTTP (`core/http/`)

### `ApiService`

Base HTTP service. All methods return `Observable<Result<T>>`:

| Method | HTTP | Returns |
|---|---|---|
| `get<T>(path, params?)` | GET | `Observable<Result<T>>` |
| `post<T>(path, body)` | POST | `Observable<Result<T>>` |
| `put<T>(path, body)` | PUT | `Observable<Result<T>>` |
| `delete<T>(path)` | DELETE | `Observable<Result<T>>` |

HTTP errors are mapped to `Result.failure(AppError)` internally. The `errorInterceptor` handles display (NzMessage notifications) and navigation.

### HTTP Interceptors (execution order)

```
correlationIdInterceptor → authInterceptor → errorInterceptor → HttpClient
```

| Interceptor | Responsibility |
|---|---|
| `correlationIdInterceptor` | Generates UUID and attaches `X-Correlation-ID` header |
| `authInterceptor` | Calls `refreshToken()`, then attaches `Authorization: Bearer <token>` |
| `errorInterceptor` | Maps 401/403/404/409/500 to NzMessage + Router navigation |

---

## Core — Mediator (`core/mediator/`)

### Interfaces (`interfaces.ts`)

```typescript
interface IRequest<TResponse> {}
interface ICommand<TResponse = void> extends IRequest<TResponse> {}
interface IQuery<TResponse> extends IRequest<TResponse> {}
interface IRequestHandler<TRequest, TResponse> {
  handle(request: TRequest): Observable<Result<TResponse>>;
}
```

Mirrors `IRequest<TResponse>` and `IRequestHandler<,>` from the .NET Application layer.

### `MediatorService`

```typescript
send<TRequest, TResponse>(
  request: TRequest,
  handler: Type<IRequestHandler<TRequest, TResponse>>
): Observable<Result<TResponse>>
```

Resolves the handler from Angular's `Injector` at runtime. Handlers are `@Injectable({ providedIn: 'root' })` — no registration required.

**Usage:**
```typescript
// Query
this.mediator.send(new GetProductsQuery({ page: 1, pageSize: 10 }), GetProductsHandler)
  .subscribe(result => result.match(
    data => this.products.set(data.items),
    err  => this.message.error(err.message)
  ));

// Command
this.mediator.send(new CreateProductCommand({ name, price, categoryId }), CreateProductHandler)
  .subscribe(result => result.match(
    ()  => this.router.navigate(['/products']),
    err => this.message.error(err.message)
  ));
```

---

## Core — Models (`core/models/`)

### `Result<T>`

Mirrors `Result<TValue>` from the .NET Domain layer.

```typescript
Result.success(value)             // Result<T>
Result.failure(appError)          // Result<T>

result.match(
  (value) => { /* success path */ },
  (error) => { /* failure path */ }
);
```

Used consistently across all handlers and components for railway-oriented error handling.

### `PagedResponse<T>`

```typescript
interface PagedResponse<T> {
  items:           T[];
  page:            number;
  pageSize:        number;
  totalCount:      number;
  totalPages:      number;
  hasNextPage:     boolean;
  hasPreviousPage: boolean;
}
```

Exactly mirrors `PagedResponse<T>` from the .NET Domain primitives.

### `AppError` / `ErrorType`

```typescript
enum ErrorType { None, Failure, NotFound, Conflict, Validation, Unauthorized }
interface AppError { code: string; message: string; type: ErrorType; }
```

### `StatusDataPolicy`

```typescript
enum StatusDataPolicy { Active = 'Active', Inactive = 'Inactive', Deleted = 'Deleted' }
```

Mirrors the .NET enum — serialized as strings via `JsonStringEnumConverter` on the API.

---

## Features — Vertical Slice Structure

Every entity feature follows the same structure:

```
features/[entity]/
├── models/
│   └── [entity].model.ts           ← DTOs, request interfaces
├── commands/
│   ├── create-[entity]/
│   │   ├── create-[entity].command.ts     ← class implements ICommand<string>
│   │   └── create-[entity].handler.ts     ← @Injectable, implements IRequestHandler<,>
│   ├── update-[entity]/
│   └── delete-[entity]/
├── queries/
│   ├── get-[entities]/
│   │   ├── get-[entities].query.ts        ← class implements IQuery<PagedResponse<Dto>>
│   │   └── get-[entities].handler.ts
│   └── get-[entity]-by-id/
├── pages/
│   ├── [entity]-list/
│   ├── [entity]-form/
│   └── [entity]-detail/
└── [entity].routes.ts               ← lazy-loaded child routes
```

### Naming Conventions

| Element | Pattern | Example |
|---|---|---|
| **Commands** | `[Action][Entity]Command` | `CreateProductCommand` |
| **Queries** | `Get[Entities]Query` / `Get[Entity]ByIdQuery` | `GetProductsQuery` |
| **Handlers** | `[Request]Handler` | `CreateProductHandler` |
| **Pages** | `[entity]-list`, `[entity]-form`, `[entity]-detail` | `product-list.component.ts` |
| **Models** | `[Entity]Dto`, `Create[Entity]Request`, `Update[Entity]Request` | `ProductDto` |
| **Routes** | `[ENTITY]_ROUTES` exported constant | `PRODUCTS_ROUTES` |

---

## Shared — Components (`shared/components/`)

> Full catalog with inputs/outputs and usage examples: **[docs/SHARED_COMPONENTS.md](docs/SHARED_COMPONENTS.md)**

| Component | Selector | Purpose |
|---|---|---|
| `LoadingContainerComponent` | `<app-loading-container>` | Skeleton on first load, spinner on reload. Used in **every** list and detail page |
| `StatusTagComponent` | `<app-status-tag>` | Colored NzTag for `StatusDataPolicy` or em-dash when null/undefined |
| `CharCounterComponent` | `<app-char-counter>` | `current / max` counter for text inputs. Used in `[nzExtra]` of `nz-form-control` |
| `PageHeaderComponent` | `<app-page-header>` | Page title + breadcrumbs + right-side action template |
| `DetailActionsComponent` | `<app-detail-actions>` | Back / Edit / Delete button group for detail pages |
| `TableRowActionsComponent` | `<app-table-row-actions>` | View / Edit / Delete action button group for table rows |
| `FormActionsComponent` | `<app-form-actions>` | Save / Cancel button row for modal forms |
| `StatusFormFieldComponent` | `<app-status-form-field>` | Status select field for modal forms (accepts a `FormControl`) |
| `ListToolbarComponent` | `<app-list-toolbar>` | Search input + total count + clear/export bar for list pages |
| `SearchInputComponent` | `<app-search-input>` | Standalone search input with clear button (used inside `<app-list-toolbar>`) |
| `EmptyStateComponent` | `<app-empty-state>` | Empty table state (used in `[nzNoResult]`) |

**Key rules:**
- Never write `@if (loading()) { <nz-skeleton> } @else { ... }` — use `<app-loading-container>`.
- Never write `@if (status) { <nz-tag | statusColor> } @else { — }` — use `<app-status-tag>`.
- Never write `<span class="char-count">{{ n }} / {{ max }}</span>` — use `<app-char-counter>`.
- Never write inline `<nz-space>` with eye/edit/delete buttons in a table row — use `<app-table-row-actions>`.
- Never write an inline `<nz-form-item>` with `nz-select` + `STATUS_OPTIONS` for a status field — use `<app-status-form-field>`.

---

## Shared — Services (`shared/services/`)

### `NotifyService`

Wrapper centralizado sobre `NzMessageService`. Todos los componentes deben usar este servicio en lugar de inyectar `NzMessageService` directamente.

| Method | Description |
|---|---|
| `success(text)` | Mensaje de éxito genérico |
| `error(error)` | Acepta `AppError` o `string`; extrae `error.message` automáticamente |
| `created(entity)` | `"${entity} created successfully."` |
| `updated(entity)` | `"${entity} updated successfully."` |
| `deleted(entity)` | `"${entity} deleted successfully."` |

```typescript
// En cualquier componente o handler:
this.notify.deleted('Product');
this.notify.error(err);          // err: AppError
this.notify.error('Custom msg'); // err: string
```

### `FormModalService`

Encapsula el patrón `modal.create()` + lazy import + `afterClose` usado por todos los componentes de lista y detalle.

```typescript
open<T extends ModalForm>(
  loader:  () => Promise<Type<T>>,
  options: { title: string; data?: unknown; width?: number },
): Observable<boolean>   // true = guardado, false = cancelado/cerrado
```

```typescript
// Uso estándar (lista o detalle):
this.formModal.open(
  () => import('../entity-form/entity-form.component').then(m => m.EntityFormComponent),
  { title: id ? 'Edit Entity' : 'New Entity', data: { id }, width: 600 },
).subscribe(saved => { if (saved) this.loadEntities(); });
```

> Todo componente de formulario abierto como modal debe implementar la interfaz `ModalForm`: `cancel(): void`.

### `ConfirmService`

Centraliza los diálogos de confirmación reutilizables. Retorna `Observable<void>` que emite en OK y completa sin emitir en Cancel.

| Method | Description |
|---|---|
| `delete(itemName)` | `"Delete \"X\"? This action cannot be undone."` — botón danger |
| `discardChanges()` | `"You have unsaved changes. Discard them?"` — usado por `unsavedChangesGuard` |
| `confirm(options)` | Genérico: `{ title, content, okText?, cancelText?, danger? }` |

```typescript
// Delete con nombre del ítem:
this.confirm.delete(entity.name)
  .subscribe(() => this.mediator.send(new DeleteEntityCommand(id), DeleteEntityHandler));

// En unsaved-changes.guard (ya integrado):
return inject(ConfirmService)
  .discardChanges()
  .pipe(map(() => true), defaultIfEmpty(false));
```

### `CsvExportService`

Generates a CSV string from headers + row arrays and triggers a browser download. Handles double-quote escaping automatically.

```typescript
private readonly csvExport = inject(CsvExportService);

exportCsv(): void {
  this.csvExport.download(
    `entities-page${this.currentPage}.csv`,
    ['Name', 'Status'],
    this.pagedData().items.map(e => [e.name, e.status]),
  );
}
```

Never write inline Blob / `URL.createObjectURL` / `document.createElement('a')` logic in feature components.

---

## Shared — Guards (`shared/guards/`)

### `CanDeactivateComponent` interface

```typescript
export interface CanDeactivateComponent {
  hasUnsavedChanges(): boolean;
}
```

Implemented by any form component that needs dirty-check on navigation.

### `unsavedChangesGuard`

Functional `CanDeactivateFn`. If `hasUnsavedChanges()` returns true, shows an `NzModalService` confirmation dialog. Returns `Observable<boolean>`.

Applied to `new` and `:id/edit` routes in both `categories.routes.ts` and `products.routes.ts`.

---

## Page Patterns

### List pages (`[entity]-list`)

All list pages share a consistent pattern:

**Loading strategy — skeleton vs spinner:**
- `initialLoad = signal(true)` — true only on first render
- `@if (initialLoad() && loading())` → shows `<nz-skeleton>` (full page skeleton)
- `@else` → shows `<nz-spin [nzSpinning]="loading()">` (overlay spinner on reload)
- `initialLoad.set(false)` after the first API response
- Prevents `onQueryParamsChange` from triggering a second load on init: `if (!this.initialLoad()) this.loadX()`

**Server-side table with NG-Zorro:**
- `[nzFrontPagination]="false"` + `(nzQueryParams)="onQueryParamsChange($event)"`
- Sorting: `nzColumnKey` + `[nzSortFn]="true"` on `<th>`, read via `params.sort.find(s => s.value !== null)`
- Column filters (multi-select): `[nzFilters]` + `[nzFilterFn]="true"` + `[nzFilterMultiple]="true"`
- Custom column filters (range inputs): `[nzCustomFilter]="true"` + `<nz-filter-trigger>` + `<nz-dropdown-menu>`
- Empty state: `[nzNoResult]="emptyTemplate"` on `<nz-table>` — never add a custom `<tr>` in tbody

**Resetting column filter checkboxes programmatically:**

NG-Zorro's `NzTableFilterComponent` only resets visual checkmarks when `[nzFilters]` receives a **new array reference** (via `ngOnChanges`). To force this on "Clear all":

```typescript
private filterVersion = signal(0);

// All filter arrays must be computed() and depend on filterVersion:
readonly statusFilters = computed(() => {
  this.filterVersion();
  return [{ text: 'Active', value: StatusDataPolicy.Active }, ...];
});

clearAllFilters(): void {
  // ... reset state signals ...
  this.filterVersion.update(v => v + 1); // new array references → checkboxes reset
  this.loadX();
}
```

**Active filter tags + result count:**
- `hasActiveFilters` getter drives the tags bar visibility
- Each active filter renders as an `<nz-tag>` with an `×` close button
- "Clear all" button resets all state signals + bumps `filterVersion`

**Search debounce:**
```typescript
private readonly searchSubject = new Subject<string>();

// In ngOnInit:
this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
  .subscribe(term => { this.activeSearch.set(term); this.currentPage = 1; this.loadX(); });
```

### Form pages (`[entity]-form`) — Modal pattern

Form components are opened as modals from list and detail pages. They are **not routed** — no `new` or `:id/edit` routes exist.

**Opening a modal (from list or detail):**
```typescript
// Lazy-load the form component to keep the bundle split
import('../../pages/[entity]-form/[entity]-form.component').then(({ EntityFormComponent }) => {
  const ref = this.modal.create({
    nzTitle: id ? 'Edit Entity' : 'New Entity',
    nzContent: EntityFormComponent,
    nzData: { id },           // undefined = create mode, string = edit mode
    nzFooter: null,           // form has its own action buttons
    nzWidth: 560,
    nzMaskClosable: false,
    nzOnCancel: () => { ref.getContentComponent()?.cancel(); return false; },
  });
  ref.afterClose.subscribe(result => {
    if (result === true) this.loadX(); // reload on success
  });
});
```

> **Required:** `NzModalModule` must be registered globally in `app.config.ts` via `importProvidersFrom(NzModalModule)`. `NzModalService` is NOT `providedIn: 'root'` — without this, any component that injects it will fail silently at runtime (blank page).

**Inside the form component:**
```typescript
private readonly modalRef     = inject(NzModalRef);
private readonly modalService = inject(NzModalService);  // for dirty-check confirm
readonly data: { id?: string } = inject(NZ_MODAL_DATA);

// On success:
this.modalRef.close(true);

// Cancel with dirty-check:
cancel(): void {
  if (!this.form?.dirty) { this.modalRef.close(false); return; }
  this.modalService.confirm({
    nzTitle: 'Unsaved Changes', nzContent: '...',
    nzOkText: 'Discard', nzOkDanger: true, nzCancelText: 'Keep editing',
    nzOnOk: () => this.modalRef.close(false),
  });
}
```

The `nzOnCancel` callback in the parent delegates to `component.cancel()` and returns `false`, so both the X button and the Cancel button go through the same dirty-check flow.

Form templates contain only `<nz-spin>` + `<form>` — no `<app-page-header>` or `<nz-card>` wrapper.

- Implements `CanDeactivateComponent` → `hasUnsavedChanges(): boolean { return this.form?.dirty === true && !this.submitting(); }`
- `form.markAsPristine()` after successful submit and after `patchValue` in edit mode
- Character counters via `nameLength = signal(0)` updated with `valueChanges.pipe(startWith(''), takeUntilDestroyed)`
- Every form includes a status field — use `<app-status-form-field [control]="asControl(form.get('status'))">` (defaults to `StatusDataPolicy.Active`)

### Detail pages (`[entity]-detail`)

- Skeleton while loading, then `@if (entity(); as e) { ... }` for the content
- Header extra template includes: **Back** button (navigates to list) + Edit button (role-gated) + Delete button (role-gated with `nz-popconfirm`)
- Status rendered as `<nz-tag [nzColor]="e.status | statusColor">{{ e.status | statusLabel }}</nz-tag>`

---

## Authorization Policies (mirrors .NET API)

| Policy | Required role(s) | Applied in frontend |
|---|---|---|
| `it` | `it` | `roleGuard('it')` — DELETE routes |
| `supervisor` | `it`, `supervisor` | `roleGuard('supervisor')` — POST/PUT routes |
| `standard` | `it`, `supervisor`, `standard` | Informational — GET requires only `authGuard` |

Role checks in components use `keycloak.canAccess(policy)` for conditional rendering of buttons.

---

## Starting a New Project from This Template

> See **[docs/NEW_PROJECT.md](docs/NEW_PROJECT.md)** for the complete guide: clone, rename, verify shared infrastructure, remove example features.
>
> **Never** run `ng new` and copy files selectively — `shared/` will be missing and every feature page will fail to compile.

---

## Adding a New Feature

1. **Model** — create `features/[entity]/models/[entity].model.ts` with `[Entity]Dto`, `Create[Entity]Request`, `Update[Entity]Request`. Include `status: StatusDataPolicy` in create/update requests.
2. **Queries** — create `Get[Entities]Query`, `Get[Entity]ByIdQuery` and their handlers.
3. **Commands** — create `Create`, `Update`, `Delete` commands and their handlers.
4. **Pages** — create list, form, and detail components following the patterns in [Page Patterns](#page-patterns).
   - List: server-side table + `filterVersion` signal + `initialLoad` skeleton pattern. Use `<app-table-row-actions>` for the Actions column.
   - Form: implements `CanDeactivateComponent`, character counters, and `<app-status-form-field>` for the status field.
   - Detail: skeleton + Back/Edit/Delete buttons in header extra
5. **Routes** — create `[entity].routes.ts` with lazy-loaded components, role guards, and `canDeactivate: [unsavedChangesGuard]` on form routes.
6. **App routes** — add a lazy child route in `app.routes.ts`.
7. **Navigation** — add a nav link in `main-layout.component.html`.
8. **Icons** — register any new NG-Zorro icon in the `NZ_ICONS` array in `app.config.ts`.

---

## Environment Configuration

### `environment.ts` (development)

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

### `environment.prod.ts` (production)

```typescript
export const environment = {
  production: true,
  apiUrl:  'https://api.yourdomain.com/api/v1',
  keycloak: {
    url:      'https://keycloak.pinnacleaerospace.com',
    realm:    'pinnacle-dev',
    clientId: 'global-client-dev',
  },
};
```

---

## App Initialization Flow

```
main.ts → bootstrapApplication(AppComponent, appConfig)
  → APP_INITIALIZER: keycloakInitFactory(KeycloakService)
      → keycloak.init({ onLoad: 'login-required', pkceMethod: 'S256' })
      → If authenticated: loadUserProfile() + scheduleTokenRefresh()
      → If not authenticated: redirect to Keycloak login
  → provideRouter(routes)
  → provideHttpClient(withInterceptors([loadingInterceptor, correlationIdInterceptor, authInterceptor, errorInterceptor]))
  → provideNzI18n(en_US)
  → LOCALE_ID: 'en-US'
  → DATE_PIPE_DEFAULT_OPTIONS: { timezone: 'America/Phoenix' }
  → provideNzIcons([...icons])
  → App renders
```

> **Note:** `ChangeDetectionStrategy.OnPush` is applied to all components. `HttpLoadingService` + `loadingInterceptor` drive the global top progress bar in main-layout.

---

## NG-Zorro Icons Registration

Icons are tree-shaken and must be explicitly registered in `app.config.ts` under `provideNzIcons([...])`. Only import from `@ant-design/icons-angular/icons`.

When adding a new icon, import its `Outline` variant and add it to the `NZ_ICONS` array in `app.config.ts`. Icon names follow the `[Name]Outline` / `[Name]Fill` / `[Name]TwoTone` naming convention.

---

## GitHub

- **Repo API:** https://github.com/jcochoa234/store-003-api
- **Repo Frontend:** https://github.com/jcochoa234/store-003-frontend
