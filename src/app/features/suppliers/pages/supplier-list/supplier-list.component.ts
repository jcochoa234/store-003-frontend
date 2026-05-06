import { Component, OnInit, DestroyRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { environment } from '@environments/environment';
import { MediatorService } from '@core/mediator/mediator.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { PagedResponse, DEFAULT_PAGE_SIZE, defaultPagedResponse } from '@core/models/paged-response.model';
import { StatusDataPolicy } from '@core/models/status-data-policy.enum';
import { PageHeaderComponent, Breadcrumb } from '@shared/components/page-header/page-header.component';
import { LoadingContainerComponent } from '@shared/components/loading-container/loading-container.component';
import { ListToolbarComponent } from '@shared/components/list-toolbar/list-toolbar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { StatusTagComponent } from '@shared/components/status-tag/status-tag.component';
import { TableRowActionsComponent } from '@shared/components/table-row-actions/table-row-actions.component';
import { NotifyService } from '@shared/services/notify.service';
import { FormModalService } from '@shared/services/form-modal.service';
import { CsvExportService } from '@shared/services/csv-export.service';
import { SupplierDto } from '../../models/supplier.model';
import { GetSuppliersQuery } from '../../queries/get-suppliers/get-suppliers.query';
import { GetSuppliersHandler } from '../../queries/get-suppliers/get-suppliers.handler';
import { DeleteSupplierCommand } from '../../commands/delete-supplier/delete-supplier.command';
import { DeleteSupplierHandler } from '../../commands/delete-supplier/delete-supplier.handler';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    StatusTagComponent,
    TableRowActionsComponent,
    PageHeaderComponent,
    LoadingContainerComponent,
    ListToolbarComponent,
    EmptyStateComponent,
  ],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierListComponent implements OnInit {
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

  pagedData   = signal<PagedResponse<SupplierDto>>(defaultPagedResponse<SupplierDto>());
  loading     = signal(false);
  initialLoad = signal(true);

  currentPage = 1;
  pageSize    = DEFAULT_PAGE_SIZE;

  searchValue      = '';
  activeSearch     = signal('');
  selectedStatuses = signal<StatusDataPolicy[]>([]);
  sortField        = signal<string | null>(null);
  sortOrder        = signal<'ascend' | 'descend' | null>(null);
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
    { label: 'Suppliers' },
  ];

  readonly canCreate    = this.keycloak.canAccess('supervisor');
  readonly canDelete    = this.keycloak.canAccess('it');
  readonly enableExport = environment.features.enableExport;

  get hasActiveFilters(): boolean {
    return !!this.activeSearch() || this.selectedStatuses().length > 0;
  }

  ngOnInit(): void {
    this.titleService.setTitle('Suppliers | Store 003');
    this._readFromUrl();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => {
      this.activeSearch.set(term);
      this.currentPage = 1;
      this.loadSuppliers();
    });

    this.loadSuppliers();
  }

  onSearch(value: string): void { this.searchSubject.next(value); }

  clearSearch(): void { this.searchSubject.next(''); }

  clearAllFilters(): void {
    this.searchValue = '';
    this.activeSearch.set('');
    this.selectedStatuses.set([]);
    this.currentPage = 1;
    this.filterVersion.update(v => v + 1);
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this._syncToUrl();
    this.loading.set(true);
    this.mediator
      .send(
        new GetSuppliersQuery({
          page:      this.currentPage,
          pageSize:  this.pageSize,
          search:    this.activeSearch() || undefined,
          statuses:  this.selectedStatuses().length > 0 ? this.selectedStatuses() : undefined,
          sortField: this.sortField() ?? undefined,
          sortOrder: this.sortOrder() ?? undefined,
        }),
        GetSuppliersHandler,
      )
      .subscribe(result => {
        result.match(
          data => this.pagedData.set(data),
          err  => this.notify.error(err),
        );
        this.loading.set(false);
        this.initialLoad.set(false);
      });
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    if (this.initialLoad()) return;
    this.currentPage = params.pageIndex;
    this.pageSize    = params.pageSize;
    const activeSort = params.sort.find(s => s.value !== null);
    this.sortField.set(activeSort?.key ?? null);
    this.sortOrder.set((activeSort?.value as 'ascend' | 'descend' | null) ?? null);
    const statusFilter = params.filter.find(f => f.key === 'status');
    this.selectedStatuses.set((statusFilter?.value ?? []) as StatusDataPolicy[]);
    this.loadSuppliers();
  }

  openFormModal(id?: string): void {
    this.formModal.open(
      () => import('../../pages/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
      { title: id ? 'Edit Supplier' : 'New Supplier', data: { id }, width: 560 },
    ).subscribe(saved => { if (saved) this.loadSuppliers(); });
  }

  deleteSupplier(id: string): void {
    this.mediator
      .send(new DeleteSupplierCommand(id), DeleteSupplierHandler)
      .subscribe(result => {
        result.match(
          () => { this.notify.deleted('Supplier'); this.loadSuppliers(); },
          err => this.notify.error(err),
        );
      });
  }

  exportCsv(): void {
    this.csvExport.download(
      `suppliers-page${this.currentPage}.csv`,
      ['Name', 'Contact Email', 'Phone', 'Status'],
      this.pagedData().items.map(s => [s.name, s.contactEmail, s.phone, s.status ?? '']),
    );
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
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        page:      this.currentPage > 1                 ? this.currentPage              : null,
        pageSize:  this.pageSize !== DEFAULT_PAGE_SIZE   ? this.pageSize                : null,
        search:    this.activeSearch()                   ? this.activeSearch()          : null,
        statuses:  this.selectedStatuses().length > 0   ? this.selectedStatuses().join(',') : null,
        sortField: this.sortField()                      ? this.sortField()             : null,
        sortOrder: this.sortOrder()                      ? this.sortOrder()             : null,
      },
    });
  }
}
