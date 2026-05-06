# Architecture Diagrams

---

## 1. Module Dependencies

Shows which layers depend on which other layers (inward dependency rule).

```mermaid
graph LR
    Pages["pages/\n─────────────\nCategoryListComponent\nProductListComponent\nProductFormComponent\n..."]
    SharedSvc["shared/services/\n─────────────\nFormModalService\nNotifyService\nConfirmService"]
    Handlers["handlers/\n─────────────\nGetProductsHandler\nCreateProductHandler\nDeleteCategoryHandler\n..."]
    Core["core/\n─────────────\nMediatorService\nApiService\nKeycloakService\nResult<T>\nHttpCacheService\nThemeService\nGlobalErrorHandler"]
    Modal["NzModalModule\n─────────────\nNzModalService\nNzModalRef\nNZ_MODAL_DATA"]
    API["SS.Template API\n─────────────\n.NET 10\nREST / JSON"]

    Pages -->|"mediator.send()\n(via MediatorService)"| Handlers
    Pages -->|"notify / confirm\nformModal.open()"| SharedSvc
    SharedSvc -->|"NzModalService\nNzMessageService"| Modal
    Modal -->|"inject NZ_MODAL_DATA\nmodalRef.close()"| Pages
    Handlers -->|"api.get()\napi.post()\napi.put()\napi.delete()"| Core
    Core -->|"HttpClient + Bearer token"| API

    style Pages    fill:#e63946,color:#fff,stroke:#9d0208
    style SharedSvc fill:#e07b39,color:#fff,stroke:#a0522d
    style Handlers fill:#457b9d,color:#fff,stroke:#1d3557
    style Core     fill:#1d3557,color:#fff,stroke:#0d1b2a
    style Modal    fill:#6a3d9a,color:#fff,stroke:#3d1f6e
    style API      fill:#2d6a4f,color:#fff,stroke:#1b4332
```

> **Note:** `NzModalModule` is registered globally via `importProvidersFrom(NzModalModule)` in `app.config.ts`.
> `NzModalService` is NOT `providedIn: 'root'` — feature components never inject it directly. They use `FormModalService` and `ConfirmService` instead.

---

## 2. Application Initialization Flow

How the app bootstraps before rendering — Keycloak must succeed before any component renders.

```mermaid
sequenceDiagram
    participant Browser
    participant main.ts
    participant AppConfig
    participant APP_INITIALIZER
    participant KeycloakService
    participant Keycloak
    participant Angular

    Browser->>main.ts: bootstrapApplication(AppComponent, appConfig)
    main.ts->>AppConfig: resolve all providers
    AppConfig->>APP_INITIALIZER: keycloakInitFactory(KeycloakService)
    APP_INITIALIZER->>KeycloakService: init()
    KeycloakService->>Keycloak: keycloak.init({ onLoad: 'login-required', pkceMethod: 'S256' })

    alt Not authenticated
        Keycloak-->>Browser: Redirect to Keycloak Login Page
        Note over Browser: User enters credentials
        Browser->>Keycloak: POST /token (Authorization Code + PKCE verifier)
        Keycloak-->>Browser: Redirect back with auth code
        Keycloak-->>KeycloakService: authenticated = true
    else Already authenticated (valid session)
        Keycloak-->>KeycloakService: authenticated = true
    end

    KeycloakService->>Keycloak: loadUserProfile()
    Keycloak-->>KeycloakService: UserProfile (username, email, firstName, lastName)
    KeycloakService->>KeycloakService: extract realm_access.roles from tokenParsed
    KeycloakService->>KeycloakService: scheduleTokenRefresh() — every 60 s
    KeycloakService-->>APP_INITIALIZER: Promise resolved
    APP_INITIALIZER-->>Angular: Initialization complete
    Angular-->>Browser: Render AppComponent → RouterOutlet → MainLayout
```

---

## 3. CQRS Command Flow (Write Operation)

Full flow of a create/update action from UI to API and back. Forms open as modal dialogs — not as routed pages.

```mermaid
sequenceDiagram
    participant User
    participant List as List/Detail Component
    participant FMS as FormModalService
    participant Modal as NzModalService
    participant Form as FormComponent (modal content)
    participant Mediator as MediatorService
    participant Handler as CommandHandler
    participant Interceptors as HTTP Interceptors
    participant API as SS.Template API
    participant Notify as NotifyService

    User->>List: Click "New" / "Edit" button (guarded by canCreate)
    List->>FMS: formModal.open(() => import(FormComponent), { title, data: { id? } })
    FMS->>Modal: modal.create({ nzContent: FormComponent, nzData, nzOnCancel... })
    Modal->>Form: instantiate component, inject NzModalRef + NZ_MODAL_DATA
    Form->>Form: ngOnInit() — load data if id present (edit mode)

    User->>Form: Fill fields and click Create / Update
    Form->>Form: Validate FormGroup (Reactive Forms + CustomValidators)

    alt Form invalid
        Form-->>User: Show validation errors (nzHasFeedback)
    else Form valid
        Form->>Form: submitting.set(true)
        Form->>Mediator: send(new CreateProductCommand(payload), CreateProductHandler)
        Mediator->>Handler: injector.get(CreateProductHandler).handle(command)
        Handler->>Interceptors: api.post('/products', payload)

        rect rgb(30, 50, 80)
            Note over Interceptors: Interceptor chain
            Interceptors->>Interceptors: loadingInterceptor — loading.start()
            Interceptors->>Interceptors: correlationIdInterceptor — attach X-Correlation-ID
            Interceptors->>Interceptors: authInterceptor — refreshToken() → attach Bearer
            Interceptors->>API: POST /api/v1/products { name, price, categoryId }
        end

        alt API success (201)
            API-->>Interceptors: { id: "guid" }
            Interceptors-->>Handler: HttpResponse
            Handler-->>Mediator: Result.success("new-guid")
            Mediator-->>Form: Observable<Result<string>>
            Form->>Form: result.match(onSuccess, _)
            Form->>Notify: notify.created('Product')
            Form->>Modal: modalRef.close(true)
            Modal-->>FMS: afterClose emits true
            FMS-->>List: Observable<boolean> emits true
            List->>List: loadProducts() — reload table
        else API error (400/409/500)
            API-->>Interceptors: ProblemDetails
            Interceptors->>Interceptors: errorInterceptor — show NzMessage error
            Interceptors-->>Handler: Result.failure(AppError)
            Handler-->>Form: Observable<Result<string>>
            Form->>Notify: notify.error(err)
            Form-->>User: Error toast shown, modal stays open
        end

        Form->>Form: submitting.set(false)
    end
```

---

## 4. CQRS Query Flow (Read Operation)

Flow of a paginated read request from component initialization to table render.

```mermaid
sequenceDiagram
    participant Page as ProductListComponent
    participant Mediator as MediatorService
    participant Handler as GetProductsHandler
    participant Interceptors as HTTP Interceptors
    participant API as SS.Template API

    Page->>Page: ngOnInit()
    Page->>Page: loading.set(true)
    Page->>Mediator: send(new GetProductsQuery({ page: 1, pageSize: 10 }), GetProductsHandler)
    Mediator->>Handler: injector.get(GetProductsHandler).handle(query)
    Handler->>Interceptors: api.get('/products', { page: 1, pageSize: 10 })

    rect rgb(30, 50, 80)
        Note over Interceptors: Interceptor chain
        Interceptors->>Interceptors: correlationIdInterceptor — attach X-Correlation-ID
        Interceptors->>Interceptors: authInterceptor — refreshToken() → attach Bearer
        Interceptors->>API: GET /api/v1/products?page=1&pageSize=10
    end

    API-->>Interceptors: 200 { items: [...], totalCount: 42, page: 1, ... }
    Interceptors-->>Handler: HttpResponse
    Handler-->>Mediator: Result.success(PagedResponse<ProductDto>)
    Mediator-->>Page: Observable<Result<PagedResponse<ProductDto>>>

    Page->>Page: result.match(data => pagedData.set(data), err => notify.error(err))
    Page->>Page: loading.set(false)
    Page-->>Page: nz-table renders with pagedData().items
    Page-->>Page: pagination shows pagedData().totalCount
    Page->>Page: _syncToUrl() — updates query params (page, search, filters, sort)
```

---

## 5. Authentication Guard Flow

How route guards protect pages. Create/edit forms are no longer routed — they open as modals with button-level `canCreate` / `canDelete` checks.

```mermaid
flowchart TD
    Navigate["User navigates to /products"]
    AuthGuard["authGuard\nkeycloak.isAuthenticated()"]
    Authenticated{Authenticated?}
    Login["keycloak.login()\n→ Redirect to Keycloak"]
    Render["Render ProductListComponent"]
    CanCreate{"canCreate?\nkeycloak.canAccess('supervisor')"}
    ShowButton["Show 'New Product' / 'Edit' buttons"]
    HideButton["Buttons hidden\n(read-only view)"]
    OpenModal["modal.create(ProductFormComponent)"]

    Navigate --> AuthGuard
    AuthGuard --> Authenticated
    Authenticated -- No --> Login
    Authenticated -- Yes --> Render
    Render --> CanCreate
    CanCreate -- Yes --> ShowButton
    CanCreate -- No --> HideButton
    ShowButton -->|"User clicks button"| OpenModal

    style Login fill:#e63946,color:#fff
    style HideButton fill:#6c757d,color:#fff
    style Render fill:#2d6a4f,color:#fff
    style OpenModal fill:#6a3d9a,color:#fff
```

> **Note:** `/products/new` and `/products/:id/edit` routes do not exist. Form access is gated entirely at the component level via `canCreate` (a computed signal from `keycloak.canAccess('supervisor')`). Modals are opened via `FormModalService`, never via `NzModalService` directly.

---

## 6. Vertical Slice Structure

How each entity feature is organized as a self-contained slice. Form components are modal content — they are opened by list and detail components via `NzModalService`.

```mermaid
graph TD
    subgraph Slice["features/products/ (Vertical Slice)"]
        Models["models/\nProductDto\nCreateProductRequest\nGetProductsRequest"]

        subgraph Commands["commands/"]
            CC["create-product/\nCreateProductCommand\nCreateProductHandler"]
            UC["update-product/\nUpdateProductCommand\nUpdateProductHandler"]
            DC["delete-product/\nDeleteProductCommand\nDeleteProductHandler"]
        end

        subgraph Queries["queries/"]
            GQ["get-products/\nGetProductsQuery\nGetProductsHandler"]
            GI["get-product-by-id/\nGetProductByIdQuery\nGetProductByIdHandler"]
        end

        subgraph Pages["pages/"]
            PL["product-list/\nProductListComponent\n(opens form modal)"]
            PF["product-form/\nProductFormComponent\n(modal content only)"]
            PD["product-detail/\nProductDetailComponent\n(opens form modal)"]
        end

        Routes["products.routes.ts\nPRODUCTS_ROUTES\n(no form routes)"]
    end

    Core["core/\nMediatorService\nApiService\nResult<T>\nHttpCacheService"]
    SharedSvc["shared/services/\nFormModalService\nNotifyService\nConfirmService"]
    ModalSvc["NzModalService\n(global via NzModalModule)"]

    PL -->|"formModal.open()"| SharedSvc
    PD -->|"formModal.open()"| SharedSvc
    SharedSvc -->|"modal.create()"| ModalSvc
    ModalSvc -->|"inject NZ_MODAL_DATA\nmodalRef.close(true/false)"| PF
    PL -->|send query| GQ
    PL -->|send command| DC
    PF -->|send command| CC
    PF -->|send command| UC
    PF -->|send query| GI
    PD -->|send query| GI
    PD -->|send command| DC

    GQ --> Core
    GI --> Core
    CC --> Core
    UC --> Core
    DC --> Core

    style Slice fill:#1d3557,color:#fff,stroke:#0d1b2a
    style Core fill:#457b9d,color:#fff
    style SharedSvc fill:#e07b39,color:#fff,stroke:#a0522d
    style ModalSvc fill:#6a3d9a,color:#fff
    style Commands fill:#2d6a4f,color:#fff,stroke:#1b4332
    style Queries fill:#2d6a4f,color:#fff,stroke:#1b4332
    style Pages fill:#e63946,color:#fff,stroke:#9d0208
```

---

## 7. HTTP Interceptor Pipeline

How interceptors wrap every outgoing HTTP request. Interceptors execute in registration order (defined in `app.config.ts`).

```mermaid
flowchart TD
    Component["Component\nmediator.send(query, Handler)"]
    Handler["Handler\napi.get('/products', params)"]
    LI["loadingInterceptor\nHttpLoadingService.start()\n→ drives top progress bar\nfinalize() → loading.end()"]
    CI["correlationIdInterceptor\nGenerate UUID\nSet X-Correlation-ID header"]
    AI["authInterceptor\nkeycloak.refreshToken()\nSet Authorization: Bearer <token>"]
    EI["errorInterceptor\nCatch HTTP errors\nShow NzMessage\nRedirect 401/403"]
    HTTP["HttpClient\nActual HTTP request"]
    API["SS.Template API"]

    Component -->|"Observable<Result<T>>"| Handler
    Handler --> LI
    LI --> CI
    CI --> AI
    AI --> EI
    EI --> HTTP
    HTTP -->|"HTTP GET/POST/PUT/DELETE"| API
    API -->|"Response"| HTTP
    HTTP -->|"Success → Result.success(data)"| EI
    EI -->|"Error → Result.failure(error)\nor NzMessage + redirect"| AI
    AI --> CI
    CI --> LI
    LI --> Handler
    Handler -->|"Observable<Result<T>>"| Component

    style LI fill:#6c757d,color:#fff
    style CI fill:#457b9d,color:#fff
    style AI fill:#1d3557,color:#fff
    style EI fill:#e63946,color:#fff
    style API fill:#2d6a4f,color:#fff
```

---

## 8. Modal Form Lifecycle

How a list/detail component opens, communicates with, and reacts to a form modal — including the dirty-check confirm dialog.

```mermaid
sequenceDiagram
    participant User
    participant Parent as List / Detail Component
    participant FMS as FormModalService
    participant NzModal as NzModalService
    participant Form as FormComponent (modal content)
    participant Confirm as ConfirmService

    Parent->>FMS: formModal.open(() => import(FormComponent), { title, data: { id? } })
    FMS->>NzModal: modal.create({ nzContent: FormComponent, nzData, nzOnCancel... })
    NzModal->>Form: instantiate, inject NzModalRef + NZ_MODAL_DATA
    Form->>Form: ngOnInit() — build form, load data if editing

    Note over NzModal,Form: Modal is open

    alt User submits successfully
        Form->>Form: mediator.send(command) → result.match success
        Form->>Form: notify.created/updated('Entity')
        Form->>NzModal: modalRef.close(true)
        NzModal-->>FMS: afterClose emits true
        FMS-->>Parent: Observable<boolean> emits true
        Parent->>Parent: reload data (loadProducts / loadCategory)
    else User clicks Cancel or X button (form pristine)
        User->>NzModal: Click Cancel / X
        NzModal->>FMS: nzOnCancel callback fires
        FMS->>Form: ref.getContentComponent().cancel()
        Form->>Form: form.dirty? → false
        Form->>NzModal: modalRef.close(false)
        NzModal-->>FMS: afterClose emits false
        FMS-->>Parent: Observable<boolean> emits false
        Note over Parent: No reload needed
    else User clicks Cancel or X button (form dirty)
        User->>NzModal: Click Cancel / X
        NzModal->>FMS: nzOnCancel callback fires, returns false (prevent auto-close)
        FMS->>Form: ref.getContentComponent().cancel()
        Form->>Form: form.dirty? → true
        Form->>Confirm: confirmService.discardChanges()
        alt User confirms discard
            Confirm->>Form: Observable<void> emits
            Form->>NzModal: modalRef.close(false)
            NzModal-->>FMS: afterClose emits false
            FMS-->>Parent: Observable<boolean> emits false
        else User clicks "Keep editing"
            Confirm-->>Form: Observable completes without emit
            Note over Form: Modal stays open, form intact
        end
    end
```

---

## 9. URL State Persistence (List Pages)

How list components sync filter, pagination, and sort state to the browser URL — enabling back-button navigation and shareable links.

```mermaid
sequenceDiagram
    participant Browser
    participant Router as Angular Router
    participant List as ListComponent
    participant Table as NzTable

    Browser->>Router: Navigate to /products?page=2&search=bolt&statuses=Active
    Router->>List: ngOnInit()
    List->>List: _readFromUrl() — restore page, search, filters, sort from queryParamMap
    List->>List: loadProducts() — calls _syncToUrl() first (replaceUrl: true)
    List->>Table: render with restored state (nzPageIndex, nzFilters, etc.)
    Table->>List: (nzQueryParams) fires on init — but initialLoad() is true → SKIP

    Note over List,Table: initialLoad.set(false) after first API response

    Browser->>Table: User changes page / sort / filter
    Table->>List: (nzQueryParams) fires — initialLoad() is false → process
    List->>List: update signals (currentPage, sortField, selectedStatuses...)
    List->>List: loadProducts() → _syncToUrl() → replaceUrl: true
    Router->>Browser: URL updated (/products?page=3&statuses=Active)
    Note over Browser: Back button restores previous URL → ngOnInit re-reads it
```

---

## 10. HTTP Cache Flow (Stable GET Responses)

How `HttpCacheService` avoids repeated API calls for stable reference data (e.g. category dropdowns).

```mermaid
flowchart TD
    Handler["GetAllCategoriesHandler\nhandle(request)"]
    CacheCheck{"cache.get(key)\nhit?"}
    CacheHit["Return Result.success(cached)\nObservable<Result<T>>"]
    ApiCall["api.get('/categories', params)"]
    StoreCache["cache.set(key, data, 60_000ms)"]
    Return["Return Result.success(data)"]
    Invalidate["Create/Update/Delete Handler\ncache.invalidate('categories:')"]

    Handler --> CacheCheck
    CacheCheck -- Yes --> CacheHit
    CacheCheck -- No --> ApiCall
    ApiCall --> StoreCache
    StoreCache --> Return
    Invalidate -.->|"on mutation success"| CacheCheck

    style CacheHit fill:#2d6a4f,color:#fff
    style Invalidate fill:#e63946,color:#fff
```

> Cache is only applied when fetching large page sizes (≥ 50) with no search/filter/sort — i.e. the full reference list used to populate dropdowns. Regular paginated table queries always hit the API.

---

## 11. Theme Toggle (Dark Mode)

How `ThemeService` manages light/dark mode across the application.

```mermaid
flowchart TD
    Init["ThemeService constructor\nRead localStorage 'app-theme'\n+ prefers-color-scheme media query"]
    Apply["_apply(theme)\nisDark.set()\ndocument.documentElement.setAttribute('data-theme', theme)\nlocalStorage.setItem(...)"]
    Toggle["ThemeService.toggle()\ncalled from main-layout header button"]
    CSS["styles.less\nhtml[data-theme='dark'] { ... }\nOverrides layout, cards, tables,\nmodals, inputs, scrollbars"]

    Init --> Apply
    Toggle --> Apply
    Apply --> CSS

    style CSS fill:#1d3557,color:#fff
    style Toggle fill:#457b9d,color:#fff
```
