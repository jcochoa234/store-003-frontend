# Project Rules & Guidelines

To maintain the integrity of the Vertical Slice Architecture and CQRS pattern, all team members must adhere to the following rules when contributing to **SS.TemplateFrontend**.

---

## 1. Dependency Direction

The **Dependency Rule** strictly points inward:

```
pages → handlers → ApiService → HttpClient / Keycloak
```

* `pages/` — present UI and delegate all business operations to the mediator. No direct HTTP calls.
* `handlers/` — hold the only knowledge of API endpoints for their feature. Use `ApiService`, never `HttpClient` directly.
* `core/` — infrastructure-level singletons. Never import from `features/`.
* `shared/` — reusable primitives only. No entity-specific models or handlers.

**Never do this:**
* Call `ApiService` or `HttpClient` directly from a page component — always dispatch via `MediatorService`.
* Import a handler or model from one feature slice into another (except models needed for cross-feature queries, such as loading categories inside the products form).
* Put business logic inside pipes, validators, or layout components.

---

## 2. CQRS — Commands and Queries

Every interaction with the API must be expressed as a **Command** (mutation) or a **Query** (read).

### Command

```typescript
// 1. Define the command class
export class CreateProductCommand implements ICommand<string> {
  constructor(public readonly payload: CreateProductRequest) {}
}

// 2. Implement the handler
@Injectable({ providedIn: 'root' })
export class CreateProductHandler
  implements IRequestHandler<CreateProductCommand, string> {
  private readonly api = inject(ApiService);

  handle(request: CreateProductCommand): Observable<Result<string>> {
    return this.api.post<string>('/products', request.payload);
  }
}

// 3. Dispatch from the page component
this.mediator.send(new CreateProductCommand(payload), CreateProductHandler)
  .subscribe(result => result.match(
    id  => this.router.navigate(['/products']),
    err => this.message.error(err.message)
  ));
```

### Query

```typescript
// 1. Define the query class
export class GetProductsQuery implements IQuery<PagedResponse<ProductDto>> {
  constructor(public readonly params: GetProductsRequest) {}
}

// 2. Implement the handler
@Injectable({ providedIn: 'root' })
export class GetProductsHandler
  implements IRequestHandler<GetProductsQuery, PagedResponse<ProductDto>> {
  private readonly api = inject(ApiService);

  handle(request: GetProductsQuery): Observable<Result<PagedResponse<ProductDto>>> {
    return this.api.get<PagedResponse<ProductDto>>('/products', { ...request.params });
  }
}
```

**Rules:**
* Commands return `ICommand<string>` (create — returns new ID), `ICommand<void>` (update/delete).
* Queries return `IQuery<PagedResponse<Dto>>` (paginated list) or `IQuery<Dto>` (single item).
* Handlers must be `@Injectable({ providedIn: 'root' })` — no additional DI registration needed.
* Never perform HTTP calls outside of handlers.

---

## 3. Vertical Slice Organization

Every entity gets its own isolated folder under `features/`. The folder must contain:

```
features/[entity]/
├── models/           ← DTOs and request interfaces
├── commands/         ← one subfolder per command
├── queries/          ← one subfolder per query
├── pages/            ← smart components (list, form, detail)
└── [entity].routes.ts
```

**Rules:**
* Each command/query gets its own subfolder with a `.command.ts`/`.query.ts` and a `.handler.ts` file.
* Page components are **smart** — they inject `MediatorService` and manage component state via signals.
* Sub-components (tables, form fields) inside a page are **dumb** — they receive `@Input()` and emit `@Output()`. No injected services.
* Route files export a single `[ENTITY]_ROUTES` constant and use lazy loading for every component.

---

## 4. Result Pattern

All API interactions must return `Observable<Result<T>>`. Components use `.match()` for branching — never use `.subscribe()` with `next`/`error` callbacks for API responses.

```typescript
// Correct
this.mediator.send(new GetProductByIdQuery(id), GetProductByIdHandler)
  .subscribe(result => result.match(
    product => this.product.set(product),
    err     => this.message.error(err.message)
  ));

// Incorrect — do not do this
this.http.get('/products/1').subscribe({
  next:  p  => this.product.set(p),
  error: e  => console.error(e),
});
```

`Result.failure()` is returned by `ApiService` when HTTP errors occur. The `errorInterceptor` handles side effects (NzMessage notifications, 401/403 redirects) before the result reaches the component.

---

## 5. Reactive State — Signals

Use Angular signals (`signal()`, `computed()`, `effect()`) for component state. Do not use `BehaviorSubject` or other RxJS subjects for local component state.

```typescript
// Correct
loading = signal(false);
products = signal<ProductDto[]>([]);
totalCount = computed(() => this.products().length);

// Incorrect — prefer signals over subjects for local state
loading$ = new BehaviorSubject(false);
```

**Exceptions:**
* Use `Observable` (RxJS) for async streams from handlers, router events, and HTTP responses.
* Use `toSignal()` to bridge an `Observable` into a signal when appropriate.

---

## 6. Forms

All forms must use **Angular Reactive Forms** (`FormBuilder`, `FormGroup`). Template-driven forms are not allowed.

**Rules:**
* Validators must mirror the FluentValidation rules from the .NET API (same lengths, same constraints).
* Use `CustomValidators` from `shared/validators/custom-validators.ts` for domain-specific rules (`positiveOrZero`, `notWhiteSpace`, etc.).
* Always call `markAsDirty()` + `updateValueAndValidity()` on all controls before submitting, to trigger error display.
* Use `nzHasFeedback` on `nz-form-control` for inline validation feedback icons.
* Disable the submit button with `[nzLoading]` while a command is in flight.

---

## 7. Authorization — Guards and Conditional Rendering

Route-level access is enforced by guards. UI-level access (showing/hiding buttons) is enforced by `keycloak.canAccess(policy)`.

```typescript
// Route guard
{ path: 'new', canActivate: [roleGuard('supervisor')], ... }

// Component — conditional rendering
readonly canCreate = this.keycloak.canAccess('supervisor');
readonly canDelete = this.keycloak.canAccess('it');
```

```html
<!-- Template — conditional rendering -->
@if (canCreate) {
  <button nz-button nzType="primary" routerLink="new">New Category</button>
}
```

**Rules:**
* Always guard routes AND conditionally render actions — defense in depth.
* Map guard policies directly to the API's authorization policies: `it` → DELETE, `supervisor` → POST/PUT.
* Never use role strings directly in templates — always call `canAccess()`.

---

## 8. Standalone Components

All components must use `standalone: true`. NgModules are not used in this project.

```typescript
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, NzTableModule, NzButtonModule, ...],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent { ... }
```

**Rules:**
* Import only the NG-Zorro modules actually used by the component — no barrel imports like `NzAntdModule`.
* Use `inject()` function for dependency injection — never constructor injection.
* Use Angular 17+ control flow syntax (`@if`, `@for`, `@switch`) — no `*ngIf` or `*ngFor` structural directives.
* Do not use `async` pipe for observables returned by handlers — subscribe manually and update a signal.

---

## 9. Shared Services — Mandatory Usage

Three shared services centralize patterns that would otherwise be repeated in every feature. **Do not bypass these services** by injecting their underlying NG-Zorro equivalents directly.

### `NotifyService` — `shared/services/notify.service.ts`

```typescript
// Correct — always use NotifyService
this.notify.created('Product');
this.notify.updated('Category');
this.notify.deleted('Product');
this.notify.error(err);           // AppError or string

// Incorrect — never inject NzMessageService in feature components
this.message.success('Product created successfully.');
```

### `FormModalService` — `shared/services/form-modal.service.ts`

```typescript
// Correct — open any form modal in 3 lines
this.formModal.open(
  () => import('../entity-form/entity-form.component').then(m => m.EntityFormComponent),
  { title: id ? 'Edit Entity' : 'New Entity', data: { id }, width: 560 },
).subscribe(saved => { if (saved) this.loadEntities(); });

// Incorrect — never call modal.create() with lazy imports inline in feature components
import('...').then(({ Comp }) => { const ref = this.modal.create({ ... }); ... });
```

> Every form component opened via `FormModalService` must implement `ModalForm`: `cancel(): void`.

### `ConfirmService` — `shared/services/confirm.service.ts`

```typescript
// Delete with entity name in the dialog
this.confirm.delete(product.name)
  .subscribe(() =>
    this.mediator.send(new DeleteProductCommand(id), DeleteProductHandler)
      .subscribe(result => result.match(
        () => { this.notify.deleted('Product'); this.loadProducts(); },
        err => this.notify.error(err),
      ))
  );

// Incorrect — never write inline modal.confirm() in feature components
this.modal.confirm({ nzTitle: 'Are you sure?', nzOnOk: () => { ... } });
```

---

## 10. Shared Components — Mandatory Usage

> See the full catalog with examples: **[docs/SHARED_COMPONENTS.md](SHARED_COMPONENTS.md)**

The `shared/` folder contains components and a service that eliminate boilerplate repeated across every feature page. **Do not write these patterns inline** — use the shared abstraction instead.

### Loading state — `<app-loading-container>`

```html
<!-- List page: skeleton on first load, spinner on reload -->
<app-loading-container [initialLoad]="initialLoad()" [loading]="loading()">
  <nz-table ...>...</nz-table>
</app-loading-container>

<!-- Detail page: always starts as skeleton -->
<nz-card [nzBordered]="false">
  <app-loading-container [loading]="loading()" [initialLoad]="true">
    @if (entity(); as e) { ... }
  </app-loading-container>
</nz-card>
```

**Do not** write `@if (loading()) { <nz-skeleton> } @else { ... }` manually in any component.

### Status badge — `<app-status-tag>`

```html
<app-status-tag [status]="entity.status"></app-status-tag>
```

**Do not** write `@if (status) { <nz-tag \| statusColor> } @else { <span>—</span> }` inline.

### Character counter — `<app-char-counter>`

```html
<ng-template #nameExtra>
  <app-char-counter [current]="nameLength()" [max]="NAME_MAX"></app-char-counter>
</ng-template>
```

**Do not** write `<span class="char-count">{{ n }} / {{ max }}</span>` inline in every form template.

### CSV export — `CsvExportService`

```typescript
this.csvExport.download(
  `entities-page${this.currentPage}.csv`,
  ['Name', 'Status'],
  this.pagedData().items.map(e => [e.name, e.status]),
);
```

**Do not** write inline Blob / createObjectURL / createElement logic in feature components.

---

## 11. NG-Zorro Usage

* **Layout** — use `nz-layout`, `nz-sider`, `nz-header`, `nz-content`, `nz-footer`.
* **Tables** — use `nz-table` with `nzFrontPagination="false"` for server-side pagination. Always track rows with `track item.id`.
* **Forms** — use `nz-form-item` > `nz-form-label` > `nz-form-control` structure.
* **Notifications** — use `NotifyService` (`shared/services/notify.service.ts`) for all success/error toasts. Never inject `NzMessageService` directly in feature components.
* **Confirmations** — use `nz-popconfirm` on inline delete buttons. For named-item confirmation dialogs, use `ConfirmService.delete(name)`. Never write `NzModalService.confirm()` inline in feature components.
* **Modal forms** — use `FormModalService.open()` to lazy-load and open form components as modals. Never call `NzModalService.create()` directly in feature components.
* **Icons** — only import icons registered in `app.config.ts`. Add new icons to the `NZ_ICONS` array before using them.
* **Styles** — override NG-Zorro theme variables in `styles.less`. Use scoped component LESS files for component-specific rules.

---

## 12. Configuration

* All environment-specific values must live in `src/environments/`. Never hardcode URLs or client IDs in service or component files.
* `keycloak.url` points to `https://keycloak.pinnacleaerospace.com` (realm `pinnacle-dev`, client `global-client-dev`) in both development and production.
* Before deploying to production, replace all placeholder values in `environment.prod.ts`. Never commit real credentials — inject them via CI/CD environment variables at build time.
* The production build (`ng build --configuration production`) automatically swaps `environment.ts` for `environment.prod.ts` via Angular's `fileReplacements`.
* The app locale is `en-US` and the default timezone is `America/Phoenix` (MST — no daylight saving). Both are configured in `app.config.ts` via `LOCALE_ID` and `DATE_PIPE_DEFAULT_OPTIONS`. All `DatePipe` usages (`| date`) will automatically apply this timezone.

---

## 13. Path Aliases

Always use the configured `@` path aliases for imports — never use relative paths that traverse more than one directory level.

```typescript
// Correct
import { ApiService } from '@core/http/api.service';
import { Result } from '@core/models/result.model';
import { environment } from '@environments/environment';

// Incorrect
import { ApiService } from '../../../../core/http/api.service';
```

Aliases are configured in `tsconfig.json` under `compilerOptions.paths` and automatically resolved by the Angular build.

---

## 14. Starting a New Project from This Template

> Before adding any features, verify the mandatory infrastructure is in place.
> See **[docs/NEW_PROJECT.md](NEW_PROJECT.md)** for the full step-by-step guide.

The `shared/` folder is **not** example code — it is required infrastructure that every feature page depends on. Missing it will cause compilation errors.

**Minimum shared structure that must exist before writing any feature code:**

```
src/app/shared/
├── components/   (11 components: loading-container, status-tag, char-counter,
│                  page-header, detail-actions, table-row-actions, form-actions,
│                  status-form-field, list-toolbar, search-input, empty-state)
├── guards/       (can-deactivate.interface.ts, unsaved-changes.guard.ts)
├── pipes/        (status.pipe.ts)
├── services/     (notify, form-modal, confirm, csv-export)
└── validators/   (custom-validators.ts)
```

---

## 15. Adding a New Feature — Checklist

Follow this sequence when adding a new entity to the template:

| Step | Action |
|---|---|
| 1 | Create `features/[entity]/models/[entity].model.ts` with DTO and request interfaces |
| 2 | Create `queries/get-[entities]/` — query class + handler (GET paginated list) |
| 3 | Create `queries/get-[entity]-by-id/` — query class + handler (GET by ID) |
| 4 | Create `commands/create-[entity]/` — command class + handler (POST) |
| 5 | Create `commands/update-[entity]/` — command class + handler (PUT) |
| 6 | Create `commands/delete-[entity]/` — command class + handler (DELETE) |
| 7 | Create `pages/[entity]-list/` — use `<app-loading-container>`, `<app-status-tag>`, `<app-list-toolbar>`, `<app-empty-state>`, `<app-table-row-actions>` |
| 8 | Create `pages/[entity]-form/` — use `<app-char-counter>`, `<app-form-actions>`, `<app-status-form-field>`; implement `ModalForm` and `CanDeactivateComponent` |
| 9 | Create `pages/[entity]-detail/` — use `<app-loading-container [initialLoad]="true">`, `<app-status-tag>`, `<app-detail-actions>` |
| 10 | Use `NotifyService` for all toasts, `FormModalService` to open the form modal, `ConfirmService` for named-delete confirms, `CsvExportService` for CSV export |
| 11 | Create `[entity].routes.ts` with lazy-loaded routes and role guards |
| 12 | Register child route in `app.routes.ts` |
| 13 | Add menu item to `main-layout.component.html` |
| 14 | Register required icons in `app.config.ts → NZ_ICONS` |
