import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DetailActionsComponent } from '../../../../shared/components/detail-actions/detail-actions.component';
import { DecimalPipe } from '@angular/common';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NotifyService } from '../../../../shared/services/notify.service';
import { FormModalService } from '../../../../shared/services/form-modal.service';
import { MediatorService } from '../../../../core/mediator/mediator.service';
import { PageHeaderComponent, Breadcrumb } from '../../../../shared/components/page-header/page-header.component';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { LoadingContainerComponent } from '../../../../shared/components/loading-container/loading-container.component';
import { StatusTagComponent } from '../../../../shared/components/status-tag/status-tag.component';
import { GetCategoryByIdQuery } from '../../../categories/queries/get-category-by-id/get-category-by-id.query';
import { GetCategoryByIdHandler } from '../../../categories/queries/get-category-by-id/get-category-by-id.handler';
import { ProductDto } from '../../models/product.model';
import { GetProductByIdQuery } from '../../queries/get-product-by-id/get-product-by-id.query';
import { GetProductByIdHandler } from '../../queries/get-product-by-id/get-product-by-id.handler';
import { DeleteProductCommand } from '../../commands/delete-product/delete-product.command';
import { DeleteProductHandler } from '../../commands/delete-product/delete-product.handler';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    NzDescriptionsModule,
    NzCardModule,
    PageHeaderComponent,
    DetailActionsComponent,
    LoadingContainerComponent,
    StatusTagComponent,
  ],
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly mediator     = inject(MediatorService);
  private readonly notify       = inject(NotifyService);
  private readonly formModal    = inject(FormModalService);
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly keycloak     = inject(KeycloakService);
  private readonly titleService = inject(Title);

  product = signal<ProductDto | null>(null);
  categoryName = signal('—');
  loading = signal(false);

  readonly canEdit = this.keycloak.canAccess('supervisor');
  readonly canDelete = this.keycloak.canAccess('it');

  get breadcrumbs(): Breadcrumb[] {
    return [
      { label: 'Home', link: '/dashboard' },
      { label: 'Products', link: '/products' },
      { label: this.product()?.name ?? 'Detail' },
    ];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProduct(id);
  }

  loadProduct(id: string): void {
    this.loading.set(true);
    this.mediator
      .send(new GetProductByIdQuery(id), GetProductByIdHandler)
      .subscribe((result) => {
        result.match(
          (data) => {
            this.product.set(data);
            this.titleService.setTitle(`${data.name} | Store 003`);
            this._loadCategoryName(data.categoryId);
          },
          (err) => {
            this.notify.error(err);
            this.router.navigate(['/products']);
          }
        );
        this.loading.set(false);
      });
  }

  private _loadCategoryName(categoryId: string): void {
    this.mediator
      .send(new GetCategoryByIdQuery(categoryId), GetCategoryByIdHandler)
      .subscribe((result) => {
        result.match(
          (cat) => this.categoryName.set(cat.name),
          () => {},
        );
      });
  }

  openEditModal(): void {
    const id = this.product()?.id;
    if (!id) return;
    this.formModal.open(
      () => import('../../pages/product-form/product-form.component').then(m => m.ProductFormComponent),
      { title: 'Edit Product', data: { id }, width: 600 },
    ).subscribe(saved => { if (saved) this.loadProduct(id); });
  }

  delete(): void {
    const id = this.product()?.id;
    if (!id) return;

    this.mediator
      .send(new DeleteProductCommand(id), DeleteProductHandler)
      .subscribe((result) => {
        result.match(
          () => {
            this.notify.deleted('Product');
            this.router.navigate(['/products']);
          },
          (err) => this.notify.error(err)
        );
      });
  }
}
