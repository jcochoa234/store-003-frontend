# Shared Components, Services & Utilities Catalog

> **Rule:** Before writing any UI block, form pattern, or utility function — check this catalog first.
> Everything listed here already exists, is tested in two feature slices, and must be reused.
> Adding duplicate code when a shared abstraction exists is a code review rejection.

---

## How to find what you need

| I need to… | Use |
|---|---|
| Show a loading skeleton on first load, spinner on reload (list pages) | `<app-loading-container>` |
| Show a loading skeleton for a detail page | `<app-loading-container [loading]="loading()" [initialLoad]="true">` |
| Show a status badge (Active / Inactive / Deleted) | `<app-status-tag>` |
| Show a character counter below a text input | `<app-char-counter>` |
| Show the page title + breadcrumbs | `<app-page-header>` |
| Show Back / Edit / Delete buttons on a detail page | `<app-detail-actions>` |
| Show View / Edit / Delete action buttons in a table row | `<app-table-row-actions>` |
| Show Save / Cancel buttons in a modal form | `<app-form-actions>` |
| Show the Status select field in a modal form | `<app-status-form-field>` |
| Show the search bar + total count + clear/export bar on a list page | `<app-list-toolbar>` |
| Show a standalone search input with clear button | `<app-search-input>` |
| Show the empty state when a table has no results | `<app-empty-state>` |
| Send a toast notification | `NotifyService` |
| Open a form component as a lazy-loaded modal | `FormModalService` |
| Show a delete / discard-changes confirmation dialog | `ConfirmService` |
| Generate and download a CSV file | `CsvExportService` |
| Validate that a number is ≥ 0 | `CustomValidators.positiveOrZero()` |
| Validate that a string is not just whitespace | `CustomValidators.notWhiteSpace()` |
| Guard a form route against unsaved navigation | `unsavedChangesGuard` |

---

## Components (`shared/components/`)

### `<app-loading-container>` — `loading-container/`

Handles the **skeleton-on-first-load / spinner-on-reload** pattern. Used in every list page and every detail page.

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `loading` | `boolean` | `false` | Whether a request is in flight |
| `initialLoad` | `boolean` | `false` | `true` until the very first response arrives |
| `skeletonRows` | `number` | `5` | Number of skeleton paragraph rows |

**Usage — list page (skeleton first, then spinner):**
```html
<app-loading-container [initialLoad]="initialLoad()" [loading]="loading()">
  <nz-table ...>...</nz-table>
</app-loading-container>
```

**Usage — detail page (always skeleton, never reloads):**
```html
<nz-card [nzBordered]="false">
  <app-loading-container [loading]="loading()" [initialLoad]="true" [skeletonRows]="6">
    @if (entity(); as e) {
      <nz-descriptions ...>...</nz-descriptions>
    }
  </app-loading-container>
</nz-card>
```

**Do NOT do this:**
```html
<!-- Manual skeleton — do not repeat this pattern -->
@if (loading()) {
  <nz-card><nz-skeleton [nzActive]="true"></nz-skeleton></nz-card>
} @else {
  <nz-card>...</nz-card>
}
```

---

### `<app-status-tag>` — `status-tag/`

Renders a colored `<nz-tag>` for a `StatusDataPolicy` value, or an em-dash when the value is null/undefined. Encapsulates `StatusLabelPipe` and `StatusColorPipe`.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| `status` | `StatusDataPolicy \| null \| undefined` | The status value to display |

**Usage — table cell, detail description, anywhere a status badge is needed:**
```html
<app-status-tag [status]="entity.status"></app-status-tag>
```

**Do NOT do this:**
```html
<!-- Manual status block — do not repeat this pattern -->
@if (entity.status) {
  <nz-tag [nzColor]="entity.status | statusColor">{{ entity.status | statusLabel }}</nz-tag>
} @else {
  <span class="text-muted">—</span>
}
```

> Components using `<app-status-tag>` do not need to import `NzTagModule`, `StatusLabelPipe`, or `StatusColorPipe` — those are encapsulated inside the component.
> Exception: list pages that also show status filter tags in the active-filters bar must still import `NzTagModule`, `StatusLabelPipe`, and `StatusColorPipe` for those tags.

---

### `<app-char-counter>` — `char-counter/`

Displays a character count indicator (`current / max`) for a text input or textarea. Applies a `char-count-warn` CSS class when the count reaches 90% of the maximum.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| `current` | `number` | Current character count (bound to a `signal<number>`) |
| `max` | `number` | Maximum allowed characters |

**Usage — inside `[nzExtra]` of `nz-form-control`:**
```html
<nz-form-control [nzExtra]="nameExtra">
  <input nz-input formControlName="name" [maxlength]="NAME_MAX" />
  <ng-template #nameExtra>
    <app-char-counter [current]="nameLength()" [max]="NAME_MAX"></app-char-counter>
  </ng-template>
</nz-form-control>
```

**TypeScript setup (in the form component):**
```typescript
nameLength = signal(0);
readonly NAME_MAX = 150;

private _setupCharCounters(): void {
  this.form.get('name')!.valueChanges
    .pipe(startWith(''), takeUntilDestroyed(this.destroyRef))
    .subscribe(v => this.nameLength.set((v || '').length));
}
```

**Do NOT do this:**
```html
<!-- Manual span — do not repeat this pattern -->
<ng-template #nameExtra>
  <span [class.char-count-warn]="nameLength() >= NAME_MAX * 0.9"
        class="char-count">{{ nameLength() }} / {{ NAME_MAX }}</span>
</ng-template>
```

---

### `<app-page-header>` — `page-header/`

Renders the page title, optional subtitle, breadcrumb trail, and an optional right-side action template. Used by all list and detail pages.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| `title` | `string` | Main page heading |
| `subtitle` | `string` (optional) | Smaller text below the title |
| `breadcrumbs` | `Breadcrumb[]` | Array of `{ label, link? }` items |
| `extraTemplate` | `TemplateRef` (optional) | Template rendered on the right side (buttons, etc.) |

**Usage:**
```html
<app-page-header
  title="Products"
  subtitle="Manage the product catalog"
  [breadcrumbs]="breadcrumbs"
  [extraTemplate]="headerExtra">
</app-page-header>

<ng-template #headerExtra>
  @if (canCreate) {
    <button nz-button nzType="primary" (click)="openFormModal()">
      <span nz-icon nzType="plus"></span> New Product
    </button>
  }
</ng-template>
```

---

### `<app-detail-actions>` — `detail-actions/`

Renders the **Back / Edit / Delete** action group used in detail page headers. Handles the `nz-popconfirm` for delete inline.

**Inputs / Outputs:**

| Name | Type | Description |
|---|---|---|
| `backLink` | `string` | Router link for the Back button |
| `showEdit` | `boolean` | Whether to show the Edit button |
| `showDelete` | `boolean` | Whether to show the Delete button |
| `deleteTitle` | `string` | Popconfirm title for the Delete button |
| `(edit)` | `EventEmitter<void>` | Emits when Edit is clicked |
| `(deleted)` | `EventEmitter<void>` | Emits when Delete popconfirm is confirmed |

**Usage (inside `#headerExtra` of `<app-page-header>`):**
```html
<ng-template #headerExtra>
  <app-detail-actions
    backLink="/products"
    [showEdit]="canEdit && !!product()"
    [showDelete]="canDelete && !!product()"
    deleteTitle="Delete this product?"
    (edit)="openEditModal()"
    (deleted)="delete()">
  </app-detail-actions>
</ng-template>
```

---

### `<app-form-actions>` — `form-actions/`

Renders the **Save / Cancel** button row at the bottom of every modal form. Handles the loading state on the submit button.

**Inputs / Outputs:**

| Name | Type | Description |
|---|---|---|
| `submitting` | `boolean` | Shows `nzLoading` on the submit button |
| `isEditMode` | `boolean` | Changes submit label from "Create" to "Save changes" |
| `(cancelled)` | `EventEmitter<void>` | Emits when Cancel is clicked |

**Usage (at the bottom of a form template):**
```html
<app-form-actions
  [submitting]="submitting()"
  [isEditMode]="isEditMode()"
  (cancelled)="cancel()">
</app-form-actions>
```

---

### `<app-table-row-actions>` — `table-row-actions/`

Standardized **View / Edit / Delete** action button group for table rows. Encapsulates the `nz-popconfirm` for delete — callers only handle the confirmed event. Used in the `Actions` column of every list page.

**Inputs / Outputs:**

| Name | Type | Default | Description |
|---|---|---|---|
| `viewLink` | `string \| any[]` | `[]` | Router link for the View button |
| `showEdit` | `boolean` | `false` | Whether to show the Edit button |
| `showDelete` | `boolean` | `false` | Whether to show the Delete button |
| `deleteTitle` | `string` | `'Delete this item?'` | Popconfirm title for the Delete button |
| `entityLabel` | `string` | `'item'` | Entity name used in aria-labels (e.g. `"category"`) |
| `(edit)` | `EventEmitter<void>` | — | Emits when Edit is clicked |
| `(deleted)` | `EventEmitter<void>` | — | Emits when delete popconfirm is confirmed |

**Usage (inside `@for` tbody loop):**
```html
<td nzAlign="center">
  <app-table-row-actions
    [viewLink]="[entity.id]"
    [showEdit]="canCreate"
    [showDelete]="canDelete"
    [deleteTitle]="'Delete &quot;' + entity.name + '&quot;?'"
    entityLabel="category"
    (edit)="openFormModal(entity.id)"
    (deleted)="deleteEntity(entity.id)">
  </app-table-row-actions>
</td>
```

**Imports required in the list component:**
```typescript
import { TableRowActionsComponent } from '../../../../shared/components/table-row-actions/table-row-actions.component';
```

**Do NOT do this:**
```html
<!-- Inline action buttons — do not repeat this pattern -->
<nz-space>
  <button *nzSpaceItem nz-button nzType="default" nzSize="small"
          nz-tooltip nzTooltipTitle="View detail" [routerLink]="[entity.id]">
    <span nz-icon nzType="eye"></span>
  </button>
  @if (canCreate) {
    <button *nzSpaceItem nz-button nzType="default" nzSize="small"
            (click)="openFormModal(entity.id)">
      <span nz-icon nzType="edit"></span>
    </button>
  }
  @if (canDelete) {
    <button *nzSpaceItem nz-button nzDanger nzSize="small"
            nz-popconfirm [nzPopconfirmTitle]="'Delete &quot;' + entity.name + '&quot;?'"
            (nzOnConfirm)="deleteEntity(entity.id)">
      <span nz-icon nzType="delete"></span>
    </button>
  }
</nz-space>
```

---

### `<app-status-form-field>` — `status-form-field/`

Standardized **Status select** form field for modal forms. Encapsulates `nz-form-item`, `nz-form-label`, `nz-form-control`, `nz-select`, and the required-error template. Accepts the reactive `FormControl` directly — no `ControlValueAccessor` needed.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| `control` | `FormControl` (required) | The reactive `FormControl` for the `status` field |

**Usage (inside a `[formGroup]="form"` form):**
```html
<app-status-form-field [control]="asControl(form.get('status'))">
</app-status-form-field>
```

**TypeScript helper to add to the form component:**
```typescript
import { AbstractControl, FormControl } from '@angular/forms';

asControl(c: AbstractControl | null): FormControl {
  return c as FormControl;
}
```

**Form group setup (unchanged — use `Validators.required`):**
```typescript
this.form = this.fb.group({
  name:   ['', [Validators.required, ...]],
  status: [StatusDataPolicy.Active, [Validators.required]],
});
```

**Imports required in the form component:**
```typescript
import { StatusFormFieldComponent } from '../../../../shared/components/status-form-field/status-form-field.component';
```

**Do NOT do this:**
```html
<!-- Manual status field — do not repeat this pattern -->
<nz-form-item>
  <nz-form-label nzRequired>Status</nz-form-label>
  <nz-form-control [nzErrorTip]="statusError">
    <nz-select formControlName="status" nzPlaceHolder="Select status">
      @for (opt of statusOptions; track opt.value) {
        <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
      }
    </nz-select>
    <ng-template #statusError let-control>
      @if (control.hasError('required')) { Status is required. }
    </ng-template>
  </nz-form-control>
</nz-form-item>
```

> Components using `<app-status-form-field>` do not need to import `NzSelectModule`, `STATUS_OPTIONS`, or the status error template — those are encapsulated inside the component.

---

### `<app-search-input>` — `search-input/`

Standalone search input with a prefix search icon and a clear (×) suffix button. Used internally by `<app-list-toolbar>`, but can also be used independently when you need a search input without the full toolbar.

**Inputs / Outputs:**

| Name | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `''` | Current input value (supports `[(value)]` two-way binding) |
| `placeholder` | `string` | `'Search...'` | Input placeholder text |
| `(valueChange)` | `EventEmitter<string>` | — | Emits on every keystroke |
| `(cleared)` | `EventEmitter<void>` | — | Emits when the × button is clicked |

**Usage (standalone, outside of `<app-list-toolbar>`):**
```html
<app-search-input
  placeholder="Search categories..."
  [value]="searchValue"
  (valueChange)="onSearch($event)"
  (cleared)="clearSearch()">
</app-search-input>
```

> The parent is responsible for debouncing. Feed `(valueChange)` into a `Subject<string>` with `debounceTime(300)` + `distinctUntilChanged()`.

> If you need a search input **with** the total count badge, "Clear all", and CSV export — use `<app-list-toolbar>` instead.

---

### `<app-list-toolbar>` — `list-toolbar/`

The search/filter control bar at the top of every list page. Includes the search input, total count badge, "Clear all filters" button, and optional CSV export button.

**Inputs / Outputs:**

| Name | Type | Description |
|---|---|---|
| `placeholder` | `string` | Search input placeholder |
| `searchValue` | `string` | Current value of the search input (two-way) |
| `totalCount` | `number` | Shown as "Total: N results" |
| `hasActiveFilters` | `boolean` | Shows the "Clear all" button |
| `canExport` | `boolean` | Shows the CSV export button |
| `(searchValueChange)` | `EventEmitter<string>` | Emits on each keystroke |
| `(searchCleared)` | `EventEmitter<void>` | Emits when the X button is clicked |
| `(clearAll)` | `EventEmitter<void>` | Emits when "Clear all" is clicked |
| `(exportData)` | `EventEmitter<void>` | Emits when "Export CSV" is clicked |

---

### `<app-empty-state>` — `empty-state/`

The empty state shown inside `[nzNoResult]` when a table has no data. Shows different messages and actions depending on whether filters are active.

**Inputs / Outputs:**

| Name | Type | Description |
|---|---|---|
| `entityName` | `string` | Entity display name (e.g. `"Product"`) |
| `hasActiveFilters` | `boolean` | If true: shows "No results for current filters" + Clear button |
| `canCreate` | `boolean` | If true: shows "New {entity}" button |
| `(clearFilters)` | `EventEmitter<void>` | Emits when "Clear filters" is clicked |
| `(create)` | `EventEmitter<void>` | Emits when "New {entity}" is clicked |

**Usage:**
```html
<nz-table [nzNoResult]="emptyTemplate" ...>...</nz-table>

<ng-template #emptyTemplate>
  <app-empty-state
    entityName="Product"
    [hasActiveFilters]="hasActiveFilters"
    [canCreate]="canCreate"
    (clearFilters)="clearAllFilters()"
    (create)="openFormModal()">
  </app-empty-state>
</ng-template>
```

---

## Services (`shared/services/`)

### `NotifyService`

Centralized wrapper over `NzMessageService`. Use this for all toast notifications — **never inject `NzMessageService` directly** in a feature component.

| Method | Description |
|---|---|
| `success(text)` | Generic success toast |
| `error(error)` | Accepts `AppError` or `string`; extracts `.message` automatically |
| `created(entity)` | `"${entity} created successfully."` |
| `updated(entity)` | `"${entity} updated successfully."` |
| `deleted(entity)` | `"${entity} deleted successfully."` |

```typescript
// After a successful command:
this.notify.created('Product');
this.notify.deleted('Category');

// On result failure:
result.match(
  ()  => this.notify.updated('Product'),
  err => this.notify.error(err),   // err is AppError
);
```

---

### `FormModalService`

Opens a form component as a lazy-loaded `NzModal`. Returns `Observable<boolean>` — `true` if the form was saved, `false` if cancelled. Every form component opened this way must implement `cancel(): void` (the `ModalForm` interface).

```typescript
this.formModal.open(
  () => import('../product-form/product-form.component').then(m => m.ProductFormComponent),
  { title: id ? 'Edit Product' : 'New Product', data: { id }, width: 600 },
).subscribe(saved => { if (saved) this.loadProducts(); });
```

**Do NOT** call `NzModalService.create()` directly in feature components.

---

### `ConfirmService`

Reusable confirmation dialogs. Returns `Observable<void>` that emits on OK and completes without emitting on Cancel.

| Method | Description |
|---|---|
| `delete(itemName)` | `Delete "{name}"? This action cannot be undone.` — danger button |
| `discardChanges()` | `You have unsaved changes. Discard them?` — used by `unsavedChangesGuard` |
| `confirm(options)` | Generic: `{ title, content, okText?, cancelText?, danger? }` |

```typescript
// Named-item delete dialog:
this.confirm.delete(product.name).subscribe(() =>
  this.mediator.send(new DeleteProductCommand(id), DeleteProductHandler)
    .subscribe(result => result.match(
      () => { this.notify.deleted('Product'); this.loadProducts(); },
      err => this.notify.error(err),
    ))
);
```

**Do NOT** call `NzModalService.confirm()` inline in feature components.

---

### `CsvExportService`

Generates a CSV string from headers and rows, then triggers a browser file download. Handles double-quote escaping automatically.

```typescript
private readonly csvExport = inject(CsvExportService);

exportCsv(): void {
  this.csvExport.download(
    `products-page${this.currentPage}.csv`,
    ['Name', 'Price', 'Category', 'Status'],
    this.pagedData().items.map(p => [
      p.name,
      p.price?.toFixed(2) ?? '0.00',
      this.getCategoryName(p.categoryId),
      p.status,
    ]),
  );
}
```

**Do NOT** write inline CSV generation logic (Blob, createObjectURL, createElement, etc.) in feature components.

---

## Pipes (`shared/pipes/`)

### `StatusLabelPipe` / `StatusColorPipe`

Transform a `StatusDataPolicy` value into a human-readable label or an `NzTag` color string.

```html
<!-- Prefer <app-status-tag> for the full badge -->
<app-status-tag [status]="entity.status"></app-status-tag>

<!-- Use pipes directly only when you need partial control (e.g. active filter tags) -->
<nz-tag [nzColor]="s | statusColor" class="active-filter-tag">
  {{ s | statusLabel }}
</nz-tag>
```

---

## Validators (`shared/validators/custom-validators.ts`)

| Validator | Usage | Description |
|---|---|---|
| `CustomValidators.notWhiteSpace()` | Name fields | Fails if the value is only whitespace |
| `CustomValidators.positiveOrZero()` | Price fields | Fails if the number is negative |
| `CustomValidators.pageSize()` | Internal (query models) | Validates page size range |
| `CustomValidators.guid()` | ID fields | Validates UUID format |

```typescript
this.form = this.fb.group({
  name:  ['', [Validators.required, Validators.maxLength(150), CustomValidators.notWhiteSpace()]],
  price: [null, [Validators.required, CustomValidators.positiveOrZero()]],
});
```

---

## Guards (`shared/guards/`)

### `unsavedChangesGuard`

Functional `CanDeactivateFn`. Applied to form routes. If `hasUnsavedChanges()` returns `true`, it opens `ConfirmService.discardChanges()` before allowing navigation.

**Route registration:**
```typescript
{ path: ':id/edit', loadComponent: () => import('...'), canDeactivate: [unsavedChangesGuard] }
```

**Required interface on the form component:**
```typescript
export class ProductFormComponent implements CanDeactivateComponent {
  hasUnsavedChanges(): boolean {
    return this.form?.dirty === true && !this.submitting();
  }
}
```

---

## Anti-patterns to avoid

The following patterns are red flags in code review. Replace them with the shared abstractions above.

| Anti-pattern | Replace with |
|---|---|
| `@if (loading()) { <nz-skeleton> } @else { ... }` | `<app-loading-container>` |
| `@if (status) { <nz-tag \| statusColor> } @else { <span>—</span> }` | `<app-status-tag>` |
| `<span class="char-count">{{ n }} / {{ max }}</span>` inline in ng-template | `<app-char-counter>` |
| Inline `<nz-space>` + eye/edit/delete buttons in a table row | `<app-table-row-actions>` |
| Inline `<nz-form-item>` with `nz-select` + `STATUS_OPTIONS` for status | `<app-status-form-field>` |
| `this.message.success(...)` / injecting `NzMessageService` in a feature | `NotifyService` |
| `this.modal.create({ nzContent: FormComponent, ... })` in a feature component | `FormModalService` |
| `this.modal.confirm({ nzTitle: ..., nzOnOk: ... })` in a feature component | `ConfirmService` |
| `new Blob([csv])` / `URL.createObjectURL` / `document.createElement('a')` inline | `CsvExportService` |
| Importing `NzTagModule` + `StatusLabelPipe` + `StatusColorPipe` just for a status badge | `<app-status-tag>` |
| Importing `NzSkeletonModule` + `NzSpinModule` for a detail page loading state | `<app-loading-container [initialLoad]="true">` |
| Importing `NzSelectModule` + `STATUS_OPTIONS` + error template just for a status field | `<app-status-form-field>` |
