import { Component, OnInit, DestroyRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { FormModalService } from '../../../../shared/services/form-modal.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ListToolbarComponent } from '../../../../shared/components/list-toolbar/list-toolbar.component';
import { LoadingContainerComponent } from '../../../../shared/components/loading-container/loading-container.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NotifyService } from '../../../../shared/services/notify.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { environment } from '../../../../../environments/environment';
import { MediatorService } from '../../../../core/mediator/mediator.service';
import { PageHeaderComponent, Breadcrumb } from '../../../../shared/components/page-header/page-header.component';
import { PagedResponse, DEFAULT_PAGE_SIZE, defaultPagedResponse } from '../../../../core/models/paged-response.model';
import { StatusDataPolicy } from '../../../../core/models/status-data-policy.enum';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { StatusLabelPipe, StatusColorPipe } from '../../../../shared/pipes/status.pipe';
import { StatusTagComponent } from '../../../../shared/components/status-tag/status-tag.component';
import { CsvExportService } from '../../../../shared/services/csv-export.service';
import { CategoryDto } from '../../../categories/models/category.model';
import { GetAllCategoriesQuery } from '../../../categories/queries/get-all-categories/get-all-categories.query';
import { GetAllCategoriesHandler } from '../../../categories/queries/get-all-categories/get-all-categories.handler';
import { BrandDto } from '../../../brands/models/brand.model';
import { GetBrandsQuery } from '../../../brands/queries/get-brands/get-brands.query';
import { GetBrandsHandler } from '../../../brands/queries/get-brands/get-brands.handler';
import { ProductDto } from '../../models/product.model';
import { GetProductsQuery } from '../../queries/get-products/get-products.query';
import { GetProductsHandler } from '../../queries/get-products/get-products.handler';
import { DeleteProductCommand } from '../../commands/delete-product/delete-product.command';
import { DeleteProductHandler } from '../../commands/delete-product/delete-product.handler';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputNumberModule,
    ListToolbarComponent,
    LoadingContainerComponent,
    EmptyStateComponent,
    NzPopconfirmModule,
    NzSpinModule,
    NzCardModule,
    NzSpaceModule,
    NzSelectModule,
    NzToolTipModule,
    NzTagModule,
    NzDividerModule,
    NzDropDownModule,
    NzSkeletonModule,
    StatusLabelPipe,
    StatusColorPipe,
    StatusTagComponent,
    PageHeaderComponent,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly mediator      = inject(MediatorService);
  private readonly notify        = inject(NotifyService);
  private readonly keycloak      = inject(KeycloakService);
  private readonly titleService  = inject(Title);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly formModal     = inject(FormModalService);
  private readonly csvExport     = inject(CsvExportService);
  private readonly searchSubject = new Subject<string>();

  pagedData = signal<PagedResponse<ProductDto>>(defaultPagedResponse<ProductDto>());
  categories = signal<CategoryDto[]>([]);
  brands     = signal<BrandDto[]>([]);
  loading = signal(false);
  initialLoad = signal(true);

  currentPage = 1;
  pageSize = DEFAULT_PAGE_SIZE;

  searchValue = '';
  activeSearch = signal('');
  selectedCategoryIds = signal<string[]>([]);
  selectedBrandIds    = signal<string[]>([]);
  selectedStatuses = signal<StatusDataPolicy[]>([]);
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  minPriceInput = signal<number | null>(null);
  maxPriceInput = signal<number | null>(null);
  priceFilterVisible = signal(false);
  sortField = signal<string | null>(null);
  sortOrder = signal<'ascend' | 'descend' | null>(null);
  private filterVersion = signal(0);

  readonly priceFormatter = (value: number | null): string =>
    value != null ? `$ ${value}` : '';
  readonly priceParser = (value: string): string =>
    value.replace(/\$\s?/g, '');

  readonly categoryFilters = computed(() => {
    this.filterVersion();
    return this.categories().map(c => ({ text: c.name, value: c.id }));
  });

  readonly brandFilters = computed(() => {
    this.filterVersion();
    return this.brands().map(b => ({ text: b.name, value: b.id }));
  });

  readonly statusFilters = computed(() => {
    this.filterVersion();
    return [
      { text: 'Active',   value: StatusDataPolicy.Active },
      { text: 'Inactive', value: StatusDataPolicy.Inactive },
      { text: 'Deleted',  value: StatusDataPolicy.Deleted },
    ];
  });

  readonly breadcrumbs: Breadcrumb[] = [
    { label: 'Home', link: '/dashboard' },
    { label: 'Products' },
  ];

  readonly canCreate    = this.keycloak.canAccess('supervisor');
  readonly canDelete    = this.keycloak.canAccess('it');
  readonly enableExport = environment.features.enableExport;

  get hasActiveFilters(): boolean {
    return !!this.activeSearch()
        || this.selectedCategoryIds().length > 0
        || this.selectedBrandIds().length > 0
        || this.selectedStatuses().length > 0
        || this.minPrice() != null || this.maxPrice() != null;
  }

  ngOnInit(): void {
    this.titleService.setTitle('Products | Store 003');
    this._readFromUrl();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => {
      this.activeSearch.set(term);
      this.currentPage = 1;
      this.loadProducts();
    });

    this.loadCategories();
    this.loadBrands();
    this.loadProducts();
  }

  onSearch(value: string): void { this.searchSubject.next(value); }

  clearSearch(): void {
    // searchValue already reset by SearchInputComponent; just flush the subject
    this.searchSubject.next('');
  }

  onPriceFilterVisibleChange(visible: boolean): void {
    this.priceFilterVisible.set(visible);
    if (visible) {
      this.minPriceInput.set(this.minPrice());
      this.maxPriceInput.set(this.maxPrice());
    }
  }

  applyPriceFilter(): void {
    this.minPrice.set(this.minPriceInput());
    this.maxPrice.set(this.maxPriceInput());
    this.priceFilterVisible.set(false);
    this.currentPage = 1;
    this.loadProducts();
  }

  clearPriceRange(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.minPriceInput.set(null);
    this.maxPriceInput.set(null);
    this.priceFilterVisible.set(false);
    this.currentPage = 1;
    this.loadProducts();
  }

  clearAllFilters(): void {
    this.searchValue = '';
    this.activeSearch.set('');
    this.selectedCategoryIds.set([]);
    this.selectedBrandIds.set([]);
    this.selectedStatuses.set([]);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.minPriceInput.set(null);
    this.maxPriceInput.set(null);
    this.priceFilterVisible.set(false);
    this.currentPage = 1;
    this.filterVersion.update(v => v + 1);
    this.loadProducts();
  }

  loadCategories(): void {
    this.mediator
      .send(new GetAllCategoriesQuery(1, 100), GetAllCategoriesHandler)
      .subscribe((result) => {
        result.match(
          (data) => this.categories.set(data.items),
          () => {},
        );
      });
  }

  loadBrands(): void {
    this.mediator
      .send(new GetBrandsQuery(1, 100), GetBrandsHandler)
      .subscribe((result) => {
        result.match(
          (data) => this.brands.set(data.items),
          () => {},
        );
      });
  }

  loadProducts(): void {
    this._syncToUrl();
    this.loading.set(true);
    this.mediator
      .send(
        new GetProductsQuery({
          page: this.currentPage,
          pageSize: this.pageSize,
          search: this.activeSearch() || undefined,
          categoryIds: this.selectedCategoryIds().length > 0 ? this.selectedCategoryIds() : undefined,
          brandIds: this.selectedBrandIds().length > 0 ? this.selectedBrandIds() : undefined,
          statuses: this.selectedStatuses().length > 0 ? this.selectedStatuses() : undefined,
          minPrice: this.minPrice() ?? undefined,
          maxPrice: this.maxPrice() ?? undefined,
          sortField: this.sortField() ?? undefined,
          sortOrder: this.sortOrder() ?? undefined,
        }),
        GetProductsHandler,
      )
      .subscribe((result) => {
        result.match(
          (data) => this.pagedData.set(data),
          (err) => this.notify.error(err),
        );
        this.loading.set(false);
        this.initialLoad.set(false);
      });
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    // Skip the table's initial fire — state was already set from URL in ngOnInit
    if (this.initialLoad()) return;
    this.currentPage = params.pageIndex;
    this.pageSize    = params.pageSize;
    const activeSort = params.sort.find(s => s.value !== null);
    this.sortField.set(activeSort?.key ?? null);
    this.sortOrder.set((activeSort?.value as 'ascend' | 'descend' | null) ?? null);
    const categoryFilter = params.filter.find(f => f.key === 'categoryId');
    this.selectedCategoryIds.set(categoryFilter?.value ?? []);
    const brandFilter = params.filter.find(f => f.key === 'brandId');
    this.selectedBrandIds.set(brandFilter?.value ?? []);
    const statusFilter = params.filter.find(f => f.key === 'status');
    this.selectedStatuses.set((statusFilter?.value ?? []) as StatusDataPolicy[]);
    this.loadProducts();
  }

  private _readFromUrl(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.currentPage = Number(qp.get('page')    ?? 1);
    this.pageSize    = Number(qp.get('pageSize') ?? DEFAULT_PAGE_SIZE);
    const search     = qp.get('search') ?? '';
    this.searchValue = search;
    this.activeSearch.set(search);
    // Support both ?categories=id1,id2 (our format) and legacy ?categoryId=id (from detail link)
    const categories = qp.get('categories');
    if (categories) {
      this.selectedCategoryIds.set(categories.split(','));
    } else {
      const categoryId = qp.get('categoryId');
      if (categoryId) this.selectedCategoryIds.set([categoryId]);
    }
    // Support both ?brands=id1,id2 (our format) and legacy ?brandId=id (from brand detail link)
    const brands = qp.get('brands');
    if (brands) {
      this.selectedBrandIds.set(brands.split(','));
    } else {
      const brandId = qp.get('brandId');
      if (brandId) this.selectedBrandIds.set([brandId]);
    }
    const statuses = qp.get('statuses');
    if (statuses) this.selectedStatuses.set(statuses.split(',') as StatusDataPolicy[]);
    const minP = qp.get('minPrice'); if (minP != null) { this.minPrice.set(Number(minP)); this.minPriceInput.set(Number(minP)); }
    const maxP = qp.get('maxPrice'); if (maxP != null) { this.maxPrice.set(Number(maxP)); this.maxPriceInput.set(Number(maxP)); }
    const sf = qp.get('sortField');
    const so = qp.get('sortOrder') as 'ascend' | 'descend' | null;
    if (sf && so) { this.sortField.set(sf); this.sortOrder.set(so); }
  }

  private _syncToUrl(): void {
    this.router.navigate([], {
      relativeTo:  this.route,
      replaceUrl:  true,
      queryParams: {
        page:       this.currentPage > 1                      ? this.currentPage                          : null,
        pageSize:   this.pageSize !== DEFAULT_PAGE_SIZE         ? this.pageSize                            : null,
        search:     this.activeSearch()                         ? this.activeSearch()                      : null,
        categories: this.selectedCategoryIds().length > 0       ? this.selectedCategoryIds().join(',')     : null,
        brands:     this.selectedBrandIds().length > 0          ? this.selectedBrandIds().join(',')        : null,
        statuses:   this.selectedStatuses().length > 0          ? this.selectedStatuses().join(',')        : null,
        minPrice:   this.minPrice() != null                     ? this.minPrice()                          : null,
        maxPrice:   this.maxPrice() != null                     ? this.maxPrice()                          : null,
        sortField:  this.sortField()                            ? this.sortField()                         : null,
        sortOrder:  this.sortOrder()                            ? this.sortOrder()                         : null,
      },
    });
  }

  openFormModal(id?: string): void {
    this.formModal.open(
      () => import('../../pages/product-form/product-form.component').then(m => m.ProductFormComponent),
      { title: id ? 'Edit Product' : 'New Product', data: { id }, width: 600 },
    ).subscribe(saved => { if (saved) this.loadProducts(); });
  }

  exportCsv(): void {
    this.csvExport.download(
      `products-page${this.currentPage}.csv`,
      ['Name', 'Price', 'Category', 'Brand', 'Status'],
      this.pagedData().items.map(p => [p.name, p.price?.toFixed(2) ?? '0.00', this.getCategoryName(p.categoryId), p.brandName ?? '—', p.status]),
    );
  }

  deleteProduct(id: string): void {
    this.mediator
      .send(new DeleteProductCommand(id), DeleteProductHandler)
      .subscribe((result) => {
        result.match(
          () => {
            this.notify.deleted('Product');
            this.loadProducts();
          },
          (err) => this.notify.error(err),
        );
      });
  }

  getCategoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? '—';
  }

  getBrandName(brandId: string): string {
    return this.brands().find((b) => b.id === brandId)?.name ?? '—';
  }
}
