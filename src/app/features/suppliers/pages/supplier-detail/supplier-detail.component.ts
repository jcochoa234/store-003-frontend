import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzCardModule } from 'ng-zorro-antd/card';
import { MediatorService } from '@core/mediator/mediator.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { PageHeaderComponent, Breadcrumb } from '@shared/components/page-header/page-header.component';
import { LoadingContainerComponent } from '@shared/components/loading-container/loading-container.component';
import { DetailActionsComponent } from '@shared/components/detail-actions/detail-actions.component';
import { StatusTagComponent } from '@shared/components/status-tag/status-tag.component';
import { NotifyService } from '@shared/services/notify.service';
import { FormModalService } from '@shared/services/form-modal.service';
import { SupplierDto } from '../../models/supplier.model';
import { GetSupplierByIdQuery } from '../../queries/get-supplier-by-id/get-supplier-by-id.query';
import { GetSupplierByIdHandler } from '../../queries/get-supplier-by-id/get-supplier-by-id.handler';
import { DeleteSupplierCommand } from '../../commands/delete-supplier/delete-supplier.command';
import { DeleteSupplierHandler } from '../../commands/delete-supplier/delete-supplier.handler';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [
    NzDescriptionsModule,
    NzCardModule,
    PageHeaderComponent,
    DetailActionsComponent,
    LoadingContainerComponent,
    StatusTagComponent,
  ],
  templateUrl: './supplier-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierDetailComponent implements OnInit {
  private readonly mediator     = inject(MediatorService);
  private readonly notify       = inject(NotifyService);
  private readonly formModal    = inject(FormModalService);
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly keycloak     = inject(KeycloakService);
  private readonly titleService = inject(Title);

  supplier = signal<SupplierDto | null>(null);
  loading  = signal(false);

  readonly canEdit   = this.keycloak.canAccess('supervisor');
  readonly canDelete = this.keycloak.canAccess('it');

  get breadcrumbs(): Breadcrumb[] {
    return [
      { label: 'Home',      link: '/dashboard' },
      { label: 'Suppliers', link: '/suppliers' },
      { label: this.supplier()?.name ?? 'Detail' },
    ];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadSupplier(id);
  }

  loadSupplier(id: string): void {
    this.loading.set(true);
    this.mediator.send(new GetSupplierByIdQuery(id), GetSupplierByIdHandler)
      .subscribe(result => {
        result.match(
          data => {
            this.supplier.set(data);
            this.titleService.setTitle(`${data.name} | Store 003`);
          },
          err => { this.notify.error(err); this.router.navigate(['/suppliers']); },
        );
        this.loading.set(false);
      });
  }

  openEditModal(): void {
    const id = this.supplier()?.id;
    if (!id) return;
    this.formModal.open(
      () => import('../../pages/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
      { title: 'Edit Supplier', data: { id }, width: 560 },
    ).subscribe(saved => { if (saved) this.loadSupplier(id); });
  }

  delete(): void {
    const id = this.supplier()?.id;
    if (!id) return;
    this.mediator.send(new DeleteSupplierCommand(id), DeleteSupplierHandler)
      .subscribe(result => {
        result.match(
          () => { this.notify.deleted('Supplier'); this.router.navigate(['/suppliers']); },
          err => this.notify.error(err),
        );
      });
  }
}
