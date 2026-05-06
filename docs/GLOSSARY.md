# Glossary of Terms

Understanding the underlying concepts of this template is essential for efficient development. Refer to this glossary when in doubt.

---

## Architectural Concepts

* **Vertical Slice Architecture**: Features are organized by entity/use-case rather than by technical layer. Each slice (`features/[entity]/`) bundles its Commands, Queries, Handlers, Models, and Pages together, maximizing cohesion and minimizing cross-cutting complexity.

* **CQRS (Command Query Responsibility Segregation)**: A pattern that separates reading data (Queries) from writing/updating data (Commands). Each operation has its own class and handler, clarifying intent and making each side independently testable.

* **Mediator Pattern**: A central `MediatorService` dispatches Commands and Queries to their corresponding Handlers without the caller needing to know the handler's identity. Mirrors the custom `Mediator.cs` from the .NET API template.

* **Result Pattern (Railway-Oriented Programming)**: All API calls return `Result<T>` — either `Result.success(value)` or `Result.failure(error)`. Components use `.match(onSuccess, onFailure)` to branch on outcome without throwing or catching exceptions.

---

## Custom Mediator (`core/mediator/`)

A lightweight, zero-library implementation of the Mediator pattern built on Angular's `Injector`.

| Type | Role |
|---|---|
| `IRequest<TResponse>` | Marker interface for all Commands and Queries |
| `ICommand<TResponse>` | Extends `IRequest` — represents a mutation (create, update, delete) |
| `IQuery<TResponse>` | Extends `IRequest` — represents a read operation |
| `IRequestHandler<TRequest, TResponse>` | Handles a specific request type, returns `Observable<Result<TResponse>>` |
| `MediatorService` | Entry point — `send(request, HandlerClass)` resolves and invokes the handler via Angular `Injector` |

---

## Core Services

* **`KeycloakService`**: Wraps `keycloak-js` and exposes Angular-friendly reactive state via signals (`isAuthenticated`, `profile`, `fullName`, `roles`). Handles initialization, silent token refresh, login/logout, and role checking. Called by `APP_INITIALIZER` before the app renders.

* **`ApiService`**: Base HTTP service that wraps `HttpClient`. Every method returns `Observable<Result<T>>` with HTTP errors automatically mapped to `Result.failure(AppError)`. Handlers extend this abstraction — never call `HttpClient` directly from handlers.

* **`MediatorService`**: Resolves Angular-injectable handlers by type from the `Injector` at runtime. Acts as the dispatch hub for all Commands and Queries. No handler registration required — all handlers are `providedIn: 'root'`.

* **`HttpCacheService`**: In-memory TTL cache for stable GET responses (e.g. full category lists used in dropdowns). `get(key)` returns null if missing or expired. `set(key, value, ttlMs)` stores with TTL (default 60 s). `invalidate(prefix)` removes all entries whose key starts with the prefix — called by Create/Update/Delete handlers to keep the cache consistent.

* **`ThemeService`**: Manages light/dark mode. Reads `localStorage` and `prefers-color-scheme` on startup. `toggle()` flips the theme and sets `data-theme` on `<html>`, which activates `html[data-theme="dark"]` CSS overrides in `styles.less`. Persists the choice across sessions.

* **`GlobalErrorHandler`**: Replaces Angular's default `ErrorHandler`. Catches uncaught exceptions from `ngOnInit`, unhandled Promise rejections, and template errors. Skips `HttpErrorResponse` (already handled by `errorInterceptor`). Displays a toast via `NzMessageService` (lazy-resolved through `Injector` to avoid circular DI at bootstrap).

---

## Shared Services (`shared/services/`)

* **`NotifyService`**: Centralized wrapper over `NzMessageService`. Provides semantic methods — `created(entity)`, `updated(entity)`, `deleted(entity)`, `error(AppError|string)`, `success(text)`. Feature components must use this service instead of injecting `NzMessageService` directly.

* **`FormModalService`**: Encapsulates the `modal.create()` + lazy import + `afterClose` pattern. `open(loader, options)` lazy-loads the component, opens it as an `NzModal`, and returns `Observable<boolean>` (true = saved, false = cancelled/closed). Every form component opened this way must implement the `ModalForm` interface: `cancel(): void`.

* **`ConfirmService`**: Reusable confirmation dialogs. Returns `Observable<void>` that emits on OK and completes without emitting on Cancel. Methods: `delete(itemName)` (danger dialog with item name), `discardChanges()` (used by `unsavedChangesGuard`), `confirm(options)` (generic). Feature components must use this instead of calling `NzModalService.confirm()` directly.

---

## HTTP Interceptors

Functional interceptors registered in `app.config.ts` via `withInterceptors([...])`. Executed in registration order on every outgoing request.

* **`loadingInterceptor`**: Calls `HttpLoadingService.start()` when a request begins and `end()` in `finalize()` when it completes. Drives the global top progress bar rendered in `MainLayoutComponent`.

* **`correlationIdInterceptor`**: Generates a UUID (via `crypto.randomUUID()`) and attaches it as `X-Correlation-ID` to every request. Enables end-to-end tracing across the Angular app and the .NET API. Mirrors `CorrelationIdMiddleware` from the API template.

* **`authInterceptor`**: Calls `KeycloakService.refreshToken()` to ensure the token is valid (> 30 s remaining), then attaches `Authorization: Bearer <token>` to every outgoing request.

* **`errorInterceptor`**: Centralized HTTP error handler. Maps status codes to user-facing actions:
  - `0` → Network error message
  - `401` → Redirect to `/unauthorized`
  - `403` → Error message + redirect to `/unauthorized`
  - `400` → Displays each validation error via `NzMessageService`
  - `404` / `409` → Displays the `ProblemDetails.title` as an error message
  - `5xx` → Generic error message

---

## Models and Primitives

* **`Result<T>`**: Immutable wrapper for a successful value or a failure error. Created via `Result.success(value)` or `Result.failure(error)`. Use `.match(onSuccess, onFailure)` for pattern-matching — mirrors `ResultExtensions.Match()` from the .NET API.

* **`PagedResponse<T>`**: Mirrors the `PagedResponse<T>` record from the .NET Domain layer exactly. Contains `items`, `page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`, and `hasPreviousPage`.

* **`AppError`**: Represents a business or transport failure. Has `code` (string), `message` (string), and `type` (`ErrorType` enum). Created by `ApiService._mapError()` when an HTTP error occurs.

* **`ErrorType`**: Enum mirroring the .NET `ErrorType`: `None`, `Failure`, `NotFound`, `Conflict`, `Validation`, `Unauthorized`.

* **`ProblemDetails`**: TypeScript interface for the RFC 7807 error body returned by the .NET API. Has `title`, `status`, `detail`, `traceId`, and optional `errors` (validation groups).

* **`StatusDataPolicy`**: Enum mirroring the .NET `StatusDataPolicy` enum. Values: `Active`, `Inactive`, `Deleted`. Serialized as strings by the API (`JsonStringEnumConverter`).

---

## Auth Concepts

* **PKCE (Proof Key for Code Exchange)**: Security extension for the OAuth 2.0 Authorization Code flow. Configured via `pkceMethod: 'S256'` in `keycloak-js`. Required for public clients (no client secret). Prevents authorization code interception attacks.

* **`login-required`**: Keycloak `onLoad` strategy. Forces the user to authenticate before the Angular app renders. The app never shows an unauthenticated state.

* **Realm Roles**: Keycloak roles assigned at the realm level (not client-specific). The frontend reads these from the token's `realm_access.roles` claim via `keycloak-js`'s `hasRealmRole()` method.

* **`canAccess(policy)`**: `KeycloakService` method that checks Keycloak realm roles — `'it'` → solo `it`; `'supervisor'` → `it|supervisor`; `'standard'` → `it|supervisor|standard`.

* **`authGuard`**: Functional route guard. Blocks access to routes if the user is not authenticated. Triggers `keycloak.login()` if not.

* **`roleGuard(policy)`**: Factory function returning a `CanActivateFn`. Blocks access and redirects to `/unauthorized` if the user lacks the required role for the given policy.

---

## Angular Concepts

* **Standalone Components**: Angular 14+ feature. Components declare their own `imports` array instead of belonging to an NgModule. All components in this template use `standalone: true`.

* **Signals**: Angular 16+ reactive primitive. `signal<T>(initialValue)` creates a reactive value; `computed(() => ...)` derives values; `effect(() => ...)` runs side effects. Used for all component state in this template instead of RxJS subjects.

* **Functional Guards**: Angular 14+ feature. Guards are plain functions (`CanActivateFn`) instead of classes. Used in `auth.guard.ts` and `role.guard.ts`.

* **Functional Interceptors**: Angular 15+ feature. Interceptors are plain functions (`HttpInterceptorFn`) instead of classes implementing `HttpInterceptor`. Used for all three interceptors.

* **`inject()`**: Angular function-based DI. Used instead of constructor injection in all components and services. Enables dependency injection outside of constructors (in `@Component` field initializers and guard/interceptor functions).

* **`APP_INITIALIZER`**: Angular token that runs an async function before the application bootstraps. Used to initialize Keycloak and ensure the user is authenticated before any component renders.

* **Lazy Loading**: Routes in `app.routes.ts` and `[entity].routes.ts` use `loadComponent()` and `loadChildren()` to defer loading component bundles until the route is activated.

---

## NG-Zorro Concepts

* **`NzMessageService`**: Global toast notification service. Used internally by `NotifyService` and `errorInterceptor`. Feature components should never inject this directly — use `NotifyService` instead.

* **`nz-popconfirm`**: Inline popover confirmation. Used on delete buttons — preferred over modal dialogs for simple yes/no confirmations.

* **`nz-table`**: NG-Zorro data table. Configured with `nzFrontPagination="false"` for server-side pagination and `(nzQueryParams)` to emit pagination/sort changes.

* **`NzTableQueryParams`**: Event emitted by `nz-table` when page index or page size changes. Contains `pageIndex` and `pageSize`. Used to trigger a new `GetProductsQuery`.

* **`provideNzIcons([...icons])`**: Tree-shakeable icon registration. Only imported icons are included in the bundle. Icons must be added to the `NZ_ICONS` array in `app.config.ts` before using them in templates.

* **NG-Zorro LESS Theme**: NG-Zorro uses LESS for theming. Override variables (e.g., `@primary-color`, `@border-radius-base`) in `styles.less` before the `ng-zorro-antd.less` import to customize the design system.

---

## Project Flow Terms

* **Vertical Slice**: A self-contained folder under `features/[entity]/` that owns everything needed for one domain entity — models, commands, queries, handlers, and pages. Adding a new feature means adding a new slice, not modifying existing layers.

* **Command**: A class implementing `ICommand<TResponse>` that represents a mutation. Carries the payload for the operation. Dispatched via `MediatorService.send(command, Handler)`.

* **Query**: A class implementing `IQuery<TResponse>` that represents a read. Carries query parameters. Dispatched via `MediatorService.send(query, Handler)`.

* **Handler**: An `@Injectable` service implementing `IRequestHandler<TRequest, TResponse>`. Contains the API endpoint knowledge for one specific operation. Returns `Observable<Result<TResponse>>`.

* **`X-Correlation-ID`**: A UUID generated per HTTP request. Sent as a request header and echoed back in the response header by the .NET API. Used to correlate a browser network request with a specific log entry in the API.

* **Soft Delete**: Backend-only concept. The .NET API marks records as `Status = Deleted` instead of removing them. The frontend can filter by `Active`, `Inactive`, or `Deleted` via `StatusDataPolicy` in list pages. The API's `HasQueryFilter` may hide `Deleted` records by default depending on configuration.

* **`PagedQuery`**: Interface with `page` and `pageSize` fields. Extended by query models that need pagination (e.g., `GetProductsRequest`). Page starts at `1`; default page size is `10`.

* **URL State Persistence**: List pages sync their pagination, search, filter, and sort state to the browser's query parameters using `_syncToUrl()` (called before each load) and `_readFromUrl()` (called in `ngOnInit`). This enables deep-linking, back-button navigation, and shareable filtered URLs. The `initialLoad` signal prevents `onQueryParamsChange` from overwriting URL-restored state on the table's first render.

* **Feature Flags**: Boolean flags in `environment.ts` under `features.*` (e.g. `enableExport`, `enableNotifications`) that toggle optional UI capabilities without code changes. Read in components via `environment.features.enableExport`. Evaluated at build time — not runtime-configurable.

* **`ModalForm` interface**: Contract that every form component opened as a modal must implement. Requires a `cancel(): void` method, which is called by `FormModalService`'s `nzOnCancel` callback. Enables the X button and Cancel button to go through the same dirty-check flow.

* **`CanDeactivateComponent` interface**: Contract for any form component that needs a dirty-check on route navigation. Requires `hasUnsavedChanges(): boolean`. Used by `unsavedChangesGuard`.

* **`unsavedChangesGuard`**: Functional `CanDeactivateFn`. If `hasUnsavedChanges()` returns true, opens a `ConfirmService.discardChanges()` dialog. Returns `Observable<boolean>` — true if the user confirmed, false if they cancelled.
