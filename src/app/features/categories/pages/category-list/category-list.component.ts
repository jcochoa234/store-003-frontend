import { Component, OnInit, DestroyRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { FormModalService } from '../../../../shared/services/form-modal.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ListToolbarComponent } from '../../../../shared/components/list-toolbar/list-toolbar.component';
import { LoadingContainerComponent } from '../../../../shared/components/loading-container/loading-container.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NotifyService } from '../../../../shared/services/notify.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
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
import { CategoryDto } from '../../models/category.model';
import { GetAllCategoriesQuery } from '../../queries/get-all-categories/get-all-categories.query';
import { GetAllCategoriesHandler } from '../../queries/get-all-categories/get-all-categories.handler';
import { DeleteCategoryCommand } from '../../commands/delete-category/delete-category.command';
import { DeleteCategoryHandler } from '../../commands/delete-category/delete-category.handler';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    RouterLink,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    ListToolbarComponent,
    LoadingContainerComponent,
    EmptyStateComponent,
    NzPopconfirmModule,
    NzSpinModule,
    NzCardModule,
    NzSpaceModule,
    NzToolTipModule,
    NzTagModule,
    NzSkeletonModule,
    StatusLabelPipe,
    StatusColorPipe,
    StatusTagComponent,
    PageHeaderComponent,
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent implements OnInit {
  private readonly mediator      = inject(MediatorService);
  private readonly notify        = inject(NotifyService);
  private readonly keycloak      = inject(KeycloakService);
  private readonly titleService  = inject(Title);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly formModal     = inject(FormModalService);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);
  private readonly csvExport     = inject(CsvExportService);
  private readonly searchSubject = new Subject<string>();

  pagedData = signal<PagedResponse<CategoryDto>>(defaultPagedResponse<CategoryDto>());
  loading = signal(false);
  initialLoad = signal(true);
  currentPage = 1;
  pageSize = DEFAULT_PAGE_SIZE;

  searchValue = '';
  activeSearch = signal('');
  selectedStatuses = signal<StatusDataPolicy[]>([]);
  sortField = signal<string | null>(null);
  sortOrder = signal<'ascend' | 'descend' | null>(null);
  private filterVersion = signal(0);

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
    { label: 'Categories' },
  ];

  readonly canCreate    = this.keycloak.canAccess('supervisor');
  readonly canDelete    = this.keycloak.canAccess('it');
  readonly enableExport = environment.features.enableExport;

  get hasActiveFilters(): boolean {
    return !!this.activeSearch() || this.selectedStatuses().length > 0;
  }

  ngOnInit(): void {
    this.titleService.setTitle('Categories | Store 003');
    this._readFromUrl();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => {
      this.activeSearch.set(term);
      this.currentPage = 1;
      this.loadCategories();
    });

    this.loadCategories();
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    // searchValue already reset by SearchInputComponent; just flush the subject
    this.searchSubject.next('');
  }

  clearAllFilters(): void {
    this.searchValue = '';
    this.activeSearch.set('');
    this.selectedStatuses.set([]);
    this.currentPage = 1;
    this.filterVersion.update(v => v + 1);
    this.loadCategories();
  }

  loadCategories(): void {
    this._syncToUrl();
    this.loading.set(true);
    this.mediator
      .send(
        new GetAllCategoriesQuery(
          this.currentPage,
          this.pageSize,
          this.activeSearch() || undefined,
          this.selectedStatuses().length > 0 ? this.selectedStatuses() : undefined,
          this.sortField() ?? undefined,
          this.sortOrder() ?? undefined,
        ),
        GetAllCategoriesHandler,
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
    const statusFilter = params.filter.find(f => f.key === 'status');
    this.selectedStatuses.set((statusFilter?.value ?? []) as StatusDataPolicy[]);
    this.loadCategories();
  }

  private _readFromUrl(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.currentPage  = Number(qp.get('page')     ?? 1);
    this.pageSize     = Number(qp.get('pageSize')  ?? DEFAULT_PAGE_SIZE);
    const search      = qp.get('search') ?? '';
    this.searchValue  = search;
    this.activeSearch.set(search);
    const statuses    = qp.get('statuses');
    if (statuses) this.selectedStatuses.set(statuses.split(',') as StatusDataPolicy[]);
    const sf = qp.get('sortField');
    const so = qp.get('sortOrder') as 'ascend' | 'descend' | null;
    if (sf && so) { this.sortField.set(sf); this.sortOrder.set(so); }
  }

  private _syncToUrl(): void {
    this.router.navigate([], {
      relativeTo:  this.route,
      replaceUrl:  true,
      queryParams: {
        page:      this.currentPage > 1                    ? this.currentPage                       : null,
        pageSize:  this.pageSize !== DEFAULT_PAGE_SIZE      ? this.pageSize                          : null,
        search:    this.activeSearch()                      ? this.activeSearch()                    : null,
        statuses:  this.selectedStatuses().length > 0       ? this.selectedStatuses().join(',')      : null,
        sortField: this.sortField()                         ? this.sortField()                       : null,
        sortOrder: this.sortOrder()                         ? this.sortOrder()                       : null,
      },
    });
  }

  openFormModal(id?: string): void {
    this.formModal.open(
      () => import('../../pages/category-form/category-form.component').then(m => m.CategoryFormComponent),
      { title: id ? 'Edit Category' : 'New Category', data: { id } },
    ).subscribe(saved => { if (saved) this.loadCategories(); });
  }

  exportCsv(): void {
    this.csvExport.download(
      `categories-page${this.currentPage}.csv`,
      ['Name', 'Description', 'Status'],
      this.pagedData().items.map(c => [c.name, c.description, c.status]),
    );
  }

  deleteCategory(id: string): void {
    this.mediator
      .send(new DeleteCategoryCommand(id), DeleteCategoryHandler)
      .subscribe((result) => {
        result.match(
          () => {
            this.notify.deleted('Category');
            this.loadCategories();
          },
          (err) => this.notify.error(err),
        );
      });
  }
}
