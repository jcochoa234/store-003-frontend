import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DetailActionsComponent } from '../../../../shared/components/detail-actions/detail-actions.component';
import { Title } from '@angular/platform-browser';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NotifyService } from '../../../../shared/services/notify.service';
import { FormModalService } from '../../../../shared/services/form-modal.service';
import { MediatorService } from '../../../../core/mediator/mediator.service';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { PageHeaderComponent, Breadcrumb } from '../../../../shared/components/page-header/page-header.component';
import { LoadingContainerComponent } from '../../../../shared/components/loading-container/loading-container.component';
import { StatusTagComponent } from '../../../../shared/components/status-tag/status-tag.component';
import { BrandDto } from '../../models/brand.model';
import { GetBrandByIdQuery } from '../../queries/get-brand-by-id/get-brand-by-id.query';
import { GetBrandByIdHandler } from '../../queries/get-brand-by-id/get-brand-by-id.handler';
import { DeleteBrandCommand } from '../../commands/delete-brand/delete-brand.command';
import { DeleteBrandHandler } from '../../commands/delete-brand/delete-brand.handler';
import { GetProductsQuery } from '../../../products/queries/get-products/get-products.query';
import { GetProductsHandler } from '../../../products/queries/get-products/get-products.handler';

@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [
    RouterLink,
    NzDescriptionsModule,
    NzIconModule,
    NzCardModule,
    PageHeaderComponent,
    DetailActionsComponent,
    LoadingContainerComponent,
    StatusTagComponent,
  ],
  templateUrl: './brand-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandDetailComponent implements OnInit {
  private readonly mediator  = inject(MediatorService);
  private readonly notify    = inject(NotifyService);
  private readonly formModal = inject(FormModalService);
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly keycloak  = inject(KeycloakService);
  private readonly titleSvc  = inject(Title);

  brand        = signal<BrandDto | null>(null);
  productCount = signal(0);
  loading      = signal(false);

  readonly canEdit   = this.keycloak.canAccess('supervisor');
  readonly canDelete = this.keycloak.canAccess('it');

  get breadcrumbs(): Breadcrumb[] {
    return [
      { label: 'Home',   link: '/dashboard' },
      { label: 'Brands', link: '/brands' },
      { label: this.brand()?.name ?? 'Detail' },
    ];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this._loadBrand(id);
  }

  private _loadBrand(id: string): void {
    this.loading.set(true);
    this.mediator
      .send(new GetBrandByIdQuery(id), GetBrandByIdHandler)
      .subscribe((result) => {
        result.match(
          (data) => {
            this.brand.set(data);
            this.titleSvc.setTitle(`${data.name} | Store 003`);
            this._loadProductCount(id);
          },
          (err) => {
            this.notify.error(err);
            this.router.navigate(['/brands']);
          }
        );
        this.loading.set(false);
      });
  }

  private _loadProductCount(brandId: string): void {
    this.mediator
      .send(new GetProductsQuery({ page: 1, pageSize: 1, brandIds: [brandId] }), GetProductsHandler)
      .subscribe((result) => {
        result.match(
          (data) => this.productCount.set(data.totalCount),
          () => {}
        );
      });
  }

  openEditModal(): void {
    const id = this.brand()?.id;
    if (!id) return;
    this.formModal.open(
      () => import('../../pages/brand-form/brand-form.component').then(m => m.BrandFormComponent),
      { title: 'Edit Brand', data: { id } },
    ).subscribe(saved => { if (saved) this._loadBrand(id); });
  }

  delete(): void {
    const id = this.brand()?.id;
    if (!id) return;
    this.mediator
      .send(new DeleteBrandCommand(id), DeleteBrandHandler)
      .subscribe((result) => {
        result.match(
          () => {
            this.notify.deleted('Brand');
            this.router.navigate(['/brands']);
          },
          (err) => this.notify.error(err)
        );
      });
  }
}
